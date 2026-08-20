# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Public principal — visiteurs de portfolio.** Recruteurs, développeurs, curieux
qui ouvrent le lien depuis un CV ou un message, sur ordinateur, pour quelques
minutes. Ils jugent la qualité technique et le soin visuel autant que le jeu
lui-même.

**Public secondaire — joueurs réels.** Amis et camarades de promo qui viennent
jouer une partie, enchaîner un tournoi, revenir.

**Plus une cible : le jury 42.** Le projet a déjà été présenté et corrigé. Le
remaster est motivé par le portfolio et le plaisir de remettre le jeu en état de
marche, pas par une grille d'évaluation.

## Product Purpose

Pong en 3D jouable dans le navigateur, avec comptes, amis, chat, historique de
matchs et tournois. Le travail en cours (branche `remaster`) le sort de son
ancien hébergement 42 pour le remettre en ligne sur des tiers gratuits.

Le succès : le site est en ligne, un visiteur arrive à jouer une partie de bout
en bout, et l'interface soutient la comparaison avec le soin porté au moteur 3D.

## Positioning

Ce n'est pas un Pong 2D de plus. La partie se joue dans une scène 3D — île,
palmiers, éclairage, nuages, bande-son — rendue par three.js côté client,
pendant qu'un service Node simule la physique et arbitre le score de façon
autoritative. Six modes partagent ce même moteur : solo contre l'IA, deux
joueurs en local, deux en ligne, quatre joueurs, demi-finale et finale de
tournoi.

## Operating Context

- **Visite portfolio** : ordinateur, découverte courte, lien partagé, souvent
  sans compte préexistant. L'API Django dort sur son tier gratuit après 15 min :
  le premier login peut demander une minute de réveil.
- **Session de jeu** : deux joueurs ou plus, au clavier. Les zones tactiles
  existent et ne s'affichent que sur pointeur grossier.
- **Hébergement** : quatre plateformes gratuites (statique, temps réel, API,
  base). Chaque décision produit doit rester compatible avec leurs limites.
- **Développement** : `docker compose` pour les quatre services, Vite pour le
  frontend ; `make check` tient les régressions.

## Capabilities and Constraints

**Fonctions confirmées.** Inscription et connexion par JWT, OAuth 42 (chemin
jamais exercé, clé d'intra périmée), profil et avatar, amis avec demandes et
relation asymétrique, blocage, chat temps réel, historique de matchs et
statistiques en graphiques, six modes de jeu, tournoi à quatre.

**Pile existante.** Frontend Vite en modules ES sans framework de composants
(Bootstrap 5, three.js, socket.io-client) ; API Django 5.2 ; service temps réel
Node ; PostgreSQL.

**Contraintes techniques durables.**

- Pas de framework de composants : les vues construisent leur HTML à la main.
- Tout ce qui atteint `innerHTML` passe par le gabarit `html` qui échappe les
  interpolations ; un script de contrôle le vérifie.
- « Connecté » se lit dans `sessionStorage` ; la navigation passe uniquement par
  le routeur.
- Les appels REST restent en chemin relatif, pour éviter CORS et garder les
  cookies CSRF.

**Faits produit encore indécis.** Le stockage des avatars envoyés (disque
éphémère sur le tier gratuit) ; la rotation des secrets et la purge de
l'historique Git avant toute mise en ligne publique ; la réouverture ou
l'abandon du chemin OAuth 42.

## Brand Commitments

**L'univers 3D est l'ADN du produit.** La scène de l'île, son ambiance et sa
bande-son sont préservées et destinées à être améliorées — jamais remplacées.

**Toute l'UX de la SPA est ouverte.** Menus, tableau de bord, formulaires,
profil, paramètres : le look actuel n'est pas un acquis à protéger.

Nom du produit : ft_transcendence.

## Evidence on Hand

Réel et disponible : le jeu jouable en local, la scène GLB et les quatorze
pistes audio, deux comptes d'essai en base, les documents `PLAN.md` et
`HANDOFF.md`, et les six scripts de vérification.

À ne pas fabriquer : il n'existe aucun utilisateur réel, aucune statistique
d'usage, aucun témoignage, aucun classement public, et aucune URL publique en
ligne à ce jour.

## Product Principles

1. **La 3D porte le produit ; l'interface la sert.** Rien dans la SPA ne doit
   voler la vedette à la scène ni retarder son affichage.
2. **Ordinateur d'abord, téléphone utilisable.** Le jeu sérieux se joue au
   clavier.
3. **Le périmètre fonctionnel est gelé.** Le projet est validé : une refonte
   visuelle ne retire aucune fonction.
4. **Le contenu utilisateur est hostile par défaut.** Noms, avatars et messages
   sont échappés, jamais insérés bruts.
5. **Rester hébergeable gratuitement.** Poids des assets, dépendances et
   services choisis doivent tenir dans les tiers gratuits.

## Accessibility & Inclusion

Aucun standard n'a été imposé au projet. Deux faits connus : les commandes
tactiles n'apparaissent que sur pointeur grossier, et il n'existe pas de
remappage des touches.
