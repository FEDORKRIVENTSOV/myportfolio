import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="SiteConfig",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("owner_name", models.CharField(default="Твоё Имя", max_length=100, verbose_name="Имя")),
                ("role_title", models.CharField(default="Разработчик и дизайнер", max_length=150, verbose_name="Роль / профессия")),
                ("hero_tagline", models.TextField(default="Собираю пет-проекты, которые не стыдно показать. Иногда даже доделываю их до конца.", max_length=400, verbose_name="Текст хиро-блока")),
                ("about_text", models.TextField(blank=True, default="Расскажи здесь пару абзацев о себе: чем занимаешься, что любишь в разработке и дизайне, что ищешь.", verbose_name="Текст \"обо мне\"")),
                ("avatar", models.ImageField(blank=True, null=True, upload_to="site/", verbose_name="Аватар")),
                ("email", models.EmailField(blank=True, max_length=254, verbose_name="Почта")),
                ("github_url", models.URLField(blank=True, verbose_name="GitHub")),
                ("telegram_url", models.URLField(blank=True, verbose_name="Telegram")),
                ("linkedin_url", models.URLField(blank=True, verbose_name="LinkedIn")),
                ("extra_link_label", models.CharField(blank=True, max_length=50, verbose_name="Доп. ссылка — подпись")),
                ("extra_link_url", models.URLField(blank=True, verbose_name="Доп. ссылка — адрес")),
                ("resume_file", models.FileField(blank=True, null=True, upload_to="site/", verbose_name="Файл резюме (PDF)")),
                ("stat1_value", models.CharField(default="42", max_length=20, verbose_name="Статистика 1 — число")),
                ("stat1_label", models.CharField(default="раздавленных багов", max_length=60, verbose_name="Статистика 1 — подпись")),
                ("stat2_value", models.CharField(default="9000+", max_length=20, verbose_name="Статистика 2 — число")),
                ("stat2_label", models.CharField(default="чашек кофе", max_length=60, verbose_name="Статистика 2 — подпись")),
                ("stat3_value", models.CharField(default="3 AM", max_length=20, verbose_name="Статистика 3 — число")),
                ("stat3_label", models.CharField(default="типичное время коммита", max_length=60, verbose_name="Статистика 3 — подпись")),
                ("footer_note", models.CharField(default="Собрано на чае, Django и лёгком перфекционизме.", max_length=200, verbose_name="Строка в подвале")),
                ("easter_egg_message", models.CharField(blank=True, default="Ты нашёл(а) секретную комбинацию клавиш. Держи печеньку 🍪", max_length=200, verbose_name="Секретное сообщение (пасхалка)")),
            ],
            options={
                "verbose_name": "Настройки сайта",
                "verbose_name_plural": "Настройки сайта",
            },
        ),
        migrations.CreateModel(
            name="Tag",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=40, unique=True, verbose_name="Название")),
                ("slug", models.SlugField(blank=True, max_length=50, unique=True, verbose_name="Слаг")),
            ],
            options={
                "verbose_name": "Тег / технология",
                "verbose_name_plural": "Теги / технологии",
                "ordering": ["name"],
            },
        ),
        migrations.CreateModel(
            name="Project",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=120, verbose_name="Название")),
                ("slug", models.SlugField(blank=True, max_length=140, unique=True, verbose_name="Слаг (для ссылки)")),
                ("category", models.CharField(choices=[("dev", "Разработка"), ("design", "Дизайн")], default="dev", max_length=10, verbose_name="Категория")),
                ("short_description", models.CharField(help_text="Показывается на карточке. 1 короткое предложение.", max_length=160, verbose_name="Короткое описание")),
                ("description", models.TextField(help_text="Показывается на странице проекта. Обычный текст, абзацы можно разделять пустой строкой.", verbose_name="Полное описание")),
                ("cover_image", models.ImageField(upload_to="projects/covers/", verbose_name="Обложка")),
                ("github_url", models.URLField(blank=True, verbose_name="Ссылка на GitHub")),
                ("demo_url", models.URLField(blank=True, verbose_name="Ссылка на демо / сайт")),
                ("year", models.PositiveIntegerField(blank=True, null=True, verbose_name="Год")),
                ("is_featured", models.BooleanField(default=False, help_text="Избранные проекты помечаются звёздочкой и идут первыми.", verbose_name="Избранный проект")),
                ("order", models.IntegerField(default=0, help_text="Чем меньше число — тем выше проект в списке.", verbose_name="Порядок")),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Создан")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Обновлён")),
                ("tags", models.ManyToManyField(blank=True, related_name="projects", to="portfolio.tag", verbose_name="Теги / технологии")),
            ],
            options={
                "verbose_name": "Проект",
                "verbose_name_plural": "Проекты",
                "ordering": ["-is_featured", "order", "-created_at"],
            },
        ),
        migrations.CreateModel(
            name="ProjectImage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("image", models.ImageField(upload_to="projects/gallery/", verbose_name="Изображение")),
                ("caption", models.CharField(blank=True, max_length=150, verbose_name="Подпись")),
                ("order", models.IntegerField(default=0, verbose_name="Порядок")),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="images", to="portfolio.project", verbose_name="project")),
            ],
            options={
                "verbose_name": "Изображение галереи",
                "verbose_name_plural": "Изображения галереи",
                "ordering": ["order", "id"],
            },
        ),
        migrations.CreateModel(
            name="CodeSnippet",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(help_text='Например: "Модель заказа" или "Главный компонент".', max_length=120, verbose_name="Заголовок сниппета")),
                ("language", models.CharField(choices=[("python", "Python"), ("javascript", "JavaScript"), ("typescript", "TypeScript"), ("html", "HTML"), ("css", "CSS"), ("bash", "Bash"), ("sql", "SQL"), ("json", "JSON"), ("markup", "Другой / разметка")], default="python", max_length=20, verbose_name="Язык")),
                ("code", models.TextField(verbose_name="Код")),
                ("order", models.IntegerField(default=0, verbose_name="Порядок")),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="snippets", to="portfolio.project", verbose_name="project")),
            ],
            options={
                "verbose_name": "Кусок кода",
                "verbose_name_plural": "Куски кода",
                "ordering": ["order", "id"],
            },
        ),
        migrations.CreateModel(
            name="FunFact",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("emoji", models.CharField(default="✨", max_length=10, verbose_name="Эмодзи")),
                ("text", models.CharField(help_text='Например: "Переписан с нуля 3 раза" или "97% багов найдены в 2 часа ночи".', max_length=160, verbose_name="Текст")),
                ("order", models.IntegerField(default=0, verbose_name="Порядок")),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="fun_facts", to="portfolio.project", verbose_name="project")),
            ],
            options={
                "verbose_name": "Мини-приколюха",
                "verbose_name_plural": "Мини-приколюхи",
                "ordering": ["order", "id"],
            },
        ),
    ]
