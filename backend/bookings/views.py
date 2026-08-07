"""
Simplified views for Bookings app.
"""
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.core.mail import send_mail
from django.conf import settings

from .models import Booking
from .serializers import (
    BookingListSerializer,
    BookingDetailSerializer,
    BookingCreateSerializer
)


def notify_tenant_booking_status(booking, new_status):
    """Email the tenant when their booking is confirmed or rejected."""
    tenant = booking.tenant
    if not tenant.email:
        return

    if new_status == 'confirmed':
        subject = f"Booking confirmed – {booking.property.title}"
        message = (
            f"Hi {tenant.email},\n\n"
            f"Good news — your booking has been confirmed.\n\n"
            f"Property: {booking.property.title}\n"
            f"Check-in: {booking.check_in}\n"
            f"Check-out: {booking.check_out}\n"
            f"Guests: {booking.guests_count}\n\n"
            f"We look forward to hosting you."
        )
    else:
        subject = f"Booking update – {booking.property.title}"
        message = (
            f"Hi {tenant.email},\n\n"
            f"Unfortunately your booking request could not be confirmed.\n\n"
            f"Property: {booking.property.title}\n"
            f"Check-in: {booking.check_in}\n"
            f"Check-out: {booking.check_out}\n\n"
            f"Feel free to browse other available properties on Propertree."
        )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[tenant.email],
        fail_silently=True,
    )


class TenantBookingListView(generics.ListAPIView):
    """
    API endpoint for tenants to view their bookings.
    """
    
    serializer_class = BookingListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return bookings made by the current tenant."""
        return Booking.objects.filter(tenant=self.request.user).order_by('-created_at')


class TenantBookingDetailView(generics.RetrieveAPIView):
    """
    API endpoint for tenants to view a specific booking.
    """
    
    serializer_class = BookingDetailSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return bookings made by the current tenant."""
        return Booking.objects.filter(tenant=self.request.user)


