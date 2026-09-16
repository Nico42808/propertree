from django.db import migrations


OLD_NAME = 'Mid-stay cleaning'
NEW_NAME = 'Property Photography & Drone Shots'
NEW_DESCRIPTION = (
    'Professional interior, exterior and aerial drone photography for sales listings, '
    'marketing campaigns and property documentation, subject to weather and local flight rules.'
)


def replace_service(apps, schema_editor):
    ServiceCatalog = apps.get_model('maintenance', 'ServiceCatalog')
    ServiceCatalog.objects.filter(name=OLD_NAME).update(
        name=NEW_NAME,
        category='other',
        description=NEW_DESCRIPTION,
        estimated_duration_minutes=120,
        icon='camera',
    )


def restore_service(apps, schema_editor):
    ServiceCatalog = apps.get_model('maintenance', 'ServiceCatalog')
    ServiceCatalog.objects.filter(name=NEW_NAME).update(
        name=OLD_NAME,
        category='cleaning',
        description=(
            'Light clean during an ongoing stay, focusing on high-traffic areas '
            'and refresh of essentials.'
        ),
        estimated_duration_minutes=90,
        icon='sparkles',
    )


class Migration(migrations.Migration):

    dependencies = [
        ('maintenance', '0009_rename_service_catalog_entries'),
    ]

    operations = [
        migrations.RunPython(replace_service, restore_service),
    ]
