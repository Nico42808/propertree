"""
Simplified Property model for Propertree.
"""
import uuid
from django.db import models
from django.db.models import Q
from django.conf import settings


class Property(models.Model):
    """
    Property model - stores all property information.
    Handles both listing and availability status.
    """
    
    PROPERTY_TYPES = [
        ('apartment', 'Apartment'),
        ('house', 'House'),
        ('room', 'Room'),
        ('condo', 'Condo'),
        ('villa', 'Villa'),
        ('studio', 'Studio'),
        ('townhouse', 'Townhouse'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending_approval', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('booked', 'Booked'),
    ]

    APPROVAL_TYPE_CHOICES = [
        ('landlord', 'Landlord Approval'),
        ('admin', 'Admin Approval'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    landlord = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='properties', limit_choices_to={'role': 'landlord'})
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_properties', limit_choices_to={'role': 'admin'})
    title = models.CharField(max_length=255)
    description = models.TextField()
    property_type = models.CharField(max_length=50, choices=PROPERTY_TYPES)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    bedrooms = models.IntegerField()
    bathrooms = models.DecimalField(max_digits=3, decimal_places=1)
    max_guests = models.IntegerField()
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    monthly_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    rental_terms = models.JSONField(default=list, blank=True)
    approval_type = models.CharField(max_length=20, choices=APPROVAL_TYPE_CHOICES, default='landlord', help_text='Who should approve booking requests for this property')
    amenities = models.JSONField(default=list, blank=True)
    photos = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='draft')
    rejection_reason = models.TextField(blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'properties'
        verbose_name = 'Property'
        verbose_name_plural = 'Properties'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.city} ({self.status})"
    
    def is_available(self):
        return self.status == 'approved'
    
    def is_available_for_dates(self, check_in, check_out, exclude_booking_id=None):
        if self.status != 'approved':
            return False
        from bookings.models import Booking
        overlapping_bookings = Booking.objects.filter(property=self, status__in=['confirmed', 'pending']).filter(Q(check_in__lt=check_out, check_out__gt=check_in))
        if exclude_booking_id:
            overlapping_bookings = overlapping_bookings.exclude(id=exclude_booking_id)
        return not overlapping_bookings.exists()
    
    def get_primary_photo(self):
        if self.photos and len(self.photos) > 0:
            return self.photos[0]
        return None
    
    def submit_for_approval(self):
        self.status = 'pending_approval'
        self.save()
    
    def approve(self, admin_user):
        from django.utils import timezone
        self.status = 'approved'
        self.approved_by = admin_user
        self.approved_at = timezone.now()
        self.rejection_reason = ''
        self.save()
    
    def reject(self, reason):
        self.status = 'rejected'
        self.rejection_reason = reason
        self.save()


class PropertyExpense(models.Model):
    EXPENSE_CATEGORIES = [
        ('utilities', 'Utilities'), ('property_tax', 'Property Tax'), ('insurance', 'Insurance'),
        ('hoa_fees', 'HOA Fees'), ('maintenance', 'Maintenance'), ('repairs', 'Repairs'),
        ('cleaning', 'Cleaning'), ('mortgage', 'Mortgage Payment'), ('management_fee', 'Management Fee'),
        ('other', 'Other'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='expenses')
    category = models.CharField(max_length=50, choices=EXPENSE_CATEGORIES)
    description = models.TextField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    expense_date = models.DateField()
    is_recurring = models.BooleanField(default=False)
    recurrence_frequency = models.CharField(max_length=20, choices=[('monthly', 'Monthly'), ('quarterly', 'Quarterly'), ('semi_annual', 'Semi-Annual'), ('annual', 'Annual')], blank=True, null=True)
    receipt_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'property_expenses'
        verbose_name = 'Property Expense'
        verbose_name_plural = 'Property Expenses'
        ordering = ['-expense_date']
        indexes = [models.Index(fields=['property', 'expense_date']), models.Index(fields=['property', 'category'])]
    
    def __str__(self):
        return f"{self.get_category_display()} - CAD ${self.amount:,.2f} ({self.property.title})"


class Favorite(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'favorites'
        verbose_name = 'Favorite'
        verbose_name_plural = 'Favorites'
        ordering = ['-created_at']
        unique_together = ['user', 'property']
        indexes = [models.Index(fields=['user', 'created_at']), models.Index(fields=['property'])]
    
    def __str__(self):
        return f"{self.user.email} - {self.property.title}"


# Imported so Django discovers the model while keeping document concerns isolated.
from .documents import PropertyDocument  # noqa: E402,F401
