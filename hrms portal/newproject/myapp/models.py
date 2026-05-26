import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

class User(AbstractUser):
    ROLE_CHOICES = (
        ('super_admin', 'Super Admin'),
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('team_leader', 'Team Leader'),
        ('employee', 'Employee'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    feed_token = models.UUIDField(default=uuid.uuid4, unique=True, null=True, blank=True)
    
    def __str__(self):
        return f"{self.username} ({self.role})"

class SuperAdmin(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='super_admin_profile')
    can_manage_admins = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"SuperAdmin: {self.user.username}"

class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    duration_months = models.IntegerField(default=1)
    features = models.TextField(blank=True)
    trial_period_days = models.IntegerField(default=7)

    def __str__(self):
        return self.name

class Company(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    members_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    license_expired = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    
class Transactions(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='transactions')
    subscription_plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_date = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        plan_name = self.subscription_plan.name if self.subscription_plan else "No Plan"
        return f"{self.company.name} - {plan_name} - ₹{self.amount}"

class Employee(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile')
    team_leader = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='team_members')
    designation = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    salary = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    casual_leaves = models.IntegerField(default=6)
    sick_leaves = models.IntegerField(default=6)
    vacation_leaves = models.IntegerField(default=6)
    
    # Personal Details
    phone = models.CharField(max_length=15, blank=True, null=True)
    gender = models.CharField(max_length=10, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)

    # Professional Details
    employee_id = models.CharField(max_length=50, blank=True, null=True)
    joining_date = models.DateField(blank=True, null=True)

    # Bank Details
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    account_number = models.CharField(max_length=50, blank=True, null=True)
    ifsc_code = models.CharField(max_length=20, blank=True, null=True)
    branch = models.CharField(max_length=100, blank=True, null=True)
    
    # New Personal Fields
    aadhaar_number = models.CharField(max_length=12, blank=True, null=True)
    pan_number = models.CharField(max_length=10, blank=True, null=True)
    marital_status = models.CharField(max_length=20, blank=True, null=True)
    nationality = models.CharField(max_length=100, blank=True, null=True)
    permanent_address = models.TextField(blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=15, blank=True, null=True)
    emergency_contact_relation = models.CharField(max_length=100, blank=True, null=True)
    blood_group = models.CharField(max_length=10, blank=True, null=True)
    
    def __str__(self):
        return self.user.username

class SupportQuery(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
    ]
    
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_queries')
    subject = models.CharField(max_length=255)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.sender.username} - {self.subject}"

class Holiday(models.Model):
    name = models.CharField(max_length=255)
    date = models.DateField()
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.date}"

class Appreciation(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_appreciations')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_appreciations')
    title = models.CharField(max_length=255)
    description = models.TextField()
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} for {self.recipient.username}"

class LeaveRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.CharField(max_length=100) 
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee.username} - {self.leave_type} ({self.status})"

class CompanyPolicy(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    file = models.FileField(upload_to='policies/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class Payroll(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    month_year = models.CharField(max_length=20) 
    status = models.CharField(max_length=20, default='paid')

    def __str__(self):
        return f"{self.employee.user.username} - {self.amount} - {self.month_year}"

class Offboarding(models.Model):
    TYPE_CHOICES = [
        ('warning', 'Warning'),
        ('termination', 'Termination'),
        ('resignation', 'Resignation'),
        ('complaint', 'Complaint'),
    ]
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='offboardings')
    action_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    reason = models.TextField()
    file = models.FileField(upload_to='offboarding/', null=True, blank=True)
    date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action_type.capitalize()} - {self.employee.user.username}"

class LetterHead(models.Model):
    TYPE_CHOICES = [
        ('internship_offer', 'Internship Offer Letter'),
        ('self_declaration', 'Self Declaration Form'),
        ('payslip', 'Payslip'),
        ('employment_bond', 'Employment Bond'),
    ]
    title = models.CharField(max_length=255)
    document_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    file = models.FileField(upload_to='letterheads/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.get_document_type_display()})"

class AdminProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='admin_profile')
    bio = models.TextField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Admin Profile: {self.user.username}"

class Attendance(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField(auto_now_add=True)
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    hours_worked = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.employee.user.username} - {self.date}"



