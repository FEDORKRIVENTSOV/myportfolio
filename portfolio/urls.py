from django.urls import path

from . import views

app_name = "portfolio"

urlpatterns = [
    path("", views.HomeView.as_view(), name="home"),
    path("proekt/<slug:slug>/", views.ProjectDetailView.as_view(), name="project_detail"),
    path("o-sayte/", views.AboutSiteView.as_view(), name="about_site"),
]
