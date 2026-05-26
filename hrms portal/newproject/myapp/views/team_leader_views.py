from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db import models
from django.contrib.auth import get_user_model
User = get_user_model()
from ..models import (
    TeamLeaderProfile, Employee, Task, Attendance, SupportQuery, Notification, EmployeeCase
)
from ..serializers import (
    TeamLeaderProfileSerializer, EmployeeProfileSerializer, TaskSerializer, SupportQuerySerializer, EmployeeCaseSerializer
)

class TeamLeaderProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        profile, _ = TeamLeaderProfile.objects.get_or_create(user=request.user)
        serializer = TeamLeaderProfileSerializer(profile)
        return Response(serializer.data)

class TeamLeaderProfileUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def put(self, request):
        profile = request.user.team_leader_profile
        serializer = TeamLeaderProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TeamLeaderStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        if request.user.role.lower() != 'team_leader':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        team_members = Employee.objects.filter(team_leader=request.user)
        total_members = team_members.count()
        tasks = Task.objects.filter(assigned_by_team_leader=request.user)
        pending = tasks.filter(status='Pending').count()
        completed = tasks.filter(status='Completed').count()
        
        return Response({
            'total_team_members': total_members,
            'pending_tasks': pending,
            'completed_tasks': completed,
            'attendance_percentage': 85.0 
        })

class TeamLeaderTeamMembersView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        if request.user.role.lower() != 'team_leader':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        if request.query_params.get('available') == 'true':
            employees = Employee.objects.all().order_by('user__first_name')
        else:
            employees = Employee.objects.filter(team_leader=request.user).order_by('user__first_name')
        serializer = EmployeeProfileSerializer(employees, many=True)
        return Response(serializer.data)
    def post(self, request):
        email = request.data.get('email')
        try:
            employee = Employee.objects.get(user__email=email)
            employee.team_leader = request.user
            employee.save()
            return Response({'message': f'Employee added to team.'})
        except Employee.DoesNotExist:
            return Response({'message': 'Employee not found with that email.'}, status=status.HTTP_404_NOT_FOUND)

