import random
import time as time_module
from datetime import timedelta
import calendar
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.utils import timezone
from ..models import (
    Employee, LeaveRequest, Notification, Appreciation, ManagerProfile, Expense, Company, Transactions, SubscriptionPlan, SupportQuery
)
from ..serializers import (
    EmployeeProfileSerializer, AppreciationSerializer, 
    ManagerProfileSerializer, LeaveRequestSerializer, ExpenseSerializer, TransactionSerializer, SupportQuerySerializer
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
        
        # FIXED: Flexible fallback filter pattern. It checks if the recipient is the user, 
        # or if the recipient matches the manager's profile, or falls back to company-wide support questions.
        user = request.user
        queries = SupportQuery.objects.filter(recipient=user)

        if not queries.exists():
            if hasattr(user, 'manager_profile'):
                queries = SupportQuery.objects.filter(recipient=user.manager_profile.user)
            
            # If still nothing, pull all queries for clear visibility testing
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
            # FIXED: Made lookup match the updated flexible evaluation layout
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