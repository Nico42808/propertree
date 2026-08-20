"""
Views for Maintenance app.
"""

import logging

from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from rest_framework import generics, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

logger = logging.getLogger(__name__)

from .models import (
    MaintenanceRequest,
    ServiceProvider,
    MaintenanceSchedule,
    ServiceCatalog,
)

from .serializers import (
    MaintenanceRequestSerializer,
    ServiceProviderSerializer,
    MaintenanceScheduleSerializer,
    ServiceCatalogSerializer,
)


# ============================================================
# Maintenance Requests
# ============================================================

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

        return MaintenanceRequest.objects.none()

    def perform_create(self, serializer):
        """Create maintenance request with current user as reporter."""
        serializer.save(reported_by=self.request.user)


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

        return MaintenanceRequest.objects.none()


# ============================================================
# Service Providers
# ============================================================

class ServiceProviderListView(generics.ListAPIView):
    """API endpoint for listing active service providers."""

    queryset = ServiceProvider.objects.filter(is_active=True)
    serializer_class = ServiceProviderSerializer
    permission_classes = [IsAuthenticated]


# ============================================================
# Maintenance Schedules
# ============================================================

class MaintenanceScheduleListCreateView(generics.ListCreateAPIView):
    """API endpoint for maintenance schedules."""

    serializer_class = MaintenanceScheduleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return maintenance schedules for user's properties."""
        if self.request.user.is_landlord():
            return MaintenanceSchedule.objects.filter(
                property__owner=self.request.user
            )

        return MaintenanceSchedule.objects.all()


# ============================================================
# Service Catalog
# ============================================================

class ServiceCatalogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for service catalog.

    Landlords can view available services.
    Admins can manage services through Django Admin.
    """

    queryset = ServiceCatalog.objects.filter(is_active=True)
    serializer_class = ServiceCatalogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return active services, optionally filtered by category."""
        queryset = super().get_queryset()

        category = self.request.query_params.get("category")

        if category:
            queryset = queryset.filter(category=category)

        return queryset

    @action(detail=False, methods=["get"])
    def categories(self, request):
        """Return list of available service categories."""

        categories = [
            {
                "value": choice[0],
                "label": choice[1],
            }
            for choice in ServiceCatalog.CATEGORY_CHOICES
        ]

        return Response(categories)


# ============================================================
# Service Bookings
# ============================================================

class ServiceBookingViewSet(viewsets.ModelViewSet):
    """
    API endpoint for service bookings.

    Service bookings are maintenance requests created
    from the Propertree service catalog.
    """

    queryset = (
        MaintenanceRequest.objects
        .exclude(service_catalog__isnull=True)
        .select_related(
            "rental_property",
            "reported_by",
            "service_catalog",
            "assigned_to",
        )
    )

    serializer_class = MaintenanceRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return service bookings based on user role."""

        user = self.request.user
        base_queryset = super().get_queryset()

        if hasattr(user, "role"):

            if user.role == "landlord":
                return base_queryset.filter(
                    rental_property__landlord=user
                )

            elif user.role == "admin":
                return base_queryset.all()

        return base_queryset.none()

    def perform_create(self, serializer):
        """
        Create service booking and notify Propertree
        by email.
        """

        booking = serializer.save(
            reported_by=self.request.user
        )

        landlord = self.request.user
        property_obj = booking.rental_property
        service = booking.service_catalog

        # ----------------------------------------------------
        # Email notification – to admin AND to the landlord
        # ----------------------------------------------------

        admin_subject = (
            f"New Propertree Service Request – {service.name}"
        )

        admin_message = f"""
A new service request has been submitted through Propertree.

Owner:
{landlord.email}

Asset:
{property_obj.title}

Service:
{service.name}

Requested date:
{booking.requested_date}

Priority:
{booking.priority}

Description:
{booking.description}

Please review the request in the Propertree Admin Dashboard.
"""

        # NOTE: the setting is called ADMIN_NOTIFICATION_EMAIL in
        # propertree/settings.py — using the wrong name here meant
        # this was always None and no email was ever sent.
        admin_notification_email = getattr(
            settings,
            "ADMIN_NOTIFICATION_EMAIL",
            None,
        )

        if admin_notification_email:
            try:
                send_mail(
                    admin_subject,
                    admin_message,
                    settings.DEFAULT_FROM_EMAIL,
                    [admin_notification_email],
                    fail_silently=False,
                )
            except Exception:
                # Don't let a broken/misconfigured mail server fail the
                # booking itself — the request is already saved. Log it
                # so it's visible in Render's logs for debugging.
                logger.exception(
                    "Failed to send admin notification email for booking %s",
                    booking.id,
                )

        # Confirmation email to the landlord who submitted the request
        landlord_subject = (
            f"Your Propertree service request has been received – {service.name}"
        )

        landlord_message = f"""
Hi {landlord.first_name or landlord.email},

