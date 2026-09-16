"""Property document storage for owner and admin property management."""
import uuid
from django.db import models
from django.conf import settings


class PropertyDocument(models.Model):
    CATEGORY_CHOICES = [
        ('management_agreement', 'Management Agreement'),
        ('insurance', 'Insurance'),
        ('property_tax', 'Property Tax'),
        ('utilities', 'Utilities'),
        ('permits', 'Permits'),
        ('warranties', 'Warranties'),
        ('invoices', 'Invoices'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        'properties.Property',
        on_delete=models.CASCADE,
        related_name='documents',
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='uploaded_property_documents',
    )
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    file = models.FileField(upload_to='property_documents/')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'property_documents'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['property', 'category']),
            models.Index(fields=['property', 'created_at']),
        ]

    def __str__(self):
        return f"{self.title} - {self.property.title}"
