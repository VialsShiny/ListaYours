# Northflank Sandbox — hébergement de repli pour l'API

Northflank est le second choix de `docs/DEPLOY.md` (le premier est la VM Oracle Always Free). Il
devient le choix principal si la carte bancaire exigée par Oracle est inacceptable.

Faits vérifiés le 2026-11-08 sur https://northflank.com/pricing : Sandbox "No card needed",
"Up to $20/mo of resources on Northflank Cloud", "2 services, 2 jobs, and 1 database",
"Always on, no sleeping". La taille de conteneur réellement couverte par ce budget n'est pas
indiquée ; un plan 0,5 vCPU / 1 Go consommerait à peu près tout le budget **[uncertain]**.
1 Go est le plancher mémoire de Chromium : vérifiez le coût affiché dans le tableau de bord avant
de créer le service.

Northflank ne contient aucun fichier de configuration dans ce dépôt : tout se règle dans l'interface
(ou via leur CLI / API). Les réglages à reproduire sont :

| Réglage | Valeur |
|---|---|
| Type de service | Combined service (build + deploy) |
| Dépôt / branche | `VialsShiny/ListaYours`, `main` |
| Build type | Dockerfile |
| Dockerfile path | `api/Dockerfile` |
| Build context | `api` |
| Port | `8000`, protocole HTTP, public (détecté depuis `EXPOSE 8000`) |
| Health check | HTTP, path `/health`, port `8000` |
| Variables d'environnement | voir `docs/DEPLOY.md` § Northflank (noms seulement) |

Sources Northflank (lues le 2026-11-08) :
- https://northflank.com/docs/v1/application/getting-started/build-and-deploy-your-code
- https://northflank.com/docs/v1/application/network/configure-ports
- https://northflank.com/docs/v1/application/secure/inject-secrets
- https://northflank.com/docs/v1/application/observe/configure-health-checks
