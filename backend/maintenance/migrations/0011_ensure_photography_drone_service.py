from django.db import migrations


SERVICE_NAME = 'Property Photography & Drone Shots'
SERVICE_DESCRIPTION = (
    'Professional interior, exterior and aerial drone photography for sales listings, '
    'marketing campaigns and property documentation, subject to weather and local flight rules.'
)


def ensure_photography_service(apps, schema_editor):
    ServiceCatalog = apps.get_model('maintenance', 'ServiceCatalog')

    existing = ServiceCatalog.objects.filter(name__iexact=SERVICE_NAME).first()
    if existing:
        existing.name = SERVICE_NAME
        existing.category = 'other'
        existing.description = SERVICE_DESCRIPTION
        existing.estimated_duration_minutes = 120
        existing.icon = 'camera'
        existing.is_active = True
        existing.save(
            update_fields=[
                'name',
                'category',
                'description',
                'estimated_duration_minutes',
                'icon',
                'is_active',
            ]
        )
        return

    legacy = ServiceCatalog.objects.filter(name__iexact='Mid-stay cleaning').first()
    if legacy:
        legacy.name = SERVICE_NAME
        legacy.category = 'other'
        legacy.description = SERVICE_DESCRIPTION
        legacy.estimated_duration_minutes = 120
        legacy.icon = 'camera'
        legacy.is_active = True
        legacy.save(
            update_fields=[
                'name',
                'category',
                'description',
                'estimated_duration_minutes',
                'icon',
                'is_active',
            ]
        )
        return

    ServiceCatalog.objects.create(
        name=SERVICE_NAME,
        category='other',
        description=SERVICE_DESCRIPTION,
        price=25,
        estimated_duration_minutes=120,
        icon='camera',
        is_active=True,
    )


def reverse_noop(apps, schema_editor):
    # This is a corrective migration; keep the service in place on reverse.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('maintenance', '0010_replace_mid_stay_cleaning_with_photography'),
    ]

    operations = [
        migrations.RunPython(ensure_photography_service, reverse_noop),
    ]
