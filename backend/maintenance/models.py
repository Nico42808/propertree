"""
Maintenance models for Propertree platform.
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model
from properties.models import Property

User = get_user_model()


class ServiceCatalog(models.Model):
    """Pre-defined services available for booking by landlords."""

    CATEGORY_CHOICES = [
        ('plumbing', 'Plumbing'),
        ('electrical', 'Electrical'),
        ('hvac', 'HVAC'),
        ('appliance', 'Appliance Repair'),
        ('cleaning', 'Cleaning'),
        ('painting', 'Painting'),
        ('carpentry', 'Carpentry'),
        ('locksmith', 'Locksmith'),
        ('gardening', 'Gardening'),
        ('pest_control', 'Pest Control'),
        ('general_maintenance', 'General Maintenance'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    description = models.TextField()

    # Pricing Information (static price, must be under EUR 100)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Service price (must be under EUR 100)"
    )

    # Duration estimate (in minutes)
    estimated_duration_minutes = models.PositiveIntegerField(null=True, blank=True, help_text="Estimated duration in minutes")

    # UI Configuration
    icon = models.CharField(max_length=50, default='wrench', help_text="Icon name for UI display")

    # Status
    is_active = models.BooleanField(default=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Service Catalog'
        verbose_name_plural = 'Service Catalog'
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"

    @property
    def formatted_price(self):
        """Return formatted price."""
        if self.price:
            return f"EUR {self.price:,.2f}"
        return "Price on request"


class ServiceProvider(models.Model):
    """Service provider model for maintenance tasks."""

    SERVICE_TYPES = [
        ('cleaner', 'Cleaner'),
        ('plumber', 'Plumber'),
        ('electrician', 'Electrician'),
        ('carpenter', 'Carpenter'),
        ('painter', 'Painter'),
        ('hvac', 'HVAC Technician'),
        ('locksmith', 'Locksmith'),
        ('gardener', 'Gardener'),
        ('general', 'General Maintenance'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=17)
    service_type = models.CharField(max_length=50, choices=SERVICE_TYPES)

    # Additional Information
    company_name = models.CharField(max_length=200, blank=True)
    address = models.TextField(blank=True)
    description = models.TextField(blank=True)

    # Rating and Status
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0, validators=[MinValueValidator(0), MaxValueValidator(5)])
    total_jobs = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Service Provider'
        verbose_name_plural = 'Service Providers'
        ordering = ['-rating', 'name']

    def __str__(self):
        return f"{self.name} - {self.get_service_type_display()}"

    def update_rating(self):
        """Update average rating from completed jobs."""
        completed_requests = self.maintenance_requests.filter(status='resolved')
        if completed_requests.exists():
            avg_rating = completed_requests.aggregate(models.Avg('rating'))['rating__avg']
            self.rating = avg_rating or 0
            self.save(update_fields=['rating'])


class MaintenanceRequest(models.Model):
    """Maintenance request model."""

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    STATUS_CHOICES = [
        ('open', 'Open'),
        ('assigned', 'Assigned'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
        ('cancelled', 'Cancelled'),
    ]

    CATEGORY_CHOICES = [
        ('plumbing', 'Plumbing'),
        ('electrical', 'Electrical'),
        ('hvac', 'HVAC'),
        ('appliance', 'Appliance'),
        ('structural', 'Structural'),
        ('cleaning', 'Cleaning'),
        ('painting', 'Painting'),
        ('locksmith', 'Locksmith'),
        ('pest_control', 'Pest Control'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rental_property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='maintenance_requests')
    reported_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reported_maintenance')

    # Request Details
    title = models.CharField(max_length=255)
    description = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)

    # Assignment
    assigned_to = models.ForeignKey(ServiceProvider, on_delete=models.SET_NULL, null=True, blank=True, related_name='maintenance_requests')
    assigned_at = models.DateTimeField(null=True, blank=True)

    # Resolution
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])

    # Rating (given by property owner after resolution)
    rating = models.PositiveIntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)])
    rating_notes = models.TextField(blank=True)

    # Service Booking Fields (for landlord-initiated service bookings)
    service_catalog = models.ForeignKey(
        ServiceCatalog,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='service_bookings',
        help_text="Pre-defined service from catalog"
    )
    requested_date = models.DateField(null=True, blank=True, help_text="Preferred date for service")
    requested_time = models.TimeField(null=True, blank=True, help_text="Preferred time for service")
    booking_type = models.CharField(
        max_length=20,
        choices=[('emergency', 'Emergency'), ('scheduled', 'Scheduled')],
        default='scheduled'
    )

    # Admin Confirmation Fields (for service bookings)
    admin_confirmed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='confirmed_service_bookings',
        help_text="Admin who confirmed the service booking"
    )
    admin_confirmed_at = models.DateTimeField(null=True, blank=True)
    admin_rejection_reason = models.TextField(blank=True, help_text="Reason if booking was rejected by admin")

    # Metadata
    reported_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Maintenance Request'
        verbose_name_plural = 'Maintenance Requests'
        ordering = ['-priority', '-reported_at']
        indexes = [
            models.Index(fields=['rental_property', 'status']),
            models.Index(fields=['reported_by', 'status']),
            models.Index(fields=['assigned_to', 'status']),
        ]

    def __str__(self):
        return f"{self.title} - {self.rental_property.title} ({self.status})"

    @property
    def resolution_time(self):
        """Calculate resolution time in hours."""
        if self.resolved_at:
            delta = self.resolved_at - self.reported_at
            return delta.total_seconds() / 3600  # Convert to hours
        return None

    @property
    def is_overdue(self):
        """Check if request is overdue based on priority."""
        from django.utils import timezone
        if self.status in ['resolved', 'closed', 'cancelled']:
            return False

        hours_since_report = (timezone.now() - self.reported_at).total_seconds() / 3600

        # Define SLA hours based on priority
        sla_hours = {
            'urgent': 4,
            'high': 24,
            'medium': 72,
            'low': 168,  # 1 week
        }

        return hours_since_report > sla_hours.get(self.priority, 72)


class MaintenanceImage(models.Model):
    """Images for maintenance requests."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    maintenance_request = models.ForeignKey(MaintenanceRequest, on_delete=models.CASCADE, related_name='images')
    image = models.FileField(upload_to='maintenance_images/')
    caption = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Maintenance Image'
        verbose_name_plural = 'Maintenance Images'
        ordering = ['created_at']

    def __str__(self):
        return f"Image for {self.maintenance_request.title}"


