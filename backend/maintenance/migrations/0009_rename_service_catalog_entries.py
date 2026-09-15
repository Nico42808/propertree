from django.db import migrations


SERVICE_RENAMES = {
    'Appliance repair': {
        'name': 'Property Management Abo',
        'description': 'Ongoing property management support for regular checks, coordination and day-to-day assistance.',
    },
    'Turnover cleaning': {
        'name': 'Arrival Preparation',
        'description': 'We prepare your property before your arrival so everything is ready when you get there.',
    },
    'Contractor management': {
        'name': 'Fridge Refill',
        'description': 'Have your fridge stocked with essentials before you arrive at your property.',
    },
}


def rename_services(apps, schema_editor):
    ServiceCatalog = apps.get_model('maintenance', 'ServiceCatalog')

    for old_name, updates in SERVICE_RENAMES.items():
        ServiceCatalog.objects.filter(name=old_name).update(
            name=updates['name'],
            description=updates['description'],
        )


def reverse_rename_services(apps, schema_editor):
    ServiceCatalog = apps.get_model('maintenance', 'ServiceCatalog')

    reverse_map = {
        'Property Management Abo': {
            'name': 'Appliance repair',
            'description': 'Repair of household appliances such as fridge, washer, dryer and oven.',
        },
        'Arrival Preparation': {
            'name': 'Turnover cleaning',
            'description': 'Full property cleaning between guest stays, including linens, bathrooms, kitchen and common areas.',
        },
        'Fridge Refill': {
            'name': 'Contractor management',
            'description': 'Coordination and oversight of third-party contractors for property works.',
        },
    }

    for current_name, updates in reverse_map.items():
        ServiceCatalog.objects.filter(name=current_name).update(
            name=updates['name'],
            description=updates['description'],
        )


class Migration(migrations.Migration):

    dependencies = [
        ('maintenance', '0008_alter_maintenancerequest_category'),
    ]

    operations = [
        migrations.RunPython(rename_services, reverse_rename_services),
    ]
