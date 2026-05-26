import time
import uuid
from datetime import date, timedelta
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db import models
from django.utils import timezone
from django.contrib.auth.hashers import make_password
from ..models import (
    User, SuperAdmin, SubscriptionPlan, Company, Transactions, 
    Employee, Attendance, Appreciation, LeaveRequest, Offboarding,
    ManagerProfile, TeamLeaderProfile
)
from ..serializers import (
    UserSerializer, SuperAdminSerializer, SubscriptionPlanSerializer,
    CompanySerializer, TransactionSerializer, EmployeeProfileSerializer
)

class AdminStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() != 'admin':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        total_companies = Company.objects.count()
        active_companies = Company.objects.filter(is_active=True).count()
        total_users = User.objects.count()
        total_revenue = Transactions.objects.aggregate(sum=models.Sum('amount'))['sum'] or 0

        return Response({
            'total_companies': total_companies,
            'active_companies': active_companies,
            'total_users': total_users,
            'total_revenue': float(total_revenue)
        })

class CompanyListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        if request.user.role.lower() not in ['admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        companies = Company.objects.all().order_by('-created_at')
        serializer = CompanySerializer(companies, many=True)
        return Response(serializer.data)

    def post(self, request):
        if request.user.role.lower() != 'super_admin':
            return Response({'message': 'Access denied. Only super admin can add companies.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = CompanySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CompanyDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request, pk):
        try:
            company = Company.objects.get(pk=pk)
            serializer = CompanySerializer(company)
            return Response(serializer.data)
        except Company.DoesNotExist:
            return Response({'message': 'Company not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            company = Company.objects.get(pk=pk)
            
            # Keep track of old status to detect a toggle
            old_is_active = company.is_active
            new_is_active = request.data.get('is_active')
            
            serializer = CompanySerializer(company, data=request.data, partial=True)
            if serializer.is_valid():
                company_instance = serializer.save()
                
                # If company active status is being toggled, cascade it to all users
                if new_is_active is not None and str(new_is_active).lower() in ['true', 'false']:
                    # Convert to strict boolean
                    is_active_bool = str(new_is_active).lower() == 'true'
                    if old_is_active != is_active_bool:
                        User = get_user_model()
                        # Physically deactivate/reactivate all admin/manager/employee accounts linked to this company
                        User.objects.filter(company=company_instance).update(is_active=is_active_bool)
                
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Company.DoesNotExist:
            return Response({'message': 'Company not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            company = Company.objects.get(pk=pk)
            company.delete()
            return Response({'message': 'Company deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except Company.DoesNotExist:
            return Response({'message': 'Company not found'}, status=status.HTTP_404_NOT_FOUND)


class SubscriptionPlanListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        plans = SubscriptionPlan.objects.all()
        serializer = SubscriptionPlanSerializer(plans, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SubscriptionPlanSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SubscriptionPlanDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def delete(self, request, pk):
        if request.user.role.lower() != 'admin':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            plan = SubscriptionPlan.objects.get(pk=pk)
            plan.delete()
            return Response({'message': 'Plan deleted successfully'}, status=status.HTTP_200_OK)
        except SubscriptionPlan.DoesNotExist:
            return Response({'message': 'Plan not found'}, status=status.HTTP_404_NOT_FOUND)

class TransactionListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        company = getattr(request.user, 'company', None)
        if request.user.role.lower() == 'super_admin':
            transactions = Transactions.objects.all().order_by('-transaction_date')
        elif company:
            transactions = Transactions.objects.filter(company=company).order_by('-transaction_date')
        else:
            transactions = Transactions.objects.none()
            
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)

class UserManagementView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        company = getattr(request.user, 'company', None)
        if request.user.role.lower() == 'super_admin':
            users = User.objects.all().order_by('-id')
        elif company:
            users = User.objects.filter(company=company).order_by('-id')
        else:
            users = User.objects.filter(id=request.user.id)
            
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
    def post(self, request):
        data = request.data.copy()
        if 'password' in data:
            data['password'] = make_password(data['password'])
        serializer = UserSerializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            company = getattr(request.user, 'company', None)
            if request.user.role.lower() != 'super_admin' and company:
                user.company = company
                user.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            serializer = UserSerializer(user)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class SuperAdminListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        role = request.user.role.lower()
        if role not in ['admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        if role == 'super_admin':
            admins = User.objects.filter(role__in=['admin', 'super_admin']).order_by('-id')
        else:
            admins = User.objects.filter(role='super_admin').order_by('-id')
            
        serializer = UserSerializer(admins, many=True)
        return Response(serializer.data)
        
    def patch(self, request):
        if request.user.role.lower() != 'super_admin':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        user_id = request.data.get('user_id')
        try:
            admin_user = User.objects.get(id=user_id, role='admin')
            admin_user.role = 'super_admin'
            admin_user.save()
            return Response({'message': 'Successfully upgraded admin to super admin.'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'message': 'Admin not found or already a super admin.'}, status=status.HTTP_404_NOT_FOUND)

class AdminSettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        if request.user.role.lower() != 'admin':
            return Response({'message': 'Access denied. Admins only.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    def patch(self, request):
        if request.user.role.lower() != 'admin':
            return Response({'message': 'Access denied. Admins only.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AllEmployeeProfilesView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        if request.user.role.lower() not in ['employee', 'team_leader', 'manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        company = getattr(request.user, 'company', None)
        if request.user.role.lower() == 'super_admin':
            users = User.objects.all().order_by('first_name')
        elif company:
            users = User.objects.filter(company=company).order_by('first_name')
        else:
            users = User.objects.none()
            
        data = []
        for u in users:
            profile_data = {
                'id': u.id, 'user_id': u.id, 'first_name': u.first_name, 
                'last_name': u.last_name, 'username': u.username, 'email': u.email,
                'role': u.role, 'is_active': u.is_active,
            }
            p = None
            if u.role == 'employee' and hasattr(u, 'employee_profile'):
                p = u.employee_profile
            elif u.role == 'team_leader' and hasattr(u, 'teamleaderprofile'):
                p = u.teamleaderprofile
            elif hasattr(u, 'managerprofile'):
                p = u.managerprofile
                
            if p:
                profile_data.update({
                    'employee_pk': p.id if u.role == 'employee' else None,
                    'designation': getattr(p, 'designation', ''),
                    'department': getattr(p, 'department', ''),
                    'employee_id': getattr(p, 'employee_id', ''),
                    'gender': getattr(p, 'gender', ''),
                    'date_of_birth': getattr(p, 'date_of_birth', ''),
                    'phone_number': getattr(p, 'phone', ''),
                    'address': getattr(p, 'address', ''),
                    'permanent_address': getattr(p, 'permanent_address', ''),
                    'blood_group': getattr(p, 'blood_group', ''),
                    'nationality': getattr(p, 'nationality', ''),
                    'marital_status': getattr(p, 'marital_status', ''),
                    'aadhaar_number': getattr(p, 'aadhaar_number', ''),
                    'pan_number': getattr(p, 'pan_number', ''),
                    'bank_name': getattr(p, 'bank_name', ''),
                    'account_number': getattr(p, 'account_number', ''),
                    'ifsc_code': getattr(p, 'ifsc_code', ''),
                    'branch_name': getattr(p, 'branch', ''),
                    'emergency_contact_name': getattr(p, 'emergency_contact_name', ''),
                    'emergency_contact_phone': getattr(p, 'emergency_contact_phone', ''),
                    'emergency_contact_relation': getattr(p, 'emergency_contact_relation', ''),
                    'sick_leaves': getattr(p, 'sick_leaves', 7),
                    'casual_leaves': getattr(p, 'casual_leaves', 7),
                    'vacation_leaves': getattr(p, 'vacation_leaves', 7),
                    'paid_leaves': getattr(p, 'paid_leaves', 0),
                    'date_of_joining': getattr(p, 'joining_date', getattr(p, 'date_of_joining', ''))
                })
            data.append(profile_data)
            
        return Response(data)

class SystemDataSetupView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        if request.user.role not in ['admin', 'super_admin', 'manager']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        action = request.data.get('action')
        if action == 'setup_team_leader':
            email = request.data.get('email', 'tl@shnoor.com')
            password = request.data.get('password', 'tl123')
            user, created = User.objects.get_or_create(email=email, defaults={'username': email.split('@')[0], 'role': 'team_leader'})
            if created:
                user.set_password(password)
                user.save()
            TeamLeaderProfile.objects.get_or_create(user=user, defaults={'designation': 'Senior Team Leader', 'department': 'Development'})
            employees = Employee.objects.all()[:5]
            for emp in employees:
                emp.team_leader = user
                emp.save()
            return Response({'message': f'Team Leader {email} setup complete.'})
        return Response({'message': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)
class AdminCompanyCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role.lower() != 'super_admin':
            return Response({'message': 'Access denied. Only super admin can create companies.'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data.copy()
        name = data.get('name')
        if not name:
            return Response({'message': 'Company name is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        email = data.get('email')
        if not email:
            data['email'] = f"{name.lower().replace(' ', '')}_{int(time.time())}@shnoor.com"

        password = data.get('password')
        if not password:
            return Response({'message': 'Admin password is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists() or User.objects.filter(username=email).exists():
            return Response({'message': 'A user with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = CompanySerializer(data=data)
        if serializer.is_valid():
            company = serializer.save()
            
            max_users = int(data.get('max_users', 50))
            base_plan, _ = SubscriptionPlan.objects.get_or_create(
                name='Base Plan', 
                defaults={'price': 0.00, 'duration_months': 1, 'features': 'Base Plan Trial'}
            )
            company.max_users = max_users
            company.subscription_plan = base_plan
            company.license_expiry_date = date.today() + timedelta(days=30)
            company.save()
            
            # Record the trial subscription as a transaction
            Transactions.objects.create(
                company=company,
                subscription_plan=base_plan,
                amount=0.00,
                status='Success',
                payment_method='Free Trial',
                transaction_id=str(uuid.uuid4()).split('-')[0].upper(),
                transaction_date=date.today()
            )
            
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=name,
                last_name='Admin',
                role='manager',
                company=company
            )
            ManagerProfile.objects.get_or_create(user=user)
            
            current_email = data.get('current_email')
            
            subject = f"Welcome to ShnoorHR - {name} Admin Credentials"
            message = f"Hello,\n\nYour company '{name}' has been successfully registered.\nYou have been granted a free 1-month trial on the Base Plan.\nYour total allowed users (capacity): {max_users}.\n\nYour Admin Login Credentials:\nEmail: {email}\nPassword: {password}\n\nPlease login to get started."
            try:
                if current_email:
                    send_mail(subject, message, None, [current_email], fail_silently=True)
            except Exception as e:
                print(f"Failed to send company creation email: {e}")
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