@receiver(post_save, sender=User)
def create_admin_profile(sender, instance, created, **kwargs):
    if instance.role == 'admin':
        AdminProfile.objects.get_or_create(user=instance)

@receiver(post_save, sender=User)
def save_admin_profile(sender, instance, **kwargs):
    if instance.role == 'admin':
        if hasattr(instance, 'admin_profile'):
            instance.admin_profile.save()
        else:
            AdminProfile.objects.create(user=instance)

class Asset(models.Model):
    STATUS_CHOICES = [
        ('available','Available'),
        ('assigned','Assigned'),
        ('maintenance','Under Maintenance'),
    ]
    name = models.CharField(max_length=100)
    asset_type = models.CharField(max_length=100)
    serial_number = models.CharField(max_length=100,unique=True)
    assigned_to = models.ForeignKey(Employee,on_delete=models.SET_NULL,null=True,blank=True,related_name='assigned_assets')
    status = models.CharField(max_length=20,choices=STATUS_CHOICES,default='available')
    purchase_date=models.DateField(null=True,blank=True)
    created_at = models.DateField(auto_now_add=True)

    def __str__(self): 
        return f"{self.name}({self.serial_number})"

def expense_receipt_upload_path(instance, filename):
    import os
    import uuid
    from django.utils import timezone
    name, ext = os.path.splitext(filename)
    unique_filename = f"{uuid.uuid4().hex}{ext.lower()}"
    today = timezone.now()
    year = today.strftime('%Y')
    month = today.strftime('%m')
    day = today.strftime('%d')
    username = instance.employee.username if (instance.employee and instance.employee.username) else "anonymous"
    return os.path.join('expense_receipts', year, month, day, username, unique_filename)

class Expense(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('DRAFT', 'Draft'),
    ]
    PAYMENT_CHOICES = [
        ('PAID', 'Paid'),
        ('UNPAID', 'Unpaid'),
    ]
    
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expenses_submitted')
    team_leader = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses_tl_reviewed')
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses_manager_reviewed')
    
    title = models.CharField(max_length=255, default='Expense Claim')
    category = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    receipt = models.FileField(upload_to=expense_receipt_upload_path, blank=True, null=True)
    receipt_url = models.URLField(max_length=1000, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='UNPAID')
    
    team_leader_remark = models.TextField(blank=True, null=True)
    manager_remark = models.TextField(blank=True, null=True)
    
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def rotate_image_if_needed(self, img):
        try:
            if hasattr(img, '_getexif'):
                exif = img._getexif()
                if exif:
                    orientation = exif.get(274)  # 274: EXIF Orientation tag
                    if orientation == 3:
                        img = img.rotate(180, expand=True)
                    elif orientation == 6:
                        img = img.rotate(270, expand=True)
                    elif orientation == 8:
                        img = img.rotate(90, expand=True)
        except Exception:
            pass
        return img

    def save(self, *args, **kwargs):
        import os
        from io import BytesIO
        from PIL import Image
        from django.core.files.uploadedfile import InMemoryUploadedFile

        is_new_upload = False
        if self.receipt and not getattr(self, '_already_saved_receipt', False):
            try:
                from django.core.files.uploadedfile import UploadedFile
                if hasattr(self.receipt, 'file') and isinstance(self.receipt.file, UploadedFile):
                    is_new_upload = True
            except Exception:
                is_new_upload = False

        if is_new_upload:
            try:
                img = Image.open(self.receipt)
                if img.format in ['JPEG', 'PNG', 'GIF', 'BMP', 'WEBP', 'JPG']:
                    img = self.rotate_image_if_needed(img)
                    
                    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                        background = Image.new('RGB', img.size, (255, 255, 255))
                        background.paste(img, mask=img.split()[3] if img.mode == 'RGBA' else None)
                        img = background
                    elif img.mode != 'RGB':
                        img = img.convert('RGB')
                    
                    max_dimension = 1600
                    if max(img.size) > max_dimension:
                        img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
                    
                    output = BytesIO()
                    img.save(output, format='JPEG', quality=80, optimize=True)
                    output.seek(0)
                    
                    original_name = self.receipt.name.replace('\\', '/').split('/')[-1]
                    name_without_ext = os.path.splitext(original_name)[0]
                    new_filename = f"{name_without_ext}.jpg"
                    
                    self.receipt = InMemoryUploadedFile(
                        output,
                        'FileField',
                        new_filename,
                        'image/jpeg',
                        output.getbuffer().nbytes,
                        None
                    )
                    self._already_saved_receipt = True
            except Exception as e:
                print(f"Fallback warning: Could not compress receipt: {e}")
                
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee.username} - {self.category} - ₹{self.amount}"

