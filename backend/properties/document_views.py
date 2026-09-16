from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import Property
from .documents import PropertyDocument
from .document_serializers import PropertyDocumentSerializer, PropertyDocumentUploadSerializer


def _can_manage_property(user, property_obj):
    return getattr(user, 'role', None) == 'admin' or property_obj.landlord_id == user.id


class PropertyDocumentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_property(self):
        property_obj = get_object_or_404(Property, pk=self.kwargs['property_id'])
        if not _can_manage_property(self.request.user, property_obj):
            raise PermissionDenied('You do not have access to this property.')
        return property_obj

    def get_queryset(self):
        return PropertyDocument.objects.filter(property=self.get_property()).order_by('-created_at')

    def get_serializer_class(self):
        return PropertyDocumentUploadSerializer if self.request.method == 'POST' else PropertyDocumentSerializer

    def create(self, request, *args, **kwargs):
        serializer = PropertyDocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        document = serializer.save(property=self.get_property(), uploaded_by=request.user)
        return Response(
            PropertyDocumentSerializer(document, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class PropertyDocumentDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = PropertyDocument.objects.select_related('property').all()

    def perform_destroy(self, instance):
        if not _can_manage_property(self.request.user, instance.property):
            raise PermissionDenied('You do not have access to this property.')
        if instance.file:
            instance.file.delete(save=False)
        instance.delete()


class PropertyDocumentDownloadView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        document = get_object_or_404(PropertyDocument.objects.select_related('property'), pk=pk)
        if not _can_manage_property(request.user, document.property):
            raise PermissionDenied('You do not have access to this property.')
        if not document.file:
            raise Http404('File not found')
        return FileResponse(
            document.file.open('rb'),
            as_attachment=True,
            filename=document.file.name.split('/')[-1],
        )
