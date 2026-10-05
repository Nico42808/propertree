from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('properties', '0011_propertydocument_review_audit'),
    ]

    operations = [
        migrations.AddField(
            model_name='propertydocument',
            name='verification_blob',
            field=models.BinaryField(blank=True, editable=False, null=True),
        ),
        migrations.AddField(
            model_name='propertydocument',
            name='verification_filename',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='propertydocument',
            name='verification_content_type',
            field=models.CharField(blank=True, max_length=120),
        ),
    ]
