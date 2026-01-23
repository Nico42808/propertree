"""
Simplified serializers for Bookings app.
"""
from rest_framework import serializers
from datetime import date
from .models import Booking
from properties.serializers import PropertyListSerializer


class BookingListSerializer(serializers.ModelSerializer):
    """Serializer for booking list view."""

    property_title = serializers.CharField(source='property.title', read_only=True)
    property_city = serializers.CharField(source='property.city', read_only=True)
    property_country = serializers.CharField(source='property.country', read_only=True)
    property_approval_type = serializers.CharField(source='property.approval_type', read_only=True)
    tenant_name = serializers.SerializerMethodField()
    tenant_email = serializers.CharField(source='tenant.email', read_only=True)
    duration_nights = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'property', 'property_title', 'property_city', 'property_country', 'property_approval_type',
            'tenant_name', 'tenant_email', 'check_in', 'check_out', 'guests_count',
            'total_price', 'status', 'duration_nights', 'cancellation_reason', 'created_at'
        ]
    
    def get_tenant_name(self, obj):
        """Get tenant name from profile."""
        if hasattr(obj.tenant, 'profile'):
            return obj.tenant.profile.get_full_name()
        return obj.tenant.email
    
    def get_duration_nights(self, obj):
        """Get booking duration."""
        return obj.get_duration()

    def get_total_price(self, obj):
        """Return stored total_price or compute a fallback for older records."""
        if obj.total_price and obj.total_price > 0:
            return obj.total_price
        return obj.calculate_total_price()


class BookingDetailSerializer(serializers.ModelSerializer):
    """Serializer for booking detail view."""
    
    property_details = PropertyListSerializer(source='property', read_only=True)
    tenant_name = serializers.SerializerMethodField()
    tenant_email = serializers.CharField(source='tenant.email', read_only=True)
    duration_nights = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Booking
        fields = [
            'id', 'property', 'property_details', 'tenant', 'tenant_name', 'tenant_email',
            'check_in', 'check_out', 'guests_count', 'total_price', 'status',
            'special_requests', 'cancellation_reason', 'duration_nights', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'tenant', 'created_at', 'updated_at']
    
    def get_tenant_name(self, obj):
        """Get tenant name from profile."""
        if hasattr(obj.tenant, 'profile'):
            return obj.tenant.profile.get_full_name()
        return obj.tenant.email
    
    def get_duration_nights(self, obj):
        """Get booking duration."""
        return obj.get_duration()

    def get_total_price(self, obj):
        """Return stored total_price or compute a fallback for older records."""
        if obj.total_price and obj.total_price > 0:
            return obj.total_price
        return obj.calculate_total_price()


class BookingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating bookings."""
    
    class Meta:
        model = Booking
        fields = [
            'property', 'check_in', 'check_out', 'guests_count', 'special_requests'
        ]
    
    def validate(self, attrs):
        """Validate booking dates."""
        check_in = attrs.get('check_in')
        check_out = attrs.get('check_out')
        
        # Do not allow bookings that start in the past
        if check_in < date.today():
            raise serializers.ValidationError('Check-in date cannot be in the past.')

        if check_in >= check_out:
            raise serializers.ValidationError('Check-out date must be after check-in date.')
        
        # Validate property is available
        property_obj = attrs.get('property')
        if property_obj.status != 'approved':
            raise serializers.ValidationError('Property is not available for booking.')
        
        # Check if property is available for the requested dates
        if not property_obj.is_available_for_dates(check_in, check_out):
            raise serializers.ValidationError(
                'Property is not available for the selected dates. Please choose different dates.'
            )
        
        return attrs
    
    def create(self, validated_data):
        """Create booking with calculated total price."""
        validated_data['tenant'] = self.context['request'].user
        booking = Booking(**validated_data)
        booking.total_price = booking.calculate_total_price()
        booking.save()
        return booking
