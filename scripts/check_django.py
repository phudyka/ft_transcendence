#!/usr/bin/env python3
"""Contrôles de bout en bout côté Django, sur une base SQLite jetable.

Vérifie ce que le service temps réel exige et ce que la revue de sécurité a
imposé :
  - les migrations passent ;
  - tout jeton émis porte la revendication `display_name` (sans elle, le
    handshake socket.io est refusé et le chat comme le jeu restent muets) ;
  - un jeton d'accès se vérifie bien en HS256 avec SECRET_KEY, exactement comme
    le fait `src/realtime/app/auth.mjs` ;
  - `clean_display_name` rejette le balisage.

    python3 scripts/check_django.py     (avec les dépendances de conf/requirements.txt)
"""

import os
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src/django/app"))

tmp = tempfile.mkdtemp()
os.environ.update(
    DJANGO_SETTINGS_MODULE="ft_trans.settings",
    DJANGO_SECRET_KEY="clef-de-test-uniquement",
    DATABASE_URL=f"sqlite:///{tmp}/test.sqlite3",
    DJANGO_MEDIA_ROOT=f"{tmp}/media",
    DJANGO_ALLOWED_HOSTS="localhost,testserver",
)

import django

django.setup()

from django.core.management import call_command

call_command("migrate", run_syncdb=True, verbosity=0)

from django.contrib.auth import get_user_model
from django.conf import settings
import jwt as pyjwt

from pong.tokens import tokens_for_user
from pong.views import clean_display_name

User = get_user_model()
user = User.objects.create_user(username="zoe", password="motdepasse", email="z@example.com")
user.display_name = "Zoé Martin"
user.save()

failures = []


def check(label, condition):
    print(f"{'ok   ' if condition else 'ÉCHEC'} {label}")
    if not condition:
        failures.append(label)


refresh = tokens_for_user(user)
access = str(refresh.access_token)

payload = pyjwt.decode(access, settings.SECRET_KEY, algorithms=["HS256"])
check("le jeton d'accès porte display_name", payload.get("display_name") == "Zoé Martin")
check("le jeton d'accès est de type access", payload.get("token_type") == "access")
# simplejwt sérialise l'identifiant en chaîne (compatibilité UUID) : côté Node,
# `payload.user_id` est donc "1" et non 1.
check("le jeton d'accès porte user_id", str(payload.get("user_id")) == str(user.pk))

# Le rafraîchissement doit conserver la revendication, sinon la session se
# coupe silencieusement au bout d'une heure.
refreshed = pyjwt.decode(str(refresh.access_token), settings.SECRET_KEY, algorithms=["HS256"])
check("la revendication survit au renouvellement", refreshed.get("display_name") == "Zoé Martin")

# Le compteur de victoires est incrémenté par le serveur, sur le compte
# authentifié : le client ne renvoie plus de total qu'il aurait calculé lui-même.
from django.test import Client

api = Client(HTTP_AUTHORIZATION=f"Bearer {access}")
before = (user.wins, user.losses)
api.post(
    "/api/save-match-result/",
    data='{"result": "win", "opponent": "AI"}',
    content_type="application/json",
)
api.post(
    "/api/save-match-result/",
    data='{"result": "loss", "opponent": "AI"}',
    content_type="application/json",
)
user.refresh_from_db()
check("save-match-result incrémente wins et losses", (user.wins, user.losses) == (before[0] + 1, before[1] + 1))

refused = api.post(
    "/api/save-match-result/",
    data='{"result": "cheat", "opponent": "AI"}',
    content_type="application/json",
)
user.refresh_from_db()
check(
    "un résultat invalide est refusé sans toucher aux compteurs",
    refused.status_code == 400 and (user.wins, user.losses) == (before[0] + 1, before[1] + 1),
)

for bad in ["<img src=x onerror=alert(1)>", 'a"b', "a'b", "ab", ""]:
    try:
        clean_display_name(bad)
        check(f"clean_display_name rejette {bad!r}", False)
    except ValueError:
        check(f"clean_display_name rejette {bad!r}", True)

for good in ["Zoé Martin", "phudyka_42", "Jean-Luc P."]:
    try:
        check(f"clean_display_name accepte {good!r}", clean_display_name(good) == good)
    except ValueError:
        check(f"clean_display_name accepte {good!r}", False)

sys.exit(1 if failures else 0)
