from django.db import migrations, models
import django.db.models.deletion
import uuid
from django.conf import settings


class Migration(migrations.Migration):
    dependencies = [
        ('properties', '0008_alter_property_property_type'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='PropertyDocument',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=255)),
                ('category', models.CharField(choices=[('management_agreement', 'Management Agreement'), ('insurance', 'Insurance'), ('property_tax', 'Property Tax'), ('utilities', 'Utilities'), ('permits', 'Permits'), ('warranties', 'Warranties'), ('invoices', 'Invoices'), ('other', 'Other')], default='other', max_length=50)),
                ('file', models.FileField(upload_to='property_documents/')),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('property', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='documents', to='properties.property')),
                ('uploaded_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='uploaded_property_documents', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'property_documents',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='propertydocument',
            index=models.Index(fields=['property', 'category'], name='property_do_propert_b7280a_idx'),
        ),
        migrations.AddIndex(
            model_name='propertydocument',
            index=models.Index(fields=['property', 'created_at'], name='property_do_propert_d647bb_idx'),
        ),
    ]
