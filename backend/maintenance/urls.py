"""
URL configuration for Maintenance app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ServiceProviderListView,
    ServiceCatalogViewSet,
    ServiceBookingViewSet,
    MaintenanceImageDownloadView,
)
from .views_fixed import (
    MaintenanceRequestListCreateView,
    MaintenanceRequestDetailView,
    MaintenanceScheduleListCreateView,
)

# Create router for ViewSets
router = DefaultRouter()
router.register(r'service-catalog', ServiceCatalogViewSet, basename='service-catalog')
router.register(r'service-bookings', ServiceBookingViewSet, basename='service-bookings')

urlpatterns = [
    # Existing maintenance endpoints
    path('', MaintenanceRequestListCreateView.as_view(), name='maintenance_list_create'),
    path('<uuid:pk>/', MaintenanceRequestDetailView.as_view(), name='maintenance_detail'),
    path('providers/', ServiceProviderListView.as_view(), name='service_provider_list'),
    path('schedules/', MaintenanceScheduleListCreateView.as_view(), name='maintenance_schedule_list'),
    path('images/<uuid:pk>/download/', MaintenanceImageDownloadView.as_view(), name='maintenance_image_download'),

    # Service booking endpoints (router)
    path('', include(router.urls)),
]
