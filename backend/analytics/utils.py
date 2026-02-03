"""
Utility functions for analytics and KPI calculations.
"""
from django.db.models import Sum, Count, Avg, Q, F
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal


class LandlordAnalytics:
    """Analytics for landlord dashboard."""

    def __init__(self, landlord):
        self.landlord = landlord

    def get_occupancy_rate(self, start_date=None, end_date=None):
        """
        Calculate occupancy rate: (Rented Units ÷ Total Units) × 100%
        """
        from properties.models import Property
        from bookings.models import Booking

        properties = Property.objects.filter(landlord=self.landlord, status='approved')
        total_units = properties.count()

        if total_units == 0:
            return 0

        # Get bookings in date range
        bookings_query = Booking.objects.filter(
            property__landlord=self.landlord,
            status__in=['confirmed', 'completed']
        )

        if start_date and end_date:
            bookings_query = bookings_query.filter(
                check_in__lte=end_date,
                check_out__gte=start_date
            )

        # Calculate total booked days
        total_days = (end_date - start_date).days if start_date and end_date else 30
        booked_days = 0

        for booking in bookings_query:
            # Calculate overlap between booking and date range
            overlap_start = max(booking.check_in, start_date) if start_date else booking.check_in
            overlap_end = min(booking.check_out, end_date) if end_date else booking.check_out
            booked_days += (overlap_end - overlap_start).days

        occupancy_rate = (booked_days / (total_units * total_days)) * 100 if total_units > 0 else 0
        return round(occupancy_rate, 2)

    def get_rental_income(self, start_date=None, end_date=None):
        """
        Calculate total rental income for a period.
        Income is counted when booking is confirmed - ALL confirmed bookings count as income.
        Date range is ignored for income calculation - once confirmed, it's always counted.
        """
        from bookings.models import Booking

        # Count ALL confirmed bookings as income, regardless of date range
        # Income shows as soon as booking is confirmed
        bookings = Booking.objects.filter(
            property__landlord=self.landlord,
            status__in=['confirmed', 'completed']
        )

        # Don't filter by date - all confirmed bookings count as income
        total_income = bookings.aggregate(total=Sum('total_price'))['total'] or Decimal('0.00')
        return float(total_income)

    def get_pending_bookings(self):
        """
        Get count and total value of pending bookings.
        """
        from bookings.models import Booking

        pending_bookings = Booking.objects.filter(
            property__landlord=self.landlord,
            status='pending'
        )
        
        total_value = pending_bookings.aggregate(total=Sum('total_price'))['total'] or Decimal('0.00')
        count = pending_bookings.count()

        return {
            'pending_count': count,
            'pending_value': float(total_value)
        }

    def get_maintenance_costs(self, start_date=None, end_date=None):
        """
        Calculate total maintenance costs for a period.
        Includes:
        - Resolved maintenance requests with actual costs
        - Confirmed service bookings (admin_confirmed_at is not null) with estimated or actual costs
        Uses resolved_at if available, otherwise uses reported_at/admin_confirmed_at for date filtering.
        """
        from maintenance.models import MaintenanceRequest

        # Get resolved maintenance with costs
        resolved_maintenance = MaintenanceRequest.objects.filter(
            rental_property__landlord=self.landlord,
            status='resolved',
            cost__isnull=False
        )

        # Get confirmed service bookings (admin confirmed)
        confirmed_bookings = MaintenanceRequest.objects.filter(
            rental_property__landlord=self.landlord,
            admin_confirmed_at__isnull=False
        ).exclude(status='cancelled')

        # Combine both querysets
        maintenance = MaintenanceRequest.objects.filter(
            Q(id__in=resolved_maintenance.values_list('id', flat=True)) |
            Q(id__in=confirmed_bookings.values_list('id', flat=True))
        ).distinct()

        if start_date and end_date:
            # Use resolved_at if available, otherwise use admin_confirmed_at, otherwise use reported_at
            maintenance = maintenance.filter(
                Q(resolved_at__isnull=False, resolved_at__date__gte=start_date, resolved_at__date__lte=end_date) |
                Q(resolved_at__isnull=True, admin_confirmed_at__isnull=False, admin_confirmed_at__date__gte=start_date, admin_confirmed_at__date__lte=end_date) |
                Q(resolved_at__isnull=True, admin_confirmed_at__isnull=True, reported_at__date__gte=start_date, reported_at__date__lte=end_date)
            )

        # Calculate total cost: use actual cost if available, otherwise use service catalog price
        total_cost = Decimal('0.00')
        count = 0
        
        for req in maintenance:
            count += 1
            if req.cost is not None:
                # Use actual cost if available
                total_cost += req.cost
            elif req.service_catalog and req.service_catalog.price:
                # Use price from service catalog
                total_cost += req.service_catalog.price

        return {
            'total_cost': float(total_cost),
            'count': count,
            'average_cost': float(total_cost / count) if count > 0 else 0
        }

    def get_property_expenses(self, start_date=None, end_date=None):
        """
        Calculate total property operating expenses for a period.
        Includes utilities, taxes, insurance, HOA fees, etc.
        NOTE: This does NOT include maintenance costs - those are handled separately.
        Maintenance costs are included in the by_category breakdown for display purposes only.
        """
        from properties.models import PropertyExpense
        from maintenance.models import MaintenanceRequest

        expenses = PropertyExpense.objects.filter(
            property__landlord=self.landlord
        )

        if start_date and end_date:
            expenses = expenses.filter(expense_date__range=[start_date, end_date])

        # Group property expenses by category
        expense_by_category = expenses.values('category').annotate(
            total=Sum('amount')
        ).order_by('-total')

        # Get maintenance costs by category (resolved with costs OR confirmed bookings)
        # This is only for the category breakdown display, not for the total
        resolved_maintenance = MaintenanceRequest.objects.filter(
            rental_property__landlord=self.landlord,
            status='resolved',
            cost__isnull=False
        )

        confirmed_bookings = MaintenanceRequest.objects.filter(
            rental_property__landlord=self.landlord,
            admin_confirmed_at__isnull=False
        ).exclude(status='cancelled')

        maintenance = MaintenanceRequest.objects.filter(
            Q(id__in=resolved_maintenance.values_list('id', flat=True)) |
            Q(id__in=confirmed_bookings.values_list('id', flat=True))
        ).distinct()

        if start_date and end_date:
            maintenance = maintenance.filter(
                Q(resolved_at__isnull=False, resolved_at__date__gte=start_date, resolved_at__date__lte=end_date) |
                Q(resolved_at__isnull=True, admin_confirmed_at__isnull=False, admin_confirmed_at__date__gte=start_date, admin_confirmed_at__date__lte=end_date) |
                Q(resolved_at__isnull=True, admin_confirmed_at__isnull=True, reported_at__date__gte=start_date, reported_at__date__lte=end_date)
            )

        # Calculate maintenance costs by category (using actual cost or estimated)
        # This is for display in the category breakdown only
        maintenance_by_category = {}
        for req in maintenance:
            category = 'maintenance'  # Use 'maintenance' as the category
            if category not in maintenance_by_category:
                maintenance_by_category[category] = Decimal('0.00')
            
            if req.cost is not None:
                # Use actual cost if available
                maintenance_by_category[category] += req.cost
            elif req.service_catalog and req.service_catalog.price:
                # Use price from service catalog
                maintenance_by_category[category] += req.service_catalog.price

        # Combine both expense types by category (for display purposes)
        category_totals = {}
        
        # Add property expenses
        for item in expense_by_category:
            category = item['category']
            if category not in category_totals:
                category_totals[category] = 0
            category_totals[category] += float(item['total'])
        
        # Add maintenance costs to category breakdown (for display)
        for category, amount in maintenance_by_category.items():
            if category not in category_totals:
                category_totals[category] = 0
            category_totals[category] += float(amount)

        # Convert to list format
        by_category = [
            {'category': cat, 'amount': amount}
            for cat, amount in sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
        ]

        # IMPORTANT: total_expenses here should ONLY include PropertyExpense items, NOT maintenance
        # Maintenance is handled separately in get_maintenance_costs()
        total_expenses = expenses.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        count = expenses.count()

        return {
            'total_expenses': float(total_expenses),  # Only property expenses, not maintenance
            'count': count,
            'by_category': by_category  # Includes maintenance for display purposes
        }

    def get_property_performance(self):
        """
        Get individual property performance metrics.
        Includes both property expenses and maintenance costs.
        """
        from properties.models import Property
        from bookings.models import Booking
        from maintenance.models import MaintenanceRequest

        properties = Property.objects.filter(landlord=self.landlord)
        performance = []

        for prop in properties:
            # Get bookings for this property
            bookings = Booking.objects.filter(
                property=prop,
                status__in=['confirmed', 'completed']
            )
            
            total_income = bookings.aggregate(total=Sum('total_price'))['total'] or Decimal('0.00')
            booking_count = bookings.count()
            
            # Get property expenses for this property
            expenses = prop.expenses.all()
            property_expenses = expenses.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            
            # Get maintenance costs for this property
            # Include resolved with costs OR confirmed bookings
            resolved_maintenance = MaintenanceRequest.objects.filter(
                rental_property=prop,
                status='resolved',
                cost__isnull=False
            )
            confirmed_bookings = MaintenanceRequest.objects.filter(
                rental_property=prop,
                admin_confirmed_at__isnull=False
            ).exclude(status='cancelled')
            
            maintenance = MaintenanceRequest.objects.filter(
                Q(id__in=resolved_maintenance.values_list('id', flat=True)) |
                Q(id__in=confirmed_bookings.values_list('id', flat=True))
            ).distinct()
            
            # Calculate total: use actual cost or service catalog price
            maintenance_costs = Decimal('0.00')
            for req in maintenance:
                if req.cost is not None:
                    maintenance_costs += req.cost
                elif req.service_catalog and req.service_catalog.price:
                    maintenance_costs += req.service_catalog.price
            
            # Total expenses = property expenses + maintenance costs
            total_expenses = float(property_expenses) + float(maintenance_costs)
            
            # Calculate net income
            net_income = float(total_income) - total_expenses
            
            performance.append({
                'property_id': str(prop.id),
                'property_title': prop.title,
                'city': prop.city,
                'status': prop.status,
                'total_income': float(total_income),
                'total_expenses': total_expenses,
                'net_income': net_income,
                'booking_count': booking_count
            })

        return performance

    def get_average_booking_duration(self):
        """
        Calculate average booking duration in days.
        """
        from bookings.models import Booking

        bookings = Booking.objects.filter(
            property__landlord=self.landlord,
            status__in=['confirmed', 'completed']
        )

        total_days = 0
        count = bookings.count()

        for booking in bookings:
            total_days += (booking.check_out - booking.check_in).days

        avg_days = total_days / count if count > 0 else 0

        return {
            'average_nights': round(avg_days, 1),
            'total_bookings': count
        }

    def get_noi(self, start_date=None, end_date=None):
        """
        Calculate Net Operating Income: Pipeline Revenue – Operating Expenses
        Includes rental income minus maintenance and property expenses.
        """
        revenue = self.get_rental_income(start_date, end_date)
        maintenance = self.get_maintenance_costs(start_date, end_date)['total_cost']
        property_expenses = self.get_property_expenses(start_date, end_date)['total_expenses']

        total_expenses = maintenance + property_expenses
        noi = revenue - total_expenses
        
        return {
            'noi': round(noi, 2),
            'revenue': round(revenue, 2),
            'total_expenses': round(total_expenses, 2),
            'maintenance_costs': round(maintenance, 2),
            'property_expenses': round(property_expenses, 2)
        }

    def get_total_properties(self):
        """
        Get total count of properties by status.
        """
        from properties.models import Property

        properties = Property.objects.filter(landlord=self.landlord)
        
        return {
            'total': properties.count(),
            'approved': properties.filter(status='approved').count(),
            'booked': 0,  # Properties no longer use 'booked' status - availability is date-based
            'pending': properties.filter(status='pending_approval').count(),
            'draft': properties.filter(status='draft').count()
        }

    def get_monthly_cash_flow(self, start_date=None, end_date=None):
        """
        Calculate monthly cash flow (income vs expenses) over time.
        Returns data for each month in the date range.
        """
        from bookings.models import Booking
        from properties.models import PropertyExpense
        from maintenance.models import MaintenanceRequest
        from datetime import datetime
        from calendar import monthrange

        if not start_date or not end_date:
            # Default to last 12 months
            end_date = timezone.now().date()
            start_date = end_date - timedelta(days=365)

        monthly_data = []
        current_date = start_date.replace(day=1)  # Start from first day of month

        while current_date <= end_date:
            # Get last day of current month
            last_day = monthrange(current_date.year, current_date.month)[1]
            month_end = current_date.replace(day=last_day)
            if month_end > end_date:
                month_end = end_date

            # Calculate income for this month
            # Income is counted when booking is confirmed
            # Use updated_at as proxy for when booking was confirmed (when status became confirmed)
            bookings = Booking.objects.filter(
                property__landlord=self.landlord,
                status__in=['confirmed', 'completed'],
                updated_at__date__gte=current_date,
                updated_at__date__lte=month_end
            )
            monthly_income = bookings.aggregate(total=Sum('total_price'))['total'] or Decimal('0.00')

            # Calculate expenses for this month
            expenses = PropertyExpense.objects.filter(
                property__landlord=self.landlord,
                expense_date__gte=current_date,
                expense_date__lte=month_end
            )
            monthly_expenses = expenses.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            # Calculate maintenance costs for this month
            # Include resolved with costs OR confirmed bookings
            resolved_maintenance = MaintenanceRequest.objects.filter(
                rental_property__landlord=self.landlord,
                status='resolved',
                cost__isnull=False
            )
            confirmed_bookings = MaintenanceRequest.objects.filter(
                rental_property__landlord=self.landlord,
                admin_confirmed_at__isnull=False
            ).exclude(status='cancelled')
            
            maintenance = MaintenanceRequest.objects.filter(
                Q(id__in=resolved_maintenance.values_list('id', flat=True)) |
                Q(id__in=confirmed_bookings.values_list('id', flat=True))
            ).distinct().filter(
                Q(resolved_at__isnull=False, resolved_at__date__gte=current_date, resolved_at__date__lte=month_end) |
                Q(resolved_at__isnull=True, admin_confirmed_at__isnull=False, admin_confirmed_at__date__gte=current_date, admin_confirmed_at__date__lte=month_end) |
                Q(resolved_at__isnull=True, admin_confirmed_at__isnull=True, reported_at__date__gte=current_date, reported_at__date__lte=month_end)
            )
            
            # Calculate total: use actual cost or service catalog price
            monthly_maintenance = Decimal('0.00')
            for req in maintenance:
                if req.cost is not None:
                    monthly_maintenance += req.cost
                elif req.service_catalog and req.service_catalog.price:
                    monthly_maintenance += req.service_catalog.price

            total_expenses = float(monthly_expenses) + float(monthly_maintenance)
            net_cash_flow = float(monthly_income) - total_expenses

            monthly_data.append({
                'month': current_date.strftime('%b %Y'),
                'month_short': current_date.strftime('%b'),
                'income': float(monthly_income),
                'expenses': total_expenses,
                'net_cash_flow': net_cash_flow
            })

            # Move to next month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)

        return monthly_data

    def get_annual_expenses_summary(self, year=None):
        """
        Get annual expenses summary by category.
        """
        from properties.models import PropertyExpense
        from maintenance.models import MaintenanceRequest
        from datetime import datetime

        if not year:
            year = timezone.now().year

        start_date = datetime(year, 1, 1).date()
        end_date = datetime(year, 12, 31).date()

        # Get property expenses by category
        expenses = PropertyExpense.objects.filter(
            property__landlord=self.landlord,
            expense_date__year=year
        )

        expense_by_category = expenses.values('category').annotate(
            total=Sum('amount')
        ).order_by('-total')

        # Get maintenance costs for the year
        # Include resolved with costs OR confirmed bookings
        resolved_maintenance = MaintenanceRequest.objects.filter(
            rental_property__landlord=self.landlord,
            status='resolved',
            cost__isnull=False
        )
        confirmed_bookings = MaintenanceRequest.objects.filter(
            rental_property__landlord=self.landlord,
            admin_confirmed_at__isnull=False
        ).exclude(status='cancelled')
        
        maintenance = MaintenanceRequest.objects.filter(
            Q(id__in=resolved_maintenance.values_list('id', flat=True)) |
            Q(id__in=confirmed_bookings.values_list('id', flat=True))
        ).distinct().filter(
            Q(resolved_at__isnull=False, resolved_at__year=year) |
            Q(resolved_at__isnull=True, admin_confirmed_at__isnull=False, admin_confirmed_at__year=year) |
            Q(resolved_at__isnull=True, admin_confirmed_at__isnull=True, reported_at__year=year)
        )
        
        # Calculate total: use actual cost or service catalog price
        maintenance_total = Decimal('0.00')
        for req in maintenance:
            if req.cost is not None:
                maintenance_total += req.cost
            elif req.service_catalog and req.service_catalog.price:
                maintenance_total += req.service_catalog.price

        property_expenses_total = expenses.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        total_expenses = float(property_expenses_total) + float(maintenance_total)

        return {
            'year': year,
            'total_expenses': total_expenses,
            'by_category': [
                {'category': item['category'], 'amount': float(item['total'])}
                for item in expense_by_category
            ],
            'maintenance_costs': float(maintenance_total),
            'property_expenses': float(property_expenses_total)
        }


