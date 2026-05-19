from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from ..models import Appreciation
from ..serializers import AppreciationSerializer

class AppreciationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        appreciations = Appreciation.objects.all().order_by('-created_at')
        serializer = AppreciationSerializer(appreciations, many=True)
        return Response(serializer.data)
    def post(self, request):
        data = request.data.copy()
        data['sender'] = request.user.id
        serializer = AppreciationSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
