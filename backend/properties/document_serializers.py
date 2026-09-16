from rest_framework import serializers
from .documents import PropertyDocument


class PropertyDocumentSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    uploaded_by_email = serializers.EmailField(source='uploaded_by.email', read_only=True)
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = PropertyDocument
        fields = [
            'id', 'property', 'title', 'category', 'category_display', 'notes',
            'uploaded_by_email', 'download_url', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'property', 'uploaded_by_email', 'download_url', 'created_at', 'updated_at']

    def get_download_url(self, obj):
        request = self.context.get('request')
        path = f'/api/properties/documents/{obj.id}/download/'
        return request.build_absolute_uri(path) if request else path


class PropertyDocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyDocument
        fields = ['title', 'category', 'file', 'notes']
