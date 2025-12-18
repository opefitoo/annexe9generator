# Generated manually

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0005_add_title_fields"),
    ]

    operations = [
        # Change signature fields from ImageField to BinaryField
        migrations.RemoveField(
            model_name="order",
            name="operator_signature",
        ),
        migrations.RemoveField(
            model_name="order",
            name="client_signature",
        ),
        migrations.AddField(
            model_name="order",
            name="operator_signature",
            field=models.BinaryField(
                blank=True, null=True, verbose_name="Signature exploitant (chiffré)"
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="client_signature",
            field=models.BinaryField(
                blank=True, null=True, verbose_name="Signature client (chiffré)"
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="client_signature_date",
            field=models.DateTimeField(
                blank=True, null=True, verbose_name="Date de signature client"
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="signature_token",
            field=models.UUIDField(
                default=uuid.uuid4, unique=True, verbose_name="Token de signature"
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="signature_token_expires",
            field=models.DateTimeField(
                blank=True, null=True, verbose_name="Expiration du token"
            ),
        ),
    ]
