from django.db import models
from django.urls import reverse
from django.utils.text import slugify


class SiteConfig(models.Model):
    """
    Единственная запись с настройками всего сайта: имя, роль, ссылки,
    тексты хиро-блока и три "приколюшные" цифры в статистике.

    Вся настройка сайта происходит здесь и в разделе "Проекты" —
    в коде трогать почти ничего не придётся.
    """

    owner_name = models.CharField(
        "Имя", max_length=100, default="Твоё Имя",
        help_text="Отображается в шапке и хиро-блоке.",
    )
    role_title = models.CharField(
        "Роль / профессия", max_length=150,
        default="Разработчик и дизайнер",
        help_text='Например: "Python-разработчик" или "Fullstack + UI/UX".',
    )
    hero_tagline = models.TextField(
        "Текст хиро-блока", max_length=400,
        default="Собираю пет-проекты, которые не стыдно показать. "
                "Иногда даже доделываю их до конца.",
    )
    about_text = models.TextField(
        "Текст \"обо мне\"", blank=True,
        default="Расскажи здесь пару абзацев о себе: чем занимаешься, "
                "что любишь в разработке и дизайне, что ищешь.",
    )
    avatar = models.ImageField(
        "Аватар", upload_to="site/", blank=True, null=True,
        help_text="Квадратное изображение хорошо смотрится лучше всего.",
    )

    email = models.EmailField("Почта", blank=True)
    github_url = models.URLField("GitHub", blank=True)
    telegram_url = models.URLField("Telegram", blank=True)
    linkedin_url = models.URLField("LinkedIn", blank=True)
    extra_link_label = models.CharField(
        "Доп. ссылка — подпись", max_length=50, blank=True,
        help_text='Например: "Behance" или "Мой блог".',
    )
    extra_link_url = models.URLField("Доп. ссылка — адрес", blank=True)

    resume_file = models.FileField(
        "Файл резюме (PDF)", upload_to="site/", blank=True, null=True,
    )

    # Три забавные цифры для полоски статистики над карточками —
    # чисто "приколюха", меняются в один клик в админке.
    stat1_value = models.CharField("Статистика 1 — число", max_length=20, default="42")
    stat1_label = models.CharField("Статистика 1 — подпись", max_length=60, default="раздавленных багов")
    stat2_value = models.CharField("Статистика 2 — число", max_length=20, default="9000+")
    stat2_label = models.CharField("Статистика 2 — подпись", max_length=60, default="чашек кофе")
    stat3_value = models.CharField("Статистика 3 — число", max_length=20, default="3 AM")
    stat3_label = models.CharField("Статистика 3 — подпись", max_length=60, default="типичное время коммита")

    footer_note = models.CharField(
        "Строка в подвале", max_length=200,
        default="Собрано на чае, Django и лёгком перфекционизме.",
    )
    easter_egg_message = models.CharField(
        "Секретное сообщение (пасхалка)", max_length=200, blank=True,
        default="Ты нашёл(а) секретную комбинацию клавиш. Держи печеньку 🍪",
        help_text="Показывается всплывающей подсказкой на Konami-код "
                   "(↑ ↑ ↓ ↓ ← → ← → B A).",
    )

    class Meta:
        verbose_name = "Настройки сайта"
        verbose_name_plural = "Настройки сайта"

    def __str__(self):
        return f"Настройки сайта — {self.owner_name}"

    def save(self, *args, **kwargs):
        # Держим ровно одну запись настроек, чтобы не запутаться в админке.
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass  # запись настроек не удаляем

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Tag(models.Model):
    """Технология/инструмент — бэйдж на карточке проекта (Python, Figma, DRF…)."""

    name = models.CharField("Название", max_length=40, unique=True)
    slug = models.SlugField("Слаг", max_length=50, unique=True, blank=True)

    class Meta:
        verbose_name = "Тег / технология"
        verbose_name_plural = "Теги / технологии"
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)


