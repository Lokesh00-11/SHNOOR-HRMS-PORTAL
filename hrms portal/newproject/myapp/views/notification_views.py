from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from ..models import Notification, LeaveRequest
from ..serializers import NotificationSerializer

class NotificationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        received = Notification.objects.filter(recipient=request.user).order_by('-created_at')

        sent = Notification.objects.filter(sender=request.user).order_by('-created_at')
        unread_count = received.filter(is_read=False).count()
        
        if request.user.role.lower() in ['manager', 'admin', 'super_admin']:
            unread_leaves_count = LeaveRequest.objects.filter(status='pending').count()
        else:
            unread_leaves_count = 0

        return Response({
            'received': NotificationSerializer(received, many=True).data,
            'sent': NotificationSerializer(sent, many=True).data,
            'unread_count': unread_count,
            'unread_leaves_count': unread_leaves_count
        })
    def post(self, request):
        data = request.data.copy()
        data['sender'] = request.user.id
        serializer = NotificationSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MarkNotificationsReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read.'})

class UnreadNotificationCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'unread_count': count})

class EmployeeNotificationView(APIView):

    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        if request.user.role.lower() not in ['employee', 'manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        return Response([])

