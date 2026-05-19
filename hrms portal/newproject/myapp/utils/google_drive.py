import os
import io
import uuid
import logging
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from PIL import Image

logger = logging.getLogger(__name__)

# Allowed files configuration
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.pdf', '.webp'}
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB

def validate_uploaded_file(file):
    """
    Validates file size (max 2MB) and file extension/type.
    Raises ValueError if validation fails.
    """
    # Check file size
    if file.size > MAX_FILE_SIZE:
        raise ValueError("File size exceeds the 2MB safe limit.")
    
    # Check file extension
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}")

def compress_image_if_needed(file):
    
    ext = os.path.splitext(file.name)[1].lower()
    base_name = os.path.splitext(file.name)[0]
    import re
    clean_base = re.sub(r'[^a-zA-Z0-9_\-]', '_', base_name)
    if not clean_base:
        clean_base = "uploaded_file"
    filename = f"{clean_base}_{uuid.uuid4().hex[:6]}{ext}"
    
    # Return original if PDF
    if ext == '.pdf':
        return file.read(), 'application/pdf', filename

    # Attempt image compression
    try:
        # Seek stream to start
        file.seek(0)
        img = Image.open(file)
        
        # Check if format is supported image
        if img.format in ['JPEG', 'PNG', 'GIF', 'BMP', 'WEBP', 'JPG']:
            # Handle orientation from EXIF metadata
            try:
                exif = img._getexif()
                if exif:
                    for tag, value in exif.items():
                        # 274 is the EXIF orientation tag code
                        if tag == 274:
                            if value == 3:
                                img = img.rotate(180, expand=True)
                            elif value == 6:
                                img = img.rotate(270, expand=True)
                            elif value == 8:
                                img = img.rotate(90, expand=True)
                            break
            except Exception as e:
                logger.warning(f"EXIF orientation correction skipped: {e}")
            
            # Downscale image if dimensions exceed target modern constraints (1600px max)
            max_size = 1600
            if img.width > max_size or img.height > max_size:
                img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            
            # Convert palette/transparency layers to solid white RGB stream for JPEG compression
            if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                alpha = img.convert('RGBA')
                bg = Image.new('RGB', alpha.size, (255, 255, 255))
                bg.paste(alpha, mask=alpha.split()[3])
                img = bg
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Compress as JPEG at 80% visually lossless quality
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=80, optimize=True)
            output.seek(0)
            
            compressed_filename = f"{os.path.splitext(filename)[0]}.jpg"
            return output.read(), 'image/jpeg', compressed_filename
    except Exception as e:
        logger.warning(f"Image compression failed, uploading original file: {e}")
    
    # Return original file if image processing failed
    file.seek(0)
    mime_type = 'application/octet-stream'
    if ext in ['.jpg', '.jpeg']:
        mime_type = 'image/jpeg'
    elif ext == '.png':
        mime_type = 'image/png'
    elif ext == '.webp':
        mime_type = 'image/webp'
    return file.read(), mime_type, filename


def extract_folder_id(folder_id_raw):
    """
    Ensures GOOGLE_DRIVE_FOLDER_ID contains ONLY the folder ID.
    If a full URL is provided, extracts only the folder ID portion.
    """
    if not folder_id_raw:
        return ""
    folder_id_raw = str(folder_id_raw).strip()
    if "drive.google.com" in folder_id_raw or "folders/" in folder_id_raw:
        # e.g., https://drive.google.com/drive/folders/1AbCdEfGhIj?usp=sharing
        parts = folder_id_raw.split("folders/")
        if len(parts) > 1:
            folder_id_raw = parts[1].split("?")[0].split("/")[0]
    return folder_id_raw.strip()