class TenantBookingCreateView(generics.CreateAPIView):
    """
    API endpoint for tenants to create new bookings.
    """
    
    serializer_class = BookingCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        booking = serializer.save(tenant=self.request.user)
        self.notify_landlord(booking)
        self.notify_tenant(booking)
        self.notify_admin(booking)

    def notify_landlord(self, booking):
        landlord = booking.property.landlord
        if not landlord.email:
            return
        send_mail(
            subject=f"New booking request – {booking.property.title}",
            message=(
                f"You have a new booking request.\n\n"
                f"Property: {booking.property.title}\n"
                f"Tenant: {booking.tenant.email}\n"
                f"Check-in: {booking.check_in}\n"
                f"Check-out: {booking.check_out}\n"
                f"Guests: {booking.guests_count}\n\n"
                f"Log in to Propertree to confirm or reject this booking."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[landlord.email],
            fail_silently=True,
        )

    def notify_tenant(self, booking):
        tenant = booking.tenant
        if not tenant.email:
            return
        send_mail(
            subject=f"Booking request received – {booking.property.title}",
            message=(
                f"Hi {tenant.email},\n\n"
                f"We received your booking request for:\n\n"
                f"Property: {booking.property.title}\n"
                f"Check-in: {booking.check_in}\n"
                f"Check-out: {booking.check_out}\n"
                f"Guests: {booking.guests_count}\n\n"
                f"The landlord will confirm or reject it shortly. "
                f"We'll email you again once there's an update."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[tenant.email],
            fail_silently=True,
        )

    def notify_admin(self, booking):
        if not settings.ADMIN_NOTIFICATION_EMAIL:
            return
        send_mail(
            subject=f"[Admin] New booking – {booking.property.title}",
            message=(
                f"New booking created on Propertree.\n\n"
                f"Property: {booking.property.title}\n"
                f"Landlord: {booking.property.landlord.email}\n"
                f"Tenant: {booking.tenant.email}\n"
                f"Check-in: {booking.check_in}\n"
                f"Check-out: {booking.check_out}\n"
                f"Guests: {booking.guests_count}"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.ADMIN_NOTIFICATION_EMAIL],
            fail_silently=True,
        )


class TenantBookingCancelView(APIView):
    """
    API endpoint for tenants to cancel their bookings.
    """
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        """Cancel a booking with reason."""
        try:
            booking = Booking.objects.get(pk=pk, tenant=request.user)
            
            if booking.status in ['cancelled', 'completed']:
                return Response(
                    {'error': 'Cannot cancel this booking'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            cancellation_reason = request.data.get('cancellation_reason', '').strip()
            if not cancellation_reason:
                return Response(
                    {'error': 'Cancellation reason is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            booking.cancel(reason=cancellation_reason)
            
            return Response({
                'message': 'Booking cancelled successfully',
                'booking': BookingDetailSerializer(booking).data
            }, status=status.HTTP_200_OK)
            
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class LandlordBookingListView(generics.ListAPIView):
    """
    API endpoint for landlords to view bookings for their properties.
    Shows all bookings for properties owned by the landlord, regardless of approval type.
    """

    serializer_class = BookingListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return bookings for all properties owned by the current landlord."""
        return Booking.objects.filter(
            property__landlord=self.request.user
        ).order_by('-created_at')


class LandlordBookingDetailView(generics.RetrieveAPIView):
    """
    API endpoint for landlords to view booking details for their properties.
    Shows all bookings for properties owned by the landlord, regardless of approval type.
    """

    serializer_class = BookingDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return bookings for all properties owned by the current landlord."""
        return Booking.objects.filter(
            property__landlord=self.request.user
        )


class LandlordBookingConfirmView(APIView):
    """
    API endpoint for landlords to confirm bookings for properties with landlord approval type.
    Landlords can only confirm bookings for properties with landlord approval type.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """Confirm a booking."""
        try:
            booking = Booking.objects.get(
                pk=pk,
                property__landlord=request.user
            )
            
            # Check if landlord can confirm this booking (only for landlord approval type)
            if booking.property.approval_type != 'landlord':
                return Response(
                    {'error': 'Only bookings for properties with landlord approval can be confirmed by landlords'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if booking.status != 'pending':
                return Response(
                    {'error': 'Only pending bookings can be confirmed'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            booking.confirm()
            notify_tenant_booking_status(booking, 'confirmed')
            
            return Response({
                'message': 'Booking confirmed successfully',
                'booking': BookingDetailSerializer(booking).data
            }, status=status.HTTP_200_OK)
            
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class LandlordBookingRejectView(APIView):
    """
    API endpoint for landlords to reject/cancel bookings for properties with landlord approval type.
    Landlords can only reject bookings for properties with landlord approval type.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """Reject a booking."""
        try:
            booking = Booking.objects.get(
                pk=pk,
                property__landlord=request.user
            )
            
            # Check if landlord can reject this booking (only for landlord approval type)
            if booking.property.approval_type != 'landlord':
                return Response(
                    {'error': 'Only bookings for properties with landlord approval can be rejected by landlords'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if booking.status in ['cancelled', 'completed']:
                return Response(
                    {'error': 'Cannot reject this booking'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            booking.cancel()
            notify_tenant_booking_status(booking, 'cancelled')
            
            return Response({
                'message': 'Booking rejected',
                'booking': BookingDetailSerializer(booking).data
            }, status=status.HTTP_200_OK)
            
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class BookingStatusUpdateView(APIView):
    """
    Unified API endpoint for updating booking status.
    Used by landlords to confirm/cancel bookings for properties with landlord approval type.
    Landlords can view all bookings but can only update bookings for properties with landlord approval type.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """Update booking status."""
        try:
            booking = Booking.objects.get(
                pk=pk,
                property__landlord=request.user
            )
            
            # Check if landlord can update this booking (only for landlord approval type)
            if booking.property.approval_type != 'landlord':
                return Response(
                    {'error': 'Only bookings for properties with landlord approval can be updated by landlords'},
                    status=status.HTTP_403_FORBIDDEN
                )
            new_status = request.data.get('status')

            if not new_status:
                return Response(
                    {'error': 'Status is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate status
            valid_statuses = ['pending', 'confirmed', 'cancelled', 'completed']
            if new_status not in valid_statuses:
                return Response(
                    {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Update status based on new value
            if new_status == 'confirmed':
                if booking.status != 'pending':
                    return Response(
                        {'error': 'Only pending bookings can be confirmed'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                booking.confirm()
            elif new_status == 'cancelled':
                if booking.status in ['cancelled', 'completed']:
                    return Response(
                        {'error': 'Cannot cancel this booking'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                booking.cancel()
            else:
                booking.status = new_status
                booking.save()

            if new_status in ('confirmed', 'cancelled'):
                notify_tenant_booking_status(booking, new_status)

            return Response({
                'message': f'Booking status updated to {new_status}',
                'booking': BookingDetailSerializer(booking).data
            }, status=status.HTTP_200_OK)

        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class AdminBookingListView(generics.ListAPIView):
    """
    API endpoint for admins to view all bookings across all properties.
    """

    serializer_class = BookingListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return all bookings for admin users."""
        # Only allow admin users
        if not hasattr(self.request.user, 'role') or self.request.user.role != 'admin':
            return Booking.objects.none()

        # Return ALL bookings, not just admin-approval properties
        queryset = Booking.objects.select_related('property', 'tenant').order_by('-created_at')
        
        # Filter by country
        country_filter = self.request.query_params.get('country')
        if country_filter:
            queryset = queryset.filter(property__country=country_filter)
        
        # Filter by city
        city_filter = self.request.query_params.get('city')
        if city_filter:
            queryset = queryset.filter(property__city=city_filter)
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """Override list to add error handling."""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            from rest_framework.response import Response
            from rest_framework import status
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminBookingDetailView(generics.RetrieveAPIView):
    """
    API endpoint for admins to view booking details for admin-approval properties.
    """

    serializer_class = BookingDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return bookings for properties with admin approval type."""
        # Only allow admin users
        if self.request.user.role != 'admin':
            return Booking.objects.none()

        return Booking.objects.filter(property__approval_type='admin')


class AdminBookingConfirmView(APIView):
    """
    API endpoint for admins to confirm bookings for admin-approval properties.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """Confirm a booking."""
        # Check if user is admin
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only admins can confirm bookings for admin-approval properties'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            booking = Booking.objects.get(pk=pk, property__approval_type='admin')

            if booking.status != 'pending':
                return Response(
                    {'error': 'Only pending bookings can be confirmed'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            booking.confirm()
            notify_tenant_booking_status(booking, 'confirmed')

            return Response({
                'message': 'Booking confirmed successfully',
                'booking': BookingDetailSerializer(booking).data
            }, status=status.HTTP_200_OK)

        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found or not set for admin approval'},
                status=status.HTTP_404_NOT_FOUND
            )


class AdminBookingRejectView(APIView):
    """
    API endpoint for admins to reject/cancel bookings for admin-approval properties.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """Reject a booking."""
        # Check if user is admin
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only admins can reject bookings for admin-approval properties'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            booking = Booking.objects.get(pk=pk, property__approval_type='admin')

            if booking.status in ['cancelled', 'completed']:
                return Response(
                    {'error': 'Cannot reject this booking'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            booking.cancel()
            notify_tenant_booking_status(booking, 'cancelled')

            return Response({
                'message': 'Booking rejected',
                'booking': BookingDetailSerializer(booking).data
            }, status=status.HTTP_200_OK)

        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found or not set for admin approval'},
                status=status.HTTP_404_NOT_FOUND
            )
