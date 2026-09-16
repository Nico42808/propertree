"""Service-centric admin dashboard, analytics and performance views.

These endpoints replace the legacy rental-booking KPIs with property-service
activity while preserving a few legacy response aliases for frontend
compatibility during the transition.
"""
from collections import defaultdict
from datetime import datetime, timedelta, date
from decimal import Decimal

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from maintenance.models import MaintenanceRequest
from properties.models import Property, PropertyExpense
from users.models import CustomUser
from .admin_views import IsAdminUser


def _service_value(request):
    """Return the best available CAD value for a service request."""
    if request.quoted_cost is not None and request.quote_status == 'approved':
        return Decimal(request.quoted_cost)
    if request.cost is not None:
        return Decimal(request.cost)
    if request.quoted_cost is not None:
        return Decimal(request.quoted_cost)
    return Decimal('0')


def _sum_service_value(queryset):
    return sum((_service_value(item) for item in queryset), Decimal('0'))


def _percent_change(current, previous):
    current = float(current or 0)
    previous = float(previous or 0)
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round(((current - previous) / previous) * 100, 1)


def _filtered_properties(request, approved_by_default=False):
    filters = Q()
    country = request.query_params.get('country', '')
    city = request.query_params.get('city', '')
    property_type = request.query_params.get('property_type', '')
    property_status = request.query_params.get('property_status', '')
    landlord_id = request.query_params.get('landlord_id', '')

    if country:
        filters &= Q(country=country)
    if city:
        filters &= Q(city=city)
    if property_type:
        filters &= Q(property_type=property_type)
    if property_status:
        filters &= Q(status=property_status)
    elif approved_by_default:
        filters &= Q(status='approved')
    if landlord_id:
        filters &= Q(landlord_id=landlord_id)

    return Property.objects.filter(filters)


def _service_queryset(properties):
    return MaintenanceRequest.objects.filter(
        rental_property__in=properties,
        service_catalog__isnull=False,
    ).select_related('rental_property', 'service_catalog')


class AdminDashboardStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_properties = Property.objects.count()
        pending_properties = Property.objects.filter(status='pending_approval').count()
        active_properties = Property.objects.filter(status='approved').count()
        rejected_properties = Property.objects.filter(status='rejected').count()

        total_users = CustomUser.objects.count()
        total_landlords = CustomUser.objects.filter(role='landlord').count()
        total_tenants = CustomUser.objects.filter(role='tenant').count()

        services = MaintenanceRequest.objects.filter(service_catalog__isnull=False)
        total_services = services.count()
        pending_services = services.filter(status='open').count()
        in_progress_services = services.filter(status__in=['assigned', 'in_progress']).count()
        completed_services = services.filter(status__in=['resolved', 'closed']).count()

        thirty_days_ago = timezone.now() - timedelta(days=30)
        seven_days_ago = timezone.now() - timedelta(days=7)
        recent_services = services.filter(reported_at__gte=seven_days_ago).count()
        recent_properties = Property.objects.filter(created_at__gte=seven_days_ago).count()
        recent_users = CustomUser.objects.filter(created_at__gte=seven_days_ago).count()

        total_revenue = _sum_service_value(services)
        monthly_revenue = _sum_service_value(services.filter(reported_at__gte=thirty_days_ago))
        average_service = total_revenue / total_services if total_services else Decimal('0')

        return Response({
            'properties': {
                'total': total_properties,
                'pending': pending_properties,
                'active': active_properties,
                'rejected': rejected_properties,
                'recent': recent_properties,
            },
            'users': {
                'total': total_users,
                'landlords': total_landlords,
                'tenants': total_tenants,
                'recent': recent_users,
            },
            'services': {
                'total': total_services,
                'pending': pending_services,
                'in_progress': in_progress_services,
                'completed': completed_services,
                'recent': recent_services,
            },
            # Temporary aliases keep older clients from breaking.
            'bookings': {
                'total': total_services,
                'pending': pending_services,
                'confirmed': in_progress_services,
                'recent': recent_services,
            },
            'revenue': {
                'total': float(total_revenue),
                'monthly': float(monthly_revenue),
                'average_service': float(average_service),
                'average_booking': float(average_service),
            },
        })


class PropertyAnalyticsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        properties = _filtered_properties(request)
        services = _service_queryset(properties)

        by_type = list(properties.values('property_type').annotate(count=Count('id')).order_by('-count'))
        by_status = list(properties.values('status').annotate(count=Count('id')).order_by('-count'))

        city_groups = defaultdict(lambda: {'property_ids': set(), 'services': [], 'country': ''})
        for prop in properties.only('id', 'city', 'country'):
            key = prop.city or 'Unknown'
            city_groups[key]['property_ids'].add(prop.id)
            city_groups[key]['country'] = prop.country or ''
        for service in services:
            key = service.rental_property.city or 'Unknown'
            city_groups[key]['services'].append(service)

        by_city = []
        revenue_by_city = []
        activity_by_city = []
        for city_name, payload in city_groups.items():
            service_count = len(payload['services'])
            revenue = _sum_service_value(payload['services'])
            property_count = len(payload['property_ids'])
            avg_services = service_count / property_count if property_count else 0
            row = {
                'city': city_name,
                'country': payload['country'],
                'count': property_count,
                'property_count': property_count,
                'service_count': service_count,
                'total_services': service_count,
                'total_revenue': float(revenue),
                'service_activity_rate': round(avg_services, 2),
            }
            by_city.append(row)
            revenue_by_city.append(row.copy())
            activity_by_city.append(row.copy())
        by_city.sort(key=lambda x: x['count'], reverse=True)
        revenue_by_city.sort(key=lambda x: x['total_revenue'], reverse=True)
        activity_by_city.sort(key=lambda x: x['service_count'], reverse=True)

        category_groups = defaultdict(lambda: {'count': 0, 'revenue': Decimal('0')})
        for service in services:
            category = service.service_catalog.category if service.service_catalog else service.category
            label = (category or 'other').replace('_', ' ').title()
            category_groups[label]['count'] += 1
            category_groups[label]['revenue'] += _service_value(service)
        services_by_category = [
            {'category': key, 'count': value['count'], 'revenue': float(value['revenue'])}
            for key, value in category_groups.items()
        ]
        services_by_category.sort(key=lambda x: x['count'], reverse=True)

        type_groups = defaultdict(lambda: {'count': 0, 'revenue': Decimal('0')})
        for service in services:
            key = service.rental_property.property_type
            type_groups[key]['count'] += 1
            type_groups[key]['revenue'] += _service_value(service)
        avg_service_by_type = []
        revenue_by_type = []
        for key, value in type_groups.items():
            count = value['count']
            avg_value = value['revenue'] / count if count else Decimal('0')
            avg_service_by_type.append({'property_type': key, 'avg_service_value': float(avg_value), 'avg_price': float(avg_value)})
            revenue_by_type.append({
                'property_type': key,
                'total_revenue': float(value['revenue']),
                'service_count': count,
                'booking_count': count,
                'avg_service_value': float(avg_value),
                'avg_price': float(avg_value),
            })

        monthly_data = []
        today = timezone.now().date()
        for months_back in range(11, -1, -1):
            year = today.year
            month = today.month - months_back
            while month <= 0:
                month += 12
                year -= 1
            month_start = timezone.make_aware(datetime(year, month, 1))
            if month == 12:
                next_month = timezone.make_aware(datetime(year + 1, 1, 1))
            else:
                next_month = timezone.make_aware(datetime(year, month + 1, 1))
            month_services = services.filter(reported_at__gte=month_start, reported_at__lt=next_month)
            monthly_data.append({
                'month': month_start.strftime('%b %Y'),
                'count': properties.filter(created_at__gte=month_start, created_at__lt=next_month).count(),
                'services': month_services.count(),
                'bookings': month_services.count(),
                'revenue': float(_sum_service_value(month_services)),
            })

        now = timezone.now()
        last_start = now - timedelta(days=90)
        prev_start = last_start - timedelta(days=90)
        last_services = services.filter(reported_at__gte=last_start, reported_at__lte=now)
        prev_services = services.filter(reported_at__gte=prev_start, reported_at__lt=last_start)
        last_revenue = _sum_service_value(last_services)
        prev_revenue = _sum_service_value(prev_services)

        top_properties = []
        for prop in properties:
            prop_services = services.filter(rental_property=prop)
            count = prop_services.count()
            if count == 0:
                continue
            revenue = _sum_service_value(prop_services)
            top_properties.append({
                'title': prop.title,
                'city': prop.city,
                'country': prop.country,
                'revenue': float(revenue),
                'services': count,
                'bookings': count,
                'type': prop.property_type,
            })
        top_properties.sort(key=lambda x: (x['services'], x['revenue']), reverse=True)
        top_properties = top_properties[:5]

        total_revenue = _sum_service_value(services)
        total_services = services.count()
        top_city = by_city[0]['city'] if by_city else None

        return Response({
            'by_type': by_type,
            'by_status': by_status,
            'by_city': by_city[:10],
            'services_by_category': services_by_category,
            'avg_service_by_type': avg_service_by_type,
            'avg_price_by_type': avg_service_by_type,
            'monthly_trend': monthly_data,
            'revenue_by_city': revenue_by_city[:10],
            'revenue_by_type': revenue_by_type,
            'activity_by_city': activity_by_city[:10],
            'occupancy_by_city': activity_by_city[:10],
            'time_comparison': {
                'last_3_months': {'revenue': float(last_revenue), 'services': last_services.count(), 'bookings': last_services.count()},
                'prev_3_months': {'revenue': float(prev_revenue), 'services': prev_services.count(), 'bookings': prev_services.count()},
                'revenue_growth': _percent_change(last_revenue, prev_revenue),
                'service_growth': _percent_change(last_services.count(), prev_services.count()),
                'booking_growth': _percent_change(last_services.count(), prev_services.count()),
            },
            'top_properties': top_properties,
            'summary': {
                'total_properties': properties.count(),
                'active_properties': properties.filter(status='approved').count(),
                'total_revenue': float(total_revenue),
                'total_services': total_services,
                'total_bookings': total_services,
                'top_city': top_city,
                'top_city_count': by_city[0]['count'] if by_city else 0,
            },
        })


