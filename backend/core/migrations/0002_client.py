# Generated migration for Client model

import uuid
import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Client',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=200, verbose_name='Nom')),
                ('address', models.CharField(max_length=300, verbose_name='Adresse')),
                ('address_number', models.CharField(blank=True, max_length=20, verbose_name='N°')),
                ('postal_code', models.CharField(max_length=10, validators=[django.core.validators.RegexValidator('^\\d{4,5}$', 'Code postal invalide')], verbose_name='Code postal')),
                ('locality', models.CharField(max_length=100, verbose_name='Localité')),
                ('phone', models.CharField(blank=True, max_length=20, verbose_name='Téléphone')),
                ('gsm', models.CharField(blank=True, max_length=20, verbose_name='GSM')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Client',
                'verbose_name_plural': 'Clients',
                'ordering': ['name'],
            },
        ),
    ]
