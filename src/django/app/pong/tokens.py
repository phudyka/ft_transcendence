"""Émission des JWT.

Le service temps réel vérifie lui-même la signature des jetons pour identifier
ses sockets, au lieu de croire le nom que le client annonce. Il lui faut donc le
nom d'affichage dans les revendications : `user_id` seul l'obligerait à
interroger la base à chaque connexion.

Toutes les émissions passent par ce module — sinon un jeton sans la
revendication serait rejeté au handshake, ce qui se traduit par un chat et un
jeu muets, sans erreur visible côté API.

Un changement de nom d'affichage ne se répercute qu'au renouvellement du jeton
(une heure au plus, cf. ACCESS_TOKEN_LIFETIME).
"""

from rest_framework_simplejwt.tokens import RefreshToken


def tokens_for_user(user):
    """Couple refresh/access portant le nom d'affichage.

    Les revendications personnalisées posées sur le jeton de rafraîchissement
    sont recopiées sur les jetons d'accès qui en dérivent, y compris lors d'un
    passage par /api/token/refresh/.
    """
    refresh = RefreshToken.for_user(user)
    refresh['display_name'] = user.display_name
    return refresh