class AssetPerformanceView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        properties = _filtered_properties(request, approved_by_default=True)
        services = _service_queryset(properties)

        days = int(request.query_params.get('days', 30))
        end_date = timezone.now()
        start_date_param = request.query_params.get('start_date', '')
        end_date_param = request.query_params.get('end_date', '')
        if start_date_param and end_date_param:
            try:
                start_date = timezone.make_aware(datetime.strptime(start_date_param, '%Y-%m-%d'))
                end_date = timezone.make_aware(datetime.strptime(end_date_param, '%Y-%m-%d')).replace(hour=23, minute=59, second=59)
            except ValueError:
                start_date = end_date - timedelta(days=days)
        else:
            start_date = end_date - timedelta(days=days)

        current = services.filter(reported_at__gte=start_date, reported_at__lte=end_date)
        duration = max((end_date - start_date).days, 1)
        prev_start = start_date - timedelta(days=duration)
        previous = services.filter(reported_at__gte=prev_start, reported_at__lt=start_date)

        current_revenue = _sum_service_value(current)
        previous_revenue = _sum_service_value(previous)
        current_count = current.count()
        previous_count = previous.count()
        avg_service = current_revenue / current_count if current_count else Decimal('0')
        prev_avg_service = previous_revenue / previous_count if previous_count else Decimal('0')

        total_properties = properties.count()
        active_properties = current.values('rental_property_id').distinct().count()
        prev_active_properties = previous.values('rental_property_id').distinct().count()
        activity_rate = (active_properties / total_properties * 100) if total_properties else 0
        prev_activity_rate = (prev_active_properties / total_properties * 100) if total_properties else 0

        monthly_services = []
        today = timezone.now().date()
        for months_back in range(5, -1, -1):
            year = today.year
            month = today.month - months_back
            while month <= 0:
                month += 12
                year -= 1
            month_start = timezone.make_aware(datetime(year, month, 1))
            next_month = timezone.make_aware(datetime(year + 1, 1, 1)) if month == 12 else timezone.make_aware(datetime(year, month + 1, 1))
            month_qs = services.filter(reported_at__gte=month_start, reported_at__lt=next_month)
            monthly_services.append({
                'month': month_start.strftime('%b'),
                'services': month_qs.count(),
                'revenue': float(_sum_service_value(month_qs)),
            })

        property_performance = []
        for prop in properties:
            prop_services = current.filter(rental_property=prop)
            count = prop_services.count()
            revenue = _sum_service_value(prop_services)
            if count == 0 and revenue == 0:
                continue
            property_performance.append({
                'id': str(prop.id),
                'title': prop.title,
                'city': prop.city,
                'country': prop.country,
                'property_type': prop.property_type,
                'revenue': float(revenue),
                'services': count,
                'bookings': count,
                'activity': count,
                'occupancy_rate': 0,
            })
        property_performance.sort(key=lambda x: (x['services'], x['revenue']), reverse=True)

        category_groups = defaultdict(lambda: {'count': 0, 'revenue': Decimal('0')})
        for service in current:
            key = service.service_catalog.category if service.service_catalog else service.category
            label = (key or 'other').replace('_', ' ').title()
            category_groups[label]['count'] += 1
            category_groups[label]['revenue'] += _service_value(service)
        service_categories = [
            {'category': key, 'count': value['count'], 'revenue': float(value['revenue'])}
            for key, value in category_groups.items()
        ]
        service_categories.sort(key=lambda x: x['count'], reverse=True)

        expenses = PropertyExpense.objects.filter(
            property__in=properties,
            expense_date__gte=start_date.date(),
            expense_date__lte=end_date.date(),
        )
        total_expenses = sum((item.amount for item in expenses), Decimal('0'))

        return Response({
            'kpis': {
                'total_revenue': float(current_revenue),
                'revenue_change': _percent_change(current_revenue, previous_revenue),
                'service_activity_rate': round(activity_rate, 1),
                'activity_change': round(activity_rate - prev_activity_rate, 1),
                'average_service_value': float(avg_service),
                'service_value_change': _percent_change(avg_service, prev_avg_service),
                'total_services': current_count,
                'services_change': _percent_change(current_count, previous_count),
                # Legacy aliases during rollout
                'occupancy_rate': round(activity_rate, 1),
                'occupancy_change': round(activity_rate - prev_activity_rate, 1),
                'average_booking_value': float(avg_service),
                'booking_value_change': _percent_change(avg_service, prev_avg_service),
                'total_bookings': current_count,
                'bookings_change': _percent_change(current_count, previous_count),
            },
            'monthly_services': monthly_services,
            'monthly_revenue': monthly_services,
            'property_performance': property_performance[:10],
            'service_categories': service_categories,
            'expense_categories': [],
            'summary': {
                'total_properties': total_properties,
                'active_properties': active_properties,
                'total_expenses': float(total_expenses),
            },
        })
