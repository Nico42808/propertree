"""
Views for Maintenance app.
"""
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import generics, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from .models import MaintenanceRequest, ServiceProvider, MaintenanceSchedule, ServiceCatalog
from .serializers import (
    MaintenanceRequestSerializer,
    ServiceProviderSerializer,
    MaintenanceScheduleSerializer,
    ServiceCatalogSerializer
)


class MaintenanceRequestListCreateView(generics.ListCreateAPIView):
    """API endpoint for listing and creating maintenance requests."""

    serializer_class = MaintenanceRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return maintenance requests based on user role."""
        user = self.request.user

        if user.is_landlord():
            return MaintenanceRequest.objects.filter(property__owner=user)
        elif user.is_tenant():
            return MaintenanceRequest.objects.filter(reported_by=user)
        elif user.is_admin_user():
            return MaintenanceRequest.objects.all()
        else:
            return MaintenanceRequest.objects.none()

    def perform_create(self, serializer):
        booking = serializer.save(reported_by=self.request.user)
        landlord = self.request.user
        property_obj = booking.rental_property
        service = booking.service_catalog

    subject = f"New Propertree Service Request – {service.name}"

    message = f"""
A new service request has been submitted through Propertree.

Owner:
{landlord.email}

Asset:
{property_obj.title}

Service:
{service.name}

Requested date:
{booking.requested_date}

Requested time:
{booking.requested_time}

Priority:
{booking.priority}

Description:
{booking.description}

Please review the request in the Propertree Admin Dashboard.
"""

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [settings.SERVICE_REQUEST_EMAIL],
        fail_silently=False,
    )

class MaintenanceRequestDetailView(generics.RetrieveUpdateAPIView):
    """API endpoint for maintenance request detail."""

    serializer_class = MaintenanceRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return maintenance requests user has access to."""
        user = self.request.user

        if user.is_landlord():
            return MaintenanceRequest.objects.filter(property__owner=user)
        elif user.is_tenant():
            return MaintenanceRequest.objects.filter(reported_by=user)
        elif user.is_admin_user():
            return MaintenanceRequest.objects.all()
        else:
            return MaintenanceRequest.objects.none()


class ServiceProviderListView(generics.ListAPIView):
    """API endpoint for listing service providers."""

    queryset = ServiceProvider.objects.filter(is_active=True)
    serializer_class = ServiceProviderSerializer
    permission_classes = [IsAuthenticated]


class MaintenanceScheduleListCreateView(generics.ListCreateAPIView):
    """API endpoint for maintenance schedules."""

    serializer_class = MaintenanceScheduleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return maintenance schedules for user's properties."""
        if self.request.user.is_landlord():
            return MaintenanceSchedule.objects.filter(property__owner=self.request.user)
        return MaintenanceSchedule.objects.all()


# ============= Service Booking Views =============

class ServiceCatalogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for service catalog.
    Landlords and tenants can view available services.
    Only admins can create/update services via Django admin.
    """
    queryset = ServiceCatalog.objects.filter(is_active=True)
    serializer_class = ServiceCatalogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return active services, optionally filtered by category."""
        queryset = super().get_queryset()
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        return queryset

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Return list of available service categories."""
        categories = [
            {'value': choice[0], 'label': choice[1]}
            for choice in ServiceCatalog.CATEGORY_CHOICES
        ]
        return Response(categories)


class ServiceBookingViewSet(viewsets.ModelViewSet):
    """
    API endpoint for service bookings (maintenance requests created from service catalog).
    """
    queryset = MaintenanceRequest.objects.exclude(service_catalog__isnull=True).select_related(
        'rental_property', 'reported_by', 'service_catalog', 'assigned_to'
    )
    serializer_class = MaintenanceRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return service bookings based on user role."""
        user = self.request.user
        base_queryset = super().get_queryset()

        if hasattr(user, 'role'):
            if user.role == 'landlord':
                return base_queryset.filter(rental_property__landlord=user)
            elif user.role == 'admin':
                return base_queryset.all()

        return base_queryset.none()

    def perform_create(self, serializer):
        """Create service booking with current user as reporter."""
        serializer.save(reported_by=self.request.user)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending service bookings (for admin review)."""
        try:
            if not hasattr(request.user, 'role') or request.user.role != 'admin':
                return Response(
                    {'error': 'Admin access required'},
                    status=status.HTTP_403_FORBIDDEN
                )

            pending_bookings = self.get_queryset().filter(
                status='open',
                admin_confirmed_at__isnull=True
            ).select_related(
                'rental_property',
                'reported_by',
                'service_catalog',
                'assigned_to'
            )

            serializer = self.get_serializer(pending_bookings, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Admin confirms service booking."""
        if not hasattr(request.user, 'role') or request.user.role != 'admin':
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )

        booking = self.get_object()

        if booking.status != 'open':
            return Response(
                {'error': 'Booking has already been processed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update booking status
        booking.status = 'assigned'
        booking.admin_confirmed_by = request.user
        booking.admin_confirmed_at = timezone.now()

        # Optionally assign service provider
        provider_id = request.data.get('service_provider_id')
        if provider_id:
            try:
                provider = ServiceProvider.objects.get(id=provider_id, is_active=True)
                booking.assigned_to = provider
                booking.assigned_at = timezone.now()
            except ServiceProvider.DoesNotExist:
                return Response(
                    {'error': 'Service provider not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

        booking.save()

        # TODO: Send notification to landlord about confirmation
        # This can be integrated with the communications app

        serializer = self.get_serializer(booking)
        return Response({
            'message': 'Service booking confirmed successfully',
            'booking': serializer.data
        })

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Admin rejects service booking."""
        if not hasattr(request.user, 'role') or request.user.role != 'admin':
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )

        booking = self.get_object()
        reason = request.data.get('reason', '')

        if not reason:
            return Response(
                {'error': 'Rejection reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking.status = 'cancelled'
        booking.admin_rejection_reason = reason
        booking.resolution_notes = f"Rejected by admin: {reason}"
        booking.save()

        # TODO: Send notification to landlord about rejection

        serializer = self.get_serializer(booking)
        return Response({
            'message': 'Service booking rejected',
            'booking': serializer.data
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get service booking statistics for landlord dashboard."""
        user = request.user

        if not hasattr(user, 'role') or user.role not in ['landlord', 'admin']:
            return Response(
                {'error': 'Access denied'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get bookings for the user
        if user.role == 'landlord':
            bookings = self.get_queryset().filter(rental_property__landlord=user)
        else:
            bookings = self.get_queryset()

        # Calculate stats
        total_bookings = bookings.count()
        pending_bookings = bookings.filter(
            status='open',
            admin_confirmed_at__isnull=True
        ).count()
        confirmed_bookings = bookings.filter(
            admin_confirmed_at__isnull=False
        ).count()
        completed_bookings = bookings.filter(status='resolved').count()

        # Calculate monthly cost (current month)
        from django.db.models import Sum
        from datetime import datetime
        current_month = datetime.now().month
        current_year = datetime.now().year

        monthly_cost = bookings.filter(
            status='resolved',
            resolved_at__month=current_month,
            resolved_at__year=current_year,
            cost__isnull=False
        ).aggregate(total=Sum('cost'))['total'] or 0

        return Response({
            'total_bookings': total_bookings,
            'pending': pending_bookings,
            'confirmed': confirmed_bookings,
            'completed': completed_bookings,
            'monthly_cost': float(monthly_cost)
        })
