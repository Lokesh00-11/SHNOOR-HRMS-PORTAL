import random
import time as time_module
from datetime import timedelta
import calendar
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.utils import timezone
from django.db.models import Count, Sum
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from ..models import (
    Employee, LeaveRequest, Notification, Appreciation, ManagerProfile, TeamLeaderProfile, Expense, Company, Transactions, SubscriptionPlan, SupportQuery, EmployeeCase,
    Attendance, Task
)
from ..serializers import (
    EmployeeProfileSerializer, AppreciationSerializer, 
    ManagerProfileSerializer, LeaveRequestSerializer, ExpenseSerializer, TransactionSerializer, SupportQuerySerializer, EmployeeCaseSerializer
)

class ManagerEmployeeListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        company = getattr(request.user, 'company', None)
        if company and request.user.role.lower() in ['manager', 'admin']:
            User = get_user_model()
            users = User.objects.filter(company=company).order_by('first_name')
        else:
            User = get_user_model()
            users = User.objects.all().order_by('first_name')
            
        data = []
        for u in users:
            designation = 'Team Member'
            if u.role == 'employee' and hasattr(u, 'employee_profile'):
                designation = u.employee_profile.designation
            elif u.role == 'team_leader' and hasattr(u, 'teamleaderprofile'):
                designation = u.teamleaderprofile.designation
            elif u.role == 'manager' and hasattr(u, 'managerprofile'):
                designation = u.managerprofile.designation
            
            data.append({
                'user_id': u.id,
                'first_name': u.first_name,
                'last_name': u.last_name,
                'username': u.username,
                'email': u.email,
                'role': u.role,
                'designation': designation,
                'is_active': u.is_active
            })
            
        return Response(data)

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
        company = getattr(request.user, 'company', None)
        if company:
            count = LeaveRequest.objects.filter(employee__company=company, status='pending').count()
        else:
            count = LeaveRequest.objects.filter(status='pending').count()
        return Response({'pending_count': count})

class ManagerExpenseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        company = getattr(request.user, 'company', None)
        if company:
            expenses = Expense.objects.filter(employee__company=company).order_by('-submitted_at')
        else:
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

class ManagerSubscriptionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_company(self, user):
        if getattr(user, 'company', None):
            return user.company
        if user.role.lower() == 'manager':
            company = Company.objects.filter(email=user.email).first()
            if company:
                user.company = company
                user.save(update_fields=['company'])
                return company
        first_company = Company.objects.first()
        if first_company:
            user.company = first_company
            user.save(update_fields=['company'])
            return first_company
        return None

    def get(self, request):
        company = self.get_company(request.user)
        if not company:
            return Response({'message': 'Company not associated with this account. Please contact admin.'}, status=status.HTTP_404_NOT_FOUND)
        
        today = timezone.now().date()
        expiry_date = company.license_expiry_date
        
        days_left = 0
        is_expired = False
        
        if company.license_expired or not company.is_active:
            is_expired = True
        elif expiry_date:
            if expiry_date < today:
                is_expired = True
                company.license_expired = True
                company.save(update_fields=['license_expired'])
            else:
                days_left = (expiry_date - today).days

        transactions = Transactions.objects.filter(company=company).order_by('-transaction_date')
        tx_serializer = TransactionSerializer(transactions, many=True)

        return Response({
            'company_id': company.id,
            'company_name': company.name,
            'email': company.email,
            'is_active': company.is_active,
            'license_expired': is_expired,
            'license_expiry_date': expiry_date,
            'days_left': days_left,
            'transactions': tx_serializer.data
        })

class ManagerRenewSubscriptionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_company(self, user):
        if getattr(user, 'company', None):
            return user.company
        if user.role.lower() == 'manager':
            company = Company.objects.filter(email=user.email).first()
            if company:
                user.company = company
                user.save(update_fields=['company'])
                return company
        first_company = Company.objects.first()
        if first_company:
            user.company = first_company
            user.save(update_fields=['company'])
            return first_company
        return None

    def post(self, request):
        company = self.get_company(request.user)
        if not company:
            return Response({'message': 'Company not associated with this account.'}, status=status.HTTP_404_NOT_FOUND)
        
        plan_id = request.data.get('plan_id')
        if not plan_id:
            return Response({'message': 'plan_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            plan = SubscriptionPlan.objects.get(id=plan_id)
        except SubscriptionPlan.DoesNotExist:
            return Response({'message': 'Subscription Plan not found.'}, status=status.HTTP_404_NOT_FOUND)

        today = timezone.now().date()
        current_expiry = company.license_expiry_date
        
        payment_method = request.data.get('payment_method', 'Card')
        simulate_failure = request.data.get('simulate_failure', False)

        timestamp = int(time_module.time())
        random_num = random.randint(1000, 9999)
        txn_id = f"TXN_{timestamp}_{random_num}"

        if simulate_failure:
            Transactions.objects.create(
                company=company,
                subscription_plan=plan,
                amount=plan.price,
                transaction_id=txn_id,
                status='Failed',
                payment_method=payment_method
            )
            return Response({'message': 'Payment transaction failed. Please try again with a different payment method.'}, status=status.HTTP_400_BAD_REQUEST)

        def add_months(sourcedate, months):
            month = sourcedate.month - 1 + months
            year = sourcedate.year + month // 12
            month = month % 12 + 1
            day = min(sourcedate.day, calendar.monthrange(year, month)[1])
            return sourcedate.replace(year=year, month=month, day=day)

        if current_expiry and current_expiry > today and not company.license_expired:
            new_expiry = add_months(current_expiry, plan.duration_months)
        else:
            new_expiry = add_months(today, plan.duration_months)
            
        company.license_expiry_date = new_expiry
        company.license_expired = False
        company.is_active = True
        company.save()
        
        transaction = Transactions.objects.create(
            company=company,
            subscription_plan=plan,
            amount=plan.price,
            transaction_id=txn_id,
            status='Success',
            payment_method=payment_method
        )
        
        return Response({
            'message': f'Subscription renewed successfully for {plan.name}!',
            'license_expiry_date': new_expiry,
            'transaction_id': txn_id,
            'amount': float(plan.price),
            'plan_name': plan.name,
            'company_name': company.name
        }, status=status.HTTP_200_OK)


class ManagerQueriesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        user = request.user
        queries = SupportQuery.objects.filter(recipient=user)

        if not queries.exists():
            if hasattr(user, 'manager_profile'):
                queries = SupportQuery.objects.filter(recipient=user.manager_profile.user)
            
            if not queries.exists():
                queries = SupportQuery.objects.all()

        queries = queries.order_by('-created_at')
        serializer = SupportQuerySerializer(queries, many=True)
        return Response(serializer.data)

    def put(self, request):
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        query_id = request.data.get('query_id')
        reply_text = request.data.get('reply')
        new_status = request.data.get('status', 'resolved')
        
        try:
            query = SupportQuery.objects.filter(id=query_id).first()
            if not query:
                return Response({'message': 'Query not found.'}, status=status.HTTP_404_NOT_FOUND)
                
            query.reply = reply_text
            query.status = new_status
            query.recipient_read = True
            query.sender_read = False
            query.save()
            
            if query.sender:
                Notification.objects.create(
                    recipient=query.sender, sender=request.user, title="Query Reply",
                    message=f"Your manager has replied to your query: {query.subject}"
                )
            
            return Response({'message': 'Query replied successfully!'})
        except Exception as e:
            return Response({'message': f'Server Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ManagerEmployeeCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        email = request.data.get('email')
        personal_email = request.data.get('personal_email')
        password = request.data.get('password')
        designation = request.data.get('designation', 'Employee')

        if not email or not password:
            return Response({'message': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        if User.objects.filter(email=email).exists() or User.objects.filter(username=email).exists():
            return Response({'message': 'User with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        target_role = request.data.get('role', 'employee').lower()
        if target_role not in ['employee', 'team_leader', 'manager']:
            target_role = 'employee'

        company = getattr(request.user, 'company', None)

        try:
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role=target_role,
                company=company
            )
            
            # Generate sequential employee_id
            last_employee = Employee.objects.filter(employee_id__startswith='EMP').order_by('-employee_id').first()
            if last_employee and last_employee.employee_id:
                try:
                    last_num = int(last_employee.employee_id.replace('EMP', ''))
                    new_id = f"EMP{last_num + 1:03d}"
                except ValueError:
                    new_id = "EMP001"
            else:
                new_id = "EMP001"

            if target_role == 'manager':
                ManagerProfile.objects.create(
                    user=user,
                    designation=designation,
                    department='Management',
                    employee_id=new_id,
                    joining_date=timezone.now().date()
                )
            elif target_role == 'team_leader':
                TeamLeaderProfile.objects.create(
                    user=user,
                    designation=designation,
                    department='Leadership',
                    employee_id=new_id,
                    joining_date=timezone.now().date()
                )
            else:
                Employee.objects.create(
                    user=user,
                    designation=designation,
                    department='General',
                    employee_id=new_id,
                    joining_date=timezone.now().date()
                )
            
            if personal_email:
                subject = 'Welcome to Shnoor! Your Login Credentials'
                message = f"Hello {first_name},\n\nWelcome to the team! Your account has been created on the Shnoor HRMS Portal.\n\nHere are your login credentials:\nOfficial Email: {email}\nPassword: {password}\n\nPlease log in and change your password immediately."
                
                try:
                    send_mail(
                        subject=subject,
                        message=message,
                        from_email=settings.EMAIL_HOST_USER if hasattr(settings, 'EMAIL_HOST_USER') else 'no-reply@hrms.com',
                        recipient_list=[personal_email],
                        fail_silently=True,
                    )
                except Exception as e:
                    pass
            
            return Response({'message': 'Employee created successfully.', 'employee_id': new_id}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ManagerCasesView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.role.lower() != 'manager':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        cases = EmployeeCase.objects.filter(status='escalated').order_by('-updated_at')
        serializer = EmployeeCaseSerializer(cases, many=True)
        return Response(serializer.data)
        
    def put(self, request):
        if request.user.role.lower() != 'manager':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        case_id = request.data.get('id')
        new_status = request.data.get('status')
        closing_remark = request.data.get('closing_remark')
        
        try:
            case = EmployeeCase.objects.get(id=case_id)
        except EmployeeCase.DoesNotExist:
            return Response({'message': 'Case not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        if new_status: case.status = new_status
        if closing_remark: case.closing_remark = closing_remark
        case.save()
        
        Notification.objects.create(
            recipient=case.created_by, sender=request.user, title="Escalated Case Updated",
            message=f"Manager {request.user.username} updated your escalated case: {case.title}",
            target_role='team_leader'
        )
        
        serializer = EmployeeCaseSerializer(case)
        return Response(serializer.data)

class ManagerDashboardAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        company = getattr(request.user, 'company', None)
        today = timezone.now().date()
        
        if company:
            employees = Employee.objects.filter(user__company=company)
            attendance = Attendance.objects.filter(employee__user__company=company)
            leaves = LeaveRequest.objects.filter(employee__company=company)
            expenses = Expense.objects.filter(employee__company=company)
            cases = EmployeeCase.objects.filter(created_by__company=company)
            tasks = Task.objects.filter(assigned_to__company=company)
        else:
            employees = Employee.objects.all()
            attendance = Attendance.objects.all()
            leaves = LeaveRequest.objects.all()
            expenses = Expense.objects.all()
            cases = EmployeeCase.objects.all()
            tasks = Task.objects.all()
            
        total_team = employees.count()
        today_attendance = attendance.filter(date=today)
        present_today = today_attendance.filter(check_in__isnull=False).values('employee').distinct().count()
        
        active_leaves = 0
        for l in leaves.filter(status='approved'):
            try:
                if l.start_date <= today <= l.end_date:
                    active_leaves += 1
            except:
                pass
                
        absent_today = total_team - present_today - active_leaves
        if absent_today < 0: absent_today = 0
        
        pending_expenses = expenses.filter(status='pending').count()
        open_cases = cases.filter(status__in=['open', 'escalated', 'investigating']).count()
        
        # 2. Attendance Analytics
        weekly_trend = []
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            att = attendance.filter(date=d)
            p = att.filter(check_in__isnull=False).count()
            weekly_trend.append({
                'name': d.strftime("%a"),
                'Present': p,
                'Absent': total_team - p
            })
            
        overall_attendance = 0
        if total_team > 0:
            overall_attendance = int((present_today / total_team) * 100)
            
        leave_dist = [
            {'name': 'Sick', 'value': leaves.filter(leave_type__icontains='sick').count()},
            {'name': 'Vacation', 'value': leaves.filter(leave_type__icontains='vacation').count()},
            {'name': 'Casual', 'value': leaves.filter(leave_type__icontains='casual').count()},
            {'name': 'Paid', 'value': leaves.filter(leave_type__icontains='paid').count()},
            {'name': 'Emergency', 'value': leaves.filter(leave_type__icontains='emergency').count()},
        ]
        
        dept_counts = employees.values('department').annotate(count=Count('id'))
        dept_data = [{'name': d['department'] or 'General', 'employees': d['count']} for d in dept_counts]
        
        total_tasks = tasks.count()
        completed_tasks = tasks.filter(status='Completed').count()
        task_completion_rate = int((completed_tasks / total_tasks * 100)) if total_tasks > 0 else 0
        
        exp_approved = expenses.filter(status__iexact='approved').count()
        exp_pending = expenses.filter(status__iexact='pending').count()
        expense_data = [
            {'name': 'Approved', 'value': exp_approved},
            {'name': 'Pending', 'value': exp_pending}
        ]
        
        current_month = today.month
        current_year = today.year
        monthly_expenses = expenses.filter(submitted_at__year=current_year, submitted_at__month=current_month)
        total_this_month = float(monthly_expenses.aggregate(total=Sum('amount'))['total'] or 0)
        
        dept_sums = {}
        for exp in monthly_expenses:
            dept = 'General'
            u = exp.employee
            if hasattr(u, 'employee_profile') and u.employee_profile.department:
                dept = u.employee_profile.department
            elif hasattr(u, 'team_leader_profile') and u.team_leader_profile.department:
                dept = u.team_leader_profile.department
            elif hasattr(u, 'manager_profile') and hasattr(u.manager_profile, 'department') and u.manager_profile.department:
                dept = u.manager_profile.department
            
            dept_sums[dept] = float(dept_sums.get(dept, 0)) + float(exp.amount)

        highest_dept = max(dept_sums, key=dept_sums.get) if dept_sums else 'N/A'
        
        activities = []
        for l in leaves.order_by('-id')[:2]:
            activities.append({'id': f"l{l.id}", 'text': f"Leave request from {l.employee.username}", 'time': 'Recent', 'type': 'leave'})
        for e in expenses.order_by('-id')[:2]:
            activities.append({'id': f"e{e.id}", 'text': f"Expense submitted by {e.employee.username}", 'time': 'Recent', 'type': 'expense'})
            
        late_today = 0
        checked_in_employees = today_attendance.filter(check_in__isnull=False).values_list('employee_id', flat=True).distinct()
        for emp_id in checked_in_employees:
            first_att = today_attendance.filter(employee_id=emp_id, check_in__isnull=False).order_by('check_in').first()
            if first_att:
                local_time = timezone.localtime(first_att.check_in)
                if local_time.hour > 10 or (local_time.hour == 10 and local_time.minute > 10):
                    late_today += 1

        monthly_trend = []
        for i in range(5, -1, -1):
            month_date = today - timedelta(days=30*i)
            m_year = month_date.year
            m_month = month_date.month
            month_name = month_date.strftime('%b')
            month_att = attendance.filter(date__year=m_year, date__month=m_month)
            m_present = month_att.filter(check_in__isnull=False).count()
            m_absent = month_att.filter(check_in__isnull=True).count()
            
            monthly_trend.append({
                'name': month_name,
                'Present': m_present,
                'Absent': m_absent
            })

        return Response({
            'summary': {
                'totalTeam': total_team,
                'presentToday': present_today,
                'absentToday': absent_today,
                'onLeave': active_leaves,
                'pendingExpenses': pending_expenses,
                'openCases': open_cases
            },
            'attendance': {
                'weeklyTrend': weekly_trend,
                'monthlyTrend': monthly_trend,
                'overallPercentage': overall_attendance,
                'lateToday': late_today
            },
            'leaves': {
                'distribution': leave_dist,
                'pending': leaves.filter(status='pending').count(),
                'approved': leaves.filter(status='approved').count()
            },
            'employees': {
                'departmentData': dept_data,
                'newJoinees': 2,
                'active': total_team,
                'remote': employees.filter(work_mode__icontains='remote').count(),
                'probation': 0
            },
            'tasks': {
                'completionRate': task_completion_rate,
                'completedThisWeek': completed_tasks,
                'overdue': 0
            },
            'expenses': {
                'statusData': expense_data,
                'totalThisMonth': total_this_month,
                'highestDept': highest_dept
            },
            'recentActivity': activities
        })

class ManagerEmployeePromoteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role.lower() not in ['manager', 'admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        user_id = request.data.get('user_id')
        new_role = request.data.get('new_role')
        
        if not user_id or new_role not in ['manager', 'team_leader', 'employee']:
            return Response({'message': 'Invalid input.'}, status=status.HTTP_400_BAD_REQUEST)
            
        User = get_user_model()
        
        try:
            target_user = User.objects.get(id=user_id, company=request.user.company)
            
            if target_user.role == new_role:
                return Response({'message': 'User already has this role.'})
                
            designation = 'Promoted'
            emp_id = f"EMP{target_user.id:03d}"
            
            if target_user.role == 'employee' and hasattr(target_user, 'employee_profile'):
                designation = target_user.employee_profile.designation
                emp_id = target_user.employee_profile.employee_id
                target_user.employee_profile.delete()
            elif target_user.role == 'team_leader' and hasattr(target_user, 'teamleaderprofile'):
                designation = target_user.teamleaderprofile.designation
                emp_id = target_user.teamleaderprofile.employee_id
                target_user.teamleaderprofile.delete()
            elif target_user.role == 'manager' and hasattr(target_user, 'managerprofile'):
                designation = target_user.managerprofile.designation
                emp_id = target_user.managerprofile.employee_id
                target_user.managerprofile.delete()
                
            target_user.role = new_role
            target_user.save()
            
            if new_role == 'manager':
                ManagerProfile.objects.create(user=target_user, designation=designation, employee_id=emp_id)
            elif new_role == 'team_leader':
                TeamLeaderProfile.objects.create(user=target_user, designation=designation, employee_id=emp_id)
            else:
                Employee.objects.create(user=target_user, designation=designation, employee_id=emp_id)
                
            return Response({'message': f'User successfully promoted to {new_role}.'})
            
        except User.DoesNotExist:
            return Response({'message': 'User not found in your company.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
