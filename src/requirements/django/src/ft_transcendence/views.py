from django.shortcuts import render

# Create your views here.
def index(request):
    return render(request, "ft_transcendence/index.html")