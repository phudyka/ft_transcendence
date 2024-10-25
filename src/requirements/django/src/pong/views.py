import requests
from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.
def index(request):
    return render(request, "index.html")

def userApi(request):
    rep = requests.get("https://user_api", verify = False)
    return HttpResponse(rep)