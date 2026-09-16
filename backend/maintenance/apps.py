from django.apps import AppConfig
from django.db.models.signals import post_migrate


SERVICE_NAME = 'Property Photography & Drone Shots'
SERVICE_DESCRIPTION = (
    'Professional interior, exterior and aerial drone photography for sales listings, '
    'marketing campaigns and property documentation, subject to weather and local flight rules.'
)


def ensure_photography_service(sender, apps, **kwargs):
    """Keep the photography service as a real, active catalog item.

    Using a real ServiceCatalog row means it appears in All Services and can be
    booked through the exact same service-booking workflow as every other item.
    This also repairs the row after future data resets whenever migrations run.
    """
    ServiceCatalog = apps.get_model('maintenance', 'ServiceCatalog')

    service = ServiceCatalog.objects.filter(name__iexact=SERVICE_NAME).first()
    if service is None:
        service = ServiceCatalog.objects.filter(name__iexact='Mid-stay cleaning').first()

    if service is None:
        ServiceCatalog.objects.create(
            name=SERVICE_NAME,
            category='other',
            description=SERVICE_DESCRIPTION,
            price=25,
            estimated_duration_minutes=120,
            icon='camera',
            is_active=True,
        )
        return

    service.name = SERVICE_NAME
    service.category = 'other'
    service.description = SERVICE_DESCRIPTION
    service.price = service.price or 25
    service.estimated_duration_minutes = 120
    service.icon = 'camera'
    service.is_active = True
    service.save(
        update_fields=[
            'name',
            'category',
            'description',
            'price',
            'estimated_duration_minutes',
            'icon',
            'is_active',
        ]
    )

    ServiceCatalog.objects.filter(name__iexact='Mid-stay cleaning').exclude(pk=service.pk).delete()


class MaintenanceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'maintenance'

    def ready(self):
        post_migrate.connect(
            ensure_photography_service,
            sender=self,
            dispatch_uid='maintenance.ensure_photography_service',
        )
