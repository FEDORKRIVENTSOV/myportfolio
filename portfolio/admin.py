from django.contrib import admin
from django.utils.html import format_html

from .models import CodeSnippet, FunFact, Project, ProjectImage, SiteConfig, Tag


@admin.register(SiteConfig)
class SiteConfigAdmin(admin.ModelAdmin):
    """Настройки сайта — всегда одна запись."""

    fieldsets = (
        ("Основное", {"fields": ("owner_name", "role_title", "avatar")}),
        ("Хиро-блок и раздел \"обо мне\"", {"fields": ("hero_tagline", "about_text")}),
        ("Контакты", {
            "fields": (
                "email", "github_url", "telegram_url", "linkedin_url",
                "extra_link_label", "extra_link_url", "resume_file",
            )
        }),
        ("Статистика (три забавные цифры)", {
            "fields": (
                ("stat1_value", "stat1_label"),
                ("stat2_value", "stat2_label"),
                ("stat3_value", "stat3_label"),
            )
        }),
        ("Мелочи", {"fields": ("footer_note", "easter_egg_message")}),
    )

    def has_add_permission(self, request):
        # Запись настроек ровно одна — запрещаем плодить новые.
        return not SiteConfig.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


class ProjectImageInline(admin.TabularInline):
    model = ProjectImage
    extra = 1
    fields = ("image", "caption", "order")


class CodeSnippetInline(admin.StackedInline):
    model = CodeSnippet
    extra = 0
    fields = ("title", "language", "code", "order")


class FunFactInline(admin.TabularInline):
    model = FunFact
    extra = 1
    fields = ("emoji", "text", "order")


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "cover_preview", "is_featured", "order", "year")
    list_filter = ("category", "is_featured", "tags")
    list_editable = ("is_featured", "order")
    search_fields = ("title", "short_description", "description")
    prepopulated_fields = {"slug": ("title",)}
    filter_horizontal = ("tags",)
    inlines = [ProjectImageInline, CodeSnippetInline, FunFactInline]

    fieldsets = (
        (None, {"fields": ("title", "slug", "category", "cover_image")}),
        ("Описание", {"fields": ("short_description", "description")}),
        ("Ссылки и метаданные", {"fields": ("github_url", "demo_url", "year", "tags")}),
        ("Отображение", {"fields": ("is_featured", "order")}),
    )

    @admin.display(description="Обложка")
    def cover_preview(self, obj):
        if obj.cover_image:
            return format_html(
                '<img src="{}" style="height:40px;border-radius:6px;object-fit:cover;" />',
                obj.cover_image.url,
            )
        return "—"


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)


admin.site.site_header = "Управление портфолио"
admin.site.site_title = "Портфолио — админка"
admin.site.index_title = "Что редактируем?"
