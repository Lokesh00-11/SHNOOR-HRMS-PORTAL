from rest_framework import status, permissions, parsers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import models
from django.contrib.auth import get_user_model
from ..models import Employee, Expense, Notification
from ..serializers import ExpenseSerializer

User = get_user_model()

class EmployeeExpenseListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.JSONParser]

    def get(self, request):
        if request.user.role.lower() not in ['employee', 'team_leader']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        expenses = Expense.objects.filter(employee=request.user).order_by('-submitted_at')
        
        # Filtering
        status_param = request.GET.get('status')
        payment_param = request.GET.get('payment_status')
        search_param = request.GET.get('search')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        if status_param:
            expenses = expenses.filter(status__iexact=status_param)
        if payment_param:
            expenses = expenses.filter(payment_status__iexact=payment_param)
        if search_param:
            expenses = expenses.filter(
                models.Q(title__icontains=search_param) | 
                models.Q(category__icontains=search_param) | 
                models.Q(description__icontains=search_param)
            )
        if start_date:
            expenses = expenses.filter(submitted_at__date__gte=start_date)
        if end_date:
            expenses = expenses.filter(submitted_at__date__lte=end_date)
            
        serializer = ExpenseSerializer(expenses, many=True)
        return Response(serializer.data)
 
    def post(self, request):
        if request.user.role.lower() not in ['employee', 'team_leader']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        # Get team leader from employee profile
        try:
            emp_profile = Employee.objects.get(user=request.user)
            team_leader = emp_profile.team_leader
        except Employee.DoesNotExist:
            team_leader = None
            
        # Get manager (the first available manager user)
        manager = User.objects.filter(role='manager').first()
        
        title = request.data.get('title', 'Expense Claim')
        category = request.data.get('category')
        amount = request.data.get('amount')
        description = request.data.get('description', '')
        receipt = request.FILES.get('receipt') # MultiPart upload support
        status_val = request.data.get('status', 'PENDING').upper()
        
        if status_val not in ['PENDING', 'DRAFT']:
            status_val = 'PENDING'
            
        if not category or not amount:
            return Response({'message': 'Category and Amount are required fields.'}, status=status.HTTP_400_BAD_REQUEST)
            
        expense = Expense.objects.create(
            employee=request.user,
            team_leader=team_leader,
            manager=manager,
            title=title,
            category=category,
            amount=amount,
            description=description,
            receipt=receipt,
            status=status_val,
            payment_status='UNPAID'
        )
        
        # Trigger dynamic company notification when submitting a live request
        if status_val == 'PENDING':
            try:
                Notification.objects.create(
                    title="New Expense Claim Submitted",
                    message=f"{request.user.username} submitted a claim of ₹{amount} for {category}.",
                    sender=request.user,
                    target_role='manager'
                )
            except Exception as e:
                print(f"Failed to create notification: {e}")
                
        return Response(ExpenseSerializer(expense).data, status=status.HTTP_201_CREATED)


class TeamLeaderExpenseListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() != 'team_leader':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        # Security: TLs should only access employee assigned to their team
        expenses = Expense.objects.filter(
            employee__employee_profile__team_leader=request.user
        ).order_by('-submitted_at')
        
        status_param = request.GET.get('status')
        payment_param = request.GET.get('payment_status')
        search_param = request.GET.get('search')
        
        if status_param:
            expenses = expenses.filter(status__iexact=status_param)
        if payment_param:
            expenses = expenses.filter(payment_status__iexact=payment_param)
        if search_param:
            expenses = expenses.filter(
                models.Q(employee__username__icontains=search_param) |
                models.Q(title__icontains=search_param) |
                models.Q(category__icontains=search_param)
            )
            
        serializer = ExpenseSerializer(expenses, many=True)
        return Response(serializer.data)


class TeamLeaderExpenseUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role.lower() != 'team_leader':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        expense_id = request.data.get('expense_id')
        status_val = request.data.get('status', '').upper()
        remark = request.data.get('remark', '')
        
        if status_val not in ['APPROVED', 'REJECTED']:
            return Response({'message': 'Invalid status update. Must be APPROVED or REJECTED.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # Security verification
            expense = Expense.objects.get(
                id=expense_id,
                employee__employee_profile__team_leader=request.user
            )
            expense.status = status_val
            expense.team_leader_remark = remark
            expense.save()
            
            # Send status update notifications
            try:
                Notification.objects.create(
                    title=f"Expense Claim {status_val.capitalize()}",
                    message=f"Team Leader {request.user.username} has {status_val.lower()} your claim of ₹{expense.amount} for {expense.category}.",
                    sender=request.user,
                    target_role='employee'
                )
            except Exception as e:
                print(f"Failed to trigger employee notification: {e}")
                
            return Response(ExpenseSerializer(expense).data)
        except Expense.DoesNotExist:
            return Response({'message': 'Expense request not found or unauthorized.'}, status=status.HTTP_404_NOT_FOUND)


class ManagerExpenseListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() != 'manager':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        company = getattr(request.user, 'company', None)
        if company:
            expenses = Expense.objects.filter(employee__company=company).order_by('-submitted_at')
        else:
            expenses = Expense.objects.all().order_by('-submitted_at')
        
        status_param = request.GET.get('status')
        payment_param = request.GET.get('payment_status')
        search_param = request.GET.get('search')
        
        if status_param:
            expenses = expenses.filter(status__iexact=status_param)
        if payment_param:
            expenses = expenses.filter(payment_status__iexact=payment_param)
        if search_param:
            expenses = expenses.filter(
                models.Q(employee__username__icontains=search_param) |
                models.Q(title__icontains=search_param) |
                models.Q(category__icontains=search_param)
            )
            
        serializer = ExpenseSerializer(expenses, many=True)
        return Response(serializer.data)


class ManagerExpenseApproveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role.lower() != 'manager':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        expense_id = request.data.get('expense_id')
        status_val = request.data.get('status', '').upper()
        remark = request.data.get('remark', '')
        
        if status_val not in ['APPROVED', 'REJECTED']:
            return Response({'message': 'Invalid status. Must be APPROVED or REJECTED.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            expense = Expense.objects.get(id=expense_id)
            expense.status = status_val
            expense.manager_remark = remark
            expense.manager = request.user
            expense.save()
            
            # Send notification to employee
            try:
                Notification.objects.create(
                    title=f"Expense {status_val.capitalize()} by Manager",
                    message=f"Manager {request.user.username} has {status_val.lower()} your claim of ₹{expense.amount}.",
                    sender=request.user,
                    target_role='employee'
                )
            except Exception as e:
                print(f"Failed to notify employee of manager approval: {e}")
                
            return Response(ExpenseSerializer(expense).data)
        except Expense.DoesNotExist:
            return Response({'message': 'Expense claim not found.'}, status=status.HTTP_404_NOT_FOUND)


class ManagerExpensePayView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role.lower() != 'manager':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        expense_id = request.data.get('expense_id')
        payment_val = request.data.get('payment_status', '').upper()
        remark = request.data.get('remark', '')
        
        if payment_val not in ['PAID', 'UNPAID']:
            return Response({'message': 'Invalid payment status. Must be PAID or UNPAID.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            expense = Expense.objects.get(id=expense_id)
            expense.payment_status = payment_val
            if remark:
                expense.manager_remark = remark
            expense.save()
            
            # If paid, trigger a notification
            if payment_val == 'PAID':
                try:
                    Notification.objects.create(
                        title="Expense Reimbursed / Paid",
                        message=f"Your claim of ₹{expense.amount} for {expense.category} has been sanctioned and paid.",
                        sender=request.user,
                        target_role='employee'
                    )
                except Exception as e:
                    print(f"Failed to notify employee of payout: {e}")
                    
            return Response(ExpenseSerializer(expense).data)
        except Expense.DoesNotExist:
            return Response({'message': 'Expense claim not found.'}, status=status.HTTP_404_NOT_FOUND)
