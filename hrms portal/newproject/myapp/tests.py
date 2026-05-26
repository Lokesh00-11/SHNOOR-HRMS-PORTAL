from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
import uuid

from .models import PlannerEvent, PlannerLock, PlannerHoliday, PlannerShift, Employee, ManagerProfile
from .views import is_date_range_locked

User = get_user_model()

class PlannerSystemTestCase(TestCase):
  def setUp(self):
    self.client = APIClient()
    
    # Create test users
    self.admin_user = User.objects.create_superuser(
      username='admin_test',
      email='admin@test.com',
      password='password123',
      role='admin'
    )
    
    self.manager_user = User.objects.create_user(
      username='manager_test',
      email='manager@test.com',
      password='password123',
      role='manager'
    )
    # ManagerProfile is auto-created by signal, so we fetch and update it
    self.manager_profile = ManagerProfile.objects.get(user=self.manager_user)
    self.manager_profile.department = 'IT'
    self.manager_profile.save()

    self.employee_user = User.objects.create_user(
      username='employee_test',
      email='employee@test.com',
      password='password123',
      role='employee',
      location='New York'
    )
    self.employee_profile = Employee.objects.create(
      user=self.employee_user,
      department='IT',
      phone='987654321',
      team_leader=self.manager_user
    )

  def test_is_date_range_locked_helper(self):
    # Create a department-scoped lock
    lock = PlannerLock.objects.create(
      title="IT Freeze",
      start_date="2026-12-01",
      end_date="2026-12-05",
      scope="Department",
      department="IT",
      locked_by=self.admin_user
    )

    # IT department user should be locked
    self.assertTrue(is_date_range_locked(self.employee_user, "2026-12-02", "2026-12-03"))
    
    # Other departments user (let's say sales) should NOT be locked
    sales_user = User.objects.create_user(username='sales_test', email='sales@test.com', role='employee')
    Employee.objects.create(user=sales_user, department='Sales')
    self.assertFalse(is_date_range_locked(sales_user, "2026-12-02", "2026-12-03"))

    # Lock soft delete test
    lock.is_active = False
    lock.save()
    self.assertFalse(is_date_range_locked(self.employee_user, "2026-12-02", "2026-12-03"))

  def test_ics_feed_generation(self):
    # Verify feed_token is auto-assigned/present
    self.assertIsNotNone(self.employee_user.feed_token)
    
    # Request the feed URL
    url = f'/api/planner/ics/{self.employee_user.feed_token}/'
    response = self.client.get(url)
    
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertTrue(response['Content-Type'].startswith('text/calendar'))
    
    content = response.content.decode('utf-8')
    self.assertIn("BEGIN:VCALENDAR", content)
    self.assertIn("VERSION:2.0", content)
    self.assertIn("BEGIN:VTIMEZONE", content)
    self.assertIn("END:VCALENDAR", content)

  def test_lock_creation_api(self):
    self.client.force_authenticate(user=self.admin_user)
    
    payload = {
      "title": "Year-End Maintenance",
      "start_date": "2026-12-25",
      "end_date": "2026-12-31",
      "scope": "Global",
      "reason": "Freeze all non-essential activities"
    }
    
    response = self.client.post('/api/planner/lock/', payload, format='json')
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertEqual(PlannerLock.objects.filter(scope="Global").count(), 1)

  def test_lock_blocks_event_creation(self):
    # Lock the date range
    PlannerLock.objects.create(
      title="Global Freeze",
      start_date="2026-12-25",
      end_date="2026-12-31",
      scope="Global",
      locked_by=self.admin_user
    )

    # Force login employee
    self.client.force_authenticate(user=self.employee_user)
    
    # Try to create a Leave in locked date range
    payload = {
      "title": "Sabbatical Leave Request",
      "event_type": "Leave",
      "start_date": "2026-12-26",
      "end_date": "2026-12-26",
      "visibility": "Team"
    }
    
    response = self.client.post('/api/planner/create-event/', payload, format='json')
    # Should get bad request response due to date locking validation
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
