"""
Admin-specific views for property management.
"""
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import timedelta
from django.conf import settings

from .models import Property
from .serializers import PropertyDetailSerializer
from bookings.models import Booking
from users.models import CustomUser, Profile


class IsAdminUser(IsAuthenticated):
    """Permission class to check if user is admin."""
    
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'admin'


class AdminDashboardStatsView(APIView):
    """API endpoint for admin dashboard statistics."""
    
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Get dashboard statistics for admin."""
        try:
            # Property stats
            total_properties = Property.objects.count()
            pending_properties = Property.objects.filter(status='pending_approval').count()
            active_properties = Property.objects.filter(status='approved').count()
            rejected_properties = Property.objects.filter(status='rejected').count()
            
            # User stats
            total_users = CustomUser.objects.count()
            total_landlords = CustomUser.objects.filter(role='landlord').count()
            total_tenants = CustomUser.objects.filter(role='tenant').count()
            
            # Booking stats
            total_bookings = Booking.objects.count()
            pending_bookings = Booking.objects.filter(status='pending').count()
            confirmed_bookings = Booking.objects.filter(status='confirmed').count()
            
            # Revenue stats
            total_revenue = Booking.objects.filter(
                status__in=['confirmed', 'completed']
            ).aggregate(Sum('total_price'))['total_price__sum'] or 0
            
            # Monthly revenue (last 30 days)
            thirty_days_ago = timezone.now() - timedelta(days=30)
            monthly_revenue = Booking.objects.filter(
                status__in=['confirmed', 'completed'],
                created_at__gte=thirty_days_ago
            ).aggregate(Sum('total_price'))['total_price__sum'] or 0
            
            # Recent activity (last 7 days)
            seven_days_ago = timezone.now() - timedelta(days=7)
            recent_properties = Property.objects.filter(created_at__gte=seven_days_ago).count()
            recent_bookings = Booking.objects.filter(created_at__gte=seven_days_ago).count()
            recent_users = CustomUser.objects.filter(created_at__gte=seven_days_ago).count()
            
            return Response({
                'properties': {
                    'total': total_properties,
                    'pending': pending_properties,
                    'active': active_properties,
                    'rejected': rejected_properties,
                    'recent': recent_properties
                },
                'users': {
                    'total': total_users,
                    'landlords': total_landlords,
                    'tenants': total_tenants,
                    'recent': recent_users
                },
                'bookings': {
                    'total': total_bookings,
                    'pending': pending_bookings,
                    'confirmed': confirmed_bookings,
                    'recent': recent_bookings
                },
                'revenue': {
                    'total': float(total_revenue),
                    'monthly': float(monthly_revenue),
                    'average_booking': float(total_revenue / total_bookings) if total_bookings > 0 else 0
                }
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PendingPropertiesView(generics.ListAPIView):
    """API endpoint to list all pending properties for admin review."""
    
    serializer_class = PropertyDetailSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        """Return all pending properties."""
        return Property.objects.filter(status='pending_approval').order_by('-created_at')


class ApprovePropertyView(APIView):
    """API endpoint to approve a property."""
    
    permission_classes = [IsAdminUser]
    
    def post(self, request, pk):
        """Approve a property."""
        try:
            property_obj = Property.objects.get(pk=pk)
            
            if property_obj.status != 'pending_approval':
                return Response(
                    {'error': 'Only pending properties can be approved'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            property_obj.status = 'approved'
            property_obj.approved_by = request.user
            property_obj.approved_at = timezone.now()
            property_obj.save()
            
            return Response({
                'message': 'Property approved successfully',
                'property': PropertyDetailSerializer(property_obj).data
            })
            
        except Property.DoesNotExist:
            return Response(
                {'error': 'Property not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class RejectPropertyView(APIView):
    """API endpoint to reject a property."""
    
    permission_classes = [IsAdminUser]
    
    def post(self, request, pk):
        """Reject a property with a reason."""
        try:
            property_obj = Property.objects.get(pk=pk)
            
            if property_obj.status != 'pending_approval':
                return Response(
                    {'error': 'Only pending properties can be rejected'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            reason = request.data.get('reason', '')
            if not reason:
                return Response(
                    {'error': 'Rejection reason is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            property_obj.status = 'rejected'
            property_obj.rejection_reason = reason
            property_obj.save()
            
            return Response({
                'message': 'Property rejected successfully',
                'property': PropertyDetailSerializer(property_obj).data
            })
            
        except Property.DoesNotExist:
            return Response(
                {'error': 'Property not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class AllPropertiesAdminView(generics.ListAPIView):
    """API endpoint to list all properties for admin (all statuses)."""
    
    serializer_class = PropertyDetailSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        """Return all properties with filtering options."""
        queryset = Property.objects.all().order_by('-created_at')
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by owner
        owner_id = self.request.query_params.get('owner_id')
        if owner_id:
            queryset = queryset.filter(owner_id=owner_id)
        
        # Filter by country
        country_filter = self.request.query_params.get('country')
        if country_filter:
            queryset = queryset.filter(country=country_filter)
        
        # Filter by city
        city_filter = self.request.query_params.get('city')
        if city_filter:
            queryset = queryset.filter(city=city_filter)
        
        return queryset


class PropertyFilterOptionsView(APIView):
    """API endpoint to get filter options (countries and cities) for properties."""
    
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Get unique countries and cities for filtering."""
        try:
            # Get unique countries
            countries = Property.objects.values_list('country', flat=True).distinct().order_by('country')
            countries = [c for c in countries if c]  # Filter out None/empty values
            
            # Get cities grouped by country
            cities_by_country = {}
            if request.query_params.get('country'):
                # If country is specified, only return cities for that country
                country = request.query_params.get('country')
                cities = Property.objects.filter(
                    country=country
                ).values_list('city', flat=True).distinct().order_by('city')
                cities = [c for c in cities if c]  # Filter out None/empty values
                return Response({
                    'countries': list(countries),
                    'cities': list(cities)
                })
            else:
                # Return all cities grouped by country
                properties = Property.objects.values('country', 'city').distinct().order_by('country', 'city')
                for prop in properties:
                    country = prop['country']
                    city = prop['city']
                    if country and city:
                        if country not in cities_by_country:
                            cities_by_country[country] = []
                        if city not in cities_by_country[country]:
                            cities_by_country[country].append(city)
                
                # Sort cities within each country
                for country in cities_by_country:
                    cities_by_country[country].sort()
            
            return Response({
                'countries': list(countries),
                'cities_by_country': cities_by_country
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminUsersListView(generics.ListAPIView):
    """API endpoint to list all users for admin."""
    
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Get all users with statistics (excluding admin users)."""
        try:
            # Exclude admin users - only show landlords and tenants
            # Use select_related to optimize profile queries
            users = CustomUser.objects.exclude(role='admin').select_related('profile').order_by('-created_at')
            
            # Filter by role (only landlord or tenant)
            role_filter = request.query_params.get('role')
            if role_filter and role_filter in ['landlord', 'tenant']:
                users = users.filter(role=role_filter)
            
            users_data = []
            for user in users:
                # Get names and profile photo from profile
                first_name = ''
                last_name = ''
                full_name = user.email
                profile_photo = None
                
                # Check if profile exists (use try/except to handle RelatedObjectDoesNotExist)
                try:
                    profile = user.profile
                    first_name = profile.first_name or ''
                    last_name = profile.last_name or ''
                    full_name = profile.get_full_name() or user.email
                    if profile.profile_photo:
                        try:
                            if profile.profile_photo.url.startswith('http'):
                                profile_photo = profile.profile_photo.url
                            else:
                                profile_photo = request.build_absolute_uri(profile.profile_photo.url)
                        except Exception:
                            profile_photo = None
                except Profile.DoesNotExist:
                    # Profile doesn't exist, use email as fallback
                    pass
                except Exception:
                    # Any other error accessing profile
                    pass
                
                # Get user's property count if landlord
                property_count = 0
                if user.role == 'landlord':
                    property_count = Property.objects.filter(landlord=user).count()
                
                # Get user's booking count if tenant
                booking_count = 0
                if user.role == 'tenant':
                    booking_count = Booking.objects.filter(tenant=user).count()
                
                users_data.append({
                    'id': str(user.id),
                    'email': user.email,
                    'first_name': first_name,
                    'last_name': last_name,
                    'full_name': full_name,
                    'role': user.role,
                    'is_active': user.is_active,
                    'is_verified': user.is_verified,
                    'created_at': user.created_at.isoformat() if user.created_at else None,
                    'profile_photo': profile_photo,
                    'property_count': property_count,
                    'booking_count': booking_count
                })
            
            return Response({
                'count': len(users_data),
                'results': users_data
            })
        except Exception as e:
            import traceback
            return Response(
                {'error': str(e), 'traceback': traceback.format_exc()},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminDeletePropertyView(APIView):
    """API endpoint for admin to delete a property."""

    permission_classes = [IsAdminUser]

    def delete(self, request, pk):
        try:
            prop = Property.objects.get(pk=pk)
            # Call delete() to allow any Django on_delete cascades/signals to run
            prop.delete()
            return Response({'message': 'Property deleted'}, status=status.HTTP_204_NO_CONTENT)
        except Property.DoesNotExist:
            return Response({'error': 'Property not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminDeleteUserView(APIView):
    """API endpoint for admin to permanently delete a user account."""

    permission_classes = [IsAdminUser]

    def delete(self, request, pk):
        try:
            user = CustomUser.objects.get(pk=pk)

            if user.role == 'admin':
                return Response(
                    {'error': 'Admin accounts cannot be deleted from this screen.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if user.id == request.user.id:
                return Response(
                    {'error': 'You cannot delete your own account.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user.delete()
            return Response({'message': 'User deleted'}, status=status.HTTP_204_NO_CONTENT)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminToggleUserActiveView(APIView):
    """API endpoint for admin to block/unblock (activate or deactivate) a user."""

    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            user = CustomUser.objects.get(pk=pk)

            if user.role == 'admin':
                return Response(
                    {'error': 'Admin accounts cannot be blocked from this screen.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if user.id == request.user.id:
                return Response(
                    {'error': 'You cannot block your own account.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user.is_active = not user.is_active
            user.save(update_fields=['is_active'])

            status_label = 'activated' if user.is_active else 'blocked'
            return Response({
                'message': f'User {status_label} successfully.',
                'is_active': user.is_active,
            })
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminResetUserPasswordView(APIView):
    """API endpoint for admin to reset a user's password.

    Generates a new random temporary password, sets it on the account,
    and emails it to the user. The user should be encouraged to change
    it after logging in.
    """

    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        import secrets
        import string
        from django.core.mail import send_mail

        try:
            user = CustomUser.objects.get(pk=pk)

            if user.role == 'admin':
                return Response(
                    {'error': "Admin accounts' passwords cannot be reset from this screen."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Generate a random temporary password
            alphabet = string.ascii_letters + string.digits
            temp_password = ''.join(secrets.choice(alphabet) for _ in range(12))

            user.set_password(temp_password)
            user.save(update_fields=['password'])

            # Try to email the temporary password to the user. Don't let a
            # broken mail server turn this into a 500 — the password has
            # already been reset either way.
            email_sent = True
            try:
                send_mail(
                    'Your Propertree password has been reset',
                    f"""
Hi,

An administrator has reset your Propertree password.

Your temporary password is:
{temp_password}

Please log in and change your password as soon as possible.

— Propertree
""",
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )
            except Exception:
                email_sent = False

            return Response({
                'message': 'Password reset successfully.' if email_sent else
                           'Password reset, but the notification email could not be sent.',
                'email_sent': email_sent,
                # Only included so the admin can hand it over manually if the
                # email failed to send — remove if you don't want this exposed.
                'temporary_password': temp_password,
            })
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PropertyAnalyticsView(APIView):
    """API endpoint for comprehensive property analytics."""
    
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Get comprehensive property analytics data."""
        from properties.models import PropertyExpense
        from calendar import monthrange
        from datetime import date, datetime
        
        try:
            # Optional filters to support cascading filters in the admin UI
            country = request.query_params.get('country', '')
            city = request.query_params.get('city', '')
            property_type = request.query_params.get('property_type', '')
            property_status = request.query_params.get('property_status', '')
            landlord_id = request.query_params.get('landlord_id', '')

            property_filter = Q()
            if country:
                property_filter &= Q(country=country)
            if city:
                property_filter &= Q(city=city)
            if property_type:
                property_filter &= Q(property_type=property_type)
            if property_status:
                property_filter &= Q(status=property_status)
            if landlord_id:
                property_filter &= Q(landlord_id=landlord_id)

            filtered_properties = Property.objects.filter(property_filter)

            # Properties by type
            by_type = filtered_properties.values('property_type').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # Properties by status
            by_status = filtered_properties.values('status').annotate(
                count=Count('id')
            )
            
            # Properties by city (top 10) with additional metrics
            by_city = filtered_properties.values('city', 'country').annotate(
                count=Count('id'),
                avg_price=Avg('price_per_night'),
                total_revenue=Sum(
                    'bookings__total_price',
                    filter=Q(bookings__status__in=['confirmed', 'completed'])
                ),
                total_bookings=Count(
                    'bookings',
                    filter=Q(bookings__status__in=['confirmed', 'completed'])
                )
            ).order_by('-count')[:10]
            
            # Average price by property type
            avg_price_by_type = filtered_properties.values('property_type').annotate(
                avg_price=Avg('price_per_night')
            )
            
            # Properties created over time (last 12 months) - improved calculation
            monthly_data = []
            today = timezone.now().date()
            for i in range(11, -1, -1):  # Last 12 months
                month_date = date(today.year, today.month, 1)
                # Go back i months
                for _ in range(i):
                    if month_date.month == 1:
                        month_date = date(month_date.year - 1, 12, 1)
                    else:
                        month_date = date(month_date.year, month_date.month - 1, 1)
                
                last_day = monthrange(month_date.year, month_date.month)[1]
                month_start = timezone.make_aware(datetime(month_date.year, month_date.month, 1))
                month_end = timezone.make_aware(datetime(month_date.year, month_date.month, last_day, 23, 59, 59))
                
                count = filtered_properties.filter(
                    created_at__gte=month_start,
                    created_at__lte=month_end
                ).count()
                
                # Also get bookings and revenue for this month
                month_bookings = Booking.objects.filter(
                    status__in=['confirmed', 'completed'],
                    created_at__gte=month_start,
                    created_at__lte=month_end
                ).filter(property__in=filtered_properties)
                month_revenue = month_bookings.aggregate(Sum('total_price'))['total_price__sum'] or 0
                month_booking_count = month_bookings.count()
                
                monthly_data.append({
                    'month': month_date.strftime('%b %Y'),
                    'count': count,
                    'revenue': float(month_revenue),
                    'bookings': month_booking_count
                })
            
            # Revenue by city (for comparison)
            revenue_by_city = filtered_properties.values('city', 'country').annotate(
                total_revenue=Sum(
                    'bookings__total_price',
                    filter=Q(bookings__status__in=['confirmed', 'completed'])
                ),
                booking_count=Count(
                    'bookings',
                    filter=Q(bookings__status__in=['confirmed', 'completed'])
                ),
                property_count=Count('id')
            ).filter(total_revenue__isnull=False).order_by('-total_revenue')[:10]
            
            # Revenue by property type (asset comparison)
            revenue_by_type = filtered_properties.values('property_type').annotate(
                total_revenue=Sum(
                    'bookings__total_price',
                    filter=Q(bookings__status__in=['confirmed', 'completed'])
                ),
                booking_count=Count(
                    'bookings',
                    filter=Q(bookings__status__in=['confirmed', 'completed'])
                ),
                property_count=Count('id'),
                avg_price=Avg('price_per_night')
            ).filter(total_revenue__isnull=False).order_by('-total_revenue')
            
            # Occupancy by city (portfolio comparison)
            # Use a rolling window so the chart is populated even if there are no bookings "today"
            occupancy_by_city = []
            period_days = 90
            end_date = today
            start_date = end_date - timedelta(days=period_days)

            for city_data in filtered_properties.values('city', 'country').annotate(
                property_count=Count('id', filter=Q(status='approved'))
            ).filter(property_count__gt=0):
                city = city_data['city']
                country = city_data['country']
                property_count = city_data['property_count']

                # Get bookings overlapping the analysis window for this city
                city_properties = filtered_properties.filter(city=city, status='approved')
                city_bookings = Booking.objects.filter(
                    property__in=city_properties,
                    status__in=['confirmed', 'completed'],
                    check_in__lt=end_date,
                    check_out__gt=start_date,
                )

                # Calculate total booked days within the window
                total_booked_days = 0
                for booking in city_bookings:
                    overlap_start = max(booking.check_in, start_date)
                    overlap_end = min(booking.check_out, end_date)
                    booked_days = (overlap_end - overlap_start).days
                    if booked_days > 0:
                        total_booked_days += booked_days

                total_available_days = property_count * period_days
                occupancy_rate = (total_booked_days / total_available_days * 100) if total_available_days > 0 else 0

                occupancy_by_city.append({
                    'city': city,
                    'country': country,
                    'occupancy_rate': round(min(100, occupancy_rate), 1),
                    'property_count': property_count,
                })

            occupancy_by_city = sorted(
                occupancy_by_city,
                key=lambda x: x['occupancy_rate'],
                reverse=True,
            )[:10]
            
            # Time period comparisons (last 3 months vs previous 3 months)
            now = timezone.now()
            last_3_months_start = now - timedelta(days=90)
            prev_3_months_start = last_3_months_start - timedelta(days=90)
            
            # Last 3 months
            last_3_bookings = Booking.objects.filter(
                status__in=['confirmed', 'completed'],
                created_at__gte=last_3_months_start,
                created_at__lte=now
            ).filter(property__in=filtered_properties)
            last_3_revenue = last_3_bookings.aggregate(Sum('total_price'))['total_price__sum'] or 0
            last_3_count = last_3_bookings.count()
            
            # Previous 3 months
            prev_3_bookings = Booking.objects.filter(
                status__in=['confirmed', 'completed'],
                created_at__gte=prev_3_months_start,
                created_at__lt=last_3_months_start
            ).filter(property__in=filtered_properties)
            prev_3_revenue = prev_3_bookings.aggregate(Sum('total_price'))['total_price__sum'] or 0
            prev_3_count = prev_3_bookings.count()
            
            # Calculate growth rates
            revenue_growth = ((last_3_revenue - prev_3_revenue) / prev_3_revenue * 100) if prev_3_revenue > 0 else (100 if last_3_revenue > 0 else 0)
            booking_growth = ((last_3_count - prev_3_count) / prev_3_count * 100) if prev_3_count > 0 else (100 if last_3_count > 0 else 0)
            
            # Top performing properties (by revenue)
            top_properties = filtered_properties.annotate(
                total_revenue=Sum(
                    'bookings__total_price',
                    filter=Q(bookings__status__in=['confirmed', 'completed'])
                ),
                booking_count=Count(
                    'bookings',
                    filter=Q(bookings__status__in=['confirmed', 'completed'])
                )
            ).filter(total_revenue__isnull=False).order_by('-total_revenue')[:5]
            
            top_properties_data = []
            for prop in top_properties:
                top_properties_data.append({
                    'title': prop.title,
                    'city': prop.city,
                    'country': prop.country,
                    'revenue': float(prop.total_revenue or 0),
                    'bookings': prop.booking_count or 0,
                    'type': prop.property_type
                })
            
            # Summary statistics
            total_properties = filtered_properties.count()
            active_properties = filtered_properties.filter(status='approved').count()
            total_revenue_all = Booking.objects.filter(
                status__in=['confirmed', 'completed'],
                property__in=filtered_properties
            ).aggregate(Sum('total_price'))['total_price__sum'] or 0
            total_bookings_all = Booking.objects.filter(
                status__in=['confirmed', 'completed'],
                property__in=filtered_properties
            ).count()
            
            return Response({
                'by_type': list(by_type),
                'by_status': list(by_status),
                'by_city': list(by_city),
                'avg_price_by_type': list(avg_price_by_type),
                'monthly_trend': monthly_data,
                'revenue_by_city': list(revenue_by_city),
                'revenue_by_type': list(revenue_by_type),
                'occupancy_by_city': occupancy_by_city,
                'time_comparison': {
                    'last_3_months': {
                        'revenue': float(last_3_revenue),
                        'bookings': last_3_count
                    },
                    'prev_3_months': {
                        'revenue': float(prev_3_revenue),
                        'bookings': prev_3_count
                    },
                    'revenue_growth': round(revenue_growth, 1),
                    'booking_growth': round(booking_growth, 1)
                },
                'top_properties': top_properties_data,
                'summary': {
                    'total_properties': total_properties,
                    'active_properties': active_properties,
                    'total_revenue': float(total_revenue_all),
                    'total_bookings': total_bookings_all,
                    'top_city': by_city[0]['city'] if by_city else None,
                    'top_city_count': by_city[0]['count'] if by_city else 0
                }
            })
        except Exception as e:
            import traceback
            return Response(
                {'error': str(e), 'traceback': traceback.format_exc()},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AssetPerformanceView(APIView):
    """API endpoint for asset performance and KPIs."""
    
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Get asset performance data."""
        from properties.models import PropertyExpense
        from calendar import monthrange
        from datetime import date, datetime
        
        # Get filter parameters
        days = int(request.query_params.get('days', 30))
        country = request.query_params.get('country', '')
        city = request.query_params.get('city', '')
        property_type = request.query_params.get('property_type', '')
        property_status = request.query_params.get('property_status', '')
        start_date_param = request.query_params.get('start_date', '')
        end_date_param = request.query_params.get('end_date', '')
        landlord_id = request.query_params.get('landlord_id', '')
        
        # Determine date range
        if start_date_param and end_date_param:
            try:
                start_date = timezone.make_aware(datetime.strptime(start_date_param, '%Y-%m-%d'))
                end_date = timezone.make_aware(datetime.strptime(end_date_param, '%Y-%m-%d'))
                # Ensure end_date is at end of day
                end_date = end_date.replace(hour=23, minute=59, second=59)
            except ValueError:
                end_date = timezone.now()
                start_date = end_date - timedelta(days=days)
        else:
            end_date = timezone.now()
            start_date = end_date - timedelta(days=days)
        
        # Build property filter queryset
        property_filter = Q()
        if country:
            property_filter &= Q(country=country)
        if city:
            property_filter &= Q(city=city)
        if property_type:
            property_filter &= Q(property_type=property_type)
        if property_status:
            property_filter &= Q(status=property_status)
        else:
            # Default to approved properties if no status filter
            property_filter &= Q(status='approved')
        if landlord_id:
            property_filter &= Q(landlord_id=landlord_id)
        
        # Get filtered properties
        filtered_properties = Property.objects.filter(property_filter)
        
        # Revenue calculations - current period (filtered by property)
        confirmed_bookings = Booking.objects.filter(
            status__in=['confirmed', 'completed'],
            created_at__gte=start_date,
            created_at__lte=end_date,
            property__in=filtered_properties
        )
        
        total_revenue = confirmed_bookings.aggregate(Sum('total_price'))['total_price__sum'] or 0
        booking_count = confirmed_bookings.count()
        
        # Previous period for comparison
        period_duration = (end_date - start_date).days
        prev_start = start_date - timedelta(days=period_duration)
        prev_bookings = Booking.objects.filter(
            status__in=['confirmed', 'completed'],
            created_at__gte=prev_start,
            created_at__lt=start_date,
            property__in=filtered_properties
        )
        prev_revenue = prev_bookings.aggregate(Sum('total_price'))['total_price__sum'] or 0
        prev_booking_count = prev_bookings.count()
        
        revenue_change = ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else (100 if total_revenue > 0 else 0)
        
        # Average booking value
        avg_booking_value = (total_revenue / booking_count) if booking_count > 0 else 0
        prev_avg_booking_value = (prev_revenue / prev_booking_count) if prev_booking_count > 0 else 0
        booking_value_change = ((avg_booking_value - prev_avg_booking_value) / prev_avg_booking_value * 100) if prev_avg_booking_value > 0 else (100 if avg_booking_value > 0 else 0)
        
        bookings_change = ((booking_count - prev_booking_count) / prev_booking_count * 100) if prev_booking_count > 0 else (100 if booking_count > 0 else 0)
        
        # Occupancy rate - calculate based on actual booking days vs available days
        total_properties = filtered_properties.count()
        
        # Calculate occupancy for current period
        # Get all unique properties with active bookings in the period
        active_bookings = Booking.objects.filter(
            status__in=['confirmed', 'completed'],
            check_in__lte=end_date.date(),
            check_out__gte=start_date.date(),
            property__in=filtered_properties
        )
        
        # Calculate total booked days across all properties
        total_booked_days = 0
        for booking in active_bookings:
            # Calculate overlap between booking period and analysis period
            overlap_start = max(booking.check_in, start_date.date())
            overlap_end = min(booking.check_out, end_date.date())
            if overlap_start <= overlap_end:
                booked_days = (overlap_end - overlap_start).days
                total_booked_days += booked_days
        
        # Calculate total available days (all properties * days in period)
        period_days = (end_date.date() - start_date.date()).days + 1
        total_available_days = total_properties * period_days if total_properties > 0 else 0
        occupancy_rate = (total_booked_days / total_available_days * 100) if total_available_days > 0 else 0
        
        # Previous period occupancy
        prev_active_bookings = Booking.objects.filter(
            status__in=['confirmed', 'completed'],
            check_in__lte=start_date.date(),
            check_out__gte=prev_start.date(),
            property__in=filtered_properties
        )
        
        prev_total_booked_days = 0
        for booking in prev_active_bookings:
            overlap_start = max(booking.check_in, prev_start.date())
            overlap_end = min(booking.check_out, start_date.date())
            if overlap_start <= overlap_end:
                booked_days = (overlap_end - overlap_start).days
                prev_total_booked_days += booked_days
        
        prev_total_available_days = total_properties * period_days if total_properties > 0 else 0
        prev_occupancy_rate = (prev_total_booked_days / prev_total_available_days * 100) if prev_total_available_days > 0 else 0
        occupancy_change = occupancy_rate - prev_occupancy_rate
        
        # Monthly revenue data - last 6 months
        monthly_data = []
        today = timezone.now().date()
        for i in range(5, -1, -1):  # Last 6 months
            month_date = date(today.year, today.month, 1)
            # Go back i months
            for _ in range(i):
                if month_date.month == 1:
                    month_date = date(month_date.year - 1, 12, 1)
                else:
                    month_date = date(month_date.year, month_date.month - 1, 1)
            
            # Get first and last day of month
            last_day = monthrange(month_date.year, month_date.month)[1]
            month_start = timezone.make_aware(datetime(month_date.year, month_date.month, 1))
            month_end = timezone.make_aware(datetime(month_date.year, month_date.month, last_day, 23, 59, 59))
            
            # Revenue for this month (filtered by property)
            month_revenue = Booking.objects.filter(
                status__in=['confirmed', 'completed'],
                created_at__gte=month_start,
                created_at__lte=month_end,
                property__in=filtered_properties
            ).aggregate(Sum('total_price'))['total_price__sum'] or 0
            
            # Expenses for this month (from PropertyExpense model, filtered by property)
            month_expenses = PropertyExpense.objects.filter(
                expense_date__year=month_date.year,
                expense_date__month=month_date.month,
                property__in=filtered_properties
            ).aggregate(Sum('amount'))['amount__sum'] or 0
            
            monthly_data.append({
                'month': month_date.strftime('%b'),
                'revenue': float(month_revenue),
                'expenses': float(month_expenses),
                'profit': float(month_revenue - month_expenses)
            })
        
        # Property performance - top 10 properties by revenue
        property_performance = []
        properties = filtered_properties.annotate(
            prop_revenue=Sum(
                'bookings__total_price',
                filter=Q(
                    bookings__status__in=['confirmed', 'completed'],
                    bookings__created_at__gte=start_date,
                    bookings__created_at__lte=end_date
                )
            ),
            prop_booking_count=Count(
                'bookings',
                filter=Q(
                    bookings__status__in=['confirmed', 'completed'],
                    bookings__created_at__gte=start_date,
                    bookings__created_at__lte=end_date
                )
            )
        ).order_by('-prop_revenue')[:10]
        
        for prop in properties:
            prop_revenue = float(prop.prop_revenue or 0)
            prop_booking_count = prop.prop_booking_count or 0
            
            # Calculate property occupancy (booked days / available days in period)
            prop_bookings = Booking.objects.filter(
                property=prop,
                status__in=['confirmed', 'completed'],
                check_in__lte=end_date.date(),
                check_out__gte=start_date.date()
            )
            
            prop_booked_days = 0
            for booking in prop_bookings:
                overlap_start = max(booking.check_in, start_date.date())
                overlap_end = min(booking.check_out, end_date.date())
                if overlap_start <= overlap_end:
                    prop_booked_days += (overlap_end - overlap_start).days
            
            prop_occupancy = (prop_booked_days / period_days * 100) if period_days > 0 else 0
            
            property_performance.append({
                'property': prop.title,
                'revenue': prop_revenue,
                'bookings': prop_booking_count,
                'occupancy': round(min(100, prop_occupancy), 1)
            })
        
        # Expense categories - aggregate from PropertyExpense model (filtered by property)
        expense_categories_data = PropertyExpense.objects.filter(
            expense_date__gte=start_date.date(),
            expense_date__lte=end_date.date(),
            property__in=filtered_properties
        ).values('category').annotate(
            total=Sum('amount')
        ).order_by('-total')
        
        # Map category codes to display names and assign colors
        category_colors = {
            'management_fee': '#3b82f6',
            'mortgage': '#10b981',
            'cleaning': '#f59e0b',
            'maintenance': '#ef4444',
            'utilities': '#8b5cf6',
            'property_tax': '#ec4899',
            'insurance': '#06b6d4',
            'hoa_fees': '#84cc16',
            'repairs': '#f97316',
            'other': '#6366f1',
        }
        
        category_display_names = {
            'management_fee': 'Management Fees',
            'mortgage': 'Mortgage/Loan',
            'cleaning': 'Cleaning',
            'maintenance': 'Maintenance',
            'utilities': 'Utilities',
            'property_tax': 'Taxes',
            'insurance': 'Insurance',
            'hoa_fees': 'HOA Fees',
            'repairs': 'Repairs',
            'other': 'Other',
        }
        
        expense_categories = []
        for item in expense_categories_data:
            category_code = item['category']
            expense_categories.append({
                'name': category_display_names.get(category_code, category_code.replace('_', ' ').title()),
                'value': float(item['total']),
                'color': category_colors.get(category_code, '#6366f1')
            })
        
        # If no expenses, return empty list (not mock data)
        
        return Response({
            'kpis': {
                'total_revenue': float(total_revenue),
                'revenue_change': round(revenue_change, 1),
                'occupancy_rate': round(occupancy_rate, 1),
                'occupancy_change': round(occupancy_change, 1),
                'average_booking_value': round(avg_booking_value, 2),
                'booking_value_change': round(booking_value_change, 1),
                'total_bookings': booking_count,
                'bookings_change': round(bookings_change, 1),
            },
            'monthly_revenue': monthly_data,
            'property_performance': property_performance,
            'expense_categories': expense_categories
        })

