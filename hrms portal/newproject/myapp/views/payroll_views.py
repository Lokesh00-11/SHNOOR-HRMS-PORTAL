from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from ..models import Payroll, Employee
from ..serializers import PayrollSerializer

class PayrollView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        user_role = request.user.role.lower()
        if user_role in ['manager', 'admin', 'super_admin']:
            payroll = Payroll.objects.all().order_by('-month_year')
        elif user_role == 'employee':
            try:
                employee_profile = request.user.employee_profile
                payroll = Payroll.objects.filter(employee=employee_profile).order_by('-month_year')
            except Employee.DoesNotExist:
                return Response({'message': 'Employee profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = PayrollSerializer(payroll, many=True)
        return Response(serializer.data)
    def post(self, request):
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = PayrollSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ManagerPaySingleEmployeeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role.lower() not in ['manager', 'admin', 'super_admin']:
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        employee_id = request.data.get('employee_id')
        if not employee_id:
            return Response({'message': 'Employee ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        from datetime import datetime
        now = datetime.now()
        month_year = now.strftime('%B %Y') # e.g., "May 2026"
        
        try:
            emp = Employee.objects.get(id=employee_id)
        except Employee.DoesNotExist:
            return Response({'message': 'Employee not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        custom_amount = request.data.get('salary_amount')
        if custom_amount is not None and custom_amount != '':
            base_salary = float(custom_amount)
        else:
            base_salary = float(emp.salary or 0)
        
        # Apply 10% extra for night shift
        if emp.shift and emp.shift.lower() == 'night':
            final_salary = base_salary * 1.10
        else:
            final_salary = base_salary
            
        # Update if exists, otherwise create
        payroll, created = Payroll.objects.update_or_create(
            employee=emp,
            month_year=month_year,
            defaults={
                'amount': final_salary,
                'status': 'Paid'
            }
        )
        
        return Response({
            'message': 'completed'
        }, status=status.HTTP_200_OK)
