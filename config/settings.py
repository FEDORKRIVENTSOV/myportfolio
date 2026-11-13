"""
Настройки проекта "Кейс" (devcase) — сайта-портфолио.

Все, что нужно поменять под себя при первом запуске, помечено
комментарием "# <-- НАСТРОЙ МЕНЯ".
"""

from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# --------------------------------------------------------------------------
# Безопасность
# --------------------------------------------------------------------------

# Для учебного / пет-проекта ключ можно оставить как есть, но если будешь
# выкладывать сайт в открытый доступ — вынеси его в переменную окружения.
SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-devcase-change-me-before-deploy-8f2ka0s9",
)

# <-- НАСТРОЙ МЕНЯ: поставь False, когда будешь выкладывать сайт "в люди"
DEBUG = os.environ.get("DJANGO_DEBUG", "True") == "True"

ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "*").split(",")


# --------------------------------------------------------------------------
# Приложения
# --------------------------------------------------------------------------

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "portfolio",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                # Кладёт SiteConfig и список категорий в контекст каждой
                # страницы, чтобы шапка/подвал были доступны везде.
                "portfolio.context_processors.site_config",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"


# --------------------------------------------------------------------------
# База данных — по умолчанию SQLite, ничего настраивать не нужно
# --------------------------------------------------------------------------

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}


# --------------------------------------------------------------------------
# Валидация паролей (для админки)
# --------------------------------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# --------------------------------------------------------------------------
# Локализация
# --------------------------------------------------------------------------

LANGUAGE_CODE = "ru-ru"
TIME_ZONE = "Asia/Almaty"  # <-- НАСТРОЙ МЕНЯ под свой часовой пояс
USE_I18N = True
USE_TZ = True


# --------------------------------------------------------------------------
# Статика и медиа (картинки проектов, резюме и т.д.)
# --------------------------------------------------------------------------

STATIC_URL = "static/"
STATICFILES_DIRS = [BASE_DIR / "portfolio" / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
