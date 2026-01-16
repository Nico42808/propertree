"""
Simplified serializers for Properties app.
"""
from rest_framework import serializers
from .models import Property, PropertyExpense, Favorite
from users.serializers import ProfileSerializer


class PropertyListSerializer(serializers.ModelSerializer):
    """Serializer for property list view."""
    
    landlord_name = serializers.SerializerMethodField()
    primary_photo = serializers.SerializerMethodField()
    booked_dates = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = [
            'id', 'title', 'description', 'property_type', 'city', 'state', 'country',
            'bedrooms', 'bathrooms', 'max_guests', 'price_per_night', 'monthly_price', 'approval_type',
            'rental_terms', 'status', 'primary_photo', 'landlord_name', 'rejection_reason', 'created_at',
            'booked_dates'
        ]
    
    def get_landlord_name(self, obj):
        """Get landlord name from profile."""
        if hasattr(obj.landlord, 'profile'):
            return obj.landlord.profile.get_full_name()
        return obj.landlord.email
    
    def get_primary_photo(self, obj):
        """Get first photo URL."""
        photo_obj = obj.get_primary_photo()
        if photo_obj:
            # Handle different photo formats:
            # 1. String URL (direct URL)
            if isinstance(photo_obj, str):
                return photo_obj
            # 2. Object with 'preview' (base64) or 'url' (uploaded file URL)
            elif isinstance(photo_obj, dict):
                return photo_obj.get('preview') or photo_obj.get('url')
        return None
    
    def get_booked_dates(self, obj):
        """Get list of booked date ranges for confirmed bookings."""
        from bookings.models import Booking
        confirmed_bookings = Booking.objects.filter(
            property=obj,
            status='confirmed'
        ).values('check_in', 'check_out')
        
        return [
            {
                'check_in': booking['check_in'].isoformat(),
                'check_out': booking['check_out'].isoformat()
            }
            for booking in confirmed_bookings
        ]


class PropertyDetailSerializer(serializers.ModelSerializer):
    """Serializer for property detail view."""
    
    landlord_name = serializers.SerializerMethodField()
    landlord_email = serializers.SerializerMethodField()
    landlord_profile = serializers.SerializerMethodField()
    primary_photo = serializers.SerializerMethodField()
    booked_dates = serializers.SerializerMethodField()
    owner_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = [
            'id', 'landlord', 'landlord_name', 'landlord_email', 'landlord_profile', 'title', 'description',
            'property_type', 'address', 'city', 'state', 'country', 'postal_code',
            'bedrooms', 'bathrooms', 'max_guests', 'price_per_night', 'monthly_price', 'approval_type',
            'rental_terms',
            'amenities', 'photos', 'primary_photo', 'status', 'rejection_reason',
            'approved_by', 'approved_at', 'created_at', 'updated_at', 'booked_dates', 'owner_name'
        ]
        read_only_fields = ['id', 'landlord', 'approved_by', 'approved_at', 'created_at', 'updated_at']
    
    def get_landlord_name(self, obj):
        """Get landlord name from profile."""
        if hasattr(obj.landlord, 'profile'):
            return obj.landlord.profile.get_full_name()
        return obj.landlord.email
    
    def get_landlord_email(self, obj):
        """Get landlord email."""
        return obj.landlord.email
    
    def get_landlord_profile(self, obj):
        """Get landlord profile data including photo and bio."""
        if hasattr(obj.landlord, 'profile'):
            return ProfileSerializer(obj.landlord.profile, context=self.context).data
        return None
    
    def get_primary_photo(self, obj):
        """Get first photo URL."""
        photo_obj = obj.get_primary_photo()
        if photo_obj:
            # Handle different photo formats:
            # 1. String URL (direct URL)
            if isinstance(photo_obj, str):
                return photo_obj
            # 2. Object with 'preview' (base64) or 'url' (uploaded file URL)
            elif isinstance(photo_obj, dict):
                return photo_obj.get('preview') or photo_obj.get('url')
        return None
    
    def get_owner_name(self, obj):
        """Get owner name (alias for landlord_name for consistency)."""
        return self.get_landlord_name(obj)
    
    def get_booked_dates(self, obj):
        """Get list of booked date ranges for confirmed bookings."""
        from bookings.models import Booking
        confirmed_bookings = Booking.objects.filter(
            property=obj,
            status='confirmed'
        ).values('check_in', 'check_out')
        
        return [
            {
                'check_in': booking['check_in'].isoformat(),
                'check_out': booking['check_out'].isoformat()
            }
            for booking in confirmed_bookings
        ]


class PropertyCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating properties."""

    class Meta:
        model = Property
        fields = [
            'title', 'description', 'property_type', 'address', 'city', 'state',
            'country', 'postal_code', 'bedrooms', 'bathrooms', 'max_guests',
            'price_per_night', 'monthly_price', 'approval_type', 'rental_terms', 'amenities', 'photos', 'status'
        ]


class PropertyExpenseSerializer(serializers.ModelSerializer):
    """Serializer for property expenses."""
    
    property_title = serializers.CharField(source='property.title', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = PropertyExpense
        fields = [
            'id', 'property', 'property_title', 'category', 'category_display',
            'description', 'amount', 'expense_date', 'is_recurring',
            'recurrence_frequency', 'receipt_url', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate expense data."""
        if data.get('is_recurring') and not data.get('recurrence_frequency'):
            raise serializers.ValidationError({
                'recurrence_frequency': 'Recurrence frequency is required for recurring expenses.'
            })
        return data


class PropertyExpenseCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating property expenses."""
    
    class Meta:
        model = PropertyExpense
        fields = [
            'property', 'category', 'description', 'amount', 'expense_date',
            'is_recurring', 'recurrence_frequency', 'receipt_url'
        ]
    
    def validate(self, data):
        """Validate expense data."""
        if data.get('is_recurring') and not data.get('recurrence_frequency'):
            raise serializers.ValidationError({
                'recurrence_frequency': 'Recurrence frequency is required for recurring expenses.'
            })
        
        # Ensure the property belongs to the requesting landlord
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            property_obj = data.get('property')
            if property_obj.landlord != request.user:
                raise serializers.ValidationError({
                    'property': 'You can only add expenses to your own properties.'
                })
        
        return data


class FavoriteSerializer(serializers.ModelSerializer):
    """Serializer for favorites."""
    
    property = PropertyListSerializer(read_only=True)
    property_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = Favorite
        fields = ['id', 'property', 'property_id', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def create(self, validated_data):
        """Create favorite with property_id."""
        property_id = validated_data.pop('property_id')
        from .models import Property
        try:
            property_obj = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            raise serializers.ValidationError({'property_id': 'Property not found.'})
        
        validated_data['property'] = property_obj
        validated_data['user'] = self.context['request'].user
        
        # Check if favorite already exists
        favorite, created = Favorite.objects.get_or_create(
            user=validated_data['user'],
            property=property_obj,
            defaults=validated_data
        )
        
        if not created:
            raise serializers.ValidationError({'property_id': 'Property is already in favorites.'})
        
        return favorite


class FavoriteCreateSerializer(serializers.Serializer):
    """Serializer for creating favorites (simplified)."""
    
    property_id = serializers.UUIDField()
    
    def validate_property_id(self, value):
        """Validate that property exists."""
        from .models import Property
        try:
            Property.objects.get(id=value)
        except Property.DoesNotExist:
            raise serializers.ValidationError('Property not found.')
        return value
