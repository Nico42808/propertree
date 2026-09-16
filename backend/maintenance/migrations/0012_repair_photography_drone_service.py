from django.db import migrations


SERVICE_NAME = 'Property Photography & Drone Shots'
SERVICE_DESCRIPTION = (
    'Professional interior, exterior and aerial drone photography for sales listings, '
    'marketing campaigns and property documentation, subject to weather and local flight rules.'
)


def repair_photography_service(apps, schema_editor):
    ServiceCatalog = apps.get_model('maintenance', 'ServiceCatalog')

    # Reuse an existing catalog row whenever possible so the service keeps the
    # same booking relationship/ID pattern as every other catalog service.
    service = ServiceCatalog.objects.filter(name__iexact=SERVICE_NAME).first()

    if service is None:
        service = ServiceCatalog.objects.filter(name__iexact='Mid-stay cleaning').first()

    if service is None:
        service = ServiceCatalog.objects.create(
            name=SERVICE_NAME,
            category='other',
            description=SERVICE_DESCRIPTION,
            price=25,
            estimated_duration_minutes=120,
            icon='camera',
            is_active=True,
        )
    else:
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

    # Remove any leftover legacy duplicate so the shortcut always resolves to
    # exactly one real, bookable catalog item.
    ServiceCatalog.objects.filter(name__iexact='Mid-stay cleaning').exclude(pk=service.pk).delete()


def reverse_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('maintenance', '0011_ensure_photography_drone_service'),
    ]

    operations = [
        migrations.RunPython(repair_photography_service, reverse_noop),
    ]
