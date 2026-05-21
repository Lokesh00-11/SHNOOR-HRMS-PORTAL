from rest_framework.views import APIView
import time
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
        companies = Company.objects.all().order_by('-created_at')
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
            serializer = CompanySerializer(company, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
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
        transactions = Transactions.objects.all().order_by('-transaction_date')
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)

class UserManagementView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        users = User.objects.all().order_by('-id')
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
    def post(self, request):
        data = request.data.copy()
        if 'password' in data:
            data['password'] = make_password(data['password'])
        serializer = UserSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
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
        super_admins = SuperAdmin.objects.all()
        serializer = SuperAdminSerializer(super_admins, many=True)
        return Response(serializer.data)

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
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        employees = Employee.objects.select_related('user').all().order_by('user__first_name')
        serializer = EmployeeProfileSerializer(employees, many=True)
        return Response(serializer.data)

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
        if request.user.role.lower() != 'admin':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data.copy()
        name = data.get('name')
        if not name:
            return Response({'message': 'Company name is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        email = data.get('email')
        if not email:
            data['email'] = f"{name.lower().replace(' ', '')}_{int(time.time())}@shnoor.com"

        serializer = CompanySerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