def upload_expense_receipt_to_drive(file):
    """
    Validates, optimizes, and uploads the given expense file to Google Drive.
    If Google Drive credentials are not found/configured, falls back gracefully to a
    local simulation storage structure (media/mock_drive/) to preserve full end-to-end functionality.
    
    Returns:
        file_id (str): Google Drive File ID (or mock string)
        view_url (str): Sharable viewing URL (Google Drive link or local server link)
    """
    # 6. VALIDATE FILE BEFORE TEMP WRITE
    # 1. Enforce validation (file size and extensions)
    validate_uploaded_file(file)
    
    # 2. Image compression optimization pipeline
    file_bytes, mime_type, filename = compress_image_if_needed(file)
    
    # 3. Locate Google Drive OAuth credentials config
    oauth_creds_file = getattr(settings, 'OAUTH_CREDENTIALS_FILE', None)
    if not oauth_creds_file:
        oauth_creds_file = os.path.join(settings.BASE_DIR, 'credentials', 'credentials.json')
    
    is_configured = os.path.exists(oauth_creds_file) and os.path.getsize(oauth_creds_file) > 0
    
    if is_configured:
        temp_file_path = None
        media = None
        # Save original socket timeout
        import socket
        original_timeout = socket.getdefaulttimeout()
        try:
            from google.oauth2.credentials import Credentials
            from google_auth_oauthlib.flow import InstalledAppFlow
            from google.auth.transport.requests import Request
            from googleapiclient.discovery import build
            from googleapiclient.http import MediaFileUpload
            
            # Extract folder ID cleanly as per Step 2
            folder_id_raw = getattr(settings, 'GOOGLE_DRIVE_FOLDER_ID', '')
            folder_id = extract_folder_id(folder_id_raw)
            
            # 3. CREATE TEMP_UPLOADS DIRECTORY SAFELY
            temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp_uploads')
            os.makedirs(temp_dir, exist_ok=True)
            temp_file_path = os.path.join(temp_dir, filename)
            with open(temp_file_path, 'wb') as temp_file:
                temp_file.write(file_bytes)
                
            # 6. ADD SAFE DEBUG LOGGING (Before upload)
            print("Uploading file:", temp_file_path)
            print("Folder ID:", folder_id)
            print("OAuth credentials file exists:", os.path.exists(oauth_creds_file))
            logger.info(f"Uploading file: {temp_file_path} to Google Drive Folder: {folder_id} via OAuth")
            
            # 5. ADD TIMEOUT SAFETY (Set socket timeout to 30 seconds)
            socket.setdefaulttimeout(30)
            
            # OAuth 2.0 Auth Flow with 'https://www.googleapis.com/auth/drive.file' scope
            scopes = ['https://www.googleapis.com/auth/drive.file']
            token_file = getattr(settings, 'OAUTH_TOKEN_FILE', os.path.join(settings.BASE_DIR, 'credentials', 'token.json'))
            
            creds = None
            if os.path.exists(token_file):
                try:
                    creds = Credentials.from_authorized_user_file(token_file, scopes)
                except Exception as token_err:
                    logger.warning(f"Failed to load token file: {token_err}")
                    
            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    creds.refresh(Request())
                else:
                    flow = InstalledAppFlow.from_client_secrets_file(oauth_creds_file, scopes)
                    creds = flow.run_local_server(port=0)
                
                # Save the credentials for next runs
                os.makedirs(os.path.dirname(token_file), exist_ok=True)
                with open(token_file, 'w') as token:
                    token.write(creds.to_json())
                    
            service = build('drive', 'v3', credentials=creds)
            
            # Upload file metadata and media stream
            file_metadata = {
                'name': filename,
                'mimeType': mime_type
            }
            if folder_id:
                file_metadata['parents'] = [folder_id]
                
            media = MediaFileUpload(temp_file_path, mimetype=mime_type, resumable=True)
            uploaded_file = service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, webViewLink'
            ).execute()
            
            file_id = uploaded_file.get('id')
            
            # 6. ADD SAFE DEBUG LOGGING (After upload)
            print("Upload successful")
            print("Google File ID:", file_id)
            logger.info(f"Successfully uploaded receipt to Google Drive via OAuth. File ID: {file_id}")
            
            # Automatically expose file permissions to: "Anyone with the link can view"
            user_permission = {
                'type': 'anyone',
                'role': 'reader'
            }
            service.permissions().create(fileId=file_id, body=user_permission).execute()
            
            # 8. ADD SAFE GOOGLE DRIVE URL GENERATION
            # Stable shareable direct link structure
            view_url = f"https://drive.google.com/uc?id={file_id}"
            
            return file_id, view_url
            
        except Exception as e:
            # 2. USE LOGGER INSTEAD OF ONLY PRINT & 5. REMOVE SILENT FAILURE
            logger.error(f"Google Drive API OAuth upload failed, falling back to local simulation: {e}")
            print("GOOGLE DRIVE ERROR:", str(e))
            # Fall through to local simulation fallback on API failures
            
        finally:
            # Restore original default timeout
            socket.setdefaulttimeout(original_timeout)
            
            # Close MediaFileUpload file descriptor if open (prevents WinError 32 file in use on Windows)
            if media and hasattr(media, '_fd') and media._fd:
                try:
                    media._fd.close()
                except Exception:
                    pass
                    
            # 4. CLEANUP TEMP FILES USING finally:
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except Exception as cleanup_err:
                    logger.warning(f"Failed to remove temporary file {temp_file_path}: {cleanup_err}")
    
    # --- SIMULATED GOOGLE DRIVE STORAGE FALLBACK ---
    logger.warning("Google Drive not configured or API error. Operating in SIMULATED Google Drive storage mode.")
    
    # Ensure media/mock_drive subfolder exists
    mock_drive_dir = os.path.join(settings.MEDIA_ROOT, 'mock_drive')
    os.makedirs(mock_drive_dir, exist_ok=True)
    
    # Save optimized file bytes locally
    mock_id = f"mock-gdrive-{uuid.uuid4().hex}"
    mock_file_path = os.path.join('mock_drive', filename)
    
    # Write optimized bytes using Django default storage
    saved_path = default_storage.save(mock_file_path, ContentFile(file_bytes))
    
    # Construct local server file URL
    simulated_url = f"http://127.0.0.1:8000/media/{saved_path.replace(os.sep, '/')}"
    
    return mock_id, simulated_url

# Trigger auto-reload for newly installed package detection


