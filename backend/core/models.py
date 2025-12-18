"""
Django models for Annex 9 Generator.
"""

import uuid
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import RegexValidator


class Template(models.Model):
    """Template definition for Annex 9 forms."""

    version = models.CharField(max_length=50, unique=True, primary_key=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    layout_spec = models.JSONField(
        default=dict, help_text="JSON specification for PDF layout"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Template"
        verbose_name_plural = "Templates"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.version})"


class OperatorConfig(models.Model):
    """Singleton configuration for the default operator (exploitant)."""

    class Title(models.TextChoices):
        MADAME = "Madame", "Madame"
        MONSIEUR = "Monsieur", "Monsieur"
        SOCIETE = "Société", "Société"

    title = models.CharField(
        max_length=20,
        choices=Title.choices,
        default=Title.SOCIETE,
        verbose_name="Titre",
    )
    name = models.CharField(max_length=200, verbose_name="Nom")
    address = models.CharField(max_length=300, verbose_name="Adresse")
    address_number = models.CharField(max_length=20, blank=True, verbose_name="N°")
    postal_code = models.CharField(
        max_length=10,
        verbose_name="Code postal",
        validators=[RegexValidator(r"^\d{4,5}$", "Code postal invalide")],
    )
    locality = models.CharField(max_length=100, verbose_name="Localité")
    bce_number = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="N° BCE",
        help_text="Numéro à la Banque-Carrefour des Entreprises",
    )
    authorization_number = models.CharField(
        max_length=50, blank=True, verbose_name="N° d'autorisation"
    )
    authorization_date = models.DateField(
        null=True, blank=True, verbose_name="Date d'autorisation"
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Configuration Exploitant"
        verbose_name_plural = "Configuration Exploitant"

    def __str__(self):
        return f"Exploitant: {self.name}"

    def save(self, *args, **kwargs):
        # Ensure only one instance exists (singleton pattern)
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_instance(cls):
        """Get or create the singleton instance."""
        instance, _ = cls.objects.get_or_create(
            pk=1,
            defaults={
                'name': '',
                'address': '',
                'postal_code': '0000',
                'locality': '',
            }
        )
        return instance


class Client(models.Model):
    """Client information for reuse across orders."""

    class Title(models.TextChoices):
        MADAME = "Madame", "Madame"
        MONSIEUR = "Monsieur", "Monsieur"
        SOCIETE = "Société", "Société"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(
        max_length=20,
        choices=Title.choices,
        default=Title.MONSIEUR,
        verbose_name="Titre",
    )
    name = models.CharField(max_length=200, verbose_name="Nom")
    address = models.CharField(max_length=300, verbose_name="Adresse")
    address_number = models.CharField(max_length=20, blank=True, verbose_name="N°")
    postal_code = models.CharField(
        max_length=10,
        verbose_name="Code postal",
        validators=[RegexValidator(r"^\d{4,5}$", "Code postal invalide")],
    )
    locality = models.CharField(max_length=100, verbose_name="Localité")
    phone = models.CharField(max_length=20, blank=True, verbose_name="Téléphone")
    gsm = models.CharField(max_length=20, blank=True, verbose_name="GSM")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Client"
        verbose_name_plural = "Clients"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.locality})"