class TeamLeaderTasksView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        if request.user.role.lower() != 'team_leader':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        my_tasks = Task.objects.filter(assigned_to=request.user).order_by('-id')
        team_tasks = Task.objects.filter(assigned_by_team_leader=request.user).order_by('-id')
        return Response({
            'my_tasks': TaskSerializer(my_tasks, many=True).data,
            'team_tasks': TaskSerializer(team_tasks, many=True).data
        })
        
    def post(self, request):
        if request.user.role.lower() != 'team_leader':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        email = request.data.get('assigned_to')
        try:
            assigned_user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'Employee not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        task_data = {
            'title': request.data.get('title'),
            'description': request.data.get('description'),
            'priority': request.data.get('priority', 'Medium'),
            'deadline': request.data.get('deadline'),
            'status': 'Pending'
        }
        
        serializer = TaskSerializer(data=task_data)
        if serializer.is_valid():
            serializer.save(assigned_to=assigned_user, assigned_by_team_leader=request.user, created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    def patch(self, request):
        if request.user.role.lower() != 'team_leader':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        task_id = request.data.get('task_id')
        try:
            task = Task.objects.get(id=task_id)
            if task.assigned_to != request.user and task.assigned_by_team_leader != request.user:
                return Response({'message': 'Access denied to this task.'}, status=status.HTTP_403_FORBIDDEN)
        except Task.DoesNotExist:
            return Response({'message': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        if 'status' in request.data:
            task.status = request.data['status']
        if 'employee_note' in request.data and task.assigned_to == request.user:
            task.employee_note = request.data['employee_note']
            
        if task.assigned_by_team_leader == request.user:
            if 'title' in request.data: task.title = request.data['title']
            if 'deadline' in request.data: task.deadline = request.data['deadline']
            if 'priority' in request.data: task.priority = request.data['priority']
            if 'description' in request.data: task.description = request.data['description']
            
        task.save()
        return Response({'message': 'Task updated successfully.'})

class TeamLeaderPerformanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        if request.user.role.lower() != 'team_leader':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        team_members = Employee.objects.filter(team_leader=request.user).select_related('user')
        data = []
        for emp in team_members:
            user = emp.user
            tasks = Task.objects.filter(assigned_to=user)
            data.append({
                'employee_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'designation': emp.designation,
                'completed_tasks': tasks.filter(status='Completed').count(),
                'pending_tasks': tasks.filter(status='Pending').count(),
                'attendance_percentage': 90.0
            })
        return Response(data)

class TeamLeaderQueriesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() not in ['team_leader', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        queries = SupportQuery.objects.filter(recipient=request.user).order_by('-created_at')
        serializer = SupportQuerySerializer(queries, many=True)
        return Response(serializer.data)

    def put(self, request):
        if request.user.role.lower() not in ['team_leader', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        query_id = request.data.get('query_id')
        reply_text = request.data.get('reply')
        new_status = request.data.get('status', 'resolved')
        
        try:
            query = SupportQuery.objects.get(id=query_id, recipient=request.user)
            query.reply = reply_text
            query.status = new_status
            query.recipient_read = True
            query.sender_read = False
            query.save()
            
            # Optionally send a notification back
            Notification.objects.create(
                recipient=query.sender, sender=request.user, title="Query Reply",
                message=f"Your Team Leader has replied to your query: {query.subject}"
            )
            
            return Response({'message': 'Query replied successfully!'})
        except SupportQuery.DoesNotExist:
            return Response({'message': 'Query not found or access denied.'}, status=status.HTTP_404_NOT_FOUND)

class TeamLeaderCasesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() != 'team_leader':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        cases = EmployeeCase.objects.filter(created_by=request.user).order_by('-created_at')
        serializer = EmployeeCaseSerializer(cases, many=True)
        return Response(serializer.data)

    def post(self, request):
        if request.user.role.lower() != 'team_leader':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        employee_ids = request.data.get('employee_ids', [])
        if not employee_ids:
            return Response({'message': 'At least one employee must be selected.'}, status=status.HTTP_400_BAD_REQUEST)
            
        employees = Employee.objects.filter(id__in=employee_ids, team_leader=request.user)
        if not employees.exists():
            return Response({'message': 'Employees not found in your team.'}, status=status.HTTP_404_NOT_FOUND)
            
        case_data = {
            'title': request.data.get('title'),
            'description': request.data.get('description'),
            'case_type': request.data.get('case_type'),
            'severity': request.data.get('severity', 'low'),
            'status': request.data.get('status', 'open'),
            'employees': employee_ids
        }
        
        serializer = EmployeeCaseSerializer(data=case_data)
        if serializer.is_valid():
            case = serializer.save(created_by=request.user)
            for emp in employees:
                Notification.objects.create(
                    recipient=emp.user,
                    sender=request.user,
                    title="New Case Filed",
                    message=f"A new case '{case.title}' has been filed involving you by your Team Leader.",
                    target_role='employee'
                )
                
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        if request.user.role.lower() != 'team_leader':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        case_id = request.data.get('id')
        try:
            case = EmployeeCase.objects.get(id=case_id, created_by=request.user)
        except EmployeeCase.DoesNotExist:
            return Response({'message': 'Case not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        if 'status' in request.data: case.status = request.data['status']
        if 'closing_remark' in request.data: case.closing_remark = request.data['closing_remark']
        
        case.save()
        
        if case.status == 'escalated':
            managers = User.objects.filter(role='manager')
            for manager in managers:
                Notification.objects.create(
                    recipient=manager, sender=request.user, title="Case Escalated",
                    message=f"Team Leader {request.user.username} escalated case: {case.title}",
                    target_role='manager'
                )
                
        serializer = EmployeeCaseSerializer(case)
        return Response(serializer.data)
