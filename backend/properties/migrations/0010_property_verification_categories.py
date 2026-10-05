from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('properties', '0009_propertydocument'),
    ]

    operations = [
        migrations.AlterField(
            model_name='propertydocument',
            name='category',
            field=models.CharField(choices=[('management_agreement', 'Management Agreement'), ('insurance', 'Insurance'), ('property_tax', 'Property Tax'), ('utilities', 'Utilities'), ('permits', 'Permits'), ('warranties', 'Warranties'), ('invoices', 'Invoices'), ('proof_of_ownership', 'Proof of Ownership'), ('lease_agreement', 'Lease Agreement'), ('other', 'Other')], default='other', max_length=50),
        ),
    ]
