# Déploiement de ListaYours (gratuit, sans mise en veille)

Ce guide déploie la pile complète à coût nul :

| Composant | Hébergeur retenu | Pourquoi |
|---|---|---|
| API (`api/`, FastAPI + Playwright/Chromium) | **Oracle Cloud Always Free, VM Ampere A1 Flex** (ARM64, 2 OCPU / 12 Go) | Seule offre à 0 € qui soit une vraie VM, jamais mise en veille, assez grande pour Chromium, avec Docker libre et 10 To de sortie |
| API, solution de repli | **Northflank Sandbox** | Seul PaaS gratuit documentant « Always on, no sleeping » sans carte bancaire |
| Frontend (`frontend/`, Next.js 14) | **Vercel Hobby** | Gratuit pour un usage personnel non commercial |
| Base de données | **Neon Free** (recommandé), Supabase Free ou Postgres auto‑hébergé sur la VM | Voir § 3 |

Toutes les limites et citations ci‑dessous ont été relevées sur les pages officielles le **2026‑11‑08**
(rapport de recherche : [`docs/HOSTING-RESEARCH.md`](HOSTING-RESEARCH.md)). Ce qui n'a pas pu être lu sur une page officielle est marqué
**[uncertain]**. Les étapes que seul le propriétaire du dépôt peut réaliser (compte, carte, secrets,
DNS) sont marquées **[MANUAL]**.

**Point d'attention avant de commencer :** Oracle exige une carte bancaire à l'inscription pour
vérifier votre identité. Elle n'est **pas** débitée tant que vous ne passez pas en compte payant
(§ 4.1). Si cette exigence est inacceptable, sautez le § 4 : Northflank (§ 6) devient l'hébergeur
principal, le reste du guide est inchangé.

---

## Sommaire

