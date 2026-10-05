from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_profile_identity_review_audit'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='identity_document_blob',
            field=models.BinaryField(blank=True, editable=False, null=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='identity_document_filename',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='profile',
            name='identity_document_content_type',
            field=models.CharField(blank=True, max_length=120),
        ),
    ]
