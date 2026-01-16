"""
Script to populate the Service Catalog with sample services.
Run this script after migrating the database:
python manage.py shell < populate_service_catalog.py
OR
python populate_service_catalog.py
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'propertree.settings')
django.setup()

from maintenance.models import ServiceCatalog

# Unified service catalog for property operations.
# All services are currently priced at £25 (stored as 25.00).
SERVICES = [
    # Cleaning & Housekeeping
    {
        'name': 'Turnover cleaning',
        'category': 'cleaning',
        'description': 'Full property cleaning between guest stays, including linens, bathrooms, kitchen and common areas.',
        'price': 25,
        'estimated_duration_minutes': 180,
        'icon': 'sparkles',
    },
    {
        'name': 'Mid-stay cleaning',
        'category': 'cleaning',
        'description': 'Light clean during an ongoing stay, focusing on high-traffic areas and refresh of essentials.',
        'price': 25,
        'estimated_duration_minutes': 90,
        'icon': 'sparkles',
    },
    {
        'name': 'Deep cleaning',
        'category': 'cleaning',
        'description': 'Intensive deep clean of the entire property including inside appliances and hard-to-reach areas.',
        'price': 25,
        'estimated_duration_minutes': 240,
        'icon': 'sparkles',
    },
    {
        'name': 'Housekeeping',
        'category': 'cleaning',
        'description': 'Regular housekeeping service including tidying, surface cleaning and linen refresh.',
        'price': 25,
        'estimated_duration_minutes': 120,
        'icon': 'broom',
    },

    # Maintenance & Repairs
    {
        'name': 'Maintenance',
        'category': 'general_maintenance',
        'description': 'General maintenance visit for small fixes and routine checks around the property.',
        'price': 25,
        'estimated_duration_minutes': 60,
        'icon': 'wrench',
    },
    {
        'name': 'Preventive maintenance',
        'category': 'general_maintenance',
        'description': 'Scheduled preventive checks to reduce breakdowns and extend asset life (e.g. filters, seals, wear items).',
        'price': 25,
        'estimated_duration_minutes': 90,
        'icon': 'shield-check',
    },
    {
        'name': 'Repair service',
        'category': 'general_maintenance',
        'description': 'Generic repair visit for minor issues reported by guests or owners.',
        'price': 25,
        'estimated_duration_minutes': 90,
        'icon': 'wrench',
    },
    {
        'name': 'Handyman service',
        'category': 'carpentry',
        'description': 'Handyman tasks such as mounting, patching, furniture assembly and small carpentry jobs.',
        'price': 25,
        'estimated_duration_minutes': 120,
        'icon': 'hammer',
    },
    {
        'name': 'Plumbing repair',
        'category': 'plumbing',
        'description': 'Plumbing repairs such as leaks, blockages and fixture issues.',
        'price': 25,
        'estimated_duration_minutes': 90,
        'icon': 'droplets',
    },
    {
        'name': 'Electrical repair',
        'category': 'electrical',
        'description': 'Electrical troubleshooting and repair for outlets, lights and circuits.',
        'price': 25,
        'estimated_duration_minutes': 90,
        'icon': 'zap',
    },
    {
        'name': 'Appliance repair',
        'category': 'appliance',
        'description': 'Repair of household appliances such as fridge, washer, dryer and oven.',
        'price': 25,
        'estimated_duration_minutes': 120,
        'icon': 'settings',
    },
    {
        'name': 'HVAC service',
        'category': 'hvac',
        'description': 'Heating and cooling system inspection, cleaning and basic servicing.',
        'price': 25,
        'estimated_duration_minutes': 120,
        'icon': 'wind',
    },
    {
        'name': '24/7 emergency service',
        'category': 'general_maintenance',
        'description': 'Round-the-clock emergency response for urgent property issues.',
        'price': 25,
        'estimated_duration_minutes': 60,
        'icon': 'alarm-bell',
    },
    {
        'name': 'On-call technician',
        'category': 'general_maintenance',
        'description': 'Technician on standby to respond rapidly to issues as they arise.',
        'price': 25,
        'estimated_duration_minutes': 60,
        'icon': 'phone-call',
    },

    # Painting
    {
        'name': 'Interior painting',
        'category': 'painting',
        'description': 'Prep and paint interior walls, ceilings and trim for a refreshed finish.',
        'price': 25,
        'estimated_duration_minutes': 240,
        'icon': 'paintbrush',
    },
    {
        'name': 'Touch-up painting',
        'category': 'painting',
        'description': 'Minor patch and touch-up work for scuffs, chips and wear.',
        'price': 25,
        'estimated_duration_minutes': 90,
        'icon': 'paintbrush',
    },

    # Pest Control
    {
        'name': 'Pest inspection',
        'category': 'pest_control',
        'description': 'Inspection for pests and entry points with a recommended treatment plan.',
        'price': 25,
        'estimated_duration_minutes': 60,
        'icon': 'bug',
    },
    {
        'name': 'Pest treatment',
        'category': 'pest_control',
        'description': 'Targeted treatment for common household pests with follow-up guidance.',
        'price': 25,
        'estimated_duration_minutes': 120,
        'icon': 'bug',
    },

    # Inspections & Safety
    {
        'name': 'Property inspection',
        'category': 'general_maintenance',
        'description': 'Comprehensive inspection of the property condition with documented findings.',
        'price': 25,
        'estimated_duration_minutes': 90,
        'icon': 'clipboard-list',
    },
    {
        'name': 'Safety inspection',
        'category': 'general_maintenance',
        'description': 'Safety-focused inspection covering hazards, access, lighting and emergency routes.',
        'price': 25,
        'estimated_duration_minutes': 90,
        'icon': 'shield',
    },
    {
        'name': 'Fire safety check',
        'category': 'general_maintenance',
        'description': 'Check of fire extinguishers, exits and basic fire safety equipment.',
        'price': 25,
        'estimated_duration_minutes': 60,
        'icon': 'flame',
    },
    {
        'name': 'Smoke detector check',
        'category': 'general_maintenance',
        'description': 'Test and basic maintenance of smoke and CO detectors.',
        'price': 25,
        'estimated_duration_minutes': 45,
        'icon': 'alarm-smoke',
    },

    # Outdoor & Seasonal
    {
        'name': 'Garden maintenance',
        'category': 'gardening',
        'description': 'Ongoing garden and outdoor area maintenance including mowing and trimming.',
        'price': 25,
        'estimated_duration_minutes': 120,
        'icon': 'leaf',
    },
    {
        'name': 'Snow removal',
        'category': 'general_maintenance',
        'description': 'Snow and ice removal from access paths, driveways and entrances.',
        'price': 25,
        'estimated_duration_minutes': 90,
        'icon': 'snowflake',
    },

    # Access & Smart Locks
    {
        'name': 'Key exchange',
        'category': 'locksmith',
        'description': 'In-person key handover between guests, tenants and hosts.',
        'price': 25,
        'estimated_duration_minutes': 30,
        'icon': 'key',
    },
    {
        'name': 'Key handover',
        'category': 'locksmith',
        'description': 'Organised key handover at check-in or check-out with identity confirmation.',
        'price': 25,
        'estimated_duration_minutes': 30,
        'icon': 'key-round',
    },
    {
        'name': 'Smart lock installation',
        'category': 'locksmith',
        'description': 'Installation and setup of smart locks at the property.',
        'price': 25,
        'estimated_duration_minutes': 90,
        'icon': 'lock',
    },
    {
        'name': 'Smart lock management',
        'category': 'locksmith',
        'description': 'Ongoing management of smart lock codes and digital access.',
        'price': 25,
        'estimated_duration_minutes': 30,
        'icon': 'lock-open',
    },

    # Guest Experience & Mobility
    {
        'name': 'Fridge stocking',
        'category': 'other',
        'description': 'Pre-arrival grocery and essentials stocking based on guest preferences.',
        'price': 25,
        'estimated_duration_minutes': 60,
        'icon': 'shopping-basket',
    },
    {
        'name': 'Airport transfer',
        'category': 'other',
        'description': 'Organised transport between the property and the nearest airport.',
        'price': 25,
        'estimated_duration_minutes': 60,
        'icon': 'car',
    },
    {
        'name': 'Chauffeur service',
        'category': 'other',
        'description': 'Private driver service for guests or owners during their stay.',
        'price': 25,
        'estimated_duration_minutes': 120,
        'icon': 'steering-wheel',
    },
    {
        'name': 'Car rental',
        'category': 'other',
        'description': 'Coordination of car hire for guests or owners.',
        'price': 25,
        'estimated_duration_minutes': 30,
        'icon': 'car-front',
    },
    {
        'name': 'Bike rental',
        'category': 'other',
        'description': 'Arrangement of bicycle rentals for guests.',
        'price': 25,
        'estimated_duration_minutes': 30,
        'icon': 'bike',
    },
    {
        'name': 'Equipment rental',
        'category': 'other',
        'description': 'Rental of additional equipment such as cots, high chairs or sports gear.',
        'price': 25,
        'estimated_duration_minutes': 30,
        'icon': 'package',
    },
    {
        'name': 'Workspace setup',
        'category': 'other',
        'description': 'Prepare a dedicated workspace with desk, chair and connectivity for remote work.',
        'price': 25,
        'estimated_duration_minutes': 60,
        'icon': 'laptop',
    },

    # Operations & Management
    {
        'name': 'Contractor management',
        'category': 'general_maintenance',
        'description': 'Coordination and oversight of third-party contractors for property works.',
        'price': 25,
        'estimated_duration_minutes': 60,
        'icon': 'users',
    },
    {
        'name': 'Dynamic pricing',
        'category': 'other',
        'description': 'Setup and optimisation of dynamic nightly rates across booking channels.',
        'price': 25,
        'estimated_duration_minutes': 60,
        'icon': 'line-chart',
    },
    {
        'name': 'Revenue management',
        'category': 'other',
        'description': 'Ongoing analysis and optimisation of property revenue performance.',
        'price': 25,
        'estimated_duration_minutes': 90,
        'icon': 'bar-chart-3',
    },
    {
        'name': 'Yield management',
        'category': 'other',
        'description': 'Strategic control of occupancy and pricing to maximise yield.',
        'price': 25,
        'estimated_duration_minutes': 90,
        'icon': 'percent',
    },
    {
        'name': 'Booking calendar sync',
        'category': 'other',
        'description': 'Setup and monitoring of channel calendar sync to avoid double bookings.',
        'price': 25,
        'estimated_duration_minutes': 45,
        'icon': 'calendar-sync',
    },
    {
        'name': 'Multilingual support',
        'category': 'other',
        'description': 'Guest communication support in multiple languages.',
        'price': 25,
        'estimated_duration_minutes': 60,
        'icon': 'languages',
    },

    # Risk, Compliance & Identity
    {
        'name': 'Damage reporting',
        'category': 'other',
        'description': 'Structured documentation and reporting of property damage after stays.',
        'price': 25,
        'estimated_duration_minutes': 45,
        'icon': 'alert-triangle',
    },
    {
        'name': 'Insurance claim handling',
        'category': 'other',
        'description': 'Support with preparing and submitting insurance claims for property incidents.',
        'price': 25,
        'estimated_duration_minutes': 90,
        'icon': 'file-text',
    },
    {
        'name': 'Deposit management',
        'category': 'other',
        'description': 'Management of security deposits including disputes and settlements.',
        'price': 25,
        'estimated_duration_minutes': 45,
        'icon': 'wallet-cards',
    },
    {
        'name': 'Compliance support',
        'category': 'other',
        'description': 'Assistance with local regulations, registrations and compliance documentation.',
        'price': 25,
        'estimated_duration_minutes': 90,
        'icon': 'file-badge-check',
    },
    {
        'name': 'Guest identity verification',
        'category': 'other',
        'description': 'Verification of guest identity and documentation prior to arrival.',
        'price': 25,
        'estimated_duration_minutes': 30,
        'icon': 'id-card',
    },
]

def populate_services():
    """Reset and populate the service catalog with the unified list."""
    print("Clearing existing Service Catalog entries...")
    deleted_count, _ = ServiceCatalog.objects.all().delete()
    print(f"Removed {deleted_count} existing services.")

    print("Populating Service Catalog with new services...")

    created_count = 0
    updated_count = 0

    for service_data in SERVICES:
        service = ServiceCatalog.objects.create(
            name=service_data['name'],
            category=service_data['category'],
            description=service_data['description'],
            price=service_data.get('price', 25),
            estimated_duration_minutes=service_data.get('estimated_duration_minutes'),
            icon=service_data.get('icon', 'wrench'),
            is_active=True,
        )

        created_count += 1
        print(f"  ✓ Created: {service.name} - £{service.price}")

    print(f"\n✅ Done! Created {created_count} services, updated {updated_count} services.")
    print(f"📊 Total services in catalog: {ServiceCatalog.objects.count()}")

if __name__ == '__main__':
    populate_services()