class Order(models.Model):
    """Order (Bon de commande) for taxi collectif service."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Brouillon"
        GENERATED = "generated", "Généré"
        SENT = "sent", "Envoyé"
        ARCHIVED = "archived", "Archivé"

    class ServiceType(models.TextChoices):
        ALLER = "aller", "Aller"
        RETOUR = "retour", "Retour"
        ALLER_RETOUR = "aller_retour", "Aller/Retour"

    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique reference number (e.g., TC-2025-000123)",
    )
    template_version = models.ForeignKey(
        Template,
        on_delete=models.PROTECT,
        to_field="version",
        default="Annex9_v2013",
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT
    )
    language = models.CharField(max_length=5, default="fr")

    # Reservation info
    reservation_date = models.DateField(verbose_name="Date de réservation")
    reservation_number = models.CharField(
        max_length=50, blank=True, verbose_name="N° de réservation"
    )

    # Exploitant (Operator) information
    operator_title = models.CharField(
        max_length=20,
        choices=[("Madame", "Madame"), ("Monsieur", "Monsieur"), ("Société", "Société")],
        default="Société",
        verbose_name="Titre exploitant",
    )
    operator_name = models.CharField(max_length=200, verbose_name="Nom de l'exploitant")
    operator_address = models.CharField(max_length=300, verbose_name="Adresse")
    operator_address_number = models.CharField(
        max_length=20, blank=True, verbose_name="N°"
    )
    operator_postal_code = models.CharField(
        max_length=10,
        verbose_name="Code postal",
        validators=[RegexValidator(r"^\d{4,5}$", "Code postal invalide")],
    )
    operator_locality = models.CharField(max_length=100, verbose_name="Localité")
    operator_bce_number = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="N° BCE",
        help_text="Numéro à la Banque-Carrefour des Entreprises",
    )
    operator_authorization_number = models.CharField(
        max_length=50, blank=True, verbose_name="N° d'autorisation"
    )
    operator_authorization_date = models.DateField(
        null=True, blank=True, verbose_name="Date d'autorisation"
    )

    # Client information
    client_title = models.CharField(
        max_length=20,
        choices=[("Madame", "Madame"), ("Monsieur", "Monsieur"), ("Société", "Société")],
        default="Monsieur",
        verbose_name="Titre client",
    )
    client_name = models.CharField(max_length=200, verbose_name="Nom du client")
    client_address = models.CharField(max_length=300, verbose_name="Adresse")
    client_address_number = models.CharField(max_length=20, blank=True, verbose_name="N°")
    client_postal_code = models.CharField(
        max_length=10,
        verbose_name="Code postal",
        validators=[RegexValidator(r"^\d{4,5}$", "Code postal invalide")],
    )
    client_locality = models.CharField(max_length=100, verbose_name="Localité")
    client_phone = models.CharField(max_length=20, blank=True, verbose_name="Téléphone")
    client_gsm = models.CharField(max_length=20, blank=True, verbose_name="GSM")

    # Passengers
    passengers_adult = models.PositiveIntegerField(
        default=1, verbose_name="Nombre d'adultes"
    )
    passengers_child = models.PositiveIntegerField(
        default=0, verbose_name="Nombre d'enfants (-12 ans)"
    )

    # Service type
    service_type = models.CharField(
        max_length=20,
        choices=ServiceType.choices,
        default=ServiceType.ALLER,
        verbose_name="Type de service",
    )

    # Trip details - Aller
    aller_date = models.DateField(null=True, blank=True, verbose_name="Date aller")
    aller_time = models.TimeField(null=True, blank=True, verbose_name="Heure aller")
    aller_departure = models.CharField(
        max_length=300, blank=True, verbose_name="Lieu de départ"
    )
    aller_destination = models.CharField(
        max_length=300, blank=True, verbose_name="Destination"
    )
    aller_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Prix aller par personne",
    )

    # Trip details - Retour
    retour_date = models.DateField(null=True, blank=True, verbose_name="Date retour")
    retour_time = models.TimeField(null=True, blank=True, verbose_name="Heure retour")
    retour_departure = models.CharField(
        max_length=300, blank=True, verbose_name="Lieu de départ retour"
    )
    retour_destination = models.CharField(
        max_length=300, blank=True, verbose_name="Destination retour"
    )
    retour_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Prix retour par personne",
    )

    # Signatures (encrypted binary data)
    operator_signature = models.BinaryField(
        null=True,
        blank=True,
        verbose_name="Signature exploitant (chiffré)",
    )
    client_signature = models.BinaryField(
        null=True,
        blank=True,
        verbose_name="Signature client (chiffré)",
    )
    client_signature_date = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date de signature client",
    )

    # Secure signature token for client access (no login required)
    signature_token = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        verbose_name="Token de signature",
    )
    signature_token_expires = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Expiration du token",
    )

    # Metadata
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # PDF storage
    pdf_file = models.FileField(
        upload_to="pdfs/", null=True, blank=True, verbose_name="Fichier PDF"
    )
    pdf_generated_at = models.DateTimeField(
        null=True, blank=True, verbose_name="Date de génération PDF"
    )

    class Meta:
        verbose_name = "Bon de commande"
        verbose_name_plural = "Bons de commande"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.reference} - {self.client_name}"

    def save(self, *args, **kwargs):
        # Auto-generate reference if not set
        if not self.reference:
            from django.utils import timezone

            year = timezone.now().year
            # Get the last order of this year
            last_order = (
                Order.objects.filter(reference__startswith=f"TC-{year}-")
                .order_by("-reference")
                .first()
            )
            if last_order:
                last_num = int(last_order.reference.split("-")[-1])
                new_num = last_num + 1
            else:
                new_num = 1
            self.reference = f"TC-{year}-{new_num:06d}"
        super().save(*args, **kwargs)


class OrderAuditLog(models.Model):
    """Audit log for order changes."""

    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="audit_logs"
    )
    action = models.CharField(max_length=50)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(default=dict)

    class Meta:
        verbose_name = "Journal d'audit"
        verbose_name_plural = "Journaux d'audit"
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.order.reference} - {self.action} - {self.timestamp}"


class PasswordResetToken(models.Model):
    """Token for password reset requests."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="password_reset_tokens"
    )
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Token de réinitialisation"
        verbose_name_plural = "Tokens de réinitialisation"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Reset token for {self.user.username}"

    @property
    def is_valid(self):
        """Check if token is still valid (not expired and not used)."""
        from django.utils import timezone
        return self.used_at is None and self.expires_at > timezone.now()

    @classmethod
    def create_for_user(cls, user, hours_valid=24):
        """Create a new password reset token for a user."""
        import secrets
        from django.utils import timezone

        # Invalidate any existing unused tokens for this user
        cls.objects.filter(user=user, used_at__isnull=True).update(
            used_at=timezone.now()
        )

        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timezone.timedelta(hours=hours_valid)

        return cls.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )
