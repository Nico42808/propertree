from rest_framework import serializers
from .documents import PropertyDocument


class PropertyDocumentSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    uploaded_by_email = serializers.EmailField(source='uploaded_by.email', read_only=True)
    reviewed_by_email = serializers.EmailField(source='reviewed_by.email', read_only=True, allow_null=True)
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = PropertyDocument
        fields = [
            'id', 'property', 'title', 'category', 'category_display', 'notes',
            'uploaded_by_email', 'reviewed_at', 'reviewed_by_email', 'download_url', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'property', 'uploaded_by_email', 'reviewed_at', 'reviewed_by_email', 'download_url', 'created_at', 'updated_at']

    def get_download_url(self, obj):
        request = self.context.get('request')
        path = f'/api/properties/documents/{obj.id}/download/'
        return request.build_absolute_uri(path) if request else path


class PropertyDocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyDocument
        fields = ['title', 'category', 'file', 'notes']

    def validate(self, attrs):
        file = attrs.get('file')
        category = attrs.get('category')
        if file and file.size > 15 * 1024 * 1024:
            raise serializers.ValidationError({'file': 'Document must be smaller than 15 MB.'})
        if category in {'proof_of_ownership', 'lease_agreement'} and file:
            allowed_types = {'application/pdf', 'image/jpeg', 'image/png'}
            if getattr(file, 'content_type', '') not in allowed_types:
                raise serializers.ValidationError({'file': 'Verification documents must be PDF, JPG or PNG files.'})
        return attrs
