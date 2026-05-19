import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'newproject.settings')
django.setup()

from myapp.models import User, Employee, AdminProfile

def create_users():
    # # Admin
    # if not User.objects.filter(username='testadmin').exists():
    #     admin = User.objects.create_user(username='testadmin', email='testadmin@example.com', password='password123', role='admin')
    #     AdminProfile.objects.create(user=admin)
    #     print("Admin created: testadmin / password123")
    # else:
    #     print("Admin testadmin already exists")
        
    # Shnoor Admin
    if not User.objects.filter(email='admin@shnoor.com').exists() and not User.objects.filter(username='admin_shnoor').exists():
        shnoor_admin = User.objects.create_user(username='admin_shnoor', email='admin@shnoor.com', password='admin123', role='admin')
        AdminProfile.objects.create(user=shnoor_admin)
        print("Admin created: admin@shnoor.com / admin123")
    else:
        print("Admin admin@shnoor.com already exists")
        
    # Manager
    if not User.objects.filter(email='manager@shnoor.com').exists() and not User.objects.filter(username='manager_shnoor').exists():
        manager = User.objects.create_user(username='manager_shnoor', email='manager@shnoor.com', password='manager123', role='manager')
        Employee.objects.create(user=manager, designation='Manager', department='Management')
        print("Manager created: manager@shnoor.com / manager123")
    else:
        # update
        mgr_user = User.objects.filter(email='manager@shnoor.com').first() or User.objects.filter(username='manager_shnoor').first()
        if mgr_user:
            mgr_user.set_password('manager123')
            mgr_user.role = 'manager'
            mgr_user.save()
            print("Manager updated: manager@shnoor.com / manager123")
        
    # Employee
    if not User.objects.filter(email='employee@shnoor.com').exists() and not User.objects.filter(username='employee_shnoor').exists():
        emp = User.objects.create_user(username='employee_shnoor', email='employee@shnoor.com', password='employee123', role='employee')
        Employee.objects.create(user=emp)
        print("Employee created: employee@shnoor.com / employee123")
    else:
        print("Employee employee@shnoor.com already exists")

    # Team Leader
    if not User.objects.filter(email='teamleader@shnoor.com').exists() and not User.objects.filter(username='teamleader_shnoor').exists():
        tl = User.objects.create_user(username='teamleader_shnoor', email='teamleader@shnoor.com', password='teamleader123', role='team_leader')
        Employee.objects.create(user=tl, designation='Team Leader', department='Development')
        print("Team Leader created: teamleader@shnoor.com / teamleader123")
    else:
        # update
        tl_user = User.objects.filter(email='teamleader@shnoor.com').first() or User.objects.filter(username='teamleader_shnoor').first()
        if tl_user:
            tl_user.set_password('teamleader123')
            tl_user.role = 'team_leader'
            tl_user.save()
            # Ensure employee profile exists
            Employee.objects.get_or_create(user=tl_user, defaults={'designation': 'Team Leader', 'department': 'Development'})
            print("Team Leader updated: teamleader@shnoor.com / teamleader123")

    # man self also
    mgr_user = User.objects.filter(email='manager@shnoor.com').first() or User.objects.filter(username='manager_shnoor').first()
    if mgr_user:
        Employee.objects.get_or_create(user=mgr_user, defaults={'designation': 'Manager', 'department': 'Management'})

    # Always assign at least 4 team members to teamleader
    tl_user = User.objects.filter(role='team_leader').first()
    if tl_user:
        assigned_emails = ['employee@shnoor.com', 'lokesh@gmail.com', 'employee@hrms.com', 'john@hrms.com', 'robert@hrms.com']
        for email in assigned_emails:
            e = Employee.objects.filter(user__email=email).first()
            if e:
                e.team_leader = tl_user
                e.save()
        print("Assigned team leader to at least 4 members in DB")


create_users()

"""
users_to_reset = [
    ('manager', 'manager123'),
    ('manager@hrms.com', 'manager123'),
    ('employee', 'employee123'),
    ('employee@hrms.com', 'employee123'),
    ('admin', 'admin123'),
    ('testadmin', 'password123')
]
"""