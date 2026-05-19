from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db import models
from django.utils import timezone
from ..models import (
    Employee, Attendance, Appreciation, LeaveRequest, Offboarding, Task, Expense
)
from ..serializers import (
    AppreciationSerializer, EmployeeProfileSerializer, ExpenseSerializer
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
        used_sick = used_casual = used_vacation = total_days_taken = 0
        for leave in approved_leaves:
            d = (leave.end_date - leave.start_date).days + 1
            ltype = leave.leave_type.lower()
            if 'sick' in ltype: used_sick += d; total_days_taken += d
            elif 'casual' in ltype: used_casual += d; total_days_taken += d
            elif 'vacation' in ltype: used_vacation += d; total_days_taken += d
            
        total_warnings = Offboarding.objects.filter(employee=employee_profile, action_type='warning').count()
        paid_sick = max(0, used_sick - 7)
        paid_casual = max(0, used_casual - 7)
        paid_vacation = max(0, used_vacation - 7)
        total_paid_leaves = paid_sick + paid_casual + paid_vacation
        total_free_used = (used_sick - paid_sick) + (used_casual - paid_casual) + (used_vacation - paid_vacation)
        remaining_balance = 21 - total_free_used

        return Response({
            'hours_worked': float(total_hours),
            'appreciations': total_appreciations,
            'leaves_taken': total_days_taken,
            'warnings': total_warnings,
            'sick_leaves': max(0, 7 - used_sick),
            'casual_leaves': max(0, 7 - used_casual),
            'vacation_leaves': max(0, 7 - used_vacation),
            'total_balance': remaining_balance,
            'paid_leaves_taken': total_paid_leaves
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
