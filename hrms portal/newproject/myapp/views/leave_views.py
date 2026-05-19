from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.core.mail import send_mail
from django.conf import settings
from datetime import datetime
from ..models import LeaveRequest, Notification, User
from ..serializers import LeaveRequestSerializer

class LeaveRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        leaves = LeaveRequest.objects.all().order_by('-id')
        serializer = LeaveRequestSerializer(leaves, many=True)
        return Response(serializer.data)
    def post(self, request):
        serializer = LeaveRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EmployeeLeaveApplyView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        leaves = LeaveRequest.objects.filter(employee=request.user).order_by('-id')
        serializer = LeaveRequestSerializer(leaves, many=True)
        return Response(serializer.data)
    def post(self, request):
        data = request.data.copy()
        data['employee'] = request.user.id
        
        leave_type = data.get('leave_type', 'General')
        try:
            start_date = datetime.strptime(data.get('start_date'), '%Y-%m-%d').date()
            end_date = datetime.strptime(data.get('end_date'), '%Y-%m-%d').date()
            days = (end_date - start_date).days + 1
            
            employee_profile = request.user.employee_profile
            available = 0
            if 'sick' in leave_type.lower():
                available = employee_profile.sick_leaves
            elif 'casual' in leave_type.lower():
                available = employee_profile.casual_leaves
            elif 'vacation' in leave_type.lower():
                available = employee_profile.vacation_leaves
            
            if days > available:
                data['leave_type'] = 'Paid Leave'
        except Exception:
            pass
        
        serializer = LeaveRequestSerializer(data=data)
        if serializer.is_valid():
            leave_request = serializer.save()
            recipient_list = [settings.MANAGER_EMAIL]
            if recipient_list:
                employee_name = leave_request.employee.get_full_name() or leave_request.employee.username
                subject = f"New Leave Request from {employee_name}"
                message = f"""{employee_name} has applied for {leave_request.leave_type} leave.
Period: {leave_request.start_date} to {leave_request.end_date}
Reason: {leave_request.reason}

Please review."""
                try:
                    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, recipient_list)
                except Exception:
                    pass

            try:
                managers = User.objects.filter(role__in=['manager', 'admin', 'super_admin'])
                employee_name = leave_request.employee.get_full_name() or leave_request.employee.username
                for m in managers:
                    Notification.objects.create(
                        recipient=m, sender=request.user, title="New Leave Request",
                        message=f"New {leave_request.leave_type} leave request from {employee_name}."
                    )
            except Exception as e:
                print(f"Notification Error: {e}")

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LeaveRequestDetailView(APIView):
    permission_classes = [permissions.AllowAny]
    def patch(self, request, pk):
        try:
            leave = LeaveRequest.objects.get(pk=pk)
            old_status = leave.status
            new_status = request.data.get('status')
            
            serializer = LeaveRequestSerializer(leave, data=request.data, partial=True)
            if serializer.is_valid():
                updated_leave = serializer.save()
                
                if old_status != 'approved' and new_status == 'approved':
                    try:
                        employee_profile = updated_leave.employee.employee_profile
                        days = (updated_leave.end_date - updated_leave.start_date).days + 1
                        ltype = updated_leave.leave_type.lower()
                        if 'casual' in ltype: employee_profile.casual_leaves -= days
                        elif 'sick' in ltype: employee_profile.sick_leaves -= days
                        elif 'vacation' in ltype: employee_profile.vacation_leaves -= days
                        employee_profile.save()
                    except Exception as e:
                        print(f"Error updating leave balance: {e}")

                if old_status != new_status:
                    try:
                        Notification.objects.create(
                            recipient=updated_leave.employee, sender=request.user,
                            title="Leave Status Update",
                            message=f"Your {updated_leave.leave_type} leave request has been {new_status.lower()}."
                        )
                    except Exception as e:
                        print(f"Notification Error: {e}")
                
                if new_status and new_status.lower() in ['approved', 'rejected']:
                    if updated_leave.employee.email:
                        subject = f"Leave Request {new_status.capitalize()}"
                        message = (
                            f"Hello {updated_leave.employee.first_name or updated_leave.employee.username},\n\n"
                            f"Your leave request for {updated_leave.leave_type} "
                            f"from {updated_leave.start_date} to {updated_leave.end_date} "
                            f"has been {new_status}.\n\n"
                            f"Regards,\nHR Team"
                        )
                        try:
                            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [updated_leave.employee.email])
                        except Exception as e:
                            print(f"Error sending email: {e}")
                
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except LeaveRequest.DoesNotExist:
            return Response({'message': 'Leave request not found'}, status=status.HTTP_404_NOT_FOUND)
    def delete(self, request, pk):
        try:
            leave = LeaveRequest.objects.get(pk=pk)
            leave.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except LeaveRequest.DoesNotExist:
            return Response({'message': 'Leave request not found'}, status=status.HTTP_404_NOT_FOUND)
