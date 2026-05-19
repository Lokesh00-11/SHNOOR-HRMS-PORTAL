from django.apps import AppConfig


class MyappConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'myapp'

    def ready(self):
        # Startup validation warning on Django startup
        import os
        import logging
        from django.conf import settings
        
        logger = logging.getLogger(__name__)
        
        oauth_creds_file = getattr(settings, 'OAUTH_CREDENTIALS_FILE', None)
        folder_id = getattr(settings, 'GOOGLE_DRIVE_FOLDER_ID', None)
        
        warnings = []
        if not oauth_creds_file:
            warnings.append("OAUTH_CREDENTIALS_FILE is not configured in Django settings.")
        elif not os.path.exists(oauth_creds_file):
            warnings.append(f"Google Drive OAuth credentials file (credentials.json) not found at: {oauth_creds_file}")
            
        if not folder_id:
            warnings.append("GOOGLE_DRIVE_FOLDER_ID is not configured in Django settings.")
            
        if warnings:
            for w in warnings:
                logger.warning(f"GOOGLE DRIVE OAUTH CONFIG WARNING: {w}")
                print(f"GOOGLE DRIVE OAUTH CONFIG WARNING: {w}")

        import myapp.signals
