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

