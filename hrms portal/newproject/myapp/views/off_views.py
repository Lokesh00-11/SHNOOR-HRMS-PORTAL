from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from ..models import Holiday, Asset, OrgChart, SupportQuery, Offboarding, LeaveRequest
from ..serializers import (
    HolidaySerializer, AssetSerializer, OrgChartSerializer, 
    SupportQuerySerializer, OffboardingSerializer, LeaveRequestSerializer
)

class HolidayView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        holidays = Holiday.objects.all().order_by('date')
        serializer = HolidaySerializer(holidays, many=True)
        return Response(serializer.data)

class AssetView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        assets = Asset.objects.all().order_by('-id')
        serializer = AssetSerializer(assets, many=True)
        return Response(serializer.data)

class OrgChartView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        nodes = OrgChart.objects.all().order_by('id')
        serializer = OrgChartSerializer(nodes, many=True)
        return Response(serializer.data)
    def post(self, request):
        if request.user.role not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = OrgChartSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OrgChartDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def patch(self, request, pk):
        if request.user.role not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access Denied'}, status=status.HTTP_403_FORBIDDEN)
        try:
            node = OrgChart.objects.get(pk=pk)
            serializer = OrgChartSerializer(node, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except OrgChart.DoesNotExist:
            return Response({'message': 'Record not found'}, status=status.HTTP_404_NOT_FOUND)
    def delete(self, request, pk):
        if request.user.role not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        try:
            node = OrgChart.objects.get(pk=pk)
            node.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except OrgChart.DoesNotExist:
            return Response({'message': 'Record not found'}, status=status.HTTP_404_NOT_FOUND)

class SupportQueryView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        user = request.user
        if user.role.lower() == 'employee':
            queries = SupportQuery.objects.filter(sender=user).order_by('-created_at')
        elif user.role.lower() in ['manager', 'team_leader']:
            queries = SupportQuery.objects.filter(target_role=user.role.lower()).order_by('-created_at')
        else:
            queries = SupportQuery.objects.all().order_by('-created_at')
        
        if user.role.lower() == 'employee':
            queries.update(sender_read=True)
        elif user.role.lower() in ['manager', 'team_leader']:
            queries.update(recipient_read=True)

        serializer = SupportQuerySerializer(queries, many=True)
        return Response(serializer.data)
    def post(self, request):
        serializer = SupportQuerySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(sender=request.user, sender_read=True, recipient_read=False)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SupportQueryDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def patch(self, request, pk):
        try:
            query = SupportQuery.objects.get(pk=pk)
            serializer = SupportQuerySerializer(query, data=request.data, partial=True)
            if serializer.is_valid():
                if 'status' in request.data:
                    serializer.save(sender_read=False)
                else:
                    serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except SupportQuery.DoesNotExist:
            return Response({'message': 'Query not found'}, status=status.HTTP_404_NOT_FOUND)

class SupportQueryUnreadCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        user = request.user
        role = user.role.lower()
        count = 0
        if role == 'employee':
            count = SupportQuery.objects.filter(sender=user, sender_read=False).count()
        elif role in ['manager', 'team_leader']:
            count = SupportQuery.objects.filter(target_role=role, recipient_read=False).count()
        return Response({'unread_count': count})

class OffboardingView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        if request.user.role.lower() == 'employee':
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
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = OffboardingSerializer(data=request.data)
        if serializer.is_valid():
            offboarding = serializer.save()
            # Send notification to employee
            try:
                from ..models import Notification
                Notification.objects.create(
                    title=f"New Offboarding Record: {offboarding.action_type.capitalize()}",
                    message=f"A new offboarding record has been created for you: {offboarding.reason}",
                    sender=request.user,
                    recipient=offboarding.employee.user,
                    target_role='employee'
                )
            except Exception as e:
                print(f"Error creating notification: {e}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OffboardingDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request, pk):
        try:
            offboarding = Offboarding.objects.get(pk=pk)
            if request.user.role.lower() == 'employee' and offboarding.employee.user != request.user:
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
            serializer = OffboardingSerializer(offboarding, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
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
