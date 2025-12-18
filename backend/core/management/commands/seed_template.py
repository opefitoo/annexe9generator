"""
Management command to seed the initial Annex 9 template.
"""

from django.core.management.base import BaseCommand
from core.models import Template


class Command(BaseCommand):
    help = "Seed the initial Annex 9 template"

    def handle(self, *args, **options):
        template, created = Template.objects.update_or_create(
            version="Annex9_v2013",
            defaults={
                "name": "Bon de commande - Taxis collectifs (Annexe 9)",
                "description": "Template officiel du Gouvernement wallon pour les bons de commande de services de taxis collectifs, "
                "conformément à l'arrêté du 11 juillet 2013.",
                "is_active": True,
                "layout_spec": {
                    "page": {"size": "A4", "orientation": "portrait"},
                    "margins": {"top": 15, "bottom": 15, "left": 20, "right": 20},
                    "fonts": [
                        {"name": "Helvetica", "size": 9},
                        {"name": "Helvetica-Bold", "size": 10},
                    ],
                    "sections": [
                        {
                            "id": "header",
                            "type": "text",
                            "content": "Annexe 9",
                            "position": {"y": 282},
                            "style": {"font": "Helvetica-Bold", "size": 10, "align": "center"},
                        },
                        {
                            "id": "title",
                            "type": "text",
                            "content": "Bon de commande d'un service de taxis collectifs",
                            "position": {"y": 255},
                            "style": {"font": "Helvetica-Bold", "size": 14, "align": "center"},
                        },
                        {
                            "id": "operator_stamp",
                            "type": "placeholder",
                            "label": "(CACHET DE L'EXPLOITANT)",
                            "position": {"x": 20, "y": 235, "w": 60, "h": 30},
                        },
                        {
                            "id": "reservation_box",
                            "type": "box",
                            "fields": ["reservation_date", "reservation_number"],
                            "position": {"x": 20, "y": 195, "w": 170, "h": 20},
                        },
                        {
                            "id": "operator_section",
                            "type": "section",
                            "label": "Exploitant:",
                            "fields": [
                                "operator_name",
                                "operator_address",
                                "operator_postal_code",
                                "operator_locality",
                                "operator_bce_number",
                                "operator_authorization_number",
                                "operator_authorization_date",
                            ],
                            "position": {"y": 175},
                        },
                        {
                            "id": "client_section",
                            "type": "section",
                            "label": "Client:",
                            "fields": [
                                "client_name",
                                "client_address",
                                "client_postal_code",
                                "client_locality",
                                "client_phone",
                                "client_gsm",
                                "passengers_adult",
                                "passengers_child",
                            ],
                            "position": {"y": 90},
                            "style": {"box": True},
                        },
                        {
                            "id": "service_type",
                            "type": "radio_group",
                            "label": "Service:",
                            "options": ["Aller", "Retour", "Aller/Retour"],
                            "position": {"y": 50},
                        },
                        {
                            "id": "trip_table",
                            "type": "table",
                            "columns": ["", "Aller", "Retour"],
                            "rows": [
                                "Date",
                                "Heure",
                                "Lieu de départ",
                                "Destination",
                                "Prix convenu par personne",
                            ],
                            "position": {"y": 25},
                        },
                        {
                            "id": "signatures",
                            "type": "signature_block",
                            "fields": ["operator_signature", "client_signature"],
                            "position": {"y": -40},
                        },
                    ],
                },
            },
        )

        if created:
            self.stdout.write(
                self.style.SUCCESS(f"Created template: {template.version}")
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f"Updated template: {template.version}")
            )
