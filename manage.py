#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Не удалось импортировать Django. Убедись, что он установлен и "
            "доступен в переменной окружения PYTHONPATH, а также что ты "
            "активировал(а) виртуальное окружение."
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
