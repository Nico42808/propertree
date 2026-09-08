"""
Serializers for Maintenance app.
"""
from rest_framework import serializers
from .models import MaintenanceRequest, MaintenanceImage, ServiceProvider, MaintenanceSchedule, ServiceCatalog
from properties.serializers import PropertyListSerializer
from users.serializers import UserSerializer


class ServiceCatalogSerializer(serializers.ModelSerializer):
    """Serializer for service catalog."""

    formatted_price = serializers.ReadOnlyField()

    class Meta:
        model = ServiceCatalog
        fields = '__all__'


class ServiceProviderSerializer(serializers.ModelSerializer):
    """Serializer for service providers."""

    class Meta:
        model = ServiceProvider
        fields = '__all__'


class MaintenanceImageSerializer(serializers.ModelSerializer):
    """Serializer for maintenance images / uploaded invoice files."""

    filename = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = MaintenanceImage
        fields = ['id', 'filename', 'caption', 'created_at', 'download_url']

    def get_filename(self, obj):
        if not obj.image:
            return ''
        return obj.image.name.rsplit('/', 1)[-1]

    def get_download_url(self, obj):
        request = self.context.get('request')
        path = f"/api/maintenance/images/{obj.id}/download/"
        if request:
            return request.build_absolute_uri(path)
        return path


class MaintenanceRequestSerializer(serializers.ModelSerializer):
    """Serializer for maintenance requests."""

    images = MaintenanceImageSerializer(many=True, read_only=True)
    assigned_to = ServiceProviderSerializer(read_only=True)
    service_catalog = ServiceCatalogSerializer(read_only=True)
    rental_property = serializers.SerializerMethodField()
    reported_by = UserSerializer(read_only=True)
    admin_confirmed_by_email = serializers.EmailField(source='admin_confirmed_by.email', read_only=True)
    
    def get_rental_property(self, obj):
        """Return rental_property as nested object for read operations."""
        if obj.rental_property:
            return PropertyListSerializer(obj.rental_property).data
        return None
    resolution_time = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()

    # For write operations
    service_catalog_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    assigned_to_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    rental_property_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    

    class Meta:
        model = MaintenanceRequest
        fields = '__all__'
        read_only_fields = [
            'id', 'reported_by', 'reported_at', 'updated_at',
            'assigned_at', 'resolved_at', 'admin_confirmed_by', 'admin_confirmed_at'
        ]


    def validate(self, attrs):
        """Validate and handle rental_property from request data."""
        from properties.models import Property
        
        # Get rental_property from initial_data (since it's not in validated_data due to SerializerMethodField)
        rental_property_uuid = None
        if hasattr(self, 'initial_data'):
            rental_property_uuid = self.initial_data.get('rental_property') or self.initial_data.get('rental_property_id')
        
        if rental_property_uuid:
            try:
                rental_property = Property.objects.get(id=rental_property_uuid)
                # Validate ownership if user is a landlord
                user = self.context.get('request').user if self.context.get('request') else None
                if user and hasattr(user, 'role') and user.role == 'landlord':
                    if rental_property.landlord != user:
                        raise serializers.ValidationError({"rental_property": "You can only create service bookings for your own properties."})
                # Add to validated_data
                attrs['rental_property'] = rental_property
            except Property.DoesNotExist:
                raise serializers.ValidationError({"rental_property": "Property not found."})
        elif self.instance is None:  # Only require for creation, not updates
            raise serializers.ValidationError({"rental_property": "This field is required."})
        
        return attrs

    def create(self, validated_data):
        """Handle foreign key IDs during creation."""
        service_catalog_id = validated_data.pop('service_catalog_id', None)
        assigned_to_id = validated_data.pop('assigned_to_id', None)

        # Get service catalog and set category from it if provided
        service_catalog = None
        if service_catalog_id:
            try:
                from .models import ServiceCatalog
                service_catalog = ServiceCatalog.objects.get(id=service_catalog_id)
                # Set category from service catalog if not explicitly provided
                if 'category' not in validated_data or not validated_data.get('category'):
                    # Map service catalog category to maintenance request category
                    category_mapping = {
                        'plumbing': 'plumbing',
                        'electrical': 'electrical',
                        'hvac': 'hvac',
                        'appliance': 'appliance',
                        'cleaning': 'cleaning',
                        'painting': 'painting',
                        'carpentry': 'other',  # MaintenanceRequest doesn't have carpentry
                        'locksmith': 'locksmith',
                        'gardening': 'other',  # MaintenanceRequest doesn't have gardening
                        'pest_control': 'pest_control',
                        'general_maintenance': 'other',
                        'other': 'other',
                    }
                    validated_data['category'] = category_mapping.get(service_catalog.category, 'other')
            except ServiceCatalog.DoesNotExist:
                raise serializers.ValidationError({"service_catalog_id": "Service catalog item not found."})

        # Create the maintenance request
        maintenance_request = MaintenanceRequest.objects.create(**validated_data)

        # Set foreign keys if provided
        if service_catalog:
            maintenance_request.service_catalog = service_catalog
        if assigned_to_id:
            maintenance_request.assigned_to_id = assigned_to_id

        maintenance_request.save()
        return maintenance_request

    def update(self, instance, validated_data):
        """Handle foreign key IDs during update."""
        service_catalog_id = validated_data.pop('service_catalog_id', None)
        assigned_to_id = validated_data.pop('assigned_to_id', None)

        # Update regular fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Update foreign keys if provided
        if service_catalog_id is not None:
            instance.service_catalog_id = service_catalog_id
        if assigned_to_id is not None:
            instance.assigned_to_id = assigned_to_id

        instance.save()
        return instance


class MaintenanceScheduleSerializer(serializers.ModelSerializer):
    """Serializer for maintenance schedules."""

    class Meta:
        model = MaintenanceSchedule
        fields = '__all__'
