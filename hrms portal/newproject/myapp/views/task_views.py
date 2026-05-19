from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.utils import timezone
from ..models import Task, User, Notification
from ..serializers import TaskSerializer

class ManagerTaskCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        assigned_to_email = request.data.get('assigned_to')
        try:
            assigned_to_user = User.objects.get(email=assigned_to_email)
            task = Task.objects.create(
                title=request.data.get('title'),
                description=request.data.get('description'),
                assigned_to=assigned_to_user,
                created_by=request.user,
                deadline=request.data.get('deadline'),
                priority=request.data.get('priority', 'Medium')
            )
            Notification.objects.create(
                recipient=assigned_to_user, sender=request.user, title="New Task Assigned",
                message=f"A new task '{task.title}' has been assigned to you."
            )
            return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)
        except User.DoesNotExist:
            return Response({'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

class ManagerTaskListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        tasks = Task.objects.all().order_by('-id')
        return Response(TaskSerializer(tasks, many=True).data)

class EmployeeTaskListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        tasks = Task.objects.filter(assigned_to=request.user).order_by('-id')
        return Response(TaskSerializer(tasks, many=True).data)

class TaskDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request, pk):
        try:
            task = Task.objects.get(pk=pk)
            return Response(TaskSerializer(task).data)
        except Task.DoesNotExist:
            return Response({'message': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)
    def patch(self, request, pk):
        try:
            task = Task.objects.get(pk=pk)
            serializer = TaskSerializer(task, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Task.DoesNotExist:
            return Response({'message': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

class EmployeeTaskUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        task_id = request.data.get('task_id')
        if not task_id:
            return Response({'message': 'Task ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            task = Task.objects.get(id=task_id, assigned_to=request.user)
            
            if 'status' in request.data:
                task.status = request.data.get('status')
                if task.status == 'Completed' and not task.completed_at:
                    task.completed_at = timezone.now()
            
            if 'employee_note' in request.data:
                task.employee_note = request.data.get('employee_note')
                
            task.save()
            return Response({'message': 'Task updated successfully', 'task': TaskSerializer(task).data})
        except Task.DoesNotExist:
            return Response({'message': 'Task not found or not assigned to you.'}, status=status.HTTP_404_NOT_FOUND)