We've received your service request and it's now being reviewed by our admin team.

Asset:
{property_obj.title}

Service:
{service.name}

Requested date:
{booking.requested_date}

Priority:
{booking.priority}

Description:
{booking.description}

You'll get another notification as soon as it's confirmed and a service
provider has been assigned.

— Propertree
"""

        if landlord.email:
            try:
                send_mail(
                    landlord_subject,
                    landlord_message,
                    settings.DEFAULT_FROM_EMAIL,
                    [landlord.email],
                    fail_silently=False,
                )
            except Exception:
                logger.exception(
                    "Failed to send landlord confirmation email for booking %s",
                    booking.id,
                )

    # --------------------------------------------------------
    # Pending bookings
    # --------------------------------------------------------

    @action(detail=False, methods=["get"])
    def pending(self, request):
        """Get pending service bookings for admin review."""

        try:

            if (
                not hasattr(request.user, "role")
                or request.user.role != "admin"
            ):
                return Response(
                    {
                        "error": "Admin access required"
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            pending_bookings = (
                self.get_queryset()
                .filter(
                    status="open",
                    admin_confirmed_at__isnull=True,
                )
                .select_related(
                    "rental_property",
                    "reported_by",
                    "service_catalog",
                    "assigned_to",
                )
            )

            serializer = self.get_serializer(
                pending_bookings,
                many=True,
            )

            return Response(serializer.data)

        except Exception as exc:

            return Response(
                {
                    "error": str(exc)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # --------------------------------------------------------
    # Confirm booking
    # --------------------------------------------------------

    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        """Admin confirms service booking."""

        if (
            not hasattr(request.user, "role")
            or request.user.role != "admin"
        ):
            return Response(
                {
                    "error": "Admin access required"
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        booking = self.get_object()

        if booking.status != "open":
            return Response(
                {
                    "error": "Booking has already been processed"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking.status = "assigned"
        booking.admin_confirmed_by = request.user
        booking.admin_confirmed_at = timezone.now()

        provider_id = request.data.get(
            "service_provider_id"
        )

        if provider_id:

            try:

                provider = ServiceProvider.objects.get(
                    id=provider_id,
                    is_active=True,
                )

                booking.assigned_to = provider
                booking.assigned_at = timezone.now()

            except ServiceProvider.DoesNotExist:

                return Response(
                    {
                        "error": "Service provider not found"
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

        booking.save()

        serializer = self.get_serializer(booking)

        return Response(
            {
                "message": (
                    "Service booking confirmed successfully"
                ),
                "booking": serializer.data,
            }
        )

    # --------------------------------------------------------
    # Reject booking
    # --------------------------------------------------------

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        """Admin rejects service booking."""

        if (
            not hasattr(request.user, "role")
            or request.user.role != "admin"
        ):
            return Response(
                {
                    "error": "Admin access required"
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        booking = self.get_object()

        reason = request.data.get(
            "reason",
            "",
        )

        if not reason:

            return Response(
                {
                    "error": "Rejection reason is required"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking.status = "cancelled"
        booking.admin_rejection_reason = reason
        booking.resolution_notes = (
            f"Rejected by admin: {reason}"
        )

        booking.save()

        serializer = self.get_serializer(booking)

        return Response(
            {
                "message": "Service booking rejected",
                "booking": serializer.data,
            }
        )

    # --------------------------------------------------------
    # Statistics
    # --------------------------------------------------------

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """
        Get service booking statistics
        for landlord dashboard.
        """

        user = request.user

        if (
            not hasattr(user, "role")
            or user.role not in ["landlord", "admin"]
        ):
            return Response(
                {
                    "error": "Access denied"
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if user.role == "landlord":

            bookings = self.get_queryset().filter(
                rental_property__landlord=user
            )

        else:

            bookings = self.get_queryset()

        total_bookings = bookings.count()

        pending_bookings = bookings.filter(
            status="open",
            admin_confirmed_at__isnull=True,
        ).count()

        confirmed_bookings = bookings.filter(
            admin_confirmed_at__isnull=False
        ).count()

        completed_bookings = bookings.filter(
            status="resolved"
        ).count()

        # ----------------------------------------------------
        # Monthly cost
        # ----------------------------------------------------

        from django.db.models import Sum
        from datetime import datetime

        current_month = datetime.now().month
        current_year = datetime.now().year

        monthly_cost = (
            bookings
            .filter(
                status="resolved",
                resolved_at__month=current_month,
                resolved_at__year=current_year,
                cost__isnull=False,
            )
            .aggregate(
                total=Sum("cost")
            )["total"]
            or 0
        )

        return Response(
            {
                "total_bookings": total_bookings,
                "pending": pending_bookings,
                "confirmed": confirmed_bookings,
                "completed": completed_bookings,
                "monthly_cost": float(monthly_cost),
            }
        )
