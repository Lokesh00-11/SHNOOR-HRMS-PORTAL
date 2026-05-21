from django.http import JsonResponse
from django.utils import timezone
from .models import Company, User

class SubscriptionCheckMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not request.user or not request.user.is_authenticated:
            return self.get_response(request)

        role = getattr(request.user, 'role', '').lower()
        if request.user.is_superuser or role in ['admin', 'super_admin', 'superadmin']:
            return self.get_response(request)

        # List of exempted URL names or paths that should remain accessible
        path = request.path
        exempt_paths = [
            '/api/auth/login/',
            '/api/user/profile/',
            '/api/manager/subscription/',
            '/api/manager/renew/',
            '/api/admin/subscriptions/',  
        ]
        
        if any(p in path for p in exempt_paths):
            return self.get_response(request)

        company = self.get_user_company(request.user)
        if company:
            today = timezone.now().date()
            is_expired = False
            
            if company.license_expired or not company.is_active:
                is_expired = True
            elif company.license_expiry_date and company.license_expiry_date < today:
                company.license_expired = True
                company.save(update_fields=['license_expired'])
                is_expired = True

            if is_expired:
                return JsonResponse({
                    'message': 'Your subscription has expired. Please renew the subscription or contact the admin.',
                    'subscription_blocked': True,
                    'company_name': company.name,
                    'expiry_date': str(company.license_expiry_date) if company.license_expiry_date else 'Expired'
                }, status=403)

        return self.get_response(request)

    def get_user_company(self, user):
        if getattr(user, 'company', None):
            return user.company

        role = getattr(user, 'role', '').lower()
        if role == 'manager':
            company = Company.objects.filter(email=user.email).first()
            if company:
                user.company = company
                user.save(update_fields=['company'])
                return company

     
        manager = User.objects.filter(role__iexact='manager').first()
        if manager:
            company = getattr(manager, 'company', None) or Company.objects.filter(email=manager.email).first()
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
