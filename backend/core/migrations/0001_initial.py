# Generated migration for core app

import uuid
from django.conf import settings
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Template',
            fields=[
                ('version', models.CharField(max_length=50, primary_key=True, serialize=False, unique=True)),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('layout_spec', models.JSONField(default=dict, help_text='JSON specification for PDF layout')),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Template',
                'verbose_name_plural': 'Templates',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Order',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('reference', models.CharField(help_text='Unique reference number (e.g., TC-2025-000123)', max_length=50, unique=True)),
                ('status', models.CharField(choices=[('draft', 'Brouillon'), ('generated', 'Généré'), ('sent', 'Envoyé'), ('archived', 'Archivé')], default='draft', max_length=20)),
                ('language', models.CharField(default='fr', max_length=5)),
                ('reservation_date', models.DateField(verbose_name='Date de réservation')),
                ('reservation_number', models.CharField(blank=True, max_length=50, verbose_name='N° de réservation')),
                ('operator_name', models.CharField(max_length=200, verbose_name="Nom de l'exploitant")),
                ('operator_address', models.CharField(max_length=300, verbose_name='Adresse')),
                ('operator_address_number', models.CharField(blank=True, max_length=20, verbose_name='N°')),
                ('operator_postal_code', models.CharField(max_length=10, validators=[django.core.validators.RegexValidator('^\\d{4,5}$', 'Code postal invalide')], verbose_name='Code postal')),
                ('operator_locality', models.CharField(max_length=100, verbose_name='Localité')),
                ('operator_bce_number', models.CharField(blank=True, help_text='Numéro à la Banque-Carrefour des Entreprises', max_length=50, verbose_name='N° BCE')),
                ('operator_authorization_number', models.CharField(blank=True, max_length=50, verbose_name="N° d'autorisation")),
                ('operator_authorization_date', models.DateField(blank=True, null=True, verbose_name="Date d'autorisation")),
                ('client_name', models.CharField(max_length=200, verbose_name='Nom du client')),
                ('client_address', models.CharField(max_length=300, verbose_name='Adresse')),
                ('client_address_number', models.CharField(blank=True, max_length=20, verbose_name='N°')),
                ('client_postal_code', models.CharField(max_length=10, validators=[django.core.validators.RegexValidator('^\\d{4,5}$', 'Code postal invalide')], verbose_name='Code postal')),
                ('client_locality', models.CharField(max_length=100, verbose_name='Localité')),
                ('client_phone', models.CharField(blank=True, max_length=20, verbose_name='Téléphone')),
                ('client_gsm', models.CharField(blank=True, max_length=20, verbose_name='GSM')),
                ('passengers_adult', models.PositiveIntegerField(default=1, verbose_name="Nombre d'adultes")),
                ('passengers_child', models.PositiveIntegerField(default=0, verbose_name="Nombre d'enfants (-12 ans)")),
                ('service_type', models.CharField(choices=[('aller', 'Aller'), ('retour', 'Retour'), ('aller_retour', 'Aller/Retour')], default='aller', max_length=20, verbose_name='Type de service')),
                ('aller_date', models.DateField(blank=True, null=True, verbose_name='Date aller')),
                ('aller_time', models.TimeField(blank=True, null=True, verbose_name='Heure aller')),
                ('aller_departure', models.CharField(blank=True, max_length=300, verbose_name='Lieu de départ')),
                ('aller_destination', models.CharField(blank=True, max_length=300, verbose_name='Destination')),
                ('aller_price', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True, verbose_name='Prix aller par personne')),
                ('retour_date', models.DateField(blank=True, null=True, verbose_name='Date retour')),
                ('retour_time', models.TimeField(blank=True, null=True, verbose_name='Heure retour')),
                ('retour_departure', models.CharField(blank=True, max_length=300, verbose_name='Lieu de départ retour')),
                ('retour_destination', models.CharField(blank=True, max_length=300, verbose_name='Destination retour')),
                ('retour_price', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True, verbose_name='Prix retour par personne')),
                ('operator_signature', models.ImageField(blank=True, null=True, upload_to='signatures/operator/', verbose_name='Signature exploitant')),
                ('client_signature', models.ImageField(blank=True, null=True, upload_to='signatures/client/', verbose_name='Signature client')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('pdf_file', models.FileField(blank=True, null=True, upload_to='pdfs/', verbose_name='Fichier PDF')),
                ('pdf_generated_at', models.DateTimeField(blank=True, null=True, verbose_name='Date de génération PDF')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='orders_created', to=settings.AUTH_USER_MODEL)),
                ('template_version', models.ForeignKey(default='Annex9_v2013', on_delete=django.db.models.deletion.PROTECT, to='core.template', to_field='version')),
            ],
            options={
                'verbose_name': 'Bon de commande',
                'verbose_name_plural': 'Bons de commande',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='OrderAuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(max_length=50)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('details', models.JSONField(default=dict)),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='audit_logs', to='core.order')),
                ('user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': "Journal d'audit",
                'verbose_name_plural': "Journaux d'audit",
                'ordering': ['-timestamp'],
            },
        ),
    ]
