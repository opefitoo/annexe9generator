# Generated migration for OperatorConfig model

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_alter_order_template_version'),
    ]

    operations = [
        migrations.CreateModel(
            name='OperatorConfig',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200, verbose_name='Nom')),
                ('address', models.CharField(max_length=300, verbose_name='Adresse')),
                ('address_number', models.CharField(blank=True, max_length=20, verbose_name='N°')),
                ('postal_code', models.CharField(max_length=10, validators=[django.core.validators.RegexValidator('^\\d{4,5}$', 'Code postal invalide')], verbose_name='Code postal')),
                ('locality', models.CharField(max_length=100, verbose_name='Localité')),
                ('bce_number', models.CharField(blank=True, help_text='Numéro à la Banque-Carrefour des Entreprises', max_length=50, verbose_name='N° BCE')),
                ('authorization_number', models.CharField(blank=True, max_length=50, verbose_name="N° d'autorisation")),
                ('authorization_date', models.DateField(blank=True, null=True, verbose_name="Date d'autorisation")),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Configuration Exploitant',
                'verbose_name_plural': 'Configuration Exploitant',
            },
        ),
    ]
