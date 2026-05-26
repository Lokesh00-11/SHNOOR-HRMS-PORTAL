import re

with open('views.py', 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'response\[\'Content-Disposition\'\] = \'attachment; filename="planner_feed\.ics"\'\s*return response', content)
if match:
    clean_content = content[:match.end()] + '\n\n'
    payroll_view = '''class TeamLeaderPayrollView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role.lower() != 'team_leader':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        current_month = datetime.now().strftime('%B %Y')
        employees = Employee.objects.filter(team_leader=request.user)
        
        payroll_data = []
        for emp in employees:
            payroll_entry = Payroll.objects.filter(employee=emp, month_year=current_month).first()
            emp_salary = float(emp.salary) if emp.salary else 0
            if emp_salary == 0:
                emp_salary = 55000.00
                
            payroll_data.append({
                'employee_id': emp.id,
                'name': f"{emp.user.first_name} {emp.user.last_name}",
                'username': emp.user.username,
                'salary': str(emp_salary),
                'credited': payroll_entry is not None,
                'amount_credited': str(payroll_entry.amount) if payroll_entry else "0.00",
                'month': current_month,
                'payment_date': payroll_entry.payment_date.strftime('%Y-%m-%d') if payroll_entry else None
            })
            
        return Response(payroll_data)

    def post(self, request):
        if request.user.role.lower() != 'team_leader':
            return Response({'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        employee_id = request.data.get('employee_id')
        current_month = datetime.now().strftime('%B %Y')
        
        try:
            emp = Employee.objects.get(id=employee_id, team_leader=request.user)
        except Employee.DoesNotExist:
            return Response({'message': 'Employee not found or not in your team.'}, status=status.HTTP_404_NOT_FOUND)
            
        payroll_entry = Payroll.objects.filter(employee=emp, month_year=current_month).first()
        if payroll_entry:
            return Response({'message': 'Salary already credited for this month.'}, status=status.HTTP_400_BAD_REQUEST)
            
        emp_salary = float(emp.salary) if emp.salary else 0
        if emp_salary == 0:
            emp_salary = 55000.00
            
        Payroll.objects.create(
            employee=emp,
            amount=emp_salary,
            month_year=current_month,
            status='paid'
        )
        
        return Response({'message': 'Salary credited successfully.'}, status=status.HTTP_201_CREATED)
'''
    clean_content += payroll_view
    with open('views.py', 'w', encoding='utf-8') as f:
        f.write(clean_content)
    print('fixed')
else:
    print('not found')
