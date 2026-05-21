from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from ..models import Thanks
from ..serializers import ThanksSerializer, ThanksCommentSerializer

class ThanksView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        thanks = Thanks.objects.all().order_by('-created_at')
        serializer = ThanksSerializer(thanks, many=True)
        return Response(serializer.data)
        
    def post(self, request):
        data = request.data.copy()
        data['sender'] = request.user.id
        serializer = ThanksSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ThanksCommentView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, thanks_id):
        try:
            thanks_obj = Thanks.objects.get(id=thanks_id)
        except Thanks.DoesNotExist:
            return Response({'error': 'Thanks not found'}, status=status.HTTP_404_NOT_FOUND)
            
        data = {
            'thanks': thanks_obj.id,
            'author': request.user.id,
            'text': request.data.get('text')
        }
        serializer = ThanksCommentSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
