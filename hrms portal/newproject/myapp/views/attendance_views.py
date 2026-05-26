from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.utils import timezone
from django.utils.timezone import localtime
from ..models import Attendance, Employee, Appreciation, Notification, User
from ..serializers import AttendanceSerializer, AppreciationSerializer
from django.db.models import Q, Value
from django.db.models.functions import Concat
from datetime import timedelta, time


def cleanup_old_attendance():
    try:
        threshold = timezone.now().date() - timedelta(days=30)
        deleted_count, _ = Attendance.objects.filter(date__lt=threshold).delete()
        if deleted_count > 0:
            print(f"Cleanup: Deleted {deleted_count} old attendance records.")
    except Exception as e:
        print(f"Cleanup Error: {e}")

class ManagerAttendanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        cleanup_old_attendance()
        
        date_str = request.query_params.get('date')
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        view_date = None
        if date_str:
            try:
                view_date = timezone.datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                view_date = timezone.localtime(timezone.now()).date()
                
        search_query = request.query_params.get('search', '').strip()
        
        company = getattr(request.user, 'company', None)
        if company and request.user.role.lower() == 'manager':
            employees = Employee.objects.select_related('user').filter(user__company=company)
        else:
            employees = Employee.objects.select_related('user').all()
        
        is_historical = False
        
        if search_query:
            employees = employees.annotate(
                full_name=Concat('user__first_name', Value(' '), 'user__last_name')
            ).filter(
                Q(user__first_name__icontains=search_query) |
                Q(user__last_name__icontains=search_query) |
                Q(user__username__icontains=search_query) |
                Q(full_name__icontains=search_query)
            )
            
        if start_date_str and end_date_str:
            try:
                start_date = timezone.datetime.strptime(start_date_str, '%Y-%m-%d').date()
                end_date = timezone.datetime.strptime(end_date_str, '%Y-%m-%d').date()
                attendance_qs = Attendance.objects.filter(
                    employee__in=employees,
                    date__range=[start_date, end_date]
                ).order_by('check_in')
                is_historical = True
            except ValueError:
                return Response({'message': 'Invalid date format.'}, status=status.HTTP_400_BAD_REQUEST)
        elif search_query:
            start_date = timezone.now().date() - timedelta(days=30)
            end_date = timezone.now().date()
            attendance_qs = Attendance.objects.filter(
                employee__in=employees,
                date__range=[start_date, end_date]
            ).order_by('-date', 'check_in')
            is_historical = True
        else:
            if not view_date:
                view_date = timezone.localtime(timezone.now()).date()
            attendance_qs = Attendance.objects.filter(
                employee__in=employees,
                date=view_date
            ).order_by('check_in')
            
        att_map = {}
        for att in attendance_qs:
            key = (att.employee_id, att.date)
            if key not in att_map:
                att_map[key] = []
            att_map[key].append(att)
            
        data = []
        if is_historical:
            current_date = start_date
            while current_date <= end_date:
                for emp in employees:
                    logs = att_map.get((emp.id, current_date), [])
                    emp_name = f"{emp.user.first_name} {emp.user.last_name}".strip() or emp.user.username
                    
                    if not logs:
                        data.append({
                            "employee_id": emp.id,
                            "employee_name": emp_name,
                            "date": current_date.strftime("%d-%m-%Y"),
                            "check_in": "-",
                            "check_out": "-",
                            "hours_worked": "0.00",
                            "status": "Absent"
                        })
                    else:
                        for log in logs:
                            in_time = localtime(log.check_in).strftime("%I:%M %p") if log.check_in else "-"
                            if log.check_out:
                                out_time = localtime(log.check_out).strftime("%I:%M %p")
                                hours = log.hours_worked or 0
                            else:
                                out_time = "Still In"
                                diff = timezone.now() - log.check_in
                                hours = diff.total_seconds() / 3600.0
                                
                            data.append({
                                "attendance_id": log.id,
                                "employee_name": emp_name,
                                "date": current_date.strftime("%d-%m-%Y"),
                                "check_in": in_time,
                                "check_out": out_time,
                                "hours_worked": round(float(hours), 2),
                                "status": "Present"
                            })
                current_date += timedelta(days=1)
        else:
            for emp in employees:
                logs = att_map.get((emp.id, view_date), [])
                emp_name = f"{emp.user.first_name} {emp.user.last_name}".strip() or emp.user.username
                    
                if not logs:
                    data.append({
                        "employee_id": emp.id,
                        "employee_name": emp_name,
                        "date": view_date.strftime("%d-%m-%Y"),
                        "check_in": "-",
                        "check_out": "-",
                        "hours_worked": "0.00",
                        "status": "Absent"
                    })
                else:
                    for log in logs:
                        in_time = localtime(log.check_in).strftime("%I:%M %p") if log.check_in else "-"
                        out_time = localtime(log.check_out).strftime("%I:%M %p") if log.check_out else "Still In"
                        hours = log.hours_worked if log.check_out else (timezone.now() - log.check_in).total_seconds() / 3600.0
                            
                        data.append({
                            "attendance_id": log.id,
                            "employee_name": emp_name,
                            "date": view_date.strftime("%d-%m-%Y"),
                            "check_in": in_time,
                            "check_out": out_time,
                            "hours_worked": round(float(hours or 0), 2),
                            "status": "Present"
                        })
            
        # Stable sort 1: by employee name A-Z
        data.sort(key=lambda x: (x['employee_name'] or '').lower())
        
        # Stable sort 2: by status (Present before Absent)
        data.sort(key=lambda x: 0 if x['status'] == 'Present' else 1)
        
        # Stable sort 3: by date descending
        data.sort(key=lambda x: f"{x['date'].split('-')[2]}-{x['date'].split('-')[1]}-{x['date'].split('-')[0]}", reverse=True)
        
        return Response(data)

    def put(self, request):
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        attendance_id = request.data.get('attendance_id')
        employee_id = request.data.get('employee_id')
        date_str = request.data.get('date')
        check_in_str = request.data.get('check_in')
        check_out_str = request.data.get('check_out')
        
        if attendance_id:
            try:
                attendance = Attendance.objects.get(id=attendance_id)
            except Attendance.DoesNotExist:
                return Response({'message': 'Attendance record not found.'}, status=status.HTTP_404_NOT_FOUND)
        elif employee_id and date_str:
            try:
                date_obj = timezone.datetime.strptime(date_str, "%d-%m-%Y").date()
            except ValueError:
                try:
                    date_obj = timezone.datetime.strptime(date_str, "%Y-%m-%d").date()
                except ValueError:
                    return Response({'message': 'Invalid date format.'}, status=status.HTTP_400_BAD_REQUEST)
                    
            try:
                employee = Employee.objects.get(id=employee_id)
            except Employee.DoesNotExist:
                return Response({'message': 'Employee not found.'}, status=status.HTTP_404_NOT_FOUND)
                
            attendance = Attendance(employee=employee, date=date_obj)
        else:
            return Response({'message': 'Attendance ID or Employee ID and Date are required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        updated = False
        
        if check_in_str and check_in_str != "-":
            try:
                t = timezone.datetime.strptime(check_in_str, "%I:%M %p").time()
                attendance.check_in = timezone.make_aware(timezone.datetime.combine(attendance.date, t))
                updated = True
            except ValueError:
                return Response({'message': 'Invalid check-in time format. Expected "HH:MM AM/PM"'}, status=status.HTTP_400_BAD_REQUEST)
                
        if check_out_str and check_out_str != "-" and check_out_str != "Still In":
            try:
                t = timezone.datetime.strptime(check_out_str, "%I:%M %p").time()
                attendance.check_out = timezone.make_aware(timezone.datetime.combine(attendance.date, t))
                updated = True
            except ValueError:
                return Response({'message': 'Invalid check-out time format. Expected "HH:MM AM/PM"'}, status=status.HTTP_400_BAD_REQUEST)
                
        if updated:
            if attendance.check_in and attendance.check_out:
                if attendance.check_out < attendance.check_in:
                    return Response({'message': 'Check-out cannot be before check-in.'}, status=status.HTTP_400_BAD_REQUEST)
                diff = attendance.check_out - attendance.check_in
                attendance.hours_worked = round(diff.total_seconds() / 3600.0, 2)
            
            attendance.save()
            return Response({'message': 'Attendance updated successfully.'}, status=status.HTTP_200_OK)
        else:
            return Response({'message': 'No valid updates provided.'}, status=status.HTTP_400_BAD_REQUEST)

def enforce_12hr_limit(employee):
    try:
        today = timezone.localtime(timezone.now()).date()
        
        open_sessions = Attendance.objects.filter(employee=employee, check_out__isnull=True)
        
        for open_session in open_sessions:
            completed_on_day = Attendance.objects.filter(
                employee=employee, date=open_session.date, check_out__isnull=False
            )
            closed_hours_on_day = sum(float(att.hours_worked or 0) for att in completed_on_day)
            
            duration = (timezone.now() - open_session.check_in).total_seconds() / 3600.0
            total_potential_hours = closed_hours_on_day + duration
            
            if open_session.date < today or total_potential_hours >= 12.0:
                remaining_hours = max(0, 12.0 - closed_hours_on_day)
                auto_out_time = open_session.check_in + timedelta(hours=remaining_hours)
                
                open_session.check_out = auto_out_time
                open_session.hours_worked = round(remaining_hours, 2)
                open_session.save()
    except Exception as e:
        print(f"Auto-Clockout Error: {e}")

class EmployeeAttendanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() not in ['employee', 'team_leader', 'manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        employee_profile, _ = Employee.objects.get_or_create(user=request.user, defaults={'designation': 'Employee', 'department': 'General'})
        
        enforce_12hr_limit(employee_profile)
        
        records = Attendance.objects.filter(employee=employee_profile).order_by('-date', '-check_in')
        serializer = AttendanceSerializer(records, many=True)
        return Response(serializer.data)

class EmployeeClockInView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role.lower() not in ['employee', 'team_leader', 'manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        today = timezone.localtime(timezone.now()).date()
        employee_profile, _ = Employee.objects.get_or_create(user=request.user, defaults={'designation': 'Employee', 'department': 'General'})
        
        enforce_12hr_limit(employee_profile)

        completed_sessions = Attendance.objects.filter(employee=employee_profile, date=today, check_out__isnull=False)
        total_hours = sum(float(att.hours_worked or 0) for att in completed_sessions)
        
        if total_hours >= 12.0:
            return Response({'message': 'You have reached the maximum limit of 12 hours for today.'}, status=status.HTTP_400_BAD_REQUEST)

        existing_attendance = Attendance.objects.filter(
            employee=employee_profile, 
            date=today, 
            check_out__isnull=True
        ).exists()
        
        if existing_attendance:
            return Response({'message': 'You are already clocked in.'}, status=status.HTTP_400_BAD_REQUEST)
        
        attendance = Attendance.objects.create(
            employee=employee_profile,
            date=today,
            check_in=timezone.now()
        )

        now_local = timezone.localtime(timezone.now())
        is_first_clockin = not completed_sessions.exists()
        
        if is_first_clockin and now_local.time() > time(10, 10):
            try:
                admin_user = User.objects.filter(role__in=['admin', 'super_admin']).first()
                manager_user = User.objects.filter(role='manager').first()
                notify_user = admin_user or manager_user
                
                if notify_user:
                    Notification.objects.create(
                        recipient=notify_user,
                        sender=request.user,
                        title="Late Clock-in Alert",
                        message=f"Employee {request.user.first_name} {request.user.last_name} ({request.user.username}) clocked in late today at {now_local.strftime('%I:%M %p')}.",
                        target_role=notify_user.role
                    )

                Notification.objects.create(
                    recipient=request.user,
                    sender=notify_user if notify_user else request.user,
                    title="Late Clock-in Warning",
                    message=f"You clocked in late today at {now_local.strftime('%I:%M %p')}. Please ensure you clock in by 10:10 AM.",
                    target_role='employee'
                )
            except Exception as e:
                print(f"Error creating late notification: {e}")

        return Response({'message': 'Clocked in successfully.', 'time': attendance.check_in}, status=status.HTTP_201_CREATED)

class EmployeeClockOutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role.lower() not in ['employee', 'team_leader', 'manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        today = timezone.localtime(timezone.now()).date()
        employee_profile, _ = Employee.objects.get_or_create(user=request.user, defaults={'designation': 'Manager', 'department': 'Management'})
        attendance = Attendance.objects.filter(employee=employee_profile, date=today, check_out__isnull=True).order_by('-check_in').first()
        if not attendance:
            return Response({'message': 'No open clock-in found for today.'}, status=status.HTTP_400_BAD_REQUEST)
        
        attendance.check_out = timezone.now()
        diff = attendance.check_out - attendance.check_in
        attendance.hours_worked = round(diff.total_seconds() / 3600.0, 2)
        attendance.save()

        return Response({'message': 'Clocked out successfully.', 'hours': attendance.hours_worked}, status=status.HTTP_200_OK)

class EmployeeAttendanceTodayView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() not in ['employee', 'team_leader', 'manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        today = timezone.now().date()
        employee_profile, _ = Employee.objects.get_or_create(user=request.user, defaults={'designation': 'Manager', 'department': 'Management'})
        records = Attendance.objects.filter(employee=employee_profile, date=today).order_by('check_in')
        
        data = []
        for rec in records:
            data.append({
                'check_in': rec.check_in,
                'check_out': rec.check_out,
                'status': 'Present' if rec.check_in else 'Absent'
            })
        return Response(data, status=status.HTTP_200_OK)

class TeamLeaderAttendanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() != 'team_leader':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        records = Attendance.objects.filter(employee__team_leader=request.user).select_related('employee__user').order_by('-id')
        data = []
        for rec in records:
            user = rec.employee.user
            check_in = localtime(rec.check_in).strftime("%I:%M %p") if rec.check_in else "-"
            check_out = localtime(rec.check_out).strftime("%I:%M %p") if rec.check_out else "-"
            status_text = "Present" if rec.check_in else "Absent"
            
            data.append({
                "employee_name": f"{user.first_name} {user.last_name}".strip() or user.username,
                "date": rec.date.strftime("%d-%m-%Y"),
                "check_in": check_in,
                "check_out": check_out,
                "status": status_text
            })
        return Response(data)