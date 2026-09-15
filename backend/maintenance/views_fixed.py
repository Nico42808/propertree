"""Targeted fixes for maintenance views.

These subclasses correct outdated ORM field paths without duplicating the
larger service-booking view implementation.
"""

from .models import MaintenanceRequest, MaintenanceSchedule
from .views import (
    MaintenanceRequestListCreateView as BaseMaintenanceRequestListCreateView,
    MaintenanceRequestDetailView as BaseMaintenanceRequestDetailView,
    MaintenanceScheduleListCreateView as BaseMaintenanceScheduleListCreateView,
)


class MaintenanceRequestListCreateView(BaseMaintenanceRequestListCreateView):
    """List maintenance requests using the current Property ownership fields."""

    def get_queryset(self):
        user = self.request.user

        if user.is_landlord():
            return MaintenanceRequest.objects.filter(rental_property__landlord=user)
        if user.is_tenant():
            return MaintenanceRequest.objects.filter(reported_by=user)
        if user.is_admin_user():
            return MaintenanceRequest.objects.all()

        return MaintenanceRequest.objects.none()


class MaintenanceRequestDetailView(BaseMaintenanceRequestDetailView):
    """Retrieve/update maintenance requests using current ownership fields."""

    def get_queryset(self):
        user = self.request.user

        if user.is_landlord():
            return MaintenanceRequest.objects.filter(rental_property__landlord=user)
        if user.is_tenant():
            return MaintenanceRequest.objects.filter(reported_by=user)
        if user.is_admin_user():
            return MaintenanceRequest.objects.all()

        return MaintenanceRequest.objects.none()


class MaintenanceScheduleListCreateView(BaseMaintenanceScheduleListCreateView):
    """List schedules for the authenticated landlord's properties."""

    def get_queryset(self):
        user = self.request.user

        if user.is_landlord():
            return MaintenanceSchedule.objects.filter(rental_property__landlord=user)
        if user.is_admin_user():
            return MaintenanceSchedule.objects.all()

        return MaintenanceSchedule.objects.none()
