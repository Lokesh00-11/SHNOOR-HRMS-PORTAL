from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db import models
from ..models import (
    TeamLeaderProfile, Employee, Task, Attendance, SupportQuery, Notification
)
from ..serializers import (
    TeamLeaderProfileSerializer, EmployeeProfileSerializer, TaskSerializer, SupportQuerySerializer
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
        employees = Employee.objects.filter(team_leader=request.user).order_by('user__first_name')
        serializer = EmployeeProfileSerializer(employees, many=True)
        return Response(serializer.data)
    def post(self, request):
        employee_id = request.data.get('employee_id')
        try:
            employee = Employee.objects.get(id=employee_id)
            employee.team_leader = request.user
            employee.save()
            return Response({'message': f'Employee added to team.'})
        except Employee.DoesNotExist:
            return Response({'message': 'Employee not found.'}, status=status.HTTP_404_NOT_FOUND)

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
