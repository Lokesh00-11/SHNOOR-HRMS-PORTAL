from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db import models
from django.utils import timezone
from ..models import (
    Employee, Attendance, Appreciation, LeaveRequest, Offboarding, Task, Expense, SupportQuery, User
)
from ..serializers import (
    AppreciationSerializer, EmployeeProfileSerializer, ExpenseSerializer, SupportQuerySerializer
)

class EmployeeStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() not in ['employee', 'manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        user = request.user
        employee_profile, _ = Employee.objects.get_or_create(user=user, defaults={'designation': 'Employee', 'department': 'General'})
        total_hours = Attendance.objects.filter(employee=employee_profile).aggregate(total=models.Sum('hours_worked'))['total'] or 0
        total_appreciations = Appreciation.objects.filter(recipient=user).count()
        
        approved_leaves = LeaveRequest.objects.filter(employee=user, status='approved')
        total_days_taken = sum((leave.end_date - leave.start_date).days + 1 for leave in approved_leaves)
            
        total_warnings = Offboarding.objects.filter(employee=employee_profile, action_type='warning').count()

        return Response({
            'hours_worked': float(total_hours),
            'appreciations': total_appreciations,
            'leaves_taken': total_days_taken,
            'warnings': total_warnings,
            'sick_leaves': employee_profile.sick_leaves,
            'casual_leaves': employee_profile.casual_leaves,
            'vacation_leaves': employee_profile.vacation_leaves,
            'total_balance': employee_profile.sick_leaves + employee_profile.casual_leaves + employee_profile.vacation_leaves,
            'paid_leaves_taken': employee_profile.paid_leaves
        })

class EmployeeReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        if request.user.role.lower() != 'employee':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        user = request.user
        employee_profile = Employee.objects.get(user=user)
        tasks = Task.objects.filter(assigned_to=user)
        completed_tasks = tasks.filter(status='Completed')
        on_time_tasks = sum(1 for t in completed_tasks if t.completed_at and t.deadline and t.completed_at.date() <= t.deadline)
        
        today = timezone.now().date()
        first_day_of_month = today.replace(day=1)
        monthly_hours = Attendance.objects.filter(employee=employee_profile, date__gte=first_day_of_month).aggregate(total=models.Sum('hours_worked'))['total'] or 0
        
        approved_leaves = LeaveRequest.objects.filter(employee=user, status='approved')
        total_used_leaves = sum((l.end_date - l.start_date).days + 1 for l in approved_leaves if any(t in l.leave_type.lower() for t in ['sick', 'casual', 'vacation']))
        
        return Response({
            'total_tasks': tasks.count(),
            'on_time_tasks': on_time_tasks,
            'monthly_hours': float(monthly_hours),
            'total_used_leaves': total_used_leaves
        })

class EmployeeProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        profile, _ = Employee.objects.get_or_create(user=request.user)
        serializer = EmployeeProfileSerializer(profile)
        return Response(serializer.data)

class EmployeeProfileUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def put(self, request):
        profile = request.user.employee_profile
        serializer = EmployeeProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EmployeeAppreciationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        appreciations = Appreciation.objects.filter(recipient=request.user).order_by('-created_at')
        serializer = AppreciationSerializer(appreciations, many=True)
        return Response(serializer.data)

class EmployeeExpenseView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        expenses = Expense.objects.filter(employee=request.user).order_by('-submitted_at')
        serializer = ExpenseSerializer(expenses, many=True)
        return Response(serializer.data)
    def post(self, request):
        data = request.data.copy()
        data['employee'] = request.user.id
        if 'date' not in data: data['date'] = str(timezone.now().date())
        serializer = ExpenseSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EmployeeQueriesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queries = SupportQuery.objects.filter(sender=request.user).order_by('-created_at')
        serializer = SupportQuerySerializer(queries, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        target_role = data.get('target_role')
        
        recipient = None
        if target_role == 'team_leader':
            employee_profile = getattr(request.user, 'employee_profile', None)
            if employee_profile and employee_profile.team_leader:
                recipient = employee_profile.team_leader
        elif target_role == 'manager':
            company = request.user.company
            recipient = User.objects.filter(role='manager', company=company).first()

        serializer = SupportQuerySerializer(data=data)
        if serializer.is_valid():
            serializer.save(sender=request.user, recipient=recipient)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
