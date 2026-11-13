from django.views.generic import DetailView, ListView, TemplateView

from .models import Project


class HomeView(ListView):
    """Главная страница: хиро-блок + сетка анимированных карточек."""

    model = Project
    template_name = "portfolio/home.html"
    context_object_name = "projects"

    def get_queryset(self):
        return (
            Project.objects.all()
            .prefetch_related("tags")
        )

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["dev_count"] = sum(1 for p in ctx["projects"] if p.category == Project.CATEGORY_DEV)
        ctx["design_count"] = sum(1 for p in ctx["projects"] if p.category == Project.CATEGORY_DESIGN)
        return ctx


class ProjectDetailView(DetailView):
    """Страница одного проекта: галерея, код, мини-факты."""

    model = Project
    template_name = "portfolio/project_detail.html"
    context_object_name = "project"

    def get_queryset(self):
        return (
            Project.objects.all()
            .prefetch_related("tags", "images", "snippets", "fun_facts")
        )

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["other_projects"] = (
            Project.objects.exclude(pk=self.object.pk)
            .order_by("?")[:3]
        )
        return ctx


class AboutSiteView(TemplateView):
    """
    Страница "как устроен этот сайт" — мета-приколюха: сам сайт тоже
    пет-проект, и об этом честно рассказано прямо на нём.
    """

    template_name = "portfolio/about_site.html"
