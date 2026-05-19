from rest_framework import status, permissions, serializers, parsers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from django.db import models
from django.core.mail import send_mail
from django.conf import settings
from .models import (
    User, SuperAdmin, SubscriptionPlan, Company, Transactions,
    Employee, SupportQuery, Holiday, Appreciation, LeaveRequest,
    CompanyPolicy, Payroll, Offboarding, LetterHead, AdminProfile,
    Asset, Attendance, Expense, Task, CompanyDocument, ManagerProfile, OrgChart, Notification,
    TeamLeaderProfile, PlannerEvent, PlannerHoliday, PlannerShift
)
from .serializers import PlannerEventSerializer, PlannerHolidaySerializer, PlannerShiftSerializer
from .permissions import IsAdmin, IsManager, IsTeamLeader, IsEmployee, IsAdminOrManager
from django.utils import timezone
from datetime import datetime

class TaskSerializer(serializers.ModelSerializer):
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True)
    assigned_to_email = serializers.CharField(source='assigned_to.email', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = Task
        fields = '__all__'

class ExpenseSerializer(serializers.ModelSerializer):
    receipt = serializers.SerializerMethodField()
    receipt_url = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = '__all__'

    def get_receipt(self, obj):
        if getattr(obj, 'receipt_url', None):
            return obj.receipt_url
        if obj.receipt:
            return obj.receipt.url
        return None

    def get_receipt_url(self, obj):
        if getattr(obj, 'receipt_url', None):
            return obj.receipt_url
        if obj.receipt:
            return obj.receipt.url
        return None

class AssetSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.user.get_full_name', read_only=True)

    class Meta:
        model = Asset
        fields = ['id', 'name', 'asset_type', 'serial_number', 'assigned_to', 'assigned_to_name', 'status', 'purchase_date']

class AppreciationSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    recipient_username = serializers.CharField(source='recipient.username', read_only=True)

    class Meta:
        model = Appreciation
        fields = ['id', 'sender', 'sender_username', 'recipient', 'recipient_username', 'title', 'description', 'amount', 'created_at']

class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = ['id', 'name', 'date', 'description', 'created_at']

class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_username = serializers.CharField(source='employee.username', read_only=True)
    employee_name = serializers.SerializerMethodField()

    class Meta:
        model = LeaveRequest
        fields = ['id', 'employee', 'employee_username', 'employee_name', 'leave_type', 'start_date', 'end_date', 'reason', 'status', 'created_at', 'updated_at']

    def get_employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}".strip() or obj.employee.username



class CompanyPolicySerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()

    class Meta:
        model = CompanyPolicy
        fields = ['id', 'title', 'description', 'file', 'created_at', 'updated_at']

    def get_file(self, obj):
        if obj.file:
            file_str = str(obj.file)
            if file_str.startswith('http://') or file_str.startswith('https://'):
                return file_str
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

class PayrollSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    username = serializers.CharField(source='employee.user.username', read_only=True)

    class Meta:
        model = Payroll
        fields = ['id', 'employee', 'employee_name', 'username', 'amount', 'payment_date', 'month_year', 'status']

class OffboardingSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
    username = serializers.CharField(source='employee.user.username', read_only=True)
    file = serializers.SerializerMethodField()

    class Meta:
        model = Offboarding
        fields = ['id', 'employee', 'employee_name', 'username', 'action_type', 'reason', 'file', 'date', 'created_at']

    def get_file(self, obj):
        if hasattr(obj, 'file') and obj.file:
            file_str = str(obj.file)
            if file_str.startswith('http://') or file_str.startswith('https://'):
                return file_str
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

class LetterHeadSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()

    class Meta:
        model = LetterHead
        fields = ['id', 'title', 'document_type', 'file', 'created_at']

    def get_file(self, obj):
        if obj.file:
            file_str = str(obj.file)
            if file_str.startswith('http://') or file_str.startswith('https://'):
                return file_str
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

class SupportQuerySerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = SupportQuery
        fields = ['id', 'sender', 'sender_username', 'subject', 'message', 'status', 'created_at', 'updated_at']

class OrgChartSerializer(serializers.ModelSerializer):
    manager_name=serializers.CharField(source='manager.name',read_only=True)

    class Meta:
        model = OrgChart
        fields = ['id','name','role','profile_picture','department','company_name','employee_months','work_mode','manager','manager_name']

class OrgChartView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self,request):
        nodes = OrgChart.objects.all().order_by('id')
        serializer = OrgChartSerializer(nodes,many=True)
        return Response(serializer.data)

    def post(self,request):
        if request.user.role not in ['manager','admin','super_admin']:
            return Response({'message':'Access denied. Only Admins and Mangers can add employees to the org chart'},status=status.HTTP_403_FORBIDDEN)

        serializer = OrgChartSerializer(data = request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data,status=status.HTTP_201_CREATED)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)

class OrgChartDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self,request,pk):
        if request.user.role not in ['manager','admin','super_admin']:
            return Response({'message':'Access Denied'},status = status.HTTP_403_FORBIDDEN)

        try:
            node = OrgChart.objects.get(pk=pk)
            serializer=OrgChartSerializer(node,data=request.data,partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
        except OrgChart.DoesNotExist:
            return Response({'message':'Record not found'},status=status.HTTP_404_NOT_FOUND)        

    def delete(self,request,pk):
        if request.user.role not in ['manager','admin','super_admin']:
            return Response({'message':'Access denied'},status=status.HTTP_403_FORBIDDEN)

        try:
            node = OrgChart.objects.get(pk=pk)
            node.delete()
            return Response(status = status.HTTP_204_NO_CONTENT)
        except OrgChart.DoesNotExist:
            return Response({'message':'Record not found'},status=status.HTTP_404_NOT_FOUND)

class AdminProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminProfile
        fields = ['bio', 'address']

class UserSerializer(serializers.ModelSerializer):
    admin_profile = AdminProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'first_name', 'last_name', 'password', 'phone_number', 'location', 'admin_profile']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        admin_profile_data = validated_data.pop('admin_profile', None)
        user = User.objects.create_user(**validated_data)
        if admin_profile_data and user.role == 'admin':
            AdminProfile.objects.update_or_create(user=user, defaults=admin_profile_data)
        return user

    def update(self, instance, validated_data):
        admin_profile_data = validated_data.pop('admin_profile', None)
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        instance.save()

        if admin_profile_data and instance.role == 'admin':
            profile, _ = AdminProfile.objects.update_or_create(user=instance, defaults=admin_profile_data)
            instance.admin_profile = profile
        
        return instance

class SuperAdminSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = SuperAdmin
        fields = ['id', 'user', 'username', 'email', 'can_manage_admins', 'created_at']

class EmployeeSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Employee
        fields = ['id', 'user', 'first_name', 'last_name', 'email', 'designation', 'department', 'salary', 'casual_leaves', 'sick_leaves', 'vacation_leaves']


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name', 'email', 'members_count', 'is_active', 'license_expired', 'created_at']

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'price', 'duration_months', 'features', 'trial_period_days']


class TransactionSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    plan_name = serializers.CharField(source='subscription_plan.name', read_only=True)

    class Meta:
        model = Transactions
        fields = ['id', 'company', 'company_name', 'subscription_plan', 'plan_name', 'amount', 'transaction_date']

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data or {}
        print("LOGIN REQUEST DATA:", data)
        email_or_username = data.get('email')
        password = data.get('password')

        if not email_or_username or not password:
            return Response(
                {'message': 'Please provide both email/username and password.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=email_or_username, password=password)

        if not user:
            user_obj = User.objects.filter(email=email_or_username).first()
            if user_obj:
                user = authenticate(username=user_obj.username, password=password)

        if user:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'role': user.role,
                'email': user.email,
                'name': user.get_full_name() or user.email
            })
        
        return Response({'message': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

class AdminStatsView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        return Response({
            'total_users': User.objects.count(),
            'total_admins': User.objects.filter(role='admin').count(),
            'total_managers': User.objects.filter(role='manager').count(),
            'total_employees': User.objects.filter(role='employee').count(),
            'total_companies': Company.objects.count(),
            'active_companies': Company.objects.filter(is_active=True).count(),
            'inactive_companies': Company.objects.filter(is_active=False).count(),
            'license_expired': Company.objects.filter(license_expired=True).count()
        })

class CompanyListView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        companies = Company.objects.only('id', 'name', 'email', 'members_count', 'is_active', 'license_expired', 'created_at').order_by('-created_at')
        serializer = CompanySerializer(companies, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CompanySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CompanyDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role.lower() != 'admin':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            company = Company.objects.get(pk=pk)
        except Company.DoesNotExist:
            return Response({'message': 'Company not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        # active/inactive
        is_active = request.data.get('is_active')
        if is_active is not None:
            company.is_active = is_active
            company.save()
            return Response(CompanySerializer(company).data)
        
        return Response({'message': 'No valid fields provided.'}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if request.user.role.lower() != 'admin':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            company = Company.objects.get(pk=pk)
            company.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Company.DoesNotExist:
            return Response({'message': 'Company not found.'}, status=status.HTTP_404_NOT_FOUND)

class AdminCompanyCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role.lower() != 'admin':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data.copy()
        name = data.get('name')
        if not name:
            return Response({'message': 'Company name is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        email = data.get('email')
        if not email:
            import time
            data['email'] = f"{name.lower().replace(' ', '')}_{int(time.time())}@shnoor.com"

        serializer = CompanySerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SubscriptionPlanListView(APIView):
    permission_classes = [permissions.AllowAny]

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
    
class TransactionListView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        transactions = Transactions.objects.select_related('company', 'subscription_plan').only(
            'id', 'company__name', 'subscription_plan__name', 'amount', 'transaction_date'
        ).order_by('-transaction_date')
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)
    
    def post(self,request):
        serializers = TransactionSerializer(data=request.data)
        if serializers.is_valid():
            serializers.save()
            return Response(serializers.data, status=status.HTTP_201_CREATED)
        return Response(serializers.errors, status=status.HTTP_400_BAD_REQUEST)

class UserManagementView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        users = User.objects.only('id', 'username', 'email', 'role', 'first_name', 'last_name', 'phone_number', 'location').order_by('-id')
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response({'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
class SuperAdminListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        super_admins = SuperAdmin.objects.all()
        serializer = SuperAdminSerializer(super_admins, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SuperAdminSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            user.role = 'super_admin'
            user.save()
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SupportQueryView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        queries = SupportQuery.objects.all().order_by('-created_at')
        serializer = SupportQuerySerializer(queries, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SupportQuerySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SupportQueryDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def patch(self, request, pk):
        try:
            query = SupportQuery.objects.get(pk=pk)
            serializer = SupportQuerySerializer(query, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except SupportQuery.DoesNotExist:
            return Response({'message': 'Query not found'}, status=status.HTTP_404_NOT_FOUND)

class ManagerEmployeeListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        employees = Employee.objects.select_related('user').only(
            'id', 'user__first_name', 'user__last_name', 'user__email', 'designation', 'department', 'salary', 'casual_leaves', 'sick_leaves', 'vacation_leaves'
        ).order_by('user__first_name')
        serializer = EmployeeSerializer(employees, many=True)
        
        # Post-process serialized data to provide graceful naming fallbacks for empty names
        serialized_employees = serializer.data
        for emp_data in serialized_employees:
            first = (emp_data.get('first_name') or '').strip()
            last = (emp_data.get('last_name') or '').strip()
            if not first and not last:
                email = emp_data.get('email') or ''
                fallback = email.split('@')[0] if email else 'Team Member'
                emp_data['first_name'] = fallback
                emp_data['last_name'] = ''

        # Team Leaders to list
        try:
            team_leaders = TeamLeaderProfile.objects.select_related('user').all()
            tl_data = []
            for tl in team_leaders:
                tl_first = tl.user.first_name if (tl.user and tl.user.first_name) else ''
                tl_last = tl.user.last_name if (tl.user and tl.user.last_name) else ''
                if not tl_first.strip() and not tl_last.strip():
                    tl_first = tl.user.username if tl.user else 'Team'
                    tl_last = '' if tl.user else 'Leader'
                
                tl_data.append({
                    'id': -tl.id,  
                    'user': tl.user.id if tl.user else None,
                    'first_name': tl_first,
                    'last_name': tl_last,
                    'email': tl.user.email if (tl.user and tl.user.email) else '',
                    'designation': tl.designation or 'Team Leader',
                    'department': tl.department or '',
                    'salary': 0.0,
                    'casual_leaves': 0,
                    'sick_leaves': 0,
                    'vacation_leaves': 0
                })
            combined_data = serialized_employees + tl_data
            combined_data.sort(key=lambda x: (x.get('first_name') or '').lower())
            return Response(combined_data)
        except Exception as e:
            print(f"Failed to append Team Leaders to employee list: {e}")
            return Response(serialized_employees)

    def post(self, request):
        serializer = EmployeeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class HolidayView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        holidays = Holiday.objects.all().order_by('date')
        serializer = HolidaySerializer(holidays, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = HolidaySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AppreciationView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        recipient_id = request.query_params.get('recipient_id')
        if recipient_id:
            appreciations = Appreciation.objects.filter(recipient_id=recipient_id).select_related('sender', 'recipient').only(
                'id', 'sender__username', 'recipient__username', 'title', 'description', 'amount', 'created_at'
            ).order_by('-created_at')
        else:
            appreciations = Appreciation.objects.all().select_related('sender', 'recipient').only(
                'id', 'sender__username', 'recipient__username', 'title', 'description', 'amount', 'created_at'
            ).order_by('-created_at')
            
        serializer = AppreciationSerializer(appreciations, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = AppreciationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LeaveRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        employee_id = request.query_params.get('employee_id')
        if employee_id:
            leaves = LeaveRequest.objects.filter(employee_id=employee_id).select_related('employee').only(
                'id', 'employee__username', 'employee__first_name', 'employee__last_name', 'leave_type', 'start_date', 'end_date', 'reason', 'status', 'created_at', 'updated_at'
            ).order_by('-created_at')
        else:
            leaves = LeaveRequest.objects.all().select_related('employee').only(
                'id', 'employee__username', 'employee__first_name', 'employee__last_name', 'leave_type', 'start_date', 'end_date', 'reason', 'status', 'created_at', 'updated_at'
            ).order_by('-created_at')
        
        serializer = LeaveRequestSerializer(leaves, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = LeaveRequestSerializer(data=request.data)
        if serializer.is_valid():
            leave_request = serializer.save()
            
            recipient_list = [settings.MANAGER_EMAIL]
            
            if recipient_list:
                employee_name = leave_request.employee.get_full_name() or leave_request.employee.username
                subject = f"New Leave Request from {employee_name}"
                message = (
                    f"Hello,\n\n"
                    f"{employee_name} has applied for {leave_request.leave_type} leave.\n"
                    f"Period: {leave_request.start_date} to {leave_request.end_date}\n"
                    f"Reason: {leave_request.reason}\n\n"
                    f"Please log in to the portal to review the request."
                )
                try:
                    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, recipient_list)
                except Exception as e:
                    print(f"Error sending email: {e}")

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LeaveRequestDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def patch(self, request, pk):
        try:
            leave = LeaveRequest.objects.get(pk=pk)
            old_status = leave.status
            new_status = request.data.get('status')
            
            serializer = LeaveRequestSerializer(leave, data=request.data, partial=True)
            if serializer.is_valid():
                updated_leave = serializer.save()
                
                if old_status != 'approved' and new_status == 'approved':
                    try:
                        employee_profile = updated_leave.employee.employee_profile
                        days = (updated_leave.end_date - updated_leave.start_date).days + 1
                        
                        leave_type = updated_leave.leave_type.lower()
                        if 'casual' in leave_type:
                            employee_profile.casual_leaves -= days
                        elif 'sick' in leave_type:
                            employee_profile.sick_leaves -= days
                        elif 'vacation' in leave_type:
                            employee_profile.vacation_leaves -= days
                        
                        employee_profile.save()
                    except Exception as e:
                        print(f"Error updating leave balance: {e}")
                
                if new_status and new_status.lower() in ['approved', 'rejected']:
                    if updated_leave.employee.email:
                        print(f"DEBUG: SUCCESS - Attempting to send {new_status} email to: {updated_leave.employee.email}")
                        subject = f"Leave Request {new_status.capitalize()}"
                        message = (
                            f"Hello {updated_leave.employee.first_name or updated_leave.employee.username},\n\n"
                            f"Your leave request for {updated_leave.leave_type} "
                            f"from {updated_leave.start_date} to {updated_leave.end_date} "
                            f"has been {new_status}.\n\n"
                            f"Regards,\nHR Team"
                        )
                        try:
                            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [updated_leave.employee.email])
                        except Exception as e:
                            print(f"Error sending email: {e}")
                    else:
                        print(f"DEBUG: Could not send email because employee {updated_leave.employee.username} has no email address.")
                
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except LeaveRequest.DoesNotExist:
            return Response({'message': 'Leave request not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            leave = LeaveRequest.objects.get(pk=pk)
            leave.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except LeaveRequest.DoesNotExist:
            return Response({'message': 'Leave request not found'}, status=status.HTTP_404_NOT_FOUND)

class CompanyPolicyView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        policies = CompanyPolicy.objects.all().order_by('-created_at')
        serializer = CompanyPolicySerializer(policies, many=True)
        return Response(serializer.data)

    def post(self, request):
        file_obj = request.FILES.get('file')
        file_url = None
        if file_obj:
            from myapp.utils.google_drive import upload_expense_receipt_to_drive
            try:
                _, file_url = upload_expense_receipt_to_drive(file_obj)
            except Exception as e:
                return Response({'message': f"Failed to upload policy to Google Drive: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        title = request.data.get('title')
        description = request.data.get('description', '')
        
        policy = CompanyPolicy.objects.create(
            title=title,
            description=description,
            file=file_url
        )
        serializer = CompanyPolicySerializer(policy)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class CompanyPolicyDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            policy = CompanyPolicy.objects.get(pk=pk)
            serializer = CompanyPolicySerializer(policy)
            return Response(serializer.data)
        except CompanyPolicy.DoesNotExist:
            return Response({'message': 'Policy not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            policy = CompanyPolicy.objects.get(pk=pk)
            file_obj = request.FILES.get('file')
            if file_obj:
                from myapp.utils.google_drive import upload_expense_receipt_to_drive
                try:
                    _, file_url = upload_expense_receipt_to_drive(file_obj)
                    policy.file = file_url
                except Exception as e:
                    return Response({'message': f"Failed to upload policy to Google Drive: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            title = request.data.get('title')
            if title is not None:
                policy.title = title
            description = request.data.get('description')
            if description is not None:
                policy.description = description
                
            policy.save()
            serializer = CompanyPolicySerializer(policy)
            return Response(serializer.data)
        except CompanyPolicy.DoesNotExist:
            return Response({'message': 'Policy not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk):
        try:
            policy = CompanyPolicy.objects.get(pk=pk)
            file_obj = request.FILES.get('file')
            file_url = policy.file
            if file_obj:
                from myapp.utils.google_drive import upload_expense_receipt_to_drive
                try:
                    _, file_url = upload_expense_receipt_to_drive(file_obj)
                except Exception as e:
                    return Response({'message': f"Failed to upload policy to Google Drive: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            policy.title = request.data.get('title')
            policy.description = request.data.get('description', '')
            policy.file = file_url
            policy.save()
            serializer = CompanyPolicySerializer(policy)
            return Response(serializer.data)
        except CompanyPolicy.DoesNotExist:
            return Response({'message': 'Policy not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            policy = CompanyPolicy.objects.get(pk=pk)
            policy.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except CompanyPolicy.DoesNotExist:
            return Response({'message': 'Policy not found'}, status=status.HTTP_404_NOT_FOUND)

class PayrollView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() == 'employee':
            payroll = Payroll.objects.filter(employee__user=request.user).order_by('-payment_date')
        else:
            employee_id = request.query_params.get('employee_id')
            if employee_id:
                payroll = Payroll.objects.filter(employee_id=employee_id).order_by('-payment_date')
            else:
                payroll = Payroll.objects.all().order_by('-payment_date')
        
        serializer = PayrollSerializer(payroll, many=True)
        return Response(serializer.data)

    def post(self, request):
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = PayrollSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OffboardingView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() in ['employee', 'team_leader']:
            offboardings = Offboarding.objects.filter(employee__user=request.user).order_by('-created_at')
        else:
            employee_id = request.query_params.get('employee_id')
            if employee_id:
                offboardings = Offboarding.objects.filter(employee_id=employee_id).order_by('-created_at')
            else:
                offboardings = Offboarding.objects.all().order_by('-created_at')
        
        serializer = OffboardingSerializer(offboardings, many=True)
        return Response(serializer.data)

    def post(self, request):
        user_role = request.user.role.lower()
        if user_role not in ['manager', 'admin', 'super_admin', 'employee', 'team_leader']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        action_type = request.data.get('action_type')
        if user_role in ['employee', 'team_leader'] and action_type not in ['resignation', 'complaint']:
            return Response({'message': 'Access denied. Employees can only submit resignations or complaints.'}, status=status.HTTP_403_FORBIDDEN)
            
        file_obj = request.FILES.get('file')
        file_url = None
        if file_obj:
            from myapp.utils.google_drive import upload_expense_receipt_to_drive
            try:
                _, file_url = upload_expense_receipt_to_drive(file_obj)
            except Exception as e:
                return Response({'message': f"Failed to upload document to Google Drive: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if user_role in ['employee', 'team_leader']:
            try:
                employee = request.user.employee_profile
            except Exception:
                return Response({'message': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            employee_id = request.data.get('employee')
            try:
                employee = Employee.objects.get(pk=employee_id)
            except Employee.DoesNotExist:
                return Response({'message': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', '')
        
        offboarding = Offboarding.objects.create(
            employee=employee,
            action_type=action_type,
            reason=reason,
            file=file_url
        )
        serializer = OffboardingSerializer(offboarding)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class OffboardingDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            offboarding = Offboarding.objects.get(pk=pk)
            if request.user.role.lower() in ['employee', 'team_leader'] and offboarding.employee.user != request.user:
                return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
                
            serializer = OffboardingSerializer(offboarding)
            return Response(serializer.data)
        except Offboarding.DoesNotExist:
            return Response({'message': 'Record not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            offboarding = Offboarding.objects.get(pk=pk)
            file_obj = request.FILES.get('file')
            if file_obj:
                from myapp.utils.google_drive import upload_expense_receipt_to_drive
                try:
                    _, file_url = upload_expense_receipt_to_drive(file_obj)
                    offboarding.file = file_url
                except Exception as e:
                    return Response({'message': f"Failed to upload document to Google Drive: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            action_type = request.data.get('action_type')
            if action_type is not None:
                offboarding.action_type = action_type
            reason = request.data.get('reason')
            if reason is not None:
                offboarding.reason = reason
            
            offboarding.save()
            serializer = OffboardingSerializer(offboarding)
            return Response(serializer.data)
        except Offboarding.DoesNotExist:
            return Response({'message': 'Record not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            offboarding = Offboarding.objects.get(pk=pk)
            offboarding.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Offboarding.DoesNotExist:
            return Response({'message': 'Record not found'}, status=status.HTTP_404_NOT_FOUND)

def generate_letterhead_pdf(title, document_type, data):
    import os
    import uuid
    from datetime import datetime
    from django.conf import settings
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from .models import Employee

    # temp dir exists
    temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp_uploads')
    os.makedirs(temp_dir, exist_ok=True)

    #   PDF gen
    import re
    emp_profile = Employee.objects.filter(id=data.get('employee')).first() if data.get('employee') else None
    if emp_profile:
        emp_name = f"{emp_profile.user.first_name}_{emp_profile.user.last_name}"
    else:
        emp_name = data.get('employee_name', 'Employee')
    
    clean_emp_name = re.sub(r'[^a-zA-Z0-9_\-]', '_', emp_name)
    clean_doc_type = re.sub(r'[^a-zA-Z0-9_\-]', '_', document_type)
    
    filename = f"{clean_doc_type}_{clean_emp_name}_{datetime.now().strftime('%Y%m%d')}.pdf"
    temp_path = os.path.join(temp_dir, filename)

    doc = SimpleDocTemplate(temp_path, pagesize=letter,
                            rightMargin=54, leftMargin=54,
                            topMargin=54, bottomMargin=54)

    styles = getSampleStyleSheet()
    
    # Style
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1E3A8A'), 
        spaceAfter=15,
        alignment=1 
    )
    
    meta_style = ParagraphStyle(
        'DocMeta',
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569'), 
        spaceAfter=8
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=16,
        textColor=colors.HexColor('#1E293B'), 
        spaceAfter=15
    )

    story = []

    # 1. Company Header -logo,com name
    logo_paths = [
        os.path.join(settings.BASE_DIR, '..', '..', 'assets', 'static', 'company', 'logo.jpg'),
        os.path.join(settings.BASE_DIR, '..', 'assets', 'static', 'company', 'logo.jpg'),
        os.path.join(settings.BASE_DIR, 'assets', 'static', 'company', 'logo.jpg'),
    ]
    logo_path = None
    for lp in logo_paths:
        if os.path.exists(lp):
            logo_path = lp
            break

    logo_img = None
    if logo_path:
        try:
            logo_img = Image(logo_path, width=120, height=45)
            logo_img.hAlign = 'LEFT'
        except Exception as logo_err:
            print(f"Warning: Logo render error: {logo_err}")

    
    comp_title_style = ParagraphStyle(
        'HeaderCompTitle',
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#1E3A8A')
    )
    comp_dept_style = ParagraphStyle(
        'HeaderCompDept',
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B')
    )
    comp_sub_style = ParagraphStyle(
        'HeaderCompSub',
        fontName='Helvetica',
        fontSize=8,
        leading=12,
        textColor=colors.HexColor('#94A3B8')
    )

    header_text_block = [
        Paragraph("SHNOOR INTERNATIONAL LLC", comp_title_style),
        Paragraph("HR & Administration Department", comp_dept_style),
        Paragraph("Corporate Headquarters | Contact: HR@shnoor.com", comp_sub_style)
    ]


    if logo_img:
        header_table_data = [[logo_img, header_text_block]]
        header_table = Table(header_table_data, colWidths=[140, 364])
    else:
        header_table_data = [[header_text_block]]
        header_table = Table(header_table_data, colWidths=[504])

    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(header_table)


    
    divider = Table([[""]], colWidths=[504], rowHeights=[2])
    divider.setStyle(TableStyle([
        ('LINEBELOW', (0, 0), (-1, -1), 1.5, colors.HexColor('#1E3A8A')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(divider)
    story.append(Spacer(1, 20))

    #  Employee Details 
    employee_obj = None
    emp_id_param = data.get('employee')
    if emp_id_param:
        try:
            employee_obj = Employee.objects.get(id=emp_id_param)
        except (Employee.DoesNotExist, ValueError):
            pass

    employee_name = f"{employee_obj.user.first_name} {employee_obj.user.last_name}".strip() if employee_obj else data.get('employee_name', 'Employee')
    if not employee_name:
        employee_name = employee_obj.user.username if employee_obj else 'Employee'

    designation = data.get('designation') or (employee_obj.designation if employee_obj else 'Staff Member')
    employee_id_val = employee_obj.employee_id if (employee_obj and employee_obj.employee_id) else 'SHN-EMP-TEMP'
    department = employee_obj.department if (employee_obj and employee_obj.department) else 'HR Operations'
    joining_date = str(employee_obj.joining_date) if (employee_obj and employee_obj.joining_date) else datetime.now().strftime('%Y-%m-%d')
    salary_val = data.get('salary') or (f"INR {employee_obj.salary:.2f}" if (employee_obj and employee_obj.salary) else 'INR 0.00')
    manager_name = f"{employee_obj.team_leader.first_name} {employee_obj.team_leader.last_name}".strip() if (employee_obj and employee_obj.team_leader) else 'HR Manager'
    if not manager_name and employee_obj and employee_obj.team_leader:
        manager_name = employee_obj.team_leader.username
    if not manager_name:
        manager_name = 'HR Department'
    current_date = datetime.now().strftime('%B %d, %Y')

    # 3. Document Title 
    story.append(Paragraph(title.upper(), title_style))
    story.append(Paragraph(f"<b>Date:</b> {current_date}<br/><b>Doc ID:</b> SHN-{uuid.uuid4().hex[:8].upper()}", meta_style))
    story.append(Spacer(1, 10))

    # 4. Employee Info Table 
    meta_label_style = ParagraphStyle(
        'MetaLabel',
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#475569')
    )
    meta_val_style = ParagraphStyle(
        'MetaValue',
        fontName='Helvetica',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#1E293B')
    )

    details_data = [
        [Paragraph("Employee Name:", meta_label_style), Paragraph(employee_name, meta_val_style),
         Paragraph("Employee ID:", meta_label_style), Paragraph(employee_id_val, meta_val_style)],
        [Paragraph("Designation:", meta_label_style), Paragraph(designation, meta_val_style),
         Paragraph("Department:", meta_label_style), Paragraph(department, meta_val_style)],
        [Paragraph("Joining Date:", meta_label_style), Paragraph(joining_date, meta_val_style),
         Paragraph("Salary / CTC:", meta_label_style), Paragraph(salary_val, meta_val_style)],
    ]
    details_table = Table(details_data, colWidths=[100, 152, 100, 152])
    details_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
    ]))
    story.append(details_table)
    story.append(Spacer(1, 20))

    content_text = data.get('content', '')
    if not content_text:
        # default
        if document_type == 'offer_letter' or document_type == 'internship_offer':
            content_text = (
                f"Dear <b>{employee_name}</b>,<br/><br/>"
                f"On behalf of <b>SHNOOR INTERNATIONAL LLC</b>, we are extremely pleased to offer you the position of "
                f"<b>{designation}</b> in our <b>{department}</b> department. "
                f"We believe your skills and background will be a valuable asset to our organization.<br/><br/>"
                f"Your annual gross salary will be <b>{salary_val}</b>, subject to applicable deductions.<br/><br/>"
                f"Your employment will be subject to the terms and conditions outlined in our standard employee handbook. "
                f"Please review this offer and confirm your acceptance by signing and returning a copy of this letter.<br/><br/>"
                f"Welcome to the SHNOOR team! We look forward to achieving great milestones together."
            )
        elif document_type == 'nda':
            content_text = (
                f"This <b>Non-Disclosure & Intellectual Property Agreement</b> (the \"Agreement\") is entered into on this "
                f"<b>{current_date}</b>, by and between <b>SHNOOR INTERNATIONAL LLC</b> (the \"Company\") and "
                f"<b>{employee_name}</b> (the \"Employee\") holding ID <b>{employee_id_val}</b>.<br/><br/>"
                f"<b>1. Confidential Information:</b><br/>"
                f"The Employee agrees to keep strictly confidential all proprietary, financial, client-related, and technical information "
                f"disclosed during the course of their employment.<br/><br/>"
                f"<b>2. Intellectual Property:</b><br/>"
                f"All codebase, designs, business solutions, and methodologies created during employment remain the sole "
                f"property of SHNOOR INTERNATIONAL LLC.<br/><br/>"
                f"<b>3. Term and Violation:</b><br/>"
                f"This confidentiality obligation survives the termination of employment. Any breach of this agreement "
                f"will result in immediate termination, legal claims, and injunctive relief as permitted under relevant law."
            )
        elif document_type == 'payslip':
            month_val = data.get('month') or datetime.now().strftime('%B %Y')
            content_text = (
                f"<b>CERTIFIED SALARY SLIP - {month_val.upper()}</b><br/><br/>"
                f"This is to certify that <b>{employee_name}</b>, working as a <b>{designation}</b> in "
                f"the <b>{department}</b> department, has been paid their monthly salary for <b>{month_val}</b>.<br/><br/>"
                f"<b>Payment Summary:</b><br/>"
                f"• <b>Basic Salary:</b> {salary_val}<br/>"
                f"• <b>HRA & Allowances:</b> Fully Consolidated<br/>"
                f"• <b>Tax Deductions:</b> As Applicable<br/>"
                f"• <b>Net Credited Amount:</b> <b>{salary_val}</b><br/><br/>"
                f"This document is digitally signed and certified by the HR & Finance Department of SHNOOR INTERNATIONAL LLC."
            )
        elif document_type == 'recommendation':
            content_text = (
                f"<b>TO WHOM IT MAY CONCERN</b><br/><br/>"
                f"It is with great pleasure that I write this letter of recommendation for <b>{employee_name}</b>, who has served as "
                f"a <b>{designation}</b> in the <b>{department}</b> department at <b>SHNOOR INTERNATIONAL LLC</b>.<br/><br/>"
                f"During their tenure starting from <b>{joining_date}</b>, they have consistently demonstrated exceptional commitment, "
                f"analytical expertise, and strong professional ethics. Their ability to deliver state-of-the-art results "
                f"under challenging constraints has been commendable.<br/><br/>"
                f"They possess a rare combination of technical prowess and collaborative spirit, making them an invaluable asset "
                f"to any organization. I strongly recommend them for any future opportunities they choose to pursue and wish "
                f"them outstanding success."
            )
        else:
            content_text = f"This is an official document generated securely by SHNOOR INTERNATIONAL LLC for {employee_name}."
    else:
        # Substitute user templates dynamically
        placeholders_map = {
            '{{employee_name}}': employee_name,
            '{{designation}}': designation,
            '{{employee_id}}': employee_id_val,
            '{{department}}': department,
            '{{joining_date}}': joining_date,
            '{{salary}}': salary_val,
            '{{manager_name}}': manager_name,
            '{{current_date}}': current_date,
        }
        for k, v in placeholders_map.items():
            content_text = content_text.replace(k, str(v))

    story.append(Paragraph(content_text, body_style))
    story.append(Spacer(1, 30))

    # 6. Signature Section
    sign_data = [
        [
            Paragraph(f"<b>Issued By:</b><br/><br/><br/><b>{manager_name}</b><br/>HR & Administration<br/>SHNOOR INTERNATIONAL LLC", meta_style),
            Paragraph(f"<b>Accepted & Signed By:</b><br/><br/><br/>_______________________<br/><b>{employee_name}</b><br/>Candidate / Employee", meta_style)
        ]
    ]
    sign_table = Table(sign_data, colWidths=[250, 254])
    sign_table.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(sign_table)
    story.append(Spacer(1, 20))

    # 7. Footer Section
    footer_text = (
        "<font size=8 color='#94A3B8'>CONFIDENTIAL DOCUMENT | SHNOOR INTERNATIONAL LLC © 2026<br/>"
        "This is a system-generated document. No physical signature is required for validation.</font>"
    )
    footer_table = Table([[Paragraph(footer_text, meta_style)]], colWidths=[504])
    footer_table.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    story.append(footer_table)

    
    doc.build(story)

   
    return temp_path, filename

class LetterHeadView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        doc_type = request.query_params.get('document_type')
        if doc_type:
            letterheads = LetterHead.objects.filter(document_type=doc_type).order_by('-created_at')
        else:
            letterheads = LetterHead.objects.all().order_by('-created_at')
        serializer = LetterHeadSerializer(letterheads, many=True)
        return Response(serializer.data)

    def post(self, request):
        import os
        file_obj = request.FILES.get('file')
        file_url = None
        
        if file_obj:
            from myapp.utils.google_drive import upload_expense_receipt_to_drive
            try:
                _, file_url = upload_expense_receipt_to_drive(file_obj)
            except Exception as e:
                return Response({'message': f"Failed to upload letterhead file to Google Drive: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            title = request.data.get('title', 'Official Document')
            document_type = request.data.get('document_type', 'default')
            
            try:
                temp_path, filename = generate_letterhead_pdf(title, document_type, request.data)
                
                from django.core.files.uploadedfile import SimpleUploadedFile
                with open(temp_path, 'rb') as f:
                    uploaded_file = SimpleUploadedFile(filename, f.read(), content_type='application/pdf')
                
                from myapp.utils.google_drive import upload_expense_receipt_to_drive
                _, file_url = upload_expense_receipt_to_drive(uploaded_file)
                
                try:
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
                except Exception as cleanup_err:
                    print(f"Warning: Failed to cleanup temp PDF: {cleanup_err}")
                    
            except Exception as e:
                return Response({'message': f"Failed to generate and upload PDF: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        title = request.data.get('title', 'Official Letter')
        document_type = request.data.get('document_type', 'default')
        
        letterhead = LetterHead.objects.create(
            title=title,
            document_type=document_type,
            file=file_url
        )
        serializer = LetterHeadSerializer(letterhead)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class LetterHeadDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            letterhead = LetterHead.objects.get(pk=pk)
            serializer = LetterHeadSerializer(letterhead)
            return Response(serializer.data)
        except LetterHead.DoesNotExist:
            return Response({'message': 'Record not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            letterhead = LetterHead.objects.get(pk=pk)
            file_obj = request.FILES.get('file')
            if file_obj:
                from myapp.utils.google_drive import upload_expense_receipt_to_drive
                try:
                    _, file_url = upload_expense_receipt_to_drive(file_obj)
                    letterhead.file = file_url
                except Exception as e:
                    return Response({'message': f"Failed to upload document to Google Drive: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            title = request.data.get('title')
            if title is not None:
                letterhead.title = title
            document_type = request.data.get('document_type')
            if document_type is not None:
                letterhead.document_type = document_type
                
            letterhead.save()
            serializer = LetterHeadSerializer(letterhead)
            return Response(serializer.data)
        except LetterHead.DoesNotExist:
            return Response({'message': 'Record not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            letterhead = LetterHead.objects.get(pk=pk)
            letterhead.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except LetterHead.DoesNotExist:
            return Response({'message': 'Record not found'}, status=status.HTTP_404_NOT_FOUND)

class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
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

class EmployeeStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() not in ['employee', 'manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied. Employees only.'}, status=status.HTTP_403_FORBIDDEN)
        
        user = request.user
        employee_profile, _ = Employee.objects.get_or_create(user=user, defaults={'designation': 'Manager', 'department': 'Management'})
        
        total_hours = Attendance.objects.filter(employee=employee_profile).aggregate(total=models.Sum('hours_worked'))['total'] or 0
        total_appreciations = Appreciation.objects.filter(recipient=user).count()
        leaves_taken = LeaveRequest.objects.filter(employee=user, status='approved').count()
        total_leave_balance = (employee_profile.casual_leaves + employee_profile.sick_leaves + employee_profile.vacation_leaves) - leaves_taken
        pending_tasks = Task.objects.filter(assigned_to=user).exclude(status='completed').count()
        total_warnings = Offboarding.objects.filter(employee=employee_profile, action_type='warning').count()

        return Response({
            'hours_worked': float(total_hours),
            'appreciations': total_appreciations,
            'leaves_taken': leaves_taken,
            'total_leaves': total_leave_balance,
            'pending_tasks': pending_tasks,
            'warnings': total_warnings
        })


class CalendarDataView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        holidays = Holiday.objects.all().order_by('date')
        holiday_serializer = HolidaySerializer(holidays, many=True)

        leaves = LeaveRequest.objects.exclude(status='rejected').order_by('start_date')
        leave_serializer = LeaveRequestSerializer(leaves, many=True)

        return Response({
            'holidays': holiday_serializer.data,
            'leaves': leave_serializer.data
        })

class AssetView(APIView):
    permission_classes=[permissions.IsAuthenticated]

    def get(self,request):
        if request.user.role.lower() == 'employee':
            assets=Asset.objects.filter(assigned_to__user=request.user)
        else:
            assets=Asset.objects.all().order_by('-created_at')

        serializer=AssetSerializer(assets,many=True)
        return Response(serializer.data)

    def post(self,request):
        if request.user.role.lower() not in ['manager','admin','super_admin']:
            return Response({'message':'Access denied.'},status=status.HTTP_403_FORBIDDEN)
        
        serializer = AssetSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data,status=status.HTTP_201_CREATED)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)

class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    username = serializers.CharField(source='employee.user.username', read_only=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = ['id', 'employee', 'employee_name', 'username', 'date', 'check_in', 'check_out', 'hours_worked', 'status']

    def get_employee_name(self, obj):
        user = obj.employee.user
        return f'{user.first_name} {user.last_name}'.strip() or user.email

    def get_status(self, obj):
        return 'Present' if obj.check_in else 'Absent'

class ManagerAttendanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        records = Attendance.objects.select_related('employee__user').all().order_by('-id')
        data = []
        for rec in records:
            user = rec.employee.user
            # Use localtime for consistent display
            from django.utils.timezone import localtime
            check_in = localtime(rec.check_in).strftime("%I:%M %p") if rec.check_in else "-"
            check_out = localtime(rec.check_out).strftime("%I:%M %p") if rec.check_out else "-"
            status_text = "Present" if rec.check_in else "Absent"
            
            # Naming fallback
            first = user.first_name.strip() if user.first_name else ""
            last = user.last_name.strip() if user.last_name else ""
            emp_name = f"{first} {last}".strip()
            if not emp_name:
                emp_name = user.username or (user.email.split('@')[0] if user.email else 'Team Member')

            rec_date = rec.date.strftime("%Y-%m-%d") if rec.date else "-"
            display_date = rec.date.strftime("%d-%m-%Y") if rec.date else "-"
            
            data.append({
                "employee_name": emp_name,
                "date": rec_date,
                "display_date": display_date,
                "check_in": check_in,
                "check_out": check_out,
                "status": status_text
            })
        return Response(data)

class ManagerPerformanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        # Using Appreciation as dummy for Performance
        appreciations = Appreciation.objects.all().order_by('-created_at')
        serializer = AppreciationSerializer(appreciations, many=True)
        return Response(serializer.data)

class ManagerNotificationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        return Response([])

class EmployeeAttendanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() not in ['employee', 'manager', 'admin', 'super_admin', 'team_leader']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        employee_profile, _ = Employee.objects.get_or_create(user=request.user, defaults={'designation': 'Manager', 'department': 'Management'})
        attendance = Attendance.objects.filter(employee=employee_profile).order_by('-date')
        serializer = AttendanceSerializer(attendance, many=True)
        return Response(serializer.data)

class EmployeeNotificationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() not in ['employee', 'manager', 'admin', 'super_admin', 'team_leader']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        return Response([])

class EmployeeClockInView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role.lower() not in ['employee', 'manager', 'admin', 'super_admin', 'team_leader']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        today = timezone.now().date()
        employee_profile, _ = Employee.objects.get_or_create(user=request.user, defaults={'designation': 'Manager', 'department': 'Management'})
        attendance = Attendance.objects.create(
            employee=employee_profile,
            date=today,
            check_in=timezone.now()
        )

        return Response({'message': 'Clocked in successfully.', 'time': attendance.check_in}, status=status.HTTP_201_CREATED)

class EmployeeClockOutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role.lower() not in ['employee', 'manager', 'admin', 'super_admin', 'team_leader']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        today = timezone.now().date()
        employee_profile, _ = Employee.objects.get_or_create(user=request.user, defaults={'designation': 'Manager', 'department': 'Management'})
        attendance = Attendance.objects.filter(employee=employee_profile, date=today, check_out__isnull=True).order_by('-check_in').first()
        if not attendance:
            return Response({'message': 'No open clock-in found for today.'}, status=status.HTTP_400_BAD_REQUEST)
        
        attendance.check_out = timezone.now()
        diff = attendance.check_out - attendance.check_in
        attendance.hours_worked = round(diff.total_seconds() / 3600.0, 2)
        attendance.save()

        return Response({'message': 'Clocked out successfully.', 'hours': attendance.hours_worked}, status=status.HTTP_200_OK)

class EmployeeAttendanceTodayView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() not in ['employee', 'manager', 'admin', 'super_admin', 'team_leader']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        today = timezone.now().date()
        employee_profile, _ = Employee.objects.get_or_create(user=request.user, defaults={'designation': 'Manager', 'department': 'Management'})
        records = Attendance.objects.filter(employee=employee_profile, date=today).order_by('check_in')
        
        data = []
        for rec in records:
            data.append({
                'check_in': rec.check_in,
                'check_out': rec.check_out,
                'status': 'Present' if rec.check_in else 'Absent'
            })
        return Response(data, status=status.HTTP_200_OK)

class EmployeeLeaveApplyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() not in ['employee', 'manager', 'admin', 'super_admin', 'team_leader']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        leaves = LeaveRequest.objects.filter(employee=request.user).order_by('-created_at')
        serializer = LeaveRequestSerializer(leaves, many=True)
        return Response(serializer.data)

    def post(self, request):
        if request.user.role.lower() not in ['employee', 'manager', 'admin', 'super_admin', 'team_leader']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data.copy()
        data['employee'] = request.user.id
        if 'leave_type' not in data:
            data['leave_type'] = 'General'
        
        serializer = LeaveRequestSerializer(data=data)
        if serializer.is_valid():
            leave_request = serializer.save()
            recipient_list = [settings.MANAGER_EMAIL]
            if recipient_list:
                employee_name = leave_request.employee.get_full_name() or leave_request.employee.username
                subject = f"New Leave Request from {employee_name}"
                message = f"""{employee_name} has applied for {leave_request.leave_type} leave.
Period: {leave_request.start_date} to {leave_request.end_date}
Reason: {leave_request.reason}

Please review."""
                try:
                    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, recipient_list)
                except Exception:
                    pass

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EmployeeExpenseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() not in ['employee', 'manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        expenses = Expense.objects.filter(employee=request.user.employee_profile).order_by('-created_at')
        serializer = ExpenseSerializer(expenses, many=True)
        return Response(serializer.data)

    def post(self, request):
        if request.user.role.lower() not in ['employee', 'manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data.copy()
        data['employee'] = request.user.employee_profile.id
        if 'date' not in data:
            data['date'] = str(timezone.now().date())
        
        serializer = ExpenseSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ManagerLeaveApprovalView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role.lower() != 'manager':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        leave_id = request.data.get('leave_id')
        new_status = request.data.get('status')
        if new_status not in ['Approved', 'Rejected']:
            return Response({'message': 'Invalid status. Must be Approved or Rejected.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            leave = LeaveRequest.objects.get(id=leave_id)
            leave.status = new_status.lower()
            leave.save()
            return Response({'message': f'Leave {new_status}'}, status=status.HTTP_200_OK)
        except LeaveRequest.DoesNotExist:
            return Response({'message': 'Leave request not found.'}, status=status.HTTP_404_NOT_FOUND)

class ManagerTaskCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        title = data.get('title', '')
        employee_input = data.get('assigned_to')
        
        employee = User.objects.filter(email=employee_input).first()
        
        if not employee:
            try:
                employee = User.objects.filter(id=employee_input).first()
            except (ValueError, TypeError):
                employee = None
        
        if not employee:
            return Response({"error": "Assigned employee not found"}, status=400)
                
        # 2) CREATE TASK ONLY IF USER EXISTS
        task = Task.objects.create(
            title=title,
            deadline=data.get('deadline'),
            priority=data.get('priority', 'Medium'),
            description=data.get('description', ''),
            assigned_to=employee,
            created_by=request.user,
            status="Pending"
        )
        
        # 3) MAIL TRIGGER FIX
        print("Sending mail to:", employee.email)
        try:
            send_mail(
                subject="New Task Assigned",
                message=f"You have a new task: {title}",
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[employee.email],
                fail_silently=False
            )
        except Exception as e:
            print(f"Mail failed: {e}")
        
        serializer = TaskSerializer(task)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class ManagerTaskListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        tasks = Task.objects.all().order_by('-id')
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

class EmployeeTaskListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() not in ['employee', 'manager']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        tasks = Task.objects.filter(assigned_to=request.user).order_by('-id')
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

class TaskDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role.lower() not in ['manager', 'admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            task = Task.objects.get(pk=pk)
            task.title = request.data.get('title', task.title)
            task.deadline = request.data.get('deadline', task.deadline)
            task.priority = request.data.get('priority', task.priority)
            task.description = request.data.get('description', task.description)
            task.save()
            return Response(TaskSerializer(task).data)
        except Task.DoesNotExist:
            return Response({'message': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)

class EmployeeTaskUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role.lower() not in ['employee', 'manager']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        task_id = request.data.get('task_id')
        try:
            task = Task.objects.get(id=task_id)
            if 'status' in request.data and request.data.get('status') == 'Completed':
                task.status = "Completed"
                task.completed_at = timezone.now()
            
            if 'employee_note' in request.data:
                task.employee_note = request.data.get('employee_note')
                
            task.save()
            return Response({'message': 'Task updated successfully'}, status=status.HTTP_200_OK)
        except Task.DoesNotExist:
            return Response({'message': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)

class DocumentUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request):
        print("FILES:", request.FILES)
        print("DATA:", request.data)
        file = request.FILES.get('file')
        title = request.data.get('title')

        if not file:
            return Response({"error": "File missing"}, status=400)

        document = CompanyDocument.objects.create(
            title=title,
            file=file,
            uploaded_by=request.user
        )

        return Response({
            "message": "Uploaded successfully",
            "file": f"http://127.0.0.1:8000{document.file.url}"
        })

class EmployeeDocumentsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        docs = CompanyDocument.objects.all().order_by('-created_at')
        policies = CompanyPolicy.objects.all().order_by('-created_at')
        
        data = []
        for d in docs:
            file_url = None
            if d.file:
                file_str = str(d.file)
                if file_str.startswith('http://') or file_str.startswith('https://'):
                    file_url = file_str
                else:
                    file_url = request.build_absolute_uri(d.file.url)
            data.append({
                "title": d.title,
                "file": file_url,
                "uploaded_at": d.created_at
            })
            
        for p in policies:
            file_url = None
            if p.file:
                file_str = str(p.file)
                if file_str.startswith('http://') or file_str.startswith('https://'):
                    file_url = file_str
                else:
                    file_url = request.build_absolute_uri(p.file.url)
            
            # Extract category prefix from description
            title = p.title
            desc = p.description or ''
            category = 'General'
            try:
                if '[Category:' in desc:
                    category = desc.split('[Category:')[1].split(']')[0]
            except Exception:
                pass
            
            data.append({
                "title": f"[Policy - {category}] {title}",
                "file": file_url,
                "uploaded_at": p.created_at
            })
            
        from django.utils import timezone
        data.sort(key=lambda x: x['uploaded_at'] if x['uploaded_at'] else timezone.now(), reverse=True)
        return Response(data)



class ManagerProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', required=False, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = ManagerProfile
        fields = [
            'first_name', 'last_name', 'email', 'phone', 'gender', 
            'date_of_birth', 'address', 'designation', 'department', 
            'employee_id', 'joining_date', 'bank_name', 'account_number', 
            'ifsc_code', 'branch', 'profile_picture',
            'aadhaar_number', 'pan_number', 'marital_status', 'nationality', 
            'permanent_address', 'emergency_contact_name', 'emergency_contact_phone', 
            'emergency_contact_relation', 'blood_group'
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user
        
        if 'first_name' in user_data:
            user.first_name = user_data['first_name']
        if 'last_name' in user_data:
            user.last_name = user_data['last_name']
        user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

class ManagerProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, created = ManagerProfile.objects.get_or_create(user=request.user)
        serializer = ManagerProfileSerializer(profile)
        return Response(serializer.data)

class ManagerProfileUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        print("Incoming data:", request.data)
        user = request.user
        profile = user.manager_profile
        
        serializer = ManagerProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # Manually handle dates to ensure they are saved to ManagerProfile
            dob = request.data.get("date_of_birth")
            joining = request.data.get("joining_date")

            if dob:
                try:
                    profile.date_of_birth = datetime.strptime(dob, "%Y-%m-%d").date()
                except Exception as e:
                    print(f"DOB parse failed: {dob}, error: {e}")

            if joining:
                try:
                    profile.joining_date = datetime.strptime(joining, "%Y-%m-%d").date()
                except Exception as e:
                    print(f"Joining parse failed: {joining}, error: {e}")

            # New fields persistence
            profile.aadhaar_number = request.data.get("aadhaar_number", profile.aadhaar_number)
            profile.pan_number = request.data.get("pan_number", profile.pan_number)
            profile.marital_status = request.data.get("marital_status", profile.marital_status)
            profile.nationality = request.data.get("nationality", profile.nationality)
            profile.permanent_address = request.data.get("permanent_address", profile.permanent_address)
            profile.emergency_contact_name = request.data.get("emergency_contact_name", profile.emergency_contact_name)
            profile.emergency_contact_phone = request.data.get("emergency_contact_phone", profile.emergency_contact_phone)
            profile.emergency_contact_relation = request.data.get("emergency_contact_relation", profile.emergency_contact_relation)
            profile.blood_group = request.data.get("blood_group", profile.blood_group)

            profile.save()
            
            # Return updated data
            return Response(ManagerProfileSerializer(profile).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EmployeeProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone_number = serializers.CharField(source='phone')
    date_of_joining = serializers.DateField(source='joining_date')
    branch_name = serializers.CharField(source='branch')

    class Meta:
        model = Employee
        fields = [
            'first_name', 'last_name', 'email', 'phone_number', 'gender', 
            'date_of_birth', 'address', 'designation', 'department', 
            'employee_id', 'date_of_joining', 'bank_name', 'account_number', 
            'ifsc_code', 'branch_name',
            'aadhaar_number', 'pan_number', 'marital_status', 'nationality', 
            'permanent_address', 'emergency_contact_name', 'emergency_contact_phone', 
            'emergency_contact_relation', 'blood_group'
        ]

class EmployeeProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            employee = request.user.employee_profile
        except Employee.DoesNotExist:
            return Response({"error": "Employee profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = EmployeeProfileSerializer(employee)
        return Response(serializer.data)

class EmployeeProfileUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        try:
            employee = request.user.employee_profile
            user = request.user
            
            # Update User model
            user.first_name = request.data.get("first_name", user.first_name)
            user.last_name = request.data.get("last_name", user.last_name)
            user.save()

            # Update Employee profile personal details
            employee.phone = request.data.get("phone_number", employee.phone)
            employee.gender = request.data.get("gender", employee.gender)
            employee.address = request.data.get("address", employee.address)
            
            # Professional details
            employee.employee_id = request.data.get("employee_id", employee.employee_id)
            employee.designation = request.data.get("designation", employee.designation)
            employee.department = request.data.get("department", employee.department)
            
            from datetime import datetime
            dob = request.data.get("date_of_birth")
            joining = request.data.get("date_of_joining")
            
            if dob and isinstance(dob, str) and dob.strip():
                try:
                    # Handle both YYYY-MM-DD and ISO formats
                    date_str = dob.split('T')[0]
                    employee.date_of_birth = datetime.strptime(date_str, "%Y-%m-%d").date()
                except Exception as e:
                    print(f"DEBUG: DOB parse error: {e}")
                
            if joining and isinstance(joining, str) and joining.strip():
                try:
                    date_str = joining.split('T')[0]
                    employee.joining_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                except Exception as e:
                    print(f"DEBUG: Joining Date parse error: {e}")
                
            # Bank details
            employee.bank_name = request.data.get("bank_name", employee.bank_name)
            employee.account_number = request.data.get("account_number", employee.account_number)
            employee.ifsc_code = request.data.get("ifsc_code", employee.ifsc_code)
            employee.branch = request.data.get("branch_name", employee.branch)
            
            # New fields persistence
            employee.aadhaar_number = request.data.get("aadhaar_number", employee.aadhaar_number)
            employee.pan_number = request.data.get("pan_number", employee.pan_number)
            employee.marital_status = request.data.get("marital_status", employee.marital_status)
            employee.nationality = request.data.get("nationality", employee.nationality)
            employee.permanent_address = request.data.get("permanent_address", employee.permanent_address)
            employee.emergency_contact_name = request.data.get("emergency_contact_name", employee.emergency_contact_name)
            employee.emergency_contact_phone = request.data.get("emergency_contact_phone", employee.emergency_contact_phone)
            employee.emergency_contact_relation = request.data.get("emergency_contact_relation", employee.emergency_contact_relation)
            employee.blood_group = request.data.get("blood_group", employee.blood_group)

            employee.save()
            return Response(EmployeeProfileSerializer(employee).data)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"message": f"Server Error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ExpenseSerializer(serializers.ModelSerializer):
    employee_username = serializers.CharField(source='employee.username', read_only=True)
    employee_name = serializers.SerializerMethodField()
    team_leader_username = serializers.CharField(source='team_leader.username', read_only=True)
    manager_username = serializers.CharField(source='manager.username', read_only=True)
    submitted_at_str = serializers.SerializerMethodField()
    receipt_url = serializers.SerializerMethodField()
    receipt = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = [
            'id', 'employee', 'employee_username', 'employee_name', 'team_leader', 'team_leader_username', 
            'manager', 'manager_username', 'title', 'category', 'amount', 
            'description', 'receipt', 'receipt_url', 'status', 'payment_status', 
            'manager_remark', 'team_leader_remark', 'submitted_at', 'submitted_at_str', 'updated_at'
        ]
        read_only_fields = ['employee', 'submitted_at', 'updated_at']

    def get_employee_name(self, obj):
        if obj.employee:
            return f"{obj.employee.first_name} {obj.employee.last_name}".strip() or obj.employee.username
        return ""

    def get_submitted_at_str(self, obj):
        if obj.submitted_at:
            from django.utils.timezone import localtime
            return localtime(obj.submitted_at).strftime("%d-%m-%Y %I:%M %p")
        return ""

    def get_receipt(self, obj):
        if getattr(obj, 'receipt_url', None):
            return obj.receipt_url
        if obj.receipt:
            return obj.receipt.url
        return None

    def get_receipt_url(self, obj):
        if getattr(obj, 'receipt_url', None):
            return obj.receipt_url
        if obj.receipt:
            return obj.receipt.url
        return None


class NotificationSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    sender = serializers.PrimaryKeyRelatedField(read_only=True)
    target_role = serializers.CharField(read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'sender', 'sender_name', 'sender_role', 'target_role', 'is_read', 'created_at']

class NotificationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Return notifications where target_role matches current user's role
        # Also return sent notifications if the user is an admin or manager
        role_lower = request.user.role.lower() if request.user.role else ''
        if role_lower == 'team_leader':
            # Team Leaders should also see general employee announcements and broadcasts
            target_notifications = Notification.objects.filter(target_role__in=['employee', 'team_leader']).order_by('-created_at')
        else:
            target_notifications = Notification.objects.filter(target_role=request.user.role).order_by('-created_at')
        
        sent_notifications = []
        if request.user.role in ['admin', 'manager']:
            sent_notifications = Notification.objects.filter(sender=request.user).order_by('-created_at')

        data = {
            'received': NotificationSerializer(target_notifications, many=True).data,
            'sent': NotificationSerializer(sent_notifications, many=True).data
        }
        return Response(data)

    def post(self, request):
        user = request.user
        if user.role.lower() not in ['admin', 'manager', 'super_admin']:
            return Response({"error": "Unauthorized to send notifications"}, status=status.HTTP_403_FORBIDDEN)

        # Admin/SuperAdmin sends to managers, Manager sends to employees
        target_role = 'manager' if user.role.lower() in ['admin', 'super_admin'] else 'employee'
        
        serializer = NotificationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(sender=user, target_role=target_role)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AllEmployeeProfilesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        employees = Employee.objects.all().order_by('user__first_name')
        serializer = EmployeeProfileSerializer(employees, many=True)
        
        # Post-process serialized data to provide graceful naming fallbacks for empty names
        serialized_employees = serializer.data
        for emp_data in serialized_employees:
            first = (emp_data.get('first_name') or '').strip()
            last = (emp_data.get('last_name') or '').strip()
            if not first and not last:
                email = emp_data.get('email') or ''
                fallback = email.split('@')[0] if email else 'Team Member'
                emp_data['first_name'] = fallback
                emp_data['last_name'] = ''

        try:
            team_leaders = TeamLeaderProfile.objects.select_related('user').all()
            tl_data = []
            for tl in team_leaders:
                dob_str = tl.date_of_birth.strftime("%d-%m-%Y") if tl.date_of_birth else None
                joining_str = tl.joining_date.strftime("%d-%m-%Y") if tl.joining_date else None
                
                tl_first = tl.user.first_name if (tl.user and tl.user.first_name) else ''
                tl_last = tl.user.last_name if (tl.user and tl.user.last_name) else ''
                if not tl_first.strip() and not tl_last.strip():
                    tl_first = tl.user.username if tl.user else 'Team'
                    tl_last = '' if tl.user else 'Leader'

                tl_data.append({
                    'id': -tl.id,  # Negative ID space to ensure zero collision with Employee records
                    'first_name': tl_first,
                    'last_name': tl_last,
                    'email': tl.user.email if (tl.user and tl.user.email) else '',
                    'phone_number': tl.phone or '',
                    'gender': tl.gender or '',
                    'date_of_birth': dob_str,
                    'address': tl.address or '',
                    'designation': tl.designation or 'Team Leader',
                    'department': tl.department or '',
                    'employee_id': tl.employee_id or '',
                    'date_of_joining': joining_str,
                    'bank_name': tl.bank_name or '',
                    'account_number': tl.account_number or '',
                    'ifsc_code': tl.ifsc_code or '',
                    'branch_name': tl.branch or '',
                    'aadhaar_number': tl.aadhaar_number or '',
                    'pan_number': tl.pan_number or '',
                    'marital_status': tl.marital_status or '',
                    'nationality': tl.nationality or '',
                    'permanent_address': tl.permanent_address or '',
                    'emergency_contact_name': tl.emergency_contact_name or '',
                    'emergency_contact_phone': tl.emergency_contact_phone or '',
                    'emergency_contact_relation': tl.emergency_contact_relation or '',
                    'blood_group': tl.blood_group or ''
                })
            combined_data = serialized_employees + tl_data
            combined_data.sort(key=lambda x: (x.get('first_name') or '').lower())
            return Response(combined_data)
        except Exception as e:
            print(f"Failed to append Team Leader profiles: {e}")
            return Response(serialized_employees)


class TeamLeaderProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', required=False, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = TeamLeaderProfile
        fields = [
            'first_name', 'last_name', 'email', 'phone', 'gender', 
            'date_of_birth', 'address', 'designation', 'department', 
            'employee_id', 'joining_date', 'bank_name', 'account_number', 
            'ifsc_code', 'branch', 'profile_picture',
            'aadhaar_number', 'pan_number', 'marital_status', 'nationality', 
            'permanent_address', 'emergency_contact_name', 'emergency_contact_phone', 
            'emergency_contact_relation', 'blood_group'
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user
        
        if 'first_name' in user_data:
            user.first_name = user_data['first_name']
        if 'last_name' in user_data:
            user.last_name = user_data['last_name']
        user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

class TeamLeaderProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() != 'team_leader':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        profile, created = TeamLeaderProfile.objects.get_or_create(user=request.user)
        serializer = TeamLeaderProfileSerializer(profile)
        return Response(serializer.data)

class TeamLeaderProfileUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        if request.user.role.lower() != 'team_leader':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        user = request.user
        profile, created = TeamLeaderProfile.objects.get_or_create(user=user)
        
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        
        # Clean date fields so that DRF's DateField does not fail on empty string validation
        for field in ['date_of_birth', 'joining_date']:
            val = data.get(field)
            if val == "" or val == "null" or val is None:
                data[field] = None
        
        serializer = TeamLeaderProfileSerializer(profile, data=data, partial=True)
        if serializer.is_valid():
            profile = serializer.save()
            
            # Manually handle first_name and last_name on user
            if 'first_name' in data:
                user.first_name = data['first_name']
            if 'last_name' in data:
                user.last_name = data['last_name']
            user.save()
            
            # Manually handle dates in multi-formats (browser standard vs settings serialized standard)
            dob = data.get("date_of_birth")
            joining = data.get("joining_date")

            if dob:
                try:
                    if '-' in dob:
                        parts = dob.split('-')
                        if len(parts) == 3:
                            if len(parts[0]) == 4: # YYYY-MM-DD
                                profile.date_of_birth = datetime.strptime(dob, "%Y-%m-%d").date()
                            else: # DD-MM-YYYY
                                profile.date_of_birth = datetime.strptime(dob, "%d-%m-%Y").date()
                except Exception as e:
                    print(f"DOB parse failed: {dob}, error: {e}")
            else:
                profile.date_of_birth = None

            if joining:
                try:
                    if '-' in joining:
                        parts = joining.split('-')
                        if len(parts) == 3:
                            if len(parts[0]) == 4: # YYYY-MM-DD
                                profile.joining_date = datetime.strptime(joining, "%Y-%m-%d").date()
                            else: # DD-MM-YYYY
                                profile.joining_date = datetime.strptime(joining, "%d-%m-%Y").date()
                except Exception as e:
                    print(f"Joining parse failed: {joining}, error: {e}")
            else:
                profile.joining_date = None

            # Explicit field assignments to guarantee absolute persistence
            profile.phone = data.get("phone", profile.phone)
            profile.gender = data.get("gender", profile.gender)
            profile.address = data.get("address", profile.address)
            profile.permanent_address = data.get("permanent_address", profile.permanent_address)
            
            profile.designation = data.get("designation", profile.designation)
            profile.department = data.get("department", profile.department)
            profile.employee_id = data.get("employee_id", profile.employee_id)
            
            profile.aadhaar_number = data.get("aadhaar_number", profile.aadhaar_number)
            profile.pan_number = data.get("pan_number", profile.pan_number)
            profile.marital_status = data.get("marital_status", profile.marital_status)
            profile.nationality = data.get("nationality", profile.nationality)
            profile.blood_group = data.get("blood_group", profile.blood_group)
            
            profile.emergency_contact_name = data.get("emergency_contact_name", profile.emergency_contact_name)
            profile.emergency_contact_phone = data.get("emergency_contact_phone", profile.emergency_contact_phone)
            profile.emergency_contact_relation = data.get("emergency_contact_relation", profile.emergency_contact_relation)
            
            profile.bank_name = data.get("bank_name", profile.bank_name)
            profile.account_number = data.get("account_number", profile.account_number)
            profile.ifsc_code = data.get("ifsc_code", profile.ifsc_code)
            profile.branch = data.get("branch", profile.branch)

            profile.save()
            return Response(TeamLeaderProfileSerializer(profile).data)
        print("Serializer validation errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TeamLeaderStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() != 'team_leader':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        team_members = Employee.objects.filter(team_leader=request.user)
        total_members = team_members.count()
        
        member_users = [emp.user for emp in team_members]
        
        pending_tasks = Task.objects.filter(assigned_to__in=member_users, status__iexact='pending').count()
        completed_tasks = Task.objects.filter(assigned_to__in=member_users, status__iexact='completed').count()
        
        # Calculate attendance percentage
        total_attendance_days = Attendance.objects.filter(employee__in=team_members).count()
        if total_members > 0:
            attendance_pct = min(100.0, round((total_attendance_days / (total_members * 22)) * 100, 1))
        else:
            attendance_pct = 0.0

        return Response({
            'total_team_members': total_members,
            'pending_tasks': pending_tasks,
            'completed_tasks': completed_tasks,
            'attendance_percentage': attendance_pct
        })

class TeamLeaderTeamMembersView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() != 'team_leader':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        employees = Employee.objects.filter(team_leader=request.user).order_by('user__first_name')
        serializer = EmployeeProfileSerializer(employees, many=True)
        return Response(serializer.data)

class TeamLeaderAttendanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() != 'team_leader':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        from django.db.models import Q
        records = Attendance.objects.filter(
            Q(employee__team_leader=request.user) | Q(employee__user=request.user)
        ).select_related('employee__user').order_by('-id')
        data = []
        for rec in records:
            user = rec.employee.user
            from django.utils.timezone import localtime
            check_in = localtime(rec.check_in).strftime("%I:%M %p") if rec.check_in else "-"
            check_out = localtime(rec.check_out).strftime("%I:%M %p") if rec.check_out else "-"
            status_text = "Present" if rec.check_in else "Absent"
            
            name = f"{user.first_name} {user.last_name}".strip() or user.username
            if user == request.user:
                name = f"{name} (Me)"
            
            data.append({
                "employee_name": name,
                "date": rec.date.strftime("%d-%m-%Y"),
                "check_in": check_in,
                "check_out": check_out,
                "status": status_text
            })
        return Response(data)

class TeamLeaderTasksView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() != 'team_leader':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        # Get manager assigned tasks to the TL, and tasks assigned by TL to employees
        my_tasks = Task.objects.filter(assigned_to=request.user).order_by('-id')
        team_tasks = Task.objects.filter(assigned_by_team_leader=request.user).order_by('-id')
        
        return Response({
            'my_tasks': TaskSerializer(my_tasks, many=True).data,
            'team_tasks': TaskSerializer(team_tasks, many=True).data
        })

    def post(self, request):
        if request.user.role.lower() != 'team_leader':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        data = request.data
        title = data.get('title', '')
        employee_input = data.get('assigned_to')
        
        # Verify the target employee is assigned to this team leader
        employee = User.objects.filter(email=employee_input).first()
        if not employee:
            employee = User.objects.filter(username=employee_input).first()
            
        if not employee:
            return Response({"error": "Employee not found"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Security: check if employee is under this TL
        try:
            emp_profile = Employee.objects.get(user=employee)
            if emp_profile.team_leader != request.user:
                return Response({"error": "Access denied. Employee is not assigned to your team."}, status=status.HTTP_403_FORBIDDEN)
        except Employee.DoesNotExist:
            return Response({"error": "Employee profile not found"}, status=status.HTTP_400_BAD_REQUEST)
            
        task = Task.objects.create(
            title=title,
            deadline=data.get('deadline'),
            priority=data.get('priority', 'Medium'),
            description=data.get('description', ''),
            assigned_to=employee,
            created_by=request.user,
            assigned_by_team_leader=request.user,
            status="Pending"
        )
        
        try:
            send_mail(
                subject="New Task Assigned by Team Leader",
                message=f"You have a new task: {title}",
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[employee.email],
                fail_silently=True
            )
        except Exception as e:
            print(f"Mail failed: {e}")
            
        return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)

    def patch(self, request):
        if request.user.role.lower() != 'team_leader':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        task_id = request.data.get('task_id')
        try:
            task = Task.objects.get(id=task_id)
            # Security: must be created by or assigned to this TL
            if task.assigned_by_team_leader != request.user and task.assigned_to != request.user:
                return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
                
            task.title = request.data.get('title', task.title)
            task.deadline = request.data.get('deadline', task.deadline)
            task.priority = request.data.get('priority', task.priority)
            task.description = request.data.get('description', task.description)
            task.status = request.data.get('status', task.status)
            task.employee_note = request.data.get('employee_note', task.employee_note)
            task.save()
            
            return Response(TaskSerializer(task).data)
        except Task.DoesNotExist:
            return Response({'message': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)

class TeamLeaderPerformanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() != 'team_leader':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        # Returns simple dynamic calculated metrics per team member
        team_members = Employee.objects.filter(team_leader=request.user)
        data = []
        for emp in team_members:
            user = emp.user
            tasks = Task.objects.filter(assigned_to=user)
            completed_count = tasks.filter(status__iexact='completed').count()
            pending_count = tasks.filter(status__iexact='pending').count()
            
            # Simple attendance calc
            total_days = Attendance.objects.filter(employee=emp).count()
            attendance_pct = min(100.0, round((total_days / 22) * 100, 1))
            
            # Simple overdue calculation (pending tasks whose deadline has passed)
            overdue_count = tasks.filter(status__iexact='pending', deadline__lt=timezone.now().date()).count()
            
            data.append({
                'employee_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'designation': emp.designation,
                'completed_tasks': completed_count,
                'pending_tasks': pending_count,
                'attendance_percentage': attendance_pct,
                'overdue_tasks': overdue_count
            })
            
        return Response(data)


# --- Expenses Module APIs ---

class EmployeeExpenseListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.JSONParser]

    def get(self, request):
        if request.user.role.lower() not in ['employee', 'team_leader']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        expenses = Expense.objects.filter(employee=request.user).order_by('-submitted_at')
        
        # Filtering
        status_param = request.GET.get('status')
        payment_param = request.GET.get('payment_status')
        search_param = request.GET.get('search')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        if status_param:
            expenses = expenses.filter(status__iexact=status_param)
        if payment_param:
            expenses = expenses.filter(payment_status__iexact=payment_param)
        if search_param:
            expenses = expenses.filter(
                models.Q(title__icontains=search_param) | 
                models.Q(category__icontains=search_param) | 
                models.Q(description__icontains=search_param)
            )
        if start_date:
            expenses = expenses.filter(submitted_at__date__gte=start_date)
        if end_date:
            expenses = expenses.filter(submitted_at__date__lte=end_date)
            
        serializer = ExpenseSerializer(expenses, many=True)
        return Response(serializer.data)
 
    def post(self, request):
        if request.user.role.lower() not in ['employee', 'team_leader']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        # Get team leader from employee profile
        try:
            emp_profile = Employee.objects.get(user=request.user)
            team_leader = emp_profile.team_leader
        except Employee.DoesNotExist:
            team_leader = None
            
        # Get manager (the first available manager user)
        manager = User.objects.filter(role='manager').first()
        
        title = request.data.get('title', 'Expense Claim')
        category = request.data.get('category')
        amount = request.data.get('amount')
        description = request.data.get('description', '')
        receipt = request.FILES.get('receipt') # MultiPart upload support
        status_val = request.data.get('status', 'PENDING').upper()
        
        if status_val not in ['PENDING', 'DRAFT']:
            status_val = 'PENDING'
            
        if not category or not amount:
            return Response({'message': 'Category and Amount are required fields.'}, status=status.HTTP_400_BAD_REQUEST)
            
        receipt_url_val = None
        if receipt:
            try:
                from myapp.utils.google_drive import upload_expense_receipt_to_drive
                file_id, receipt_url_val = upload_expense_receipt_to_drive(receipt)
            except ValueError as ve:
                return Response({'message': str(ve)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({'message': f"Failed to upload receipt to Google Drive: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        expense = Expense.objects.create(
            employee=request.user,
            team_leader=team_leader,
            manager=manager,
            title=title,
            category=category,
            amount=amount,
            description=description,
            receipt=None,
            receipt_url=receipt_url_val,
            status=status_val,
            payment_status='UNPAID'
        )
        
        # Trigger dynamic company notification when submitting a live request
        if status_val == 'PENDING':
            try:
                Notification.objects.create(
                    title="New Expense Claim Submitted",
                    message=f"{request.user.username} submitted a claim of ₹{amount} for {category}.",
                    sender=request.user,
                    target_role='manager'
                )
            except Exception as e:
                print(f"Failed to create notification: {e}")
                
        return Response(ExpenseSerializer(expense).data, status=status.HTTP_201_CREATED)


class TeamLeaderExpenseListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() != 'team_leader':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        # Security: TLs should only access employee assigned to their team
        expenses = Expense.objects.filter(
            employee__employee_profile__team_leader=request.user
        ).order_by('-submitted_at')
        
        status_param = request.GET.get('status')
        payment_param = request.GET.get('payment_status')
        search_param = request.GET.get('search')
        
        if status_param:
            expenses = expenses.filter(status__iexact=status_param)
        if payment_param:
            expenses = expenses.filter(payment_status__iexact=payment_param)
        if search_param:
            expenses = expenses.filter(
                models.Q(employee__username__icontains=search_param) |
                models.Q(title__icontains=search_param) |
                models.Q(category__icontains=search_param)
            )
            
        serializer = ExpenseSerializer(expenses, many=True)
        return Response(serializer.data)


class TeamLeaderExpenseUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role.lower() != 'team_leader':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        expense_id = request.data.get('expense_id')
        status_val = request.data.get('status', '').upper()
        remark = request.data.get('remark', '')
        
        if status_val not in ['APPROVED', 'REJECTED']:
            return Response({'message': 'Invalid status update. Must be APPROVED or REJECTED.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # Security verification
            expense = Expense.objects.get(
                id=expense_id,
                employee__employee_profile__team_leader=request.user
            )
            expense.status = status_val
            expense.team_leader_remark = remark
            expense.save()
            
            # Send status update notifications
            try:
                Notification.objects.create(
                    title=f"Expense Claim {status_val.capitalize()}",
                    message=f"Team Leader {request.user.username} has {status_val.lower()} your claim of ₹{expense.amount} for {expense.category}.",
                    sender=request.user,
                    target_role='employee'
                )
            except Exception as e:
                print(f"Failed to trigger employee notification: {e}")
                
            return Response(ExpenseSerializer(expense).data)
        except Expense.DoesNotExist:
            return Response({'message': 'Expense request not found or unauthorized.'}, status=status.HTTP_404_NOT_FOUND)


class ManagerExpenseListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() != 'manager':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        expenses = Expense.objects.all().order_by('-submitted_at')
        
        status_param = request.GET.get('status')
        payment_param = request.GET.get('payment_status')
        search_param = request.GET.get('search')
        
        if status_param:
            expenses = expenses.filter(status__iexact=status_param)
        if payment_param:
            expenses = expenses.filter(payment_status__iexact=payment_param)
        if search_param:
            expenses = expenses.filter(
                models.Q(employee__username__icontains=search_param) |
                models.Q(title__icontains=search_param) |
                models.Q(category__icontains=search_param)
            )
            
        serializer = ExpenseSerializer(expenses, many=True)
        return Response(serializer.data)


class ManagerExpenseApproveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role.lower() != 'manager':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        expense_id = request.data.get('expense_id')
        status_val = request.data.get('status', '').upper()
        remark = request.data.get('remark', '')
        
        if status_val not in ['APPROVED', 'REJECTED']:
            return Response({'message': 'Invalid status. Must be APPROVED or REJECTED.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            expense = Expense.objects.get(id=expense_id)
            expense.status = status_val
            expense.manager_remark = remark
            expense.manager = request.user
            expense.save()
            
            # Send notification to employee
            try:
                Notification.objects.create(
                    title=f"Expense {status_val.capitalize()} by Manager",
                    message=f"Manager {request.user.username} has {status_val.lower()} your claim of ₹{expense.amount}.",
                    sender=request.user,
                    target_role='employee'
                )
            except Exception as e:
                print(f"Failed to notify employee of manager approval: {e}")
                
            return Response(ExpenseSerializer(expense).data)
        except Expense.DoesNotExist:
            return Response({'message': 'Expense claim not found.'}, status=status.HTTP_444_NOT_FOUND)


class ManagerExpensePayView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role.lower() != 'manager':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        expense_id = request.data.get('expense_id')
        payment_val = request.data.get('payment_status', '').upper()
        remark = request.data.get('remark', '')
        
        if payment_val not in ['PAID', 'UNPAID']:
            return Response({'message': 'Invalid payment status. Must be PAID or UNPAID.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            expense = Expense.objects.get(id=expense_id)
            expense.payment_status = payment_val
            if remark:
                expense.manager_remark = remark
            expense.save()
            
            # If paid, trigger a notification
            if payment_val == 'PAID':
                try:
                    Notification.objects.create(
                        title="Expense Reimbursed / Paid",
                        message=f"Your claim of ₹{expense.amount} for {expense.category} has been sanctioned and paid.",
                        sender=request.user,
                        target_role='employee'
                    )
                except Exception as e:
                    print(f"Failed to notify employee of payout: {e}")
                    
            return Response(ExpenseSerializer(expense).data)
        except Expense.DoesNotExist:
            return Response({'message': 'Expense claim not found.'}, status=status.HTTP_404_NOT_FOUND)


from django.http import StreamingHttpResponse
import requests

class DownloadFileView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        file_url = request.query_params.get('url')
        custom_name = request.query_params.get('name')
        
        if not file_url:
            return Response({'message': 'URL parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not custom_name:
            custom_name = "document"
            
        import re
        clean_name = re.sub(r'[^a-zA-Z0-9_\- ]', '', custom_name).strip().replace(' ', '_')
        if not clean_name:
            clean_name = "downloaded_file"
        
        ext = ".pdf"
        lower_url = file_url.lower()
        if '.pdf' in lower_url:
            ext = '.pdf'
        elif '.jpg' in lower_url or '.jpeg' in lower_url:
            ext = '.jpg'
        elif '.png' in lower_url:
            ext = '.png'
        elif '.webp' in lower_url:
            ext = '.webp'
        elif '.docx' in lower_url:
            ext = '.docx'
        elif '.doc' in lower_url:
            ext = '.doc'
        elif '.xlsx' in lower_url:
            ext = '.xlsx'
        elif '.xls' in lower_url:
            ext = '.xls'
            
        if not clean_name.lower().endswith(ext):
            clean_name = f"{clean_name}{ext}"

        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
            response = requests.get(file_url, headers=headers, stream=True, timeout=15)
            if response.status_code != 200:
                return Response({'message': 'Failed to fetch resource from source URL'}, status=status.HTTP_404_NOT_FOUND)
                
            content_type = response.headers.get('Content-Type', 'application/octet-stream')
            
            django_response = StreamingHttpResponse(
                response.iter_content(chunk_size=4096),
                content_type=content_type
            )
            django_response['Content-Disposition'] = f'attachment; filename="{clean_name}"'
            return django_response
            
        except Exception as e:
            return Response({'message': f"Error downloading file: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ==========================================
# PLANNER VIEWS
# ==========================================

from django.db.models import Q

class PlannerMyEventsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        events = PlannerEvent.objects.filter(employee=request.user).order_by('-start_date')
        serializer = PlannerEventSerializer(events, many=True)
        return Response(serializer.data)

class PlannerTeamEventsView(APIView):
    permission_classes = [IsTeamLeader | IsManager | IsAdmin]

    def get(self, request):
        if request.user.role == 'team_leader':
            team_members = User.objects.filter(employee_profile__team_leader=request.user)
            events = PlannerEvent.objects.filter(Q(employee__in=team_members) | Q(employee=request.user)).order_by('-start_date')
        else:
            events = PlannerEvent.objects.all()
        serializer = PlannerEventSerializer(events, many=True)
        return Response(serializer.data)

class PlannerDepartmentEventsView(APIView):
    permission_classes = [IsManager | IsAdmin]

    def get(self, request):
        if request.user.role == 'manager':
            # Simplified: Assuming manager can see all events for their department, or just all if simplified.
            # Assuming employee profile has department
            department = ""
            if hasattr(request.user, 'manager_profile'):
                department = request.user.manager_profile.department
            events = PlannerEvent.objects.filter(employee__employee_profile__department=department).order_by('-start_date')
        else:
            events = PlannerEvent.objects.all()
            
        serializer = PlannerEventSerializer(events, many=True)
        return Response(serializer.data)

class PlannerAllEventsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        events = PlannerEvent.objects.all().order_by('-start_date')
        serializer = PlannerEventSerializer(events, many=True)
        return Response(serializer.data)

class PlannerHolidaysView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        holidays = PlannerHoliday.objects.all().order_by('holiday_date')
        serializer = PlannerHolidaySerializer(holidays, many=True)
        return Response(serializer.data)

class PlannerCreateEventView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PlannerEventSerializer(data=request.data)
        if serializer.is_valid():
            # If the user doesn't pass employee, default to themselves so it's not orphaned
            employee = request.user if 'employee' not in serializer.validated_data else serializer.validated_data['employee']
            event = serializer.save(created_by=request.user, employee=employee)
            return Response(PlannerEventSerializer(event).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PlannerApproveEventView(APIView):
    permission_classes = [IsTeamLeader | IsManager | IsAdmin]

    def patch(self, request, pk):
        try:
            event = PlannerEvent.objects.get(pk=pk)
        except PlannerEvent.DoesNotExist:
            return Response({'message': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if request.user.role == 'team_leader' and event.employee.employee_profile.team_leader != request.user:
             return Response({'message': 'Not authorized to approve this event'}, status=status.HTTP_403_FORBIDDEN)

        event.is_approved = request.data.get('is_approved', True)
        event.status = request.data.get('status', 'Approved')
        event.approved_by = request.user
        event.approved_at = timezone.now()
        event.save()
        
        return Response(PlannerEventSerializer(event).data)

class PlannerCalendarFeedView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # A combined feed of all events relevant to the user for the custom calendar
        user = request.user
        holidays = PlannerHoliday.objects.all()
        
        if user.role == 'employee':
            team_leader = getattr(getattr(user, 'employee_profile', None), 'team_leader', None)
            events = PlannerEvent.objects.filter(
                Q(employee=user) | 
                Q(created_by=user) |
                Q(visibility='Organization') |
                Q(visibility='Team', created_by=team_leader) |
                Q(visibility='Team', employee__employee_profile__team_leader=team_leader)
            ).distinct()
        elif user.role == 'team_leader':
            team_members = User.objects.filter(employee_profile__team_leader=user)
            events = PlannerEvent.objects.filter(
                Q(employee__in=team_members) | Q(employee=user) | Q(created_by=user) | Q(visibility='Organization')
            ).distinct()
        elif user.role == 'manager':
            department = getattr(getattr(user, 'manager_profile', None), 'department', '')
            events = PlannerEvent.objects.filter(
                Q(employee__employee_profile__department=department) | Q(visibility='Organization') | Q(created_by=user)
            ).distinct()
        else: # admin
            events = PlannerEvent.objects.all()
            
        events_serializer = PlannerEventSerializer(events, many=True)
        holidays_serializer = PlannerHolidaySerializer(holidays, many=True)
        
        return Response({
            'events': events_serializer.data,
            'holidays': holidays_serializer.data
        })