class AdminAnalytics:
    """Analytics for admin dashboard."""

    @staticmethod
    def get_open_maintenance_tickets():
        """Get count of open maintenance tickets."""
        from maintenance.models import MaintenanceRequest

        return MaintenanceRequest.objects.filter(
            status__in=['open', 'assigned', 'in_progress']
        ).count()

    @staticmethod
    def get_average_resolution_time():
        """Calculate average maintenance resolution time."""
        from maintenance.models import MaintenanceRequest

        resolved = MaintenanceRequest.objects.filter(
            status='resolved',
            resolved_at__isnull=False
        )

        if not resolved.exists():
            return 0

        total_hours = sum([r.resolution_time for r in resolved if r.resolution_time])
        avg_hours = total_hours / resolved.count() if resolved.count() > 0 else 0

        return round(avg_hours, 2)

    @staticmethod
    def get_occupancy_ratio():
        """Calculate platform-wide occupancy ratio."""
        from properties.models import Property
        from bookings.models import Booking

        total_properties = Property.objects.filter(status='active').count()

        today = timezone.now().date()
        occupied = Booking.objects.filter(
            status='confirmed',
            check_in__lte=today,
            check_out__gte=today
        ).values('property').distinct().count()

        ratio = (occupied / total_properties) * 100 if total_properties > 0 else 0
        return round(ratio, 2)

    @staticmethod
    def get_rent_collection_rate():
        """Calculate rent collection rate."""
        from bookings.models import Booking, Payment

        total_due = Booking.objects.filter(
            status='confirmed'
        ).aggregate(total=Sum('total_price'))['total'] or Decimal('0.00')

        total_collected = Payment.objects.filter(
            status='completed'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        rate = (float(total_collected) / float(total_due)) * 100 if total_due > 0 else 0
        return round(rate, 2)

    @staticmethod
    def get_platform_statistics():
        """Get general platform statistics."""
        from django.contrib.auth import get_user_model
        from properties.models import Property
        from bookings.models import Booking

        User = get_user_model()

        return {
            'total_users': User.objects.count(),
            'total_landlords': User.objects.filter(role='landlord').count(),
            'total_tenants': User.objects.filter(role='tenant').count(),
            'total_properties': Property.objects.count(),
            'active_properties': Property.objects.filter(status='active').count(),
            'total_bookings': Booking.objects.count(),
            'active_bookings': Booking.objects.filter(status='confirmed').count(),
        }