class MaintenanceSchedule(models.Model):
    """Scheduled maintenance tasks."""

    FREQUENCY_CHOICES = [
        ('one_time', 'One Time'),
        ('weekly', 'Weekly'),
        ('bi_weekly', 'Bi-Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('semi_annual', 'Semi-Annual'),
        ('annual', 'Annual'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rental_property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='maintenance_schedules')
    service_provider = models.ForeignKey(ServiceProvider, on_delete=models.SET_NULL, null=True, blank=True)

    # Schedule Details
    title = models.CharField(max_length=255)
    description = models.TextField()
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    next_due_date = models.DateField()
    last_completed = models.DateField(null=True, blank=True)

    # Status
    is_active = models.BooleanField(default=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Maintenance Schedule'
        verbose_name_plural = 'Maintenance Schedules'
        ordering = ['next_due_date']

    def __str__(self):
        return f"{self.title} - {self.rental_property.title}"

    def update_next_due_date(self):
        """Update next due date based on frequency."""
        from datetime import timedelta
        from dateutil.relativedelta import relativedelta

        if not self.last_completed:
            return

        if self.frequency == 'weekly':
            self.next_due_date = self.last_completed + timedelta(weeks=1)
        elif self.frequency == 'bi_weekly':
            self.next_due_date = self.last_completed + timedelta(weeks=2)
        elif self.frequency == 'monthly':
            self.next_due_date = self.last_completed + relativedelta(months=1)
        elif self.frequency == 'quarterly':
            self.next_due_date = self.last_completed + relativedelta(months=3)
        elif self.frequency == 'semi_annual':
            self.next_due_date = self.last_completed + relativedelta(months=6)
        elif self.frequency == 'annual':
            self.next_due_date = self.last_completed + relativedelta(years=1)

        self.save(update_fields=['next_due_date'])
