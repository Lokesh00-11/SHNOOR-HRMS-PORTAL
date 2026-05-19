from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.utils import timezone
from ..models import (
    Employee, LeaveRequest, Notification, Appreciation, ManagerProfile, Expense
)
from ..serializers import (
    EmployeeProfileSerializer, AppreciationSerializer, 
    ManagerProfileSerializer, LeaveRequestSerializer, ExpenseSerializer
)

class ManagerEmployeeListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        employees = Employee.objects.select_related('user').all().order_by('user__first_name')
        serializer = EmployeeProfileSerializer(employees, many=True)
        return Response(serializer.data)

class ManagerLeaveApprovalView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        if request.user.is_authenticated and request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        leave_id = request.data.get('leave_id')
        new_status = request.data.get('status')
        if new_status not in ['Approved', 'Rejected']:
            return Response({'message': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            leave = LeaveRequest.objects.get(id=leave_id)
            leave.status = new_status.lower()
            leave.save()   
            Notification.objects.create(
                recipient=leave.employee, sender=request.user, title="Leave Status Update",
                message=f"Your {leave.leave_type} leave request has been {new_status.lower()}."
            )
            return Response({'message': f'Leave {new_status}'})
        except LeaveRequest.DoesNotExist:
            return Response({'message': 'Leave request not found.'}, status=status.HTTP_404_NOT_FOUND)

class ManagerProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        profile, _ = ManagerProfile.objects.get_or_create(user=request.user)
        serializer = ManagerProfileSerializer(profile)
        return Response(serializer.data)

class ManagerProfileUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def put(self, request):
        profile = request.user.manager_profile
        serializer = ManagerProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ManagerPerformanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        appreciations = Appreciation.objects.all().order_by('-created_at')
        serializer = AppreciationSerializer(appreciations, many=True)
        return Response(serializer.data)

class ManagerNotificationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        return Response([])

class PendingLeavesCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        count = LeaveRequest.objects.filter(status='pending').count()
        return Response({'pending_count': count})

class ManagerExpenseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        expenses = Expense.objects.all().order_by('-submitted_at')
        serializer = ExpenseSerializer(expenses, many=True)
        return Response(serializer.data)

    def post(self, request):
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        expense_id = request.data.get('expense_id')
        new_status = request.data.get('status')
        
        if not expense_id or not new_status:
            return Response({'message': 'Missing expense_id or status'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            expense = Expense.objects.get(id=expense_id)
            expense.status = new_status
            expense.save()
            return Response({'message': f'Expense status updated to {new_status}'})
        except Expense.DoesNotExist:
            return Response({'message': 'Expense not found'}, status=status.HTTP_404_NOT_FOUND)
