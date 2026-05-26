from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, parsers
from ..models import CompanyPolicy, CompanyDocument, LetterHead
from ..serializers import CompanyPolicySerializer, CompanyDocumentSerializer, LetterHeadSerializer

class CompanyPolicyView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        policies = CompanyPolicy.objects.all().order_by('-created_at')
        serializer = CompanyPolicySerializer(policies, many=True)
        return Response(serializer.data)
    def post(self, request):
        serializer = CompanyPolicySerializer(data=request.data)
        if serializer.is_valid():
            company = getattr(request.user, 'company', None)
            if request.user.role.lower() != 'super_admin' and company:
                serializer.save(company=company)
            else:
                serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CompanyPolicyDetailView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request, pk):
        try:
            policy = CompanyPolicy.objects.get(pk=pk)
            serializer = CompanyPolicySerializer(policy)
            return Response(serializer.data)
        except CompanyPolicy.DoesNotExist:
            return Response({'message': 'Policy not found'}, status=status.HTTP_404_NOT_FOUND)
    def patch(self, request, pk):
        try:
            policy = CompanyPolicy.objects.get(pk=pk)
            serializer = CompanyPolicySerializer(policy, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except CompanyPolicy.DoesNotExist:
            return Response({'message': 'Policy not found'}, status=status.HTTP_404_NOT_FOUND)
    def delete(self, request, pk):
        try:
            policy = CompanyPolicy.objects.get(pk=pk)
            policy.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except CompanyPolicy.DoesNotExist:
            return Response({'message': 'Policy not found'}, status=status.HTTP_404_NOT_FOUND)

class DocumentUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (parsers.MultiPartParser, parsers.FormParser)
    def post(self, request):
        data = request.data.copy()
        data['uploaded_by'] = request.user.id
        serializer = CompanyDocumentSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EmployeeDocumentsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        docs = CompanyDocument.objects.all().order_by('-created_at')
        serializer = CompanyDocumentSerializer(docs, many=True)
        return Response(serializer.data)

class LetterHeadView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        doc_type = request.query_params.get('document_type')
        if doc_type:
            letterheads = LetterHead.objects.filter(document_type=doc_type).order_by('-created_at')
        else:
            letterheads = LetterHead.objects.all().order_by('-created_at')
        serializer = LetterHeadSerializer(letterheads, many=True)
        return Response(serializer.data)
    def post(self, request):
        serializer = LetterHeadSerializer(data=request.data)
        if serializer.is_valid():
            company = getattr(request.user, 'company', None)
            if request.user.role.lower() != 'super_admin' and company:
                serializer.save(company=company)
            else:
                serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LetterHeadDetailView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request, pk):
        try:
            letterhead = LetterHead.objects.get(pk=pk)
            serializer = LetterHeadSerializer(letterhead)
            return Response(serializer.data)
        except LetterHead.DoesNotExist:
            return Response({'message': 'Record not found'}, status=status.HTTP_404_NOT_FOUND)
    def patch(self, request, pk):
        try:
            letterhead = LetterHead.objects.get(pk=pk)
            serializer = LetterHeadSerializer(letterhead, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except LetterHead.DoesNotExist:
            return Response({'message': 'Record not found'}, status=status.HTTP_404_NOT_FOUND)
    def delete(self, request, pk):
        try:
            letterhead = LetterHead.objects.get(pk=pk)
            letterhead.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except LetterHead.DoesNotExist:
            return Response({'message': 'Record not found'}, status=status.HTTP_404_NOT_FOUND)

from django.http import StreamingHttpResponse
import requests
import re

class DownloadFileView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        file_url = request.query_params.get('url')
        custom_name = request.query_params.get('name')
        
        if not file_url:
            return Response({'message': 'URL parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not custom_name:
            custom_name = "document"
            
        clean_name = re.sub(r'[^a-zA-Z0-9_\- ]', '', custom_name).strip().replace(' ', '_')
        if not clean_name:
            clean_name = "downloaded_file"
        
        ext = ".pdf"
        lower_url = file_url.lower()
        if '.pdf' in lower_url:
            ext = '.pdf'
        elif '.jpg' in lower_url or '.jpeg' in lower_url:
            ext = '.jpg'
        elif '.png' in lower_url:
            ext = '.png'
        elif '.webp' in lower_url:
            ext = '.webp'
        elif '.docx' in lower_url:
            ext = '.docx'
        elif '.doc' in lower_url:
            ext = '.doc'
        elif '.xlsx' in lower_url:
            ext = '.xlsx'
        elif '.xls' in lower_url:
            ext = '.xls'
            
        if not clean_name.lower().endswith(ext):
            clean_name = f"{clean_name}{ext}"

        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
            response = requests.get(file_url, headers=headers, stream=True, timeout=15)
            if response.status_code != 200:
                return Response({'message': 'Failed to fetch resource from source URL'}, status=status.HTTP_404_NOT_FOUND)
                
            content_type = response.headers.get('Content-Type', 'application/octet-stream')
            
            django_response = StreamingHttpResponse(
                response.iter_content(chunk_size=4096),
                content_type=content_type
            )
            django_response['Content-Disposition'] = f'attachment; filename="{clean_name}"'
            return django_response
            
        except Exception as e:
            return Response({'message': f"Error downloading file: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

