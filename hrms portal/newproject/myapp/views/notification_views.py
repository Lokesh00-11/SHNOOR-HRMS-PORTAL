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

class BadgeCountsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        role = user.role.lower()
        
        from django.db.models import Q
        base_qs = Notification.objects.filter(
            Q(recipient=user) | Q(recipient__isnull=True, target_role__iexact=role),
            is_read=False
        )
        
        counts = {'notifications': 0, 'leaves': 0, 'expenses': 0, 'queries': 0, 'tasks': 0, 'payroll': 0, 'thanks': 0, 'offboarding': 0, 'transactions': 0}
        
        for n in base_qs:
            t = n.title.lower()
            if 'leave' in t: counts['leaves'] += 1
            elif 'expense' in t: counts['expenses'] += 1
            elif 'query' in t: counts['queries'] += 1
            elif 'task' in t: counts['tasks'] += 1
            elif 'payroll' in t or 'salary' in t or 'payslip' in t: counts['payroll'] += 1
            elif 'thank' in t or 'appreciation' in t: counts['thanks'] += 1
            elif 'offboard' in t or 'resign' in t: counts['offboarding'] += 1
            elif 'transaction' in t or 'payment' in t: counts['transactions'] += 1
            else: counts['notifications'] += 1
            
        return Response(counts)

class MarkBadgeReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        user = request.user
        role = user.role.lower()
        badge_type = request.data.get('type')
        
        from django.db.models import Q
        qs = Notification.objects.filter(
            Q(recipient=user) | Q(recipient__isnull=True, target_role__iexact=role),
            is_read=False
        )
        
        if badge_type == 'leaves':
            qs.filter(title__icontains='leave').update(is_read=True)
        elif badge_type == 'expenses':
            qs.filter(title__icontains='expense').update(is_read=True)
        elif badge_type == 'queries':
            qs.filter(title__icontains='query').update(is_read=True)
        elif badge_type == 'tasks':
            qs.filter(title__icontains='task').update(is_read=True)
        elif badge_type == 'payroll':
            from django.db.models import Q as Q2
            qs.filter(Q2(title__icontains='payroll') | Q2(title__icontains='salary') | Q2(title__icontains='payslip')).update(is_read=True)
        elif badge_type == 'thanks':
            from django.db.models import Q as Q3
            qs.filter(Q3(title__icontains='thank') | Q3(title__icontains='appreciation')).update(is_read=True)
        elif badge_type == 'offboarding':
            from django.db.models import Q as Q4
            qs.filter(Q4(title__icontains='offboard') | Q4(title__icontains='resign')).update(is_read=True)
        elif badge_type == 'transactions':
            from django.db.models import Q as Q5
            qs.filter(Q5(title__icontains='transaction') | Q5(title__icontains='payment')).update(is_read=True)
        elif badge_type == 'notifications':
            from django.db.models import Q as Q6
            qs.exclude(title__icontains='leave').exclude(title__icontains='expense').exclude(title__icontains='query').exclude(title__icontains='task').exclude(title__icontains='payroll').exclude(title__icontains='salary').exclude(title__icontains='payslip').exclude(title__icontains='thank').exclude(title__icontains='appreciation').exclude(title__icontains='offboard').exclude(title__icontains='resign').exclude(title__icontains='transaction').exclude(title__icontains='payment').update(is_read=True)
            
        return Response({'status': 'ok'})