class Task(models.Model):
    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    deadline = models.DateField()
    priority = models.CharField(max_length=20)
    status = models.CharField(max_length=20, default="Pending")
    description = models.TextField(blank=True, null=True)
    employee_note = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_tasks')
    assigned_team_leader = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='team_leader_assigned_tasks')
    assigned_by_team_leader = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='team_leader_created_tasks')
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} - {self.assigned_to.username}"

class CompanyDocument(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class ManagerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='manager_profile')
    phone = models.CharField(max_length=15, blank=True, null=True)
    gender = models.CharField(max_length=10, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    
    designation = models.CharField(max_length=100, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    employee_id = models.CharField(max_length=50, blank=True, null=True)
    joining_date = models.DateField(blank=True, null=True)
    
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    account_number = models.CharField(max_length=50, blank=True, null=True)
    ifsc_code = models.CharField(max_length=20, blank=True, null=True)
    branch = models.CharField(max_length=100, blank=True, null=True)
    
    # New Personal Fields
    aadhaar_number = models.CharField(max_length=12, blank=True, null=True)
    pan_number = models.CharField(max_length=10, blank=True, null=True)
    marital_status = models.CharField(max_length=20, blank=True, null=True)
    nationality = models.CharField(max_length=100, blank=True, null=True)
    permanent_address = models.TextField(blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=15, blank=True, null=True)
    emergency_contact_relation = models.CharField(max_length=100, blank=True, null=True)
    blood_group = models.CharField(max_length=10, blank=True, null=True)
    
    profile_picture = models.FileField(upload_to='profiles/', blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Manager Profile: {self.user.username}"

@receiver(post_save, sender=User)
def create_manager_profile(sender, instance, created, **kwargs):
    if created and instance.role == 'manager':
        ManagerProfile.objects.get_or_create(user=instance)

class TeamLeaderProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='team_leader_profile')
    phone = models.CharField(max_length=15, blank=True, null=True)
    gender = models.CharField(max_length=10, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    
    designation = models.CharField(max_length=100, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    employee_id = models.CharField(max_length=50, blank=True, null=True)
    joining_date = models.DateField(blank=True, null=True)
    
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    account_number = models.CharField(max_length=50, blank=True, null=True)
    ifsc_code = models.CharField(max_length=20, blank=True, null=True)
    branch = models.CharField(max_length=100, blank=True, null=True)
    
    # New Personal Fields
    aadhaar_number = models.CharField(max_length=12, blank=True, null=True)
    pan_number = models.CharField(max_length=10, blank=True, null=True)
    marital_status = models.CharField(max_length=20, blank=True, null=True)
    nationality = models.CharField(max_length=100, blank=True, null=True)
    permanent_address = models.TextField(blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=15, blank=True, null=True)
    emergency_contact_relation = models.CharField(max_length=100, blank=True, null=True)
    blood_group = models.CharField(max_length=10, blank=True, null=True)
    
    profile_picture = models.FileField(upload_to='profiles/', blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Team Leader Profile: {self.user.username}"

@receiver(post_save, sender=User)
def create_team_leader_profile(sender, instance, created, **kwargs):
    if created and instance.role == 'team_leader':
        TeamLeaderProfile.objects.get_or_create(user=instance)

class OrgChart(models.Model):
    WORK_MODE_CHOICES=[
        ('onsite','Onsite'),
        ('hybrid','Hybrid'),
        ('remote','Remote'),
    ]
    name=models.CharField(max_length=100)
    role=models.CharField(max_length=100)
    profile_picture=models.FileField(upload_to='orgchart',null=True,blank=True)
    department=models.CharField(max_length=100)
    company_name=models.CharField(max_length=100)
    employee_months=models.IntegerField()
    work_mode=models.CharField(max_length=50,choices=WORK_MODE_CHOICES,default='remote')
    manager=models.ForeignKey('self',on_delete=models.SET_NULL,null=True,blank=True,related_name='subordinates')

    def __str__(self):
        return f"{self.name} - {self.role}"

class Notification(models.Model):
    ROLE_CHOICES = [
        ('manager', 'Manager'),
        ('employee', 'Employee'),
    ]
    title = models.CharField(max_length=255)
    message = models.TextField()
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_notifications')
    target_role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.target_role}"

class PlannerEvent(models.Model):
    EVENT_TYPES = [
        ('Leave', 'Leave'),
        ('WFH', 'WFH'),
        ('Holiday', 'Holiday'),
        ('Meeting', 'Meeting'),
        ('Shift', 'Shift'),
        ('Task Deadline', 'Task Deadline'),
        ('Attendance Issue', 'Attendance Issue'),
        ('Training', 'Training'),
        ('Company Event', 'Company Event'),
        ('Late Mark', 'Late Mark'),
        ('Absent', 'Absent'),
    ]
    VISIBILITY_CHOICES = [
        ('Private', 'Private'),
        ('Team', 'Team'),
        ('Department', 'Department'),
        ('Organization', 'Organization'),
    ]
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('Completed', 'Completed'),
    ]

    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='planner_events', null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_planner_events')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending')
    visibility = models.CharField(max_length=50, choices=VISIBILITY_CHOICES, default='Private')
    department = models.CharField(max_length=100, blank=True, null=True)
    office = models.CharField(max_length=100, blank=True, null=True)
    color_code = models.CharField(max_length=20, default='#3b82f6')
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_planner_events')
    approved_at = models.DateTimeField(null=True, blank=True)
    is_locked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['employee', 'start_date']),
            models.Index(fields=['status', 'start_date']),
            models.Index(fields=['is_approved', 'start_date']),
        ]

    def __str__(self):
        return self.title

