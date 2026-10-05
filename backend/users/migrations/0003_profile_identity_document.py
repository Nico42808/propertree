from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_alter_profile_profile_photo'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='identity_document',
            field=models.FileField(blank=True, null=True, upload_to='identity_documents/'),
        ),
    ]
