from .models import SiteConfig


def site_config(request):
    """Делает настройки сайта доступными в любом шаблоне как {{ site }}."""
    return {"site": SiteConfig.load()}