1. [Ce qui est déployé](#1-ce-qui-est-déployé)
2. [Prérequis communs](#2-prérequis-communs)
3. [Base de données : Neon, Supabase ou Postgres sur la VM](#3-base-de-données--neon-supabase-ou-postgres-sur-la-vm)
4. [Hébergeur principal : Oracle Cloud Always Free (VM ARM64)](#4-hébergeur-principal--oracle-cloud-always-free-vm-arm64)
5. [Frontend : Vercel Hobby](#5-frontend--vercel-hobby)
6. [Hébergeur de repli : Northflank Sandbox](#6-hébergeur-de-repli--northflank-sandbox)
7. [Chargement initial de la liste (`make seed`)](#7-chargement-initial-de-la-liste-make-seed)
8. [Vérification de bout en bout](#8-vérification-de-bout-en-bout)
9. [Mises à jour, migrations, journaux](#9-mises-à-jour-migrations-journaux)
10. [Rester hors de la règle de récupération des VM inactives (Oracle)](#10-rester-hors-de-la-règle-de-récupération-des-vm-inactives-oracle)
11. [Keep-alive pingers : pourquoi ce n'est pas la voie recommandée](#11-keep-alive-pingers--pourquoi-ce-nest-pas-la-voie-recommandée)
12. [Hébergeurs écartés et pourquoi](#12-hébergeurs-écartés-et-pourquoi)
13. [Limites gratuites qui s'appliquent à vous](#13-limites-gratuites-qui-sappliquent-à-vous)
14. [Checklist mensuelle](#14-checklist-mensuelle)
15. [Secrets : règles non négociables](#15-secrets--règles-non-négociables)
16. [Dépannage](#16-dépannage)

---

## 1. Ce qui est déployé

```
Navigateur ──HTTPS──▶ Vercel (Next.js, frontend/)          NEXT_PUBLIC_API_URL
                           │
                           └──HTTPS (CORS)──▶ Caddy :443 ──▶ api:8000 (FastAPI + Chromium)
                                              VM Oracle A1        │
                                                                  └──TLS──▶ Postgres (Neon / Supabase / docker db)
```

- **API** : image construite depuis `api/Dockerfile` (Python 3.11, Chromium installé par Playwright).
  Au démarrage le conteneur exécute `alembic upgrade head` puis `uvicorn` sur le port 8000.
  `GET /health` renvoie `{"status":"ok"}`. Chromium a besoin d'environ 1 Go de RAM.
- **Variables lues par l'API** (`api/app/config.py`) : `ENVIRONMENT`, `DATABASE_URL`, `JWT_SECRET`
  (≥ 32 caractères, obligatoire en production, sinon l'API refuse de démarrer), `JWT_EXPIRES_MINUTES`,
  `OWNER_EMAIL` (obligatoire en production ; le compte qui s'inscrit avec cette adresse devient le
  propriétaire, décision n° 5 de `docs/DECISIONS.md`), `CORS_ORIGINS` (origines navigateur séparées par
  des virgules, doit contenir l'URL Vercel), `SCRAPE_TIMEOUT_SECONDS`, `SCRAPE_CACHE_TTL_SECONDS`,
  `RATE_LIMIT_PER_MINUTE`, `TRUST_PROXY_HEADERS` (`true` uniquement derrière un reverse proxy qui écrit
  `X-Forwarded-For`), `API_PORT`.
- **Frontend** : Next.js 14 App Router, déployé sur Vercel avec le répertoire racine `frontend`.
  Une seule variable : `NEXT_PUBLIC_API_URL` (URL publique de l'API, sans `/` final).
- **Fichiers ajoutés par ce guide** :

| Fichier | Rôle |
|---|---|
| `deploy/oracle/docker-compose.prod.yml` | API + Caddy (+ Postgres optionnel via `--profile local-db`) |
| `deploy/oracle/Caddyfile` | Reverse proxy, TLS automatique, en‑têtes de sécurité |
| `deploy/oracle/listayours.env.example` | Noms des variables de production (à copier en `.env`, mode 600) |
| `deploy/keepalive/*` | Timer systemd contre la règle d'inactivité Oracle |
| `deploy/northflank/README.md` | Réglages à reproduire dans l'interface Northflank |
| `frontend/vercel.json` | Fige le preset `nextjs` sur Vercel |

---

## 2. Prérequis communs

1. **[MANUAL]** Un compte GitHub avec accès en écriture au dépôt `VialsShiny/ListaYours` (Vercel et
   Northflank s'y connectent par OAuth).
2. **[MANUAL]** Un nom de domaine ou un sous‑domaine dont vous contrôlez le DNS (par exemple
   `api.example.com`). Il est indispensable pour la VM Oracle : Vercel sert le frontend en HTTPS, le
   navigateur refuse donc d'appeler une API en HTTP (« mixed content »), et Caddy ne délivre un
   certificat public que pour un nom de domaine. Northflank fournit une URL `*.code.run` déjà en HTTPS,
   le domaine y est facultatif.
3. Sur votre poste : `git`, `ssh`, `curl`, et pour `make seed` l'environnement local du projet
   (`make install`, voir `README.md`).
4. Générez le secret JWT **une seule fois**, sur votre poste ou sur la VM, et ne le collez que dans le
   fichier `.env` de la VM (ou le gestionnaire de secrets Northflank) :

   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(48))"
   # ou
   openssl rand -base64 48 | tr -d '\n'; echo
   ```

   Ne l'envoyez jamais par messagerie, ne le mettez pas dans un ticket, ne le committez jamais.

---

## 3. Base de données : Neon, Supabase ou Postgres sur la VM

### 3.1 Comparaison (relevé du 2026‑11‑08)

| Critère | Neon Free | Supabase Free |
|---|---|---|
| Stockage | 1 Go/projet, 20 Go au total, 100 projets | 500 Mo, « Limit of 2 active projects » |
| Calcul | 100 CU‑heures/projet/mois, jusqu'à 2 CU (8 Go) | Nano : « Up to 0.5 GB » RAM, CPU partagé, 60 connexions, « subject to change » |
| **Inactivité** | Suspension du calcul « Always enabled on Free (suspends after 5 min, cannot be turned off) » ; **réveil automatique** à la requête suivante (quelques centaines de ms) | « pauses Free Plan projects that show low activity over a 7-day period » ; « a few database requests per day » suffisent ; un projet en pause est **un arrêt dur** à relancer à la main, restaurable « for up to 1 year » |
| Carte | « no credit card required » | Non précisé **[uncertain]** |
| Sortie réseau | Non précisé **[uncertain]** | 5 Go |
| Réseau | — | Connexion directe en IPv6 seulement sur le plan gratuit ; le pooler partagé (port 5432, mode session) est IPv4 (https://supabase.com/docs/guides/database/connecting-to-postgres, lu le 2026‑11‑08) |
| Sources | https://neon.com/pricing | https://supabase.com/pricing ; https://supabase.com/docs/guides/platform/compute-and-disk ; https://supabase.com/docs/guides/platform/free-project-pausing |

**Recommandation : Neon.** Son seul inconvénient est une latence sur la première requête après
5 minutes de calme ; l'API utilise `pool_pre_ping=True` (`api/app/db/base.py`), donc une connexion
coupée par la suspension est détectée et remplacée sans erreur côté utilisateur. Supabase ne pose pas
ce problème de latence mais peut **mettre le projet en pause** si l'activité est faible pendant 7 jours :
une liste de souhaits consultée rarement est exactement ce cas. Si vous choisissez Supabase, le timer
du § 10 (qui appelle `GET /api/public/wishlists`, donc la base) sert aussi d'activité quotidienne.

**Alternative : Postgres dans Docker sur la VM** (`--profile local-db`, § 4.11). Avantages : aucune
dépendance externe, aucune pause, 200 Go de stockage bloc inclus. Inconvénient majeur : **les
sauvegardes sont à votre charge** (§ 9.4) ; si la VM est récupérée par Oracle (§ 10) ou si le volume est
perdu, les données le sont aussi, sauf si vous avez copié les dumps ailleurs.

### 3.2 Créer la base sur Neon

1. **[MANUAL]** Créez un compte sur https://neon.com (connexion GitHub possible, aucune carte).
2. **[MANUAL]** Créez un projet (région la plus proche de la région Oracle choisie au § 4.1, par exemple
   Francfort), base `listayours`.
3. **[MANUAL]** Dans le tableau de bord, bouton **Connect**, copiez la chaîne de connexion
   « psql » / « Postgres ». Transformez‑la pour SQLAlchemy + psycopg :

   ```
   postgresql+psycopg://USER:PASSWORD@HOST/DBNAME?sslmode=require
   ```

   Neon « requires that all connections use SSL/TLS encryption » et recommande `sslmode=verify-full`
   (https://neon.com/docs/connect/connect-securely, lu le 2026‑11‑08) ; `require` est le minimum,
   `verify-full` fonctionne aussi avec psycopg 3 si le magasin de certificats système est présent
   (c'est le cas dans l'image Debian de l'API).
4. Cette chaîne est la valeur de `DATABASE_URL`. Elle contient le mot de passe : traitez‑la comme un
   secret (§ 15).

### 3.3 Créer la base sur Supabase (alternative)

1. **[MANUAL]** Compte sur https://supabase.com, nouveau projet, région proche d'Oracle, mot de passe
   de base fort (généré par Supabase, à conserver dans votre gestionnaire de mots de passe).
2. **[MANUAL]** Bouton **Connect** en haut du tableau de bord. La VM Oracle a une IPv4 publique ; prenez
   le **pooler partagé en mode session (port 5432)**, qui est « IPv4-only on every plan » et supporte
   les requêtes préparées. Évitez le mode transaction (6543) : « The shared pooler doesn't support
   prepared statements in transaction mode ».
3. `DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/postgres?sslmode=require`.
4. Si le projet est mis en pause, relancez‑le depuis le tableau de bord (**[MANUAL]**) ; l'API répondra
   `500` sur les routes base de données jusque‑là.

---

## 4. Hébergeur principal : Oracle Cloud Always Free (VM ARM64)

Toutes les citations Oracle proviennent de
https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm et
https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm (lues le
2026‑11‑08), sauf mention contraire.

### 4.1 Créer le compte **[MANUAL]**

1. Ouvrez https://www.oracle.com/cloud/free/ et créez un compte Free Tier.
2. Oracle : « most users need a mobile phone number and a credit card to create an account. Your credit
   card will not be charged unless you upgrade your account. » Une **autorisation temporaire** est posée
   sur la carte. La FAQ indique « We do not accept debit cards with a PIN or virtual, single-use, or
   prepaid cards » **[uncertain wording, page en 403 pour notre lecteur, texte issu de l'index de
   recherche]**.
3. **Choisissez la région d'origine (home region) avec soin** : les ressources Always Free compute ne
   sont disponibles que dans cette région, et elle ne se change pas ensuite. Pour la France :
   `eu-paris-1`, `eu-marseille-1` ou `eu-frankfurt-1`. La disponibilité des A1 (« Out of capacity ») varie
   selon la région, c'est une observation communautaire non documentée **[uncertain]**.
4. Une fois le compte créé, vous disposez de 30 jours d'essai avec des crédits ; à la fin de l'essai
   « your account remains active. There is no interruption to the availability of the Always Free
   Resources you have provisioned. » Ne cliquez sur **Upgrade** que si vous acceptez d'être facturé.
5. Si vous refusez de donner une carte : arrêtez ici et passez au § 6 (Northflank), puis au § 5.

### 4.2 Clé SSH **[MANUAL]**

Sur votre poste :

```bash
ssh-keygen -t ed25519 -a 64 -f ~/.ssh/listayours_oci -C "listayours-oci"
cat ~/.ssh/listayours_oci.pub
```

Vous collerez le contenu de `.pub` dans la console Oracle. La clé privée ne quitte jamais votre poste.

### 4.3 Réseau virtuel (VCN) et règles de pare‑feu 22/80/443 **[MANUAL]**

1. Console OCI, menu **Networking › Virtual cloud networks › Start VCN Wizard › Create VCN with
   Internet Connectivity**. Nom `listayours-vcn`, valeurs par défaut, **Create**.
2. Ouvrez le VCN créé, puis **Security Lists › Default Security List for listayours-vcn**. Par défaut la
   liste autorise seulement « TCP traffic on destination port 22 (SSH) » et deux règles ICMP
   (https://docs.oracle.com/en-us/iaas/Content/Network/Concepts/securitylists.htm, lu le 2026‑11‑08).
3. **Add Ingress Rules**, deux fois :

   | Champ | HTTP | HTTPS |
   |---|---|---|
   | Stateless | décoché | décoché |
   | Source Type / Source CIDR | CIDR / `0.0.0.0/0` | CIDR / `0.0.0.0/0` |
   | IP Protocol | TCP | TCP |
   | Source Port Range | All | All |
   | Destination Port Range | `80` | `443` |

4. Facultatif mais recommandé : modifiez la règle `22` existante pour remplacer `0.0.0.0/0` par votre
   IP publique en `/32` (Oracle recommande de restreindre les sources). Si votre IP change souvent,
   laissez `0.0.0.0/0` : l'authentification par clé reste solide.

### 4.4 Créer la VM **[MANUAL]**

Chemin et libellés d'après https://docs.oracle.com/en-us/iaas/Content/Compute/Tasks/launchinginstance.htm
(lu le 2026‑11‑08).

1. **Compute › Instances › Create instance**. Nom `listayours-api`.
2. **Image** : **Change image › Platform Images › Ubuntu**, version la plus récente LTS (24.04). Vérifiez
   avec la flèche de détail que l'image est compatible avec les shapes Ampere (une image `aarch64` est
   sélectionnée automatiquement une fois le shape choisi).
3. **Shape** : **Change shape › Virtual machine › Ampere › VM.Standard.A1.Flex**, **2 OCPU** et
   **12 GB** de mémoire. C'est l'intégralité du quota Always Free A1 (« equivalent to 2 OCPUs and
   12 GB of memory ») ; une seule VM est plus simple à maintenir que deux petites.
4. **Networking** : **Select existing virtual cloud network** → `listayours-vcn`, sous‑réseau **public**,
   et laissez coché **Automatically assign public IPv4 address** (sinon la VM est injoignable).
5. **Add SSH keys › Paste public keys** : collez la ligne de `~/.ssh/listayours_oci.pub`.
6. **Boot volume** : **Specify a custom boot volume size**, **100 GB** (quota Always Free : 200 Go au
   total pour boot + bloc ; l'image API fait ~1,5 Go, Chromium et les journaux grossissent).
7. **Create**. Si vous obtenez « Out of capacity », réessayez plus tard ou dans un autre
   *availability domain* **[uncertain]** ; ne passez pas en Pay As You Go pour contourner.
8. Notez l'**IP publique** affichée sur la page de l'instance.

### 4.5 DNS **[MANUAL]**

Chez votre registrar, créez un enregistrement **A** `api.example.com → IP_PUBLIQUE_VM` (TTL court,
300 s, le temps des tests). Vérifiez :

```bash
dig +short api.example.com
```

### 4.6 Première connexion et mise à jour

```bash
ssh -i ~/.ssh/listayours_oci ubuntu@IP_PUBLIQUE_VM
```

Puis sur la VM :

```bash
uname -m                       # doit afficher aarch64
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y git curl ca-certificates unattended-upgrades
sudo hostnamectl set-hostname listayours-api
```

### 4.7 Pare‑feu de l'instance (iptables, pas UFW)

Les images Oracle ont « a default set of firewall rules that allow only SSH access », et Oracle avertit :
« Do not use Uncomplicated Firewall (UFW) to edit firewall rules on an Ubuntu image. Using UFW to edit
rules might cause an instance not to boot. »
(https://docs.oracle.com/en-us/iaas/Content/Compute/References/images.htm, lu le 2026‑11‑08.)
Le trafic doit être autorisé **aux deux niveaux** : security list (§ 4.3) **et** pare‑feu de la VM.

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo apt-get install -y iptables-persistent     # répondre "Yes" pour sauvegarder les règles courantes
sudo netfilter-persistent save
sudo iptables -L INPUT -n --line-numbers | head -20
```

Ne supprimez jamais les règles existantes vers `169.254.0.2` / `169.254.2.0/24` (accès iSCSI aux
volumes : « Removing these rules allows non-root users or non-administrators to access the instance's
boot disk volume »). Les ports publiés par Docker transitent par la chaîne `FORWARD` que Docker gère
lui‑même ; les deux règles `INPUT` ci‑dessus couvrent le cas où Caddy serait un jour lancé hors
Docker. La position `6` suppose la liste de règles d'origine d'Oracle **[uncertain]** ; si la commande
échoue, utilisez `-I INPUT 1`.

### 4.8 Installer Docker (méthode dépôt apt officiel)

Commandes de https://docs.docker.com/engine/install/ubuntu/ (lu le 2026‑11‑08 ; « compatible with
x86_64 (or amd64), armhf, arm64, s390x, and ppc64le »).

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
newgrp docker
docker version && docker compose version
```

### 4.9 Cloner le dépôt

```bash
git clone https://github.com/VialsShiny/ListaYours.git ~/listayours
cd ~/listayours/deploy/oracle
```

### 4.10 Variables d'environnement **[MANUAL]**

```bash
cp listayours.env.example .env
chmod 600 .env
nano .env
```

Renseignez (noms seulement ici, jamais de valeurs dans le dépôt) :

| Variable | À mettre |
|---|---|
| `API_DOMAIN` | `api.example.com` (le nom du § 4.5 ; lu par Caddy) |
| `ENVIRONMENT` | `production` |
| `DATABASE_URL` | la chaîne du § 3.2 / 3.3, ou `postgresql+psycopg://listayours:<POSTGRES_PASSWORD>@db:5432/listayours` avec `--profile local-db` |
| `JWT_SECRET` | la valeur générée au § 2.4 (≥ 32 caractères) |
| `JWT_EXPIRES_MINUTES` | `10080` (7 jours) |
| `OWNER_EMAIL` | votre adresse ; le compte inscrit avec cette adresse devient propriétaire |
| `CORS_ORIGINS` | `https://<projet>.vercel.app` puis, séparé par une virgule, votre domaine frontend s'il existe ; **sans `/` final**. Vous reviendrez compléter cette valeur au § 5.5 |
| `SCRAPE_TIMEOUT_SECONDS`, `SCRAPE_CACHE_TTL_SECONDS`, `RATE_LIMIT_PER_MINUTE` | valeurs par défaut `90`, `300`, `20` |
| `TRUST_PROXY_HEADERS` | `true` (Caddy écrit `X-Forwarded-For`) |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | seulement avec `--profile local-db` ; mot de passe généré comme le secret JWT |

Vérifiez les droits sans afficher le contenu :

```bash
stat -c '%a %U %n' .env        # attendu : 600 ubuntu .env
grep -c '^JWT_SECRET=.\{32,\}' .env   # attendu : 1
```

### 4.11 Déployer (construction de l'image en linux/arm64)

La VM est ARM64 : l'image **doit** être construite pour `linux/arm64`. Le plus simple est de la
construire sur la VM elle‑même, ce que fait la commande ci‑dessous (`platforms: [linux/arm64]` dans le
compose). Comptez 5 à 10 minutes la première fois (téléchargement de Chromium).

```bash
cd ~/listayours/deploy/oracle
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api      # Ctrl-C pour quitter
```

Avec Postgres auto‑hébergé :

```bash
docker compose -f docker-compose.prod.yml --profile local-db up -d --build
```

Construction sur un autre poste (amd64) si la VM est trop lente :

```bash
docker buildx create --use --name arm 2>/dev/null || true
docker buildx build --platform linux/arm64 -t ghcr.io/VOTRE_COMPTE/listayours-api:prod --push ./api
```

puis dans `docker-compose.prod.yml` remplacez la section `build:` du service `api` par
`image: ghcr.io/VOTRE_COMPTE/listayours-api:prod` et lancez `docker compose ... pull && up -d`
(l'authentification au registre est à votre charge, **[MANUAL]**).

### 4.12 Reverse proxy et TLS automatique

Rien à faire : le service `caddy` lit `deploy/oracle/Caddyfile`, où `{$API_DOMAIN}` est votre
domaine. Caddy « serves all sites over HTTPS », « provisions TLS certificates for all your sites and
keeps them renewed » et « redirects HTTP to HTTPS », à condition que « your domain's A/AAAA records
point to your server » et que « ports 80 and 443 are open externally »
(https://caddyserver.com/docs/automatic-https, lu le 2026‑11‑08). Le certificat est émis en quelques
secondes au premier démarrage :

```bash
docker compose -f docker-compose.prod.yml logs caddy | grep -iE 'certificate obtained|error' | tail -5
```

### 4.13 Migrations

Elles sont **automatiques** : la commande du conteneur est `alembic upgrade head && exec uvicorn ...`.
Manuellement (par exemple après un `git pull` sans reconstruction) :

```bash
docker compose -f docker-compose.prod.yml exec api alembic current
docker compose -f docker-compose.prod.yml exec api alembic upgrade head
```

### 4.14 Vérification de l'API

```bash
curl -fsS http://127.0.0.1:8000/health; echo                 # depuis la VM : {"status":"ok"}
curl -fsS https://api.example.com/health; echo               # depuis n'importe où
curl -sI http://api.example.com/health | head -1             # HTTP/1.1 308 Permanent Redirect
curl -fsS https://api.example.com/api/public/wishlists; echo # [] avant le seed
```

Si la première ligne répond mais pas la deuxième : § 16.

### 4.15 Timer anti‑inactivité

Suivez le § 10 maintenant, avant d'oublier : la règle des 7 jours commence à courir dès la création.

---

## 5. Frontend : Vercel Hobby

Faits relevés le 2026‑11‑08 sur https://vercel.com/docs/plans/hobby et
https://vercel.com/docs/limits/fair-use-guidelines : le plan Hobby est gratuit et « restricts users to
non-commercial, personal use only » ; est commercial « any Deployment that is used for the purpose of
financial gain of anyone involved » (paiements, vente, publicité, affiliation). Une liste de souhaits
personnelle est dans le cadre ; si le site devait un jour se monétiser, le plan Pro (20 $/utilisateur/mois)
devient obligatoire.

1. **[MANUAL]** Créez un compte sur https://vercel.com avec votre compte GitHub (plan **Hobby**).
2. **[MANUAL]** **Add New… › Project**, importez `VialsShiny/ListaYours`.
3. Dans l'écran de configuration :
   - **Root Directory** : cliquez **Edit** et saisissez `frontend` (le dépôt est un monorepo ; Vercel
     exécute install et build depuis ce répertoire, https://vercel.com/docs/builds/configure-a-build,
     lu le 2026‑11‑08).
   - **Framework Preset** : `Next.js` est détecté ; `frontend/vercel.json` le fige.
   - **Build Command / Output Directory** : laissez les valeurs par défaut (`next build`).
4. **Environment Variables** (avant le premier déploiement) :

   | Nom | Valeur | Environnements | Type |
   |---|---|---|---|
   | `NEXT_PUBLIC_API_URL` | `https://api.example.com` (Oracle) ou l'URL `https://….code.run` (Northflank), **sans `/` final** | Production (et Preview si vous voulez tester les branches contre l'API de production) | Config (la valeur est publique par construction : Next.js l'inline dans le bundle navigateur) |

   Les variables Vercel sont « encrypted at rest » ; les variables `NEXT_PUBLIC_` sont inlinées au
   build, donc **tout changement exige un redéploiement**
   (https://vercel.com/docs/environment-variables, lu le 2026‑11‑08).
5. **Deploy**. Notez l'URL de production, de la forme `https://<projet>.vercel.app`.
6. **[MANUAL]** Domaine personnalisé facultatif : **Settings › Domains**, ajoutez `www.example.com`, puis
   créez l'enregistrement CNAME indiqué par Vercel chez votre registrar.
7. **Câblage CORS côté API** : ajoutez l'URL Vercel (et le domaine personnalisé) à `CORS_ORIGINS`.
   - Oracle : sur la VM, éditez `~/listayours/deploy/oracle/.env`, puis **recréez** le conteneur
     (`restart` ne relit pas `env_file`) :

     ```bash
     cd ~/listayours/deploy/oracle && docker compose -f docker-compose.prod.yml up -d
     ```

   - Northflank : modifiez la variable dans le service ou le secret group, le service redémarre.
   - Les déploiements **Preview** de Vercel ont des URL différentes à chaque branche : ils ne passeront
     pas CORS sauf à les ajouter explicitement. C'est voulu (liste blanche stricte).
8. Vérifiez l'en‑tête CORS depuis votre poste :

   ```bash
   curl -sSI https://api.example.com/api/public/wishlists -H 'Origin: https://<projet>.vercel.app' \
     | grep -i '^access-control-allow-origin'
   # attendu : access-control-allow-origin: https://<projet>.vercel.app
   ```

---

## 6. Hébergeur de repli : Northflank Sandbox

À utiliser si la carte Oracle est inacceptable (Northflank devient alors le principal) ou si la VM
Oracle est indisponible. Faits relevés le 2026‑11‑08 sur https://northflank.com/pricing : Sandbox
« No card needed », « Up to $20/mo of resources on Northflank Cloud », « 2 services, 2 jobs, and
1 database », « Always on, no sleeping ». **Non vérifié [uncertain]** : la taille de conteneur que
couvre réellement ce budget ; un plan 0,5 vCPU / 1 Go consommerait à peu près tout, et 1 Go est le
plancher de Chromium. Vérifiez le coût mensuel affiché dans l'interface avant de valider.
Les libellés ci‑dessous viennent de la documentation Northflank (URL dans `deploy/northflank/README.md`,
lues le 2026‑11‑08) ; l'interface peut avoir évolué.

1. **[MANUAL]** Créez un compte sur https://northflank.com (connexion GitHub), plan **Sandbox**. Aucune
   carte n'est demandée.
2. **[MANUAL]** Liez votre compte GitHub (**Account settings › Git**) et autorisez le dépôt
   `VialsShiny/ListaYours`.
3. Créez un **Project** (`listayours`, région européenne).
4. **Create new › Service › Combined service** :
   - **Repository** : `VialsShiny/ListaYours`, branche `main`.
   - **Build type** : `Dockerfile` ; **Dockerfile path** `/api/Dockerfile` ; **Build context** `/api`
     (« If your Dockerfile and/or build context are not root, specify the relative paths »).
   - **Resources** : le plus petit plan offrant **au moins 1 Go de RAM** (Chromium) ; contrôlez que le coût
     mensuel estimé reste sous les 20 $ du Sandbox **[uncertain]**. 1 instance.
   - **Networking** : le port `8000` est détecté depuis `EXPOSE 8000` du Dockerfile ; protocole **HTTP**,
     **Public**. Nom de port `api`. L'URL générée a la forme `[port-name]--[service-name]--[random].code.run`
     et est « secured with an automatically-generated TLS certificate » ; HTTP 80 redirige vers 443.
   - **Advanced › Health checks** : type HTTP, path `/health`, port `8000`, intervalle 30 s (« HTTP probes
     will send a GET request which passes if the response has a status code greater than or equal to 200
     and less than 400 »).
5. **Variables d'environnement [MANUAL]** : créez un **Secret group** `listayours-api` (**Project › Secrets
   › Create secret group**, portée *runtime*, lié au service), ou saisissez‑les dans **Service ›
   Environment**. Noms :

   `ENVIRONMENT=production`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_MINUTES`, `OWNER_EMAIL`,
   `CORS_ORIGINS`, `SCRAPE_TIMEOUT_SECONDS`, `SCRAPE_CACHE_TTL_SECONDS`, `RATE_LIMIT_PER_MINUTE`,
   `TRUST_PROXY_HEADERS`, `API_PORT=8000`.

   Pour `TRUST_PROXY_HEADERS` : le trafic passe par l'ingress Northflank ; que celui‑ci écrase
   `X-Forwarded-For` avec l'IP réelle du client n'a pas été vérifié dans la documentation **[uncertain]**.
   Mettez `true` (sinon tous les visiteurs partagent la même clé de limitation de débit, l'IP de
   l'ingress) et vérifiez dans les journaux du service que les clés de rate‑limit varient d'un client à
   l'autre ; revenez à `false` si l'en‑tête s'avère non fiable.
   Ne mettez **jamais** `JWT_SECRET` ou `DATABASE_URL` dans un *build argument* (ils sont lisibles dans
   l'image).
6. **Create service**. Le premier build dure plusieurs minutes (Chromium). Northflank reconstruit à
   chaque push sur `main`. La page de la documentation ne précise pas l'architecture des builders
   **[uncertain]** ; les images de base du Dockerfile sont multi‑arch, aucun changement n'est nécessaire.
7. Vérifiez :

   ```bash
   curl -fsS https://api--listayours-api--XXXX.code.run/health; echo
   curl -fsS https://api--listayours-api--XXXX.code.run/api/public/wishlists; echo
   ```

8. **[MANUAL]** Domaine personnalisé facultatif : **Service › Ports & DNS › Link domain**, puis CNAME chez
   votre registrar. Sinon l'URL `code.run` suffit : mettez‑la dans `NEXT_PUBLIC_API_URL` (§ 5.4) et
   l'URL Vercel dans `CORS_ORIGINS`.
9. **Base de données** : gardez Neon (§ 3.2). Le Sandbox inclut « 1 database » Northflank, mais son coût
   s'impute sur les 20 $ partagés avec l'API et sa taille gratuite n'est pas documentée **[uncertain]**.
10. Migrations : automatiques au démarrage du conteneur. Manuellement : **Service › Shell** (ou
    `northflank exec` avec leur CLI) puis `alembic upgrade head`.

---

## 7. Chargement initial de la liste (`make seed`)

`make seed` lance **le vrai scraper** (HTTPX puis Chromium) sur les URL de `api/seed/wishlist.json`
et remplit la base (`python -m app.seed`, voir le `Makefile`). Il crée le compte propriétaire s'il
n'existe pas encore et le réutilise sinon. Il s'exécute **depuis le dépôt**, sur votre poste (après
`make install`), avec quatre variables dans l'environnement du shell, jamais dans un fichier commité :

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | la base de production (Neon/Supabase : la même chaîne que l'API ; Postgres sur la VM : voir la variante en conteneur) |
| `OWNER_EMAIL` | la même valeur que l'API ; le compte créé par le seed devient propriétaire |
| `OWNER_PASSWORD` | mot de passe du compte propriétaire, fort, généré par votre gestionnaire de mots de passe ; jamais journalisé par le seed |
| `SEED_ASSETS_BASE_URL` | origine qui sert les images `/seed/...` du frontend, c'est‑à‑dire l'URL Vercel de production (sans `/` final) |

```bash
cd ~/Code/ListaYours
read -rs -p 'OWNER_PASSWORD: ' OWNER_PASSWORD; echo
read -rs -p 'DATABASE_URL: ' DATABASE_URL; echo
export DATABASE_URL OWNER_PASSWORD
export OWNER_EMAIL='vous@example.com' SEED_ASSETS_BASE_URL='https://<projet>.vercel.app'
make seed
unset DATABASE_URL OWNER_PASSWORD
```

`read -rs` évite que les secrets apparaissent dans l'historique du shell. Le seed dépend des sites
e‑commerce : il peut durer plusieurs minutes et retomber sur les données PDF si une page est bloquée
(décision n° 4) ; `--no-scrape` force ce repli sans réseau. Le rapport est écrit dans
`api/seed/last-run.json` (ne le committez pas s'il contient des URL privées). Relancer `make seed` est
idempotent pour le compte propriétaire ; vérifiez le résultat avec l'appel public du § 8.

**Variante en conteneur, sur la VM** (obligatoire avec `--profile local-db`, dont le port 5432 n'est
publié que sur `127.0.0.1` de la VM ; pratique aussi avec Neon). `DATABASE_URL` et `OWNER_EMAIL` sont
déjà dans l'environnement du conteneur, l'image contient `seed/wishlist.json` et Chromium :

```bash
cd ~/listayours/deploy/oracle
read -rs -p 'OWNER_PASSWORD: ' OWNER_PASSWORD; echo
docker compose -f docker-compose.prod.yml exec -e OWNER_PASSWORD="$OWNER_PASSWORD" api \
  python -m app.seed --file seed/wishlist.json --assets-base-url 'https://<projet>.vercel.app' --report /tmp/seed-last-run.json
unset OWNER_PASSWORD
docker compose -f docker-compose.prod.yml exec api cat /tmp/seed-last-run.json | head -c 2000; echo
```

Sur Northflank : **Service › Shell**, puis la même commande `python -m app.seed …` après avoir exporté
`OWNER_PASSWORD` dans ce shell (ne l'ajoutez pas aux variables permanentes du service).

---

## 8. Vérification de bout en bout

```bash
API=https://api.example.com            # ou l'URL code.run
FRONT=https://<projet>.vercel.app

curl -fsS "$API/health"; echo                                   # {"status":"ok"}
curl -fsS "$API/api/public/wishlists" | head -c 400; echo       # liste JSON non vide après le seed
curl -sSI "$API/api/public/wishlists" -H "Origin: $FRONT" | grep -i access-control-allow-origin
curl -sS -o /dev/null -w '%{http_code}\n' "$FRONT"              # 200
```

Puis, dans un navigateur :

1. Ouvrez `$FRONT`, inscrivez‑vous avec `OWNER_EMAIL` (si le seed ne l'a pas déjà fait) : ce compte est
   propriétaire. Les onglets d'administration doivent apparaître.
2. Dans une fenêtre privée, inscrivez un compte visiteur, réservez un cadeau.
3. Revenez sur le compte propriétaire : le cadeau doit apparaître **disponible** (c'est le contrat de
   confidentialité, `docs/PRIVACY.md`).
4. Onglet *Network* des outils de développement : aucune erreur CORS, toutes les requêtes API en `https://`.

---

## 9. Mises à jour, migrations, journaux

### 9.1 Déployer une nouvelle version (Oracle)

```bash
ssh -i ~/.ssh/listayours_oci ubuntu@IP_PUBLIQUE_VM
cd ~/listayours && git pull --ff-only
cd deploy/oracle && docker compose -f docker-compose.prod.yml up -d --build
docker image prune -f
```

La migration s'exécute au redémarrage du conteneur. Le frontend se redéploie seul à chaque push sur
`main` (Vercel), de même que l'API sur Northflank.

### 9.2 Retour arrière

```bash
cd ~/listayours && git log --oneline -5
git checkout <sha_precedent> && cd deploy/oracle && docker compose -f docker-compose.prod.yml up -d --build
```

Une migration Alembic n'est pas annulée automatiquement ; si la version précédente l'exige :
`docker compose -f docker-compose.prod.yml exec api alembic downgrade -1`.

### 9.3 Journaux

```bash
docker compose -f docker-compose.prod.yml logs --since 1h api
docker compose -f docker-compose.prod.yml logs --since 1h caddy
sudo journalctl -u listayours-keepalive.service --since today
```

Les journaux Docker sont plafonnés (20 Mo × 5 fichiers par service) dans le compose.

### 9.4 Sauvegardes (uniquement avec `--profile local-db`)

```bash
mkdir -p ~/backups
cat > ~/backups/pg-dump.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cd ~/listayours/deploy/oracle
docker compose -f docker-compose.prod.yml --profile local-db exec -T db \
  pg_dump -U "${POSTGRES_USER:-listayours}" "${POSTGRES_DB:-listayours}" | gzip > ~/backups/listayours-$(date +%F).sql.gz
find ~/backups -name 'listayours-*.sql.gz' -mtime +14 -delete
EOF
chmod 700 ~/backups/pg-dump.sh
( crontab -l 2>/dev/null; echo '30 3 * * * $HOME/backups/pg-dump.sh >> $HOME/backups/pg-dump.log 2>&1' ) | crontab -
```

Copiez régulièrement `~/backups` hors de la VM (`scp -i ~/.ssh/listayours_oci ubuntu@IP:backups/*.sql.gz .`),
sinon une récupération de la VM par Oracle (§ 10) emporte les données. Oracle inclut aussi « 5 backups »
de volumes bloc dans Always Free (console **Block Storage › Boot Volumes › Backups**), utiles mais pas
une sauvegarde logique de la base.

---

## 10. Rester hors de la règle de récupération des VM inactives (Oracle)

Règle officielle, verbatim (https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm,
lu le 2026‑11‑08) :

> « Idle Always Free compute instances may be reclaimed by Oracle. Oracle will deem virtual machine and
> bare metal compute instances as idle if, during a 7-day period, the following are true:
> CPU utilization for the 95th percentile is less than 20%; Network utilization is less than 20%;
> Memory utilization is less than 20% (applies to A1 shapes only) »

Les **trois** conditions doivent être réunies : il suffit d'en faire échouer une. Un scrape Chromium
quotidien pousse souvent le 95e percentile CPU au‑dessus de 20 %, mais rien ne le garantit sur une liste
consultée rarement. La mitigation proposée est un **timer systemd** qui toutes les 5 minutes appelle
`/health` et `GET /api/public/wishlists` (ce qui maintient aussi Neon/Supabase actifs) puis occupe un
cœur pendant 60 s en priorité minimale (`nice 19`), soit ≈ 50 % de CPU instance sur une minute sur cinq.

Installation (sur la VM, depuis le clone) :

```bash
cd ~/listayours
sudo install -m 0755 deploy/keepalive/keepalive.sh /usr/local/bin/listayours-keepalive.sh
sudo install -m 0644 deploy/keepalive/listayours-keepalive.service /etc/systemd/system/
sudo install -m 0644 deploy/keepalive/listayours-keepalive.timer /etc/systemd/system/
API_DOMAIN=$(grep '^API_DOMAIN=' deploy/oracle/.env | cut -d= -f2)
printf 'KEEPALIVE_URL=http://127.0.0.1:8000/health\nKEEPALIVE_PUBLIC_URL=https://%s/api/public/wishlists\nKEEPALIVE_BURST_SECONDS=60\n' "$API_DOMAIN" \
  | sudo tee /etc/default/listayours-keepalive >/dev/null
sudo systemctl daemon-reload
sudo systemctl enable --now listayours-keepalive.timer
systemctl list-timers listayours-keepalive.timer --no-pager
sudo systemctl start listayours-keepalive.service && sudo journalctl -u listayours-keepalive.service -n 5 --no-pager
```

**C'est un contournement, pas une garantie.** Non vérifié **[uncertain]** : la granularité
d'échantillonnage et la méthode de calcul du 95e percentile par Oracle (si la métrique est moyennée sur
plus d'une minute, 60 s de rafale peuvent peser moins que prévu : augmentez `KEEPALIVE_BURST_SECONDS` à
90 ou 120) ; le devenir d'une instance récupérée (arrêtée ou supprimée) ; l'exemption éventuelle des
tenancies passées en Pay As You Go. Contrôlez chaque mois dans la console **Compute › Instances ›
listayours-api › Metrics** que *CPU Utilization* (95e percentile sur 7 jours) dépasse 20 %, ou que
*Memory Utilization* le dépasse (Chromium + Postgres local y contribuent). Rien dans les conditions
Oracle lues n'interdit ce type de charge ni le scraping.

Deuxième règle, distincte : « Accounts left idle for 30 days or more may be deemed abandoned »
(FAQ Oracle, **[uncertain]**, page inaccessible à notre lecteur). Connectez‑vous à la console au moins
une fois par mois (§ 14).

---

## 11. Keep-alive pingers : pourquoi ce n'est pas la voie recommandée

Les services de ping gratuits existent (relevé du 2026‑11‑08) : cron-job.org, « absolutely free »,
« frequencies up to once per minute », délai 30 s, réponse plafonnée à 64 Ko, « fair usage »
(https://cron-job.org/en/ ; https://cron-job.org/en/faq/) ; UptimeRobot, « 50 monitors », « 5 min.
monitoring interval », « No credit card required! » (https://uptimerobot.com/pricing/).

Ils ne sont **pas** la solution retenue pour l'API, pour trois raisons :

1. **Ils n'empêchent pas la mise en veille** chez les hébergeurs qui l'imposent : Koyeb Free « scales
   down to zero after 1 hour without traffic » et cela « cannot be disabled » ; Hugging Face impose un
   matériel payant pour « never deactivate » ; Render se réveille au ping mais consomme son quota de
   « 750 Free instance hours » par mois (un seul service 24 h/24 ≈ 720‑744 h, et le quota épuisé
   suspend tous les services gratuits). Tous peuvent redémarrer à leur rythme : un ping ne satisfait
   pas « ne jamais dormir ».
2. **Les conditions d'utilisation ne sont pas vérifiées** : « None of Render, Hugging Face or Koyeb
   explicitly allow or forbid pinging » sur les pages lues ; la politique de contenu Hugging Face interdit
   les contournements de restrictions, ce qui va à l'encontre d'un ping ; la page des conditions Render
   n'a pu être lue **[uncertain]**.
3. **Ce qui n'a pas pu être vérifié** : la position contractuelle de cron-job.org / UptimeRobot sur
   l'usage « keep-alive », et le traitement par Oracle du trafic HTTP entrant dans sa métrique réseau
   (un ping externe seul est très en dessous de 20 % d'utilisation réseau).

Un moniteur UptimeRobot sur `https://api.example.com/health` reste **utile comme alerte** (e‑mail en cas
de panne, intervalle 5 min), à condition de ne pas en dépendre pour la disponibilité. Pour Neon/Supabase,
l'activité quotidienne vient du timer du § 10, pas d'un pinger externe.

---

## 12. Hébergeurs écartés et pourquoi

Relevé du 2026‑11‑08 ; chaque chiffre vient de la page citée.

| Hébergeur (offre gratuite) | Mise en veille | RAM / CPU | Carte à l'inscription | Risque ToS / autre | Source |
|---|---|---|---|---|---|
| Render Free web service | Oui après **15 min** sans trafic entrant ; réveil « about one minute » ; 750 h/mois par workspace | 0,1 CPU / 512 Mo | Non précisé **[uncertain]** | « not for production use », peut redémarrer à tout moment, ports SMTP bloqués, Postgres gratuit expire après 30 jours ; conditions illisibles **[uncertain]** | https://render.com/docs/free ; https://render.com/docs/compute-plans ; https://render.com/docs/faq |
| Koyeb Free Instance | Oui après **1 h** ; « cannot be disabled » ; réveil 1‑5 s | 0,1 vCPU / 512 Mo / 2 Go | Carte exigée selon la FAQ (pré‑autorisation 29 $) ; blog 2023 : seulement si le contrôle automatique échoue **[uncertain lequel s'applique]** | « should not be used for production applications » ; blog documentant des campagnes anti‑abus | https://www.koyeb.com/docs/reference/instances ; https://www.koyeb.com/docs/run-and-scale/scale-to-zero ; https://www.koyeb.com/docs/faqs/pricing |
| Hugging Face Spaces (CPU Basic) | Oui après **48 h**, non configurable sur matériel gratuit | 2 vCPU / 16 Go / 50 Go éphémère | Non, mais les Docker Spaces « require a paid plan to create: PRO » (9 $/mois) | Sortie limitée aux ports 80/443/8080 ; politique de contenu contre le contournement de restrictions | https://huggingface.co/docs/hub/spaces-overview ; https://huggingface.co/docs/hub/spaces-gpus ; https://huggingface.co/pricing ; https://huggingface.co/content-policy |
| Google Cloud Run | Scale‑to‑zero ; `min-instances=1` évite la veille mais le temps idle est **facturé** ; gratuit ≈ 7 % d'un mois à 1 vCPU / 1 Gio (180 000 vCPU‑s, 360 000 Go‑s) | Configurable | **Oui** (compte de facturation + moyen de paiement) | Pas d'always‑on gratuit ; seul le crédit d'essai de 300 $ l'absorberait | https://docs.cloud.google.com/free/docs/free-cloud-features ; https://docs.cloud.google.com/run/docs/configuring/min-instances |
| Fly.io | « No free tier » ; 1 $ de crédit pendant 7 jours | 1 Go = 6,70 $/mois | **Oui** | — | https://docs.fly.io/about/pricing |
| Railway Free | Non précisé **[uncertain]** | plafond 1 vCPU / 0,5 Go ; « $1 of free credit per month » | Non précisé **[uncertain]** | 1 $/mois ne couvre pas un conteneur 24 h/24 ; image ≤ 4 Go | https://railway.com/pricing ; https://docs.railway.com/reference/pricing/plans ; https://docs.railway.com/reference/pricing/free-trial |
| Zeabur Free | Oui, « auto-sleep » après inactivité | Non précisé | Non | — | https://zeabur.com/docs/en-US/pricing/free-plan |
| Oracle AMD Micro (E2.1.Micro) | Non | 1/8 OCPU / 1 Go chacune (×2) | Oui (même compte) | Trop petit pour Chromium (1 Go = plancher), on garde le quota A1 à la place | https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm |
| Oracle Autonomous DB Always Free | Non ; s'arrête après 7 jours d'inactivité **[uncertain, non re‑vérifié]** | 1 OCPU, 20 Go, 20 sessions | Oui (même compte) | Moteur Oracle SQL, pas Postgres : incompatible avec SQLAlchemy/psycopg sans réécriture | même page |

Filet de sécurité payant si tout échoue : Koyeb eco‑small 0,5 vCPU / 1 Go à 5,36 $/mois ou Fly
shared‑cpu‑1x 1 Go à 6,70 $/mois (mêmes sources).

---

## 13. Limites gratuites qui s'appliquent à vous

Relevé du 2026‑11‑08.

| Service | Ce que vous utilisez | Limite gratuite | À surveiller |
|---|---|---|---|
| **Oracle Always Free** (A1) | 1 VM 2 OCPU / 12 Go, 100 Go boot | « 1,500 OCPU hours and 9,000 GB hours per month … equivalent to 2 OCPUs and 12 GB », 200 Go bloc + boot au total, 5 sauvegardes de volume, « 10 TB per month of outbound data » ; ressources dans la **home region** seulement | Règle d'inactivité 7 jours (§ 10) ; compte inactif 30 jours **[uncertain]** ; A1 au‑delà de 2 OCPU / 12 Go désactivé après l'essai puis supprimé après 30 jours |
| **Vercel Hobby** | 1 projet Next.js | Par mois : Fast Data Transfer 100 Go, Fast Origin Transfer 10 Go, 1 M d'invocations de fonctions, 4 h CPU, 360 Go‑h mémoire, 1 M de requêtes CDN, 5 000 transformations d'images ; 200 projets, 100 déploiements/jour, fonctions 300 s, journaux 1 h ; un dépassement **met la fonctionnalité en pause 30 jours** | Usage **non commercial** uniquement ; pas de publicité ni de vente |
| **Neon Free** | 1 projet | 100 projets, 1 Go/projet (20 Go total), 100 CU‑heures/projet/mois, suspension après 5 min toujours active | Les 100 CU‑heures ≈ 400 h à 0,25 CU : **ne pas** pinger Neon en continu ; un timer 5 min (§ 10) réveille la base ≈ 288 fois/jour, surveillez la consommation dans la console Neon et espacez à 10‑15 min si nécessaire |
| **Supabase Free** (alternative) | 1 projet | 2 projets actifs, 500 Mo, Nano 0,5 Go RAM, 60 connexions, 5 Go de sortie | Pause après 7 jours de faible activité, reprise manuelle |
| **Northflank Sandbox** (repli) | 1 service | « Up to $20/mo of resources », 2 services, 2 jobs, 1 base ; taille couverte **[uncertain]** | Le coût affiché du plan choisi doit rester sous le budget |

---

## 14. Checklist mensuelle

- [ ] **[MANUAL]** Se connecter à la console Oracle (règle des 30 jours d'inactivité du compte
  **[uncertain]**) et vérifier que l'instance est `Running`.
- [ ] Console Oracle, **Compute › Instances › listayours-api › Metrics**, fenêtre 7 jours : *CPU
  Utilization* p95 > 20 % **ou** *Memory Utilization* > 20 %. Sinon augmenter `KEEPALIVE_BURST_SECONDS`.
- [ ] `systemctl list-timers listayours-keepalive.timer` : le timer a tourné dans les 5 dernières minutes.
- [ ] `curl -fsS https://api.example.com/health` et `GET /api/public/wishlists` répondent ; certificat
  valide (`curl -vI … 2>&1 | grep -i expire`).
- [ ] Neon : consommation de CU‑heures du mois < 100 ; Supabase : projet non en pause.
- [ ] Vercel, **Usage** : transfert et invocations loin des plafonds Hobby.
- [ ] Northflank (si utilisé) : coût du mois < 20 $, service `Running`, dernier build vert.
- [ ] `--profile local-db` : un dump récent dans `~/backups`, copié hors de la VM.
- [ ] `sudo apt-get update && sudo apt-get upgrade -y`, puis `docker compose … up -d --build` si une
  nouvelle version de l'image `caddy:2` ou de l'API est disponible.
- [ ] Espace disque : `df -h /` et `docker system df` ; `docker image prune -f` si besoin.

---

## 15. Secrets : règles non négociables

- **Jamais dans le dépôt** : seul `listayours.env.example` (noms et valeurs factices) est versionné ;
  `.env` est dans `.gitignore`. Avant chaque commit : `git status --porcelain | grep -E '\.env$'` doit être
  vide.
- **Jamais affichés** : pas de `cat .env`, pas de `echo $JWT_SECRET`, pas de `docker compose config`
  sans `--no-interpolate` dans un terminal partagé, pas de capture d'écran de l'onglet Environment.
  Utilisez `read -rs` pour saisir une valeur dans un shell.
- **Jamais dans les journaux** : l'API ne journalise pas sa configuration ; ne lancez pas `uvicorn` avec
  `--log-level trace` en production.
- **Sur la VM** : `.env` en mode `600`, propriétaire `ubuntu`, dans `~/listayours/deploy/oracle/` ; la clé
  SSH privée ne quitte pas votre poste.
- **Sur Vercel** : variables chiffrées au repos ; `NEXT_PUBLIC_API_URL` est la seule variable, et elle est
  publique par nature. Ne mettez **aucun** secret dans une variable `NEXT_PUBLIC_*`.
- **Sur Northflank** : secret groups ou variables de service, **jamais** en build argument.
- **Rotation** : si `JWT_SECRET` fuit, générez‑en un nouveau (§ 2.4), remplacez‑le, `docker compose … up -d` ;
  toutes les sessions sont invalidées, c'est voulu. Si `DATABASE_URL` fuit, changez le mot de passe dans
  Neon/Supabase (**[MANUAL]**) puis mettez `.env` à jour.

---

## 16. Dépannage

| Symptôme | Cause probable | Correctif |
|---|---|---|
| `curl http://127.0.0.1:8000/health` répond sur la VM mais pas `https://api.example.com/health` | Ports 80/443 fermés dans la security list **ou** dans iptables ; DNS pas encore propagé | § 4.3 et § 4.7 ; `dig +short api.example.com` ; `docker compose logs caddy` |
| Caddy : erreurs ACME `challenge failed` | Le DNS ne pointe pas vers la VM ou le port 80 est bloqué | Corriger le DNS/pare‑feu ; Caddy réessaie seul |
| Le conteneur `api` redémarre en boucle | `JWT_SECRET` < 32 caractères ou `OWNER_EMAIL` vide en production ; `DATABASE_URL` invalide | `docker compose logs api` montre `RuntimeError: JWT_SECRET must be set…` ; corriger `.env`, `up -d` |
| `alembic upgrade head` échoue avec une erreur SSL | `sslmode` manquant vers Neon/Supabase | Ajouter `?sslmode=require` à `DATABASE_URL` |
| Le frontend affiche une erreur réseau, console : `blocked by CORS policy` | L'origine Vercel n'est pas dans `CORS_ORIGINS`, ou `/` final en trop | § 5.7 puis `up -d` (pas `restart`) |
| Le frontend appelle `http://localhost:8000` | `NEXT_PUBLIC_API_URL` absente au moment du build | Ajouter la variable puis **redéployer** sur Vercel |
| Première requête lente après une pause | Suspension Neon (5 min) | Normal ; `pool_pre_ping` gère la reconnexion |
| `500` sur toutes les routes base de données | Projet Supabase en pause | Reprendre le projet dans le tableau de bord **[MANUAL]** |
| `exec /opt/venv/bin/python: exec format error` | Image construite pour amd64 lancée sur la VM ARM64 | Reconstruire sur la VM ou avec `--platform linux/arm64` (§ 4.11) |
| Scrape en échec, `Target page, context or browser has been closed` | Mémoire partagée insuffisante pour Chromium | `shm_size: "1gb"` est dans le compose ; vérifier `free -h` et qu'aucun autre service ne sature la RAM |
| Instance Oracle disparue ou arrêtée | Récupération pour inactivité (§ 10) ou compte abandonné | Vérifier le timer, recréer la VM, restaurer depuis `~/backups` si Postgres local |
