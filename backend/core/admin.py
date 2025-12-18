"""
Django Admin configuration for Annex 9 Generator.
"""

from django.contrib import admin
from django.utils.html import format_html
from .models import Order, Template, OrderAuditLog, Client, OperatorConfig


@admin.register(OperatorConfig)
class OperatorConfigAdmin(admin.ModelAdmin):
    list_display = ["name", "locality", "bce_number", "authorization_number"]
    readonly_fields = ["updated_at"]

    def has_add_permission(self, request):
        # Only allow one instance
        return not OperatorConfig.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ["name", "locality", "phone", "gsm", "created_at"]
    list_filter = ["locality", "created_at"]
    search_fields = ["name", "address", "locality", "phone", "gsm"]
    readonly_fields = ["id", "created_at", "updated_at"]


@admin.register(Template)
class TemplateAdmin(admin.ModelAdmin):
    list_display = ["version", "name", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["version", "name"]
    readonly_fields = ["created_at", "updated_at"]


class OrderAuditLogInline(admin.TabularInline):
    model = OrderAuditLog
    extra = 0
    readonly_fields = ["action", "user", "timestamp", "details"]
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        "reference",
        "client_name",
        "operator_name",
        "service_type",
        "reservation_date",
        "status",
        "pdf_link",
        "created_at",
    ]
    list_filter = ["status", "service_type", "reservation_date", "created_at"]
    search_fields = ["reference", "client_name", "operator_name"]
    readonly_fields = ["id", "reference", "created_at", "updated_at", "pdf_generated_at"]
    date_hierarchy = "reservation_date"
    inlines = [OrderAuditLogInline]

    fieldsets = (
        (
            "Identification",
            {
                "fields": (
                    "id",
                    "reference",
                    "template_version",
                    "status",
                    "language",
                )
            },
        ),
        (
            "Réservation",
            {"fields": ("reservation_date", "reservation_number")},
        ),
        (
            "Exploitant",
            {
                "fields": (
                    "operator_name",
                    "operator_address",
                    "operator_address_number",
                    "operator_postal_code",
                    "operator_locality",
                    "operator_bce_number",
                    "operator_authorization_number",
                    "operator_authorization_date",
                )
            },
        ),
        (
            "Client",
            {
                "fields": (
                    "client_name",
                    "client_address",
                    "client_address_number",
                    "client_postal_code",
                    "client_locality",
                    "client_phone",
                    "client_gsm",
                    "passengers_adult",
                    "passengers_child",
                )
            },
        ),
        (
            "Service",
            {"fields": ("service_type",)},
        ),
        (
            "Trajet Aller",
            {
                "fields": (
                    "aller_date",
                    "aller_time",
                    "aller_departure",
                    "aller_destination",
                    "aller_price",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Trajet Retour",
            {
                "fields": (
                    "retour_date",
                    "retour_time",
                    "retour_departure",
                    "retour_destination",
                    "retour_price",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Signatures",
            {
                "fields": ("operator_signature", "client_signature"),
                "classes": ("collapse",),
            },
        ),
        (
            "PDF",
            {
                "fields": ("pdf_file", "pdf_generated_at"),
                "classes": ("collapse",),
            },
        ),
        (
            "Métadonnées",
            {
                "fields": ("created_by", "created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )

    def pdf_link(self, obj):
        if obj.pdf_file:
            return format_html(
                '<a href="{}" target="_blank">Télécharger PDF</a>', obj.pdf_file.url
            )
        return "-"

    pdf_link.short_description = "PDF"

    def save_model(self, request, obj, form, change):
        if not obj.created_by:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

        # Create audit log
        action = "updated" if change else "created"
        OrderAuditLog.objects.create(
            order=obj,
            action=action,
            user=request.user,
            details={"changed_fields": list(form.changed_data) if change else []},
        )


@admin.register(OrderAuditLog)
class OrderAuditLogAdmin(admin.ModelAdmin):
    list_display = ["order", "action", "user", "timestamp"]
    list_filter = ["action", "timestamp"]
    search_fields = ["order__reference"]
    readonly_fields = ["order", "action", "user", "timestamp", "details"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


# Admin site customization
admin.site.site_header = "Annex 9 Generator - Administration"
admin.site.site_title = "Annex 9 Admin"
admin.site.index_title = "Gestion des bons de commande"
