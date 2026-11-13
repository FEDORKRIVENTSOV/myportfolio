"""
Наполняет сайт демонстрационными данными: пару примерных проектов,
теги и настройки, — чтобы сразу после установки было на что посмотреть.

Запуск:  python manage.py seed_demo
Полностью безопасно запускать повторно — существующие демо-записи не дублируются.
"""

import io

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from portfolio.models import CodeSnippet, FunFact, Project, SiteConfig, Tag


def make_placeholder_image(text, bg_hex, fg_hex="#FFFFFF", size=(900, 560)):
    """Рисует простую однотонную обложку-заглушку с подписью через Pillow."""
    from PIL import Image, ImageDraw, ImageFont

    img = Image.new("RGB", size, bg_hex)
    draw = ImageDraw.Draw(img)

    try:
        font = ImageFont.truetype("DejaVuSans-Bold.ttf", 46)
    except OSError:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((size[0] - tw) / 2, (size[1] - th) / 2), text, fill=fg_hex, font=font)

    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=87)
    return ContentFile(buffer.getvalue(), name=f"{text.lower().replace(' ', '-')}.jpg")


class Command(BaseCommand):
    help = "Создаёт демонстрационные проекты, чтобы сайт не выглядел пустым после установки."

    def handle(self, *args, **options):
        site = SiteConfig.load()
        if not site.avatar:
            self.stdout.write("Настройки сайта уже созданы (можно отредактировать в /admin/).")

        tag_names = ["Python", "Django", "PostgreSQL", "Figma", "React", "REST API"]
        tags = {name: Tag.objects.get_or_create(name=name)[0] for name in tag_names}

        if Project.objects.filter(slug="demo-task-tracker").exists():
            self.stdout.write(self.style.WARNING("Демо-проекты уже есть — пропускаю."))
            return

        dev_project = Project.objects.create(
            title="Демо: трекер задач",
            slug="demo-task-tracker",
            category=Project.CATEGORY_DEV,
            short_description="Пример карточки: маленький таск-трекер на Django + HTMX.",
            description=(
                "Это демонстрационный проект — замени его на свой первый пет-проект "
                "прямо в админке (/admin/portfolio/project/).\n\n"
                "Сюда можно вписать, какую проблему решает проект, какой стек ты "
                "использовал(а) и с какими сложностями столкнулся(ась) по пути."
            ),
            github_url="https://github.com/",
            year=2026,
            is_featured=True,
            order=0,
        )
        dev_project.cover_image.save(
            "demo-task-tracker.jpg",
            make_placeholder_image("Task Tracker", "#1F6F63"),
            save=True,
        )
        dev_project.tags.set([tags["Python"], tags["Django"], tags["PostgreSQL"]])

        CodeSnippet.objects.create(
            project=dev_project,
            title="Модель задачи",
            language="python",
            order=0,
            code=(
                "class Task(models.Model):\n"
                "    title = models.CharField(max_length=200)\n"
                "    is_done = models.BooleanField(default=False)\n"
                "    created_at = models.DateTimeField(auto_now_add=True)\n\n"
                "    def __str__(self):\n"
                "        return self.title\n"
            ),
        )
        FunFact.objects.create(project=dev_project, emoji="🐛", order=0, text="Заменишь на свои факты в один клик в админке")
        FunFact.objects.create(project=dev_project, emoji="☕", order=1, text="Это пример — удали меня, когда добавишь реальный проект")

        design_project = Project.objects.create(
            title="Демо: редизайн мобильного приложения",
            slug="demo-app-redesign",
            category=Project.CATEGORY_DESIGN,
            short_description="Пример карточки для дизайн-проекта с галереей макетов.",
            description=(
                "Ещё один демонстрационный проект — на этот раз дизайнерский. "
                "Для дизайн-проектов удобно использовать галерею изображений "
                "вместо блоков с кодом."
            ),
            demo_url="https://www.figma.com/",
            year=2026,
            order=1,
        )
        design_project.cover_image.save(
            "demo-app-redesign.jpg",
            make_placeholder_image("App Redesign", "#6E4B7C"),
            save=True,
        )
        design_project.tags.set([tags["Figma"]])
        FunFact.objects.create(project=design_project, emoji="🎨", order=0, text="12 итераций макета до финальной версии")

        self.stdout.write(self.style.SUCCESS("Готово! Демо-данные созданы. Загляни на главную страницу."))
