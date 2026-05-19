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
