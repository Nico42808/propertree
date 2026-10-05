from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('properties', '0010_property_verification_categories'),
    ]

    operations = [
        migrations.AddField(
            model_name='propertydocument',
            name='reviewed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='propertydocument',
            name='reviewed_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='reviewed_property_documents',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
