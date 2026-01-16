"""
Simplified views for Properties app.
"""
from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from datetime import datetime

from .models import Property, PropertyExpense, Favorite
from .serializers import (
    PropertyListSerializer,
    PropertyDetailSerializer,
    PropertyCreateSerializer,
    PropertyExpenseSerializer,
    PropertyExpenseCreateSerializer,
    FavoriteSerializer,
    FavoriteCreateSerializer
)


class PropertyListView(generics.ListAPIView):
    """
    API endpoint to list all approved properties (public view).
    Tenants can browse and search properties here.
    """
    
    serializer_class = PropertyListSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['property_type', 'city', 'state', 'country', 'bedrooms', 'bathrooms']
    search_fields = ['title', 'description', 'city', 'address']
    ordering_fields = ['price_per_night', 'created_at', 'bedrooms']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Return only approved properties for public viewing."""
        queryset = Property.objects.filter(status='approved')
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        
        if min_price:
            queryset = queryset.filter(price_per_night__gte=min_price)
        if max_price:
            queryset = queryset.filter(price_per_night__lte=max_price)
        
        # Filter by guests
        guests = self.request.query_params.get('guests')
        if guests:
            queryset = queryset.filter(max_guests__gte=guests)

        rental_term = self.request.query_params.get('rental_term')
        if rental_term:
            queryset = queryset.filter(rental_terms__contains=[rental_term])

        # Filter by availability for a given date range.
        # Only return properties that are not already booked (pending or confirmed)
        # for any of the requested dates.
        check_in_str = self.request.query_params.get('check_in')
        check_out_str = self.request.query_params.get('check_out')

        if check_in_str and check_out_str:
            try:
                check_in = datetime.strptime(check_in_str, '%Y-%m-%d').date()
                check_out = datetime.strptime(check_out_str, '%Y-%m-%d').date()

                # Only apply availability filter for valid ranges
                if check_in < check_out:
                    from bookings.models import Booking

                    overlapping_property_ids = Booking.objects.filter(
                        property__in=queryset,
                        status__in=['pending', 'confirmed'],
                    ).filter(
                        Q(check_in__lt=check_out, check_out__gt=check_in)
                    ).values_list('property_id', flat=True)

                    queryset = queryset.exclude(id__in=overlapping_property_ids)
            except ValueError:
                # If dates are invalid, ignore availability filter and return basic results
                pass
        
        return queryset


class PropertyDetailView(generics.RetrieveAPIView):
    """
    API endpoint to get property details.
    """
    
    serializer_class = PropertyDetailSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = Property.objects.all()


class LandlordPropertyListView(generics.ListAPIView):
    """
    API endpoint for landlords to see their own properties.
    Shows all statuses (draft, pending, approved, rejected, booked).
    """
    
    serializer_class = PropertyListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return properties owned by the current landlord."""
        return Property.objects.filter(landlord=self.request.user).order_by('-created_at')


class LandlordPropertyCreateView(generics.CreateAPIView):
    """
    API endpoint for landlords to create new properties.
    """
    
    serializer_class = PropertyCreateSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        """Save property with current user as landlord."""
        serializer.save(landlord=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Create property and return detailed response with ID."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Return the created property with full details
        property_instance = serializer.instance
        response_serializer = PropertyDetailSerializer(property_instance)
        
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class LandlordPropertyUpdateView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for landlords to update/delete their properties.
    """
    
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on request method."""
        if self.request.method in ['PATCH', 'PUT']:
            return PropertyCreateSerializer
        return PropertyDetailSerializer
    
    def get_queryset(self):
        """Return only properties owned by the current landlord."""
        return Property.objects.filter(landlord=self.request.user)
    
    def update(self, request, *args, **kwargs):
        """Update property and return updated data."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Return the updated data using PropertyDetailSerializer
        return Response(PropertyDetailSerializer(instance).data)


class PropertySubmitForApprovalView(APIView):
    """
    API endpoint for landlords to submit property for approval.
    Changes status from 'draft' to 'pending_approval'.
    """
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        """Submit property for approval."""
        try:
            property_obj = Property.objects.get(pk=pk, landlord=request.user)
            
            if property_obj.status != 'draft':
                return Response(
                    {'error': 'Only draft properties can be submitted for approval'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            property_obj.submit_for_approval()
            
            return Response({
                'message': 'Property submitted for approval',
                'property': PropertyDetailSerializer(property_obj).data
            }, status=status.HTTP_200_OK)
            
        except Property.DoesNotExist:
            return Response(
                {'error': 'Property not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class PropertyExpenseListView(generics.ListAPIView):
    """
    API endpoint for landlords to view all expenses across their properties.
    """
    
    serializer_class = PropertyExpenseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return expenses for properties owned by the current landlord."""
        return PropertyExpense.objects.filter(
            property__landlord=self.request.user
        ).order_by('-expense_date')


class PropertyExpenseCreateView(generics.CreateAPIView):
    """
    API endpoint for landlords to create new property expenses.
    """
    
    serializer_class = PropertyExpenseCreateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_context(self):
        """Add request to serializer context for validation."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """Create expense and return detailed response."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Return the created expense with full details
        expense_instance = serializer.instance
        response_serializer = PropertyExpenseSerializer(expense_instance)
        
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class PropertyExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for landlords to view, update, or delete a specific expense.
    """
    
    serializer_class = PropertyExpenseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return only expenses for properties owned by the current landlord."""
        return PropertyExpense.objects.filter(property__landlord=self.request.user)


class PropertyExpenseListByPropertyView(generics.ListAPIView):
    """
    API endpoint to get all expenses for a specific property.
    """
    
    serializer_class = PropertyExpenseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return expenses for the specified property if owned by current landlord."""
        property_id = self.kwargs.get('property_id')
        return PropertyExpense.objects.filter(
            property_id=property_id,
            property__landlord=self.request.user
        ).order_by('-expense_date')


class FavoriteListView(generics.ListCreateAPIView):
    """
    API endpoint to list user's favorites and add new favorites.
    GET: List all favorites for the current user
    POST: Add a property to favorites
    """
    
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on request method."""
        if self.request.method == 'POST':
            return FavoriteCreateSerializer
        return FavoriteSerializer
    
    def get_queryset(self):
        """Return favorites for the current user."""
        return Favorite.objects.filter(user=self.request.user).select_related('property')
    
    def create(self, request, *args, **kwargs):
        """Create a new favorite."""
        serializer = FavoriteCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        property_id = serializer.validated_data['property_id']
        
        # Check if favorite already exists
        favorite, created = Favorite.objects.get_or_create(
            user=request.user,
            property_id=property_id
        )
        
        if not created:
            return Response(
                {'error': 'Property is already in favorites.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Return the created favorite with property details
        response_serializer = FavoriteSerializer(favorite)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class FavoriteDeleteView(generics.DestroyAPIView):
    """
    API endpoint to remove a property from favorites.
    DELETE: Remove a favorite by ID
    """
    
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return only favorites owned by the current user."""
        return Favorite.objects.filter(user=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """Delete the favorite."""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {'message': 'Favorite removed successfully.'},
            status=status.HTTP_200_OK
        )