class Project(models.Model):
    """Один пет-проект — программистский или дизайнерский."""

    CATEGORY_DEV = "dev"
    CATEGORY_DESIGN = "design"
    CATEGORY_CHOICES = [
        (CATEGORY_DEV, "Разработка"),
        (CATEGORY_DESIGN, "Дизайн"),
    ]

    title = models.CharField("Название", max_length=120)
    slug = models.SlugField("Слаг (для ссылки)", max_length=140, unique=True, blank=True)
    category = models.CharField(
        "Категория", max_length=10, choices=CATEGORY_CHOICES, default=CATEGORY_DEV,
    )
    short_description = models.CharField(
        "Короткое описание", max_length=160,
        help_text="Показывается на карточке. 1 короткое предложение.",
    )
    description = models.TextField(
        "Полное описание",
        help_text="Показывается на странице проекта. Обычный текст, "
                   "абзацы можно разделять пустой строкой.",
    )
    cover_image = models.ImageField("Обложка", upload_to="projects/covers/")

    tags = models.ManyToManyField(Tag, verbose_name="Теги / технологии", blank=True, related_name="projects")

    github_url = models.URLField("Ссылка на GitHub", blank=True)
    demo_url = models.URLField("Ссылка на демо / сайт", blank=True)

    year = models.PositiveIntegerField("Год", blank=True, null=True)
    is_featured = models.BooleanField(
        "Избранный проект", default=False,
        help_text="Избранные проекты помечаются звёздочкой и идут первыми.",
    )
    order = models.IntegerField(
        "Порядок", default=0,
        help_text="Чем меньше число — тем выше проект в списке.",
    )

    created_at = models.DateTimeField("Создан", auto_now_add=True)
    updated_at = models.DateTimeField("Обновлён", auto_now=True)

    class Meta:
        verbose_name = "Проект"
        verbose_name_plural = "Проекты"
        ordering = ["-is_featured", "order", "-created_at"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title, allow_unicode=True) or "project"
            slug = base_slug
            i = 1
            while Project.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                i += 1
                slug = f"{base_slug}-{i}"
            self.slug = slug
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse("portfolio:project_detail", kwargs={"slug": self.slug})

    @property
    def description_paragraphs(self):
        return [p.strip() for p in self.description.split("\n\n") if p.strip()]


class ProjectImage(models.Model):
    """Дополнительный кадр в галерее проекта (скриншоты, макеты, фото)."""

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField("Изображение", upload_to="projects/gallery/")
    caption = models.CharField("Подпись", max_length=150, blank=True)
    order = models.IntegerField("Порядок", default=0)

    class Meta:
        verbose_name = "Изображение галереи"
        verbose_name_plural = "Изображения галереи"
        ordering = ["order", "id"]

    def __str__(self):
        return self.caption or f"Изображение #{self.pk} ({self.project})"


class CodeSnippet(models.Model):
    """Кусок кода, который показывается на странице проекта."""

    LANGUAGE_CHOICES = [
        ("python", "Python"),
        ("javascript", "JavaScript"),
        ("typescript", "TypeScript"),
        ("html", "HTML"),
        ("css", "CSS"),
        ("bash", "Bash"),
        ("sql", "SQL"),
        ("json", "JSON"),
        ("markup", "Другой / разметка"),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="snippets")
    title = models.CharField("Заголовок сниппета", max_length=120, help_text='Например: "Модель заказа" или "Главный компонент".')
    language = models.CharField("Язык", max_length=20, choices=LANGUAGE_CHOICES, default="python")
    code = models.TextField("Код")
    order = models.IntegerField("Порядок", default=0)

    class Meta:
        verbose_name = "Кусок кода"
        verbose_name_plural = "Куски кода"
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.title} ({self.project})"


class FunFact(models.Model):
    """Мини-приколюха про проект: забавный факт, цифра или деталь разработки."""

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="fun_facts")
    emoji = models.CharField("Эмодзи", max_length=10, default="✨")
    text = models.CharField(
        "Текст", max_length=160,
        help_text='Например: "Переписан с нуля 3 раза" или "97% багов найдены в 2 часа ночи".',
    )
    order = models.IntegerField("Порядок", default=0)

    class Meta:
        verbose_name = "Мини-приколюха"
        verbose_name_plural = "Мини-приколюхи"
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.emoji} {self.text}"