class PlannerHoliday(models.Model):
    title = models.CharField(max_length=255)
    holiday_date = models.DateField()
    description = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    color_code = models.CharField(max_length=20, default='#10b981')

    def __str__(self):
        return f"{self.title} - {self.holiday_date}"

class PlannerShift(models.Model):
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='planner_shifts')
    shift_name = models.CharField(max_length=100)
    start_time = models.TimeField()
    end_time = models.TimeField()
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_shifts')
    color_code = models.CharField(max_length=20, default='#f59e0b')
    recurring_pattern = models.CharField(max_length=50, default='None')
    rotation_start_date = models.DateField(null=True, blank=True)
    rotation_cycle_days = models.IntegerField(default=7)

    def __str__(self):
        return f"{self.shift_name} - {self.employee.username}"

class PlannerLock(models.Model):
    DEPARTMENT_CHOICES = (
        ('Management', 'Management'),
        ('Development', 'Development'),
        ('HR', 'HR'),
        ('Finance', 'Finance'),
        ('Sales', 'Sales'),
        ('Marketing', 'Marketing'),
        ('Operations', 'Operations'),
    )
    OFFICE_CHOICES = (
        ('Headquarters', 'Headquarters'),
        ('New York', 'New York'),
        ('Chicago', 'Chicago'),
        ('San Francisco', 'San Francisco'),
        ('London', 'London'),
        ('Remote', 'Remote'),
    )

    locked_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='locked_days')
    title = models.CharField(max_length=255)
    reason = models.TextField(blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField()
    scope = models.CharField(max_length=50, default='Global') # Global, Department, Team, Employee
    department = models.CharField(max_length=100, choices=DEPARTMENT_CHOICES, blank=True, null=True)
    office = models.CharField(max_length=100, choices=OFFICE_CHOICES, blank=True, null=True)
    affected_employees = models.ManyToManyField(User, related_name='affected_locks', blank=True)
    is_active = models.BooleanField(default=True)
    unlocked_at = models.DateTimeField(null=True, blank=True)
    unlocked_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='unlocked_days')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['start_date']),
            models.Index(fields=['end_date']),
            models.Index(fields=['scope']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"Lock: {self.title} ({self.start_date} to {self.end_date})"