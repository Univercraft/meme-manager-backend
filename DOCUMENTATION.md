# Documentation Technique - Backend (Directus)

## 📖 Table des matières

1. [Architecture Backend](#architecture-backend)
2. [Structure du projet](#structure-du-projet)
3. [Collections Directus](#collections-directus)
4. [Configuration](#configuration)
5. [Extensions personnalisées](#extensions-personnalisées)
6. [API et endpoints](#api-et-endpoints)
7. [Authentification OAuth](#authentification-oauth)
8. [Meilisearch](#meilisearch)
9. [Scripts utiles](#scripts-utiles)
10. [Développement](#développement)

---

## Architecture Backend

### Vue d'ensemble

Le backend utilise **Directus 11** comme Headless CMS avec :
- **SQLite** pour la base de données (développement)
- **Meilisearch** pour la recherche full-text
- **OAuth GitHub** pour l'authentification

```
┌─────────────────────────────────────────┐
│         Frontend (Angular)              │
└──────────────┬──────────────────────────┘
               │ HTTP/REST
               ▼
┌─────────────────────────────────────────┐
│      Directus API (Port 8055)           │
│   - Authentification                    │
│   - CRUD Collections                    │
│   - Upload fichiers                     │
│   - Permissions                         │
└──────────────┬──────────────────────────┘
               │
      ┌────────┴────────┐
      ▼                 ▼
┌──────────┐    ┌──────────────┐
│  SQLite  │    │ Meilisearch  │
│   3.x    │    │  (Port 7701) │
└──────────┘    └──────────────┘
```

---

## Structure du projet

```
meme-manager-backend/
├── data/                      # Données persistantes
│   ├── database.db           # Base SQLite
│   └── meilisearch/          # Index de recherche
│
├── extensions/               # Extensions personnalisées
│   ├── hooks/                # Hooks Directus
│   │   └── auto-role/        # Attribution auto de rôle
│   │       └── index.js
│   └── meilisearch-config.yaml
│
├── migrations/               # Migrations de schéma
│   └── 001_initial_schema.json
│
├── uploads/                  # Fichiers uploadés (images)
│
├── dumps/                    # Backups de la base
│
├── .env                      # Variables d'environnement
├── package.json             # Dépendances Node.js
├── README.md                # Documentation rapide
│
├── check-permissions*.js    # Scripts de vérification
├── create-*.js              # Scripts de création
├── fix-permissions*.js      # Scripts de correction
├── setup-*.js               # Scripts de configuration
└── test-connection.js       # Test de connexion
```

---

## Collections Directus

### 1. Collection `memes`

**Schéma** :
```typescript
interface Meme {
  id: string;                    // UUID (primary key)
  title: string;                 // Titre du meme (requis)
  description?: string;          // Description optionnelle
  image: string;                 // UUID référence vers directus_files
  tags?: Tag[];                  // Tags associés (relation M2M)
  user_created: string;          // UUID de l'utilisateur créateur
  date_created: Date;            // Date de création (auto)
  date_updated?: Date;           // Date de modification (auto)
  status: 'draft' | 'published'; // Statut de publication
  likes: number;                 // Nombre de likes (default: 0)
  views: number;                 // Nombre de vues (default: 0)
}
```

**Permissions** :
- **Public** : 
  - Lecture : ✅ (seulement `status = published`)
  - Création : ❌
  - Modification : ❌
  - Suppression : ❌

- **Authenticated** :
  - Lecture : ✅ (tous les memes publiés)
  - Création : ✅
  - Modification : ✅ (seulement ses propres memes)
  - Suppression : ✅ (seulement ses propres memes)

- **Administrator** :
  - Tous les droits : ✅

### 2. Collection `saved_memes`

**Schéma** :
```typescript
interface SavedMeme {
  id: number;                // Auto-increment (primary key)
  user_id: string;           // UUID référence vers directus_users
  meme_id: string;           // UUID référence vers memes
  date_created: Date;        // Date de sauvegarde (auto)
}
```

**Contrainte** : `UNIQUE(user_id, meme_id)` - Un utilisateur ne peut sauvegarder un meme qu'une seule fois

**Permissions** :
- **Authenticated** :
  - Lecture : ✅ (seulement ses propres sauvegardes)
  - Création : ✅
  - Suppression : ✅ (seulement ses propres sauvegardes)

### 3. Collection `notifications`

**Schéma** :
```typescript
interface Notification {
  id: number;                    // Auto-increment (primary key)
  user_id: string;               // UUID destinataire
  type: string;                  // Type: 'like', 'comment', 'follow'
  message: string;               // Message de notification
  related_meme_id?: string;      // UUID du meme concerné (optionnel)
  read: boolean;                 // Statut de lecture (default: false)
  date_created: Date;            // Date de création (auto)
}
```

**Permissions** :
- **Authenticated** :
  - Lecture : ✅ (seulement ses propres notifications)
  - Modification : ✅ (seulement champ `read`)

### 4. Collections système Directus

- **directus_users** : Utilisateurs de l'application
- **directus_roles** : Rôles (Public, Authenticated, Administrator)
- **directus_files** : Fichiers uploadés (images des memes)
- **directus_folders** : Dossiers de fichiers
- **directus_permissions** : Règles de permissions

---

## Configuration

### Variables d'environnement (.env)

```bash
####################################
# Configuration Directus
####################################
PORT=8055
PUBLIC_URL=http://localhost:8055

# Clés de sécurité (à changer en production)
KEY=replace-with-random-string
SECRET=replace-with-random-string

####################################
# Base de données SQLite
####################################
DB_CLIENT=sqlite3
DB_FILENAME=./data/database.db

####################################
# Admin par défaut
####################################
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123

####################################
# Authentification GitHub OAuth
####################################
AUTH_PROVIDERS=github

AUTH_GITHUB_DRIVER=oauth2
AUTH_GITHUB_CLIENT_ID=your_github_client_id
AUTH_GITHUB_CLIENT_SECRET=your_github_client_secret
AUTH_GITHUB_AUTHORIZE_URL=https://github.com/login/oauth/authorize
AUTH_GITHUB_ACCESS_URL=https://github.com/login/oauth/access_token
AUTH_GITHUB_PROFILE_URL=https://api.github.com/user

####################################
# CORS (autoriser le frontend)
####################################
CORS_ENABLED=true
CORS_ORIGIN=http://localhost:4200

####################################
# Meilisearch
####################################
MEILISEARCH_HOST=http://localhost:7701
MEILISEARCH_API_KEY=dev-meilisearch-key-123

####################################
# Uploads
####################################
STORAGE_LOCATIONS=local
STORAGE_LOCAL_ROOT=./uploads
```

### Configuration OAuth GitHub

1. **Créer une application OAuth sur GitHub** :
   - Aller sur https://github.com/settings/developers
   - New OAuth App
   - Application name : `Meme Manager`
   - Homepage URL : `http://localhost:4200`
   - Authorization callback URL : `http://localhost:8055/auth/login/github/callback`

2. **Copier les identifiants** dans `.env` :
   - Client ID → `AUTH_GITHUB_CLIENT_ID`
   - Client Secret → `AUTH_GITHUB_CLIENT_SECRET`

---

## Extensions personnalisées

### Hook : Attribution automatique de rôle

**Fichier** : `extensions/hooks/auto-role/index.js`

**Fonctionnalité** : Attribue automatiquement le rôle "Authenticated" aux nouveaux utilisateurs créés via OAuth

```javascript
export default ({ filter, action }, { services, database }) => {
  const { ItemsService } = services;

  // Intercepter la création d'utilisateurs
  filter('users.create', async (payload, meta, context) => {
    try {
      // Récupérer l'ID du rôle "Authenticated"
      const role = await database
        .select('id')
        .from('directus_roles')
        .where('name', 'Authenticated')
        .first();

      if (role) {
        // Assigner le rôle à l'utilisateur
        payload.role = role.id;
        console.log('✅ Rôle "Authenticated" assigné automatiquement');
      }
    } catch (error) {
      console.error('❌ Erreur attribution rôle:', error);
    }

    return payload;
  });

  // Confirmer l'action après création
  action('users.create', async (meta, context) => {
    console.log('👤 Nouvel utilisateur créé:', meta.key);
  });
};
```

### Configuration Meilisearch

**Fichier** : `extensions/meilisearch-config.yaml`

```yaml
indexes:
  - name: memes
    primary_key: id
    
    # Champs interrogeables
    searchable_attributes:
      - title
      - description
      - tags
    
    # Champs filtrables
    filterable_attributes:
      - status
      - user_created
      - date_created
      - likes
      - views
    
    # Champs triables
    sortable_attributes:
      - date_created
      - likes
      - views
    
    # Règles de classement
    ranking_rules:
      - words        # Correspondance des mots
      - typo         # Tolérance aux fautes
      - proximity    # Proximité des termes
      - attribute    # Ordre des attributs
      - sort         # Tri personnalisé
      - exactness    # Correspondance exacte
```

---

## API et endpoints

### Authentification

| Endpoint                              | Méthode | Auth | Description                        |
|---------------------------------------|---------|------|------------------------------------|
| `/auth/login/github`                  | GET     | Non  | Initie l'authentification GitHub   |
| `/auth/login/github/callback`         | GET     | Non  | Callback OAuth GitHub              |
| `/auth/refresh`                       | POST    | Non  | Rafraîchir le token JWT            |
| `/auth/logout`                        | POST    | Oui  | Se déconnecter                     |
| `/users/me`                           | GET     | Oui  | Récupérer l'utilisateur connecté   |

### Memes

| Endpoint                              | Méthode | Auth | Description                        |
|---------------------------------------|---------|------|------------------------------------|
| `/items/memes`                        | GET     | Non  | Liste des memes publiés            |
| `/items/memes/:id`                    | GET     | Non  | Détail d'un meme                   |
| `/items/memes`                        | POST    | Oui  | Créer un nouveau meme              |
| `/items/memes/:id`                    | PATCH   | Oui  | Modifier un meme (propriétaire)    |
| `/items/memes/:id`                    | DELETE  | Oui  | Supprimer un meme (propriétaire)   |

### Memes sauvegardés

| Endpoint                              | Méthode | Auth | Description                        |
|---------------------------------------|---------|------|------------------------------------|
| `/items/saved_memes`                  | GET     | Oui  | Mes memes sauvegardés              |
| `/items/saved_memes`                  | POST    | Oui  | Sauvegarder un meme                |
| `/items/saved_memes/:id`              | DELETE  | Oui  | Retirer des favoris                |

### Notifications

| Endpoint                              | Méthode | Auth | Description                        |
|---------------------------------------|---------|------|------------------------------------|
| `/items/notifications`                | GET     | Oui  | Mes notifications                  |
| `/items/notifications/:id`            | PATCH   | Oui  | Marquer comme lu                   |

### Fichiers

| Endpoint                              | Méthode | Auth | Description                        |
|---------------------------------------|---------|------|------------------------------------|
| `/files`                              | POST    | Oui  | Upload d'image                     |
| `/assets/:id`                         | GET     | Non  | Télécharger une image              |

### Exemples de requêtes

#### 1. Récupérer les memes avec pagination

```http
GET /items/memes?limit=12&offset=0&sort=-date_created
```

#### 2. Filtrer les memes par statut

```http
GET /items/memes?filter[status][_eq]=published
```

#### 3. Rechercher par titre

```http
GET /items/memes?filter[title][_contains]=funny
```

#### 4. Récupérer avec relations

```http
GET /items/memes?fields=*,user_created.first_name,user_created.last_name,tags.tags_id.*
```

#### 5. Créer un meme

```http
POST /items/memes
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Mon super meme",
  "description": "Description optionnelle",
  "image": "uuid-of-uploaded-image",
  "status": "published"
}
```

---

## Authentification OAuth

### Flux complet GitHub OAuth

```
1. Frontend → Directus
   GET /auth/login/github

2. Directus → GitHub
   Redirect vers https://github.com/login/oauth/authorize?client_id=...

3. Utilisateur s'authentifie sur GitHub

4. GitHub → Directus
   Redirect vers /auth/login/github/callback?code=...

5. Directus → GitHub
   POST /login/oauth/access_token (échange du code)

6. GitHub → Directus
   Retourne access_token

7. Directus → GitHub
   GET /user (récupération du profil)

8. Directus
   - Crée ou met à jour l'utilisateur
   - Génère JWT access_token et refresh_token

9. Directus → Frontend
   Retourne les tokens JWT
```

### Réponse d'authentification

```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires": 900000
  }
}
```

### Utilisation du token

Toutes les requêtes authentifiées doivent inclure le header :

```http
Authorization: Bearer <access_token>
```

---

## Meilisearch

### Démarrage de Meilisearch

**Option 1 : Binaire local**
```bash
cd meilisearch-bin
./meilisearch --master-key "dev-meilisearch-key-123"
```

**Option 2 : Docker**
```bash
docker run -p 7701:7700 \
  -e MEILI_MASTER_KEY=dev-meilisearch-key-123 \
  getmeili/meilisearch:latest
```

### Indexation des memes

```javascript
const { MeiliSearch } = require('meilisearch');

const client = new MeiliSearch({
  host: 'http://localhost:7701',
  apiKey: 'dev-meilisearch-key-123'
});

// Ajouter un document
await client.index('memes').addDocuments([
  {
    id: 'uuid-123',
    title: 'Super meme',
    description: 'Description du meme',
    tags: ['funny', 'tech'],
    status: 'published'
  }
]);
```

### Recherche

```javascript
// Recherche simple
const results = await client.index('memes').search('funny cat');

// Recherche avec filtres
const results = await client.index('memes').search('meme', {
  filter: 'status = published',
  sort: ['date_created:desc'],
  limit: 20
});
```

---

## Scripts utiles

### Installation et démarrage

```bash
# Installation des dépendances
npm install

# Démarrage complet (Directus + Meilisearch)
npm run dev

# Démarrage Directus seul
npm start

# Démarrage Meilisearch seul
npm run meilisearch
```

### Configuration initiale

```bash
# Créer les collections saved_memes et notifications
npm run create:collections

# Configurer toutes les permissions
npm run setup:all

# Créer un token statique pour tests
npm run create:token
```

### Tests et vérifications

```bash
# Tester la connexion à Directus
npm run test:connection

# Vérifier les permissions (simple)
npm run check:permissions:simple

# Vérifier les permissions (détaillé)
npm run check:permissions:detailed

# Corriger les permissions
npm run fix:permissions
```

### Meilisearch

```bash
# Configurer Meilisearch
npm run setup:meilisearch
```

### Gestion de la base

```bash
# Créer un backup
npm run backup

# Restaurer un backup
npm run restore
```

---

## Développement

### Ajouter une nouvelle collection

```javascript
// create-my-collection.js
const { Directus } = require('@directus/sdk');

async function createCollection() {
  const directus = new Directus('http://localhost:8055');
  
  // Authentification admin
  await directus.auth.login({
    email: 'admin@example.com',
    password: 'admin123'
  });
  
  // Créer la collection
  await directus.collections.createOne({
    collection: 'comments',
    schema: { name: 'comments' },
    fields: [
      {
        field: 'id',
        type: 'integer',
        schema: {
          is_primary_key: true,
          has_auto_increment: true
        }
      },
      {
        field: 'content',
        type: 'text',
        schema: { is_nullable: false }
      },
      {
        field: 'meme_id',
        type: 'uuid',
        schema: { is_nullable: false }
      }
    ]
  });
  
  console.log('✅ Collection créée');
}

createCollection();
```

### Configurer des permissions

```javascript
// setup-permissions.js
const { Directus } = require('@directus/sdk');

async function setupPermissions() {
  const directus = new Directus('http://localhost:8055');
  await directus.auth.login({ /* ... */ });
  
  // Récupérer l'ID du rôle "Authenticated"
  const roles = await directus.roles.readByQuery({ filter: { name: { _eq: 'Authenticated' } } });
  const roleId = roles.data[0].id;
  
  // Créer une permission
  await directus.permissions.createOne({
    role: roleId,
    collection: 'comments',
    action: 'read',
    permissions: {},  // Tous les commentaires
    fields: ['*']     // Tous les champs
  });
  
  console.log('✅ Permission créée');
}

setupPermissions();
```

### Debugging

#### Logs Directus

```bash
# Mode verbose
DEBUG=directus:* npm start
```

#### Inspecter la base SQLite

```bash
sqlite3 data/database.db

# Lister les tables
.tables

# Voir le schéma d'une table
.schema memes

# Requête SQL
SELECT * FROM memes LIMIT 5;

# Quitter
.exit
```

#### Tester les permissions

```bash
# Avec curl
curl -H "Authorization: Bearer <token>" \
  http://localhost:8055/items/memes

# Avec httpie
http GET localhost:8055/items/memes \
  Authorization:"Bearer <token>"
```

### Migration vers PostgreSQL (production)

**Fichier .env** :
```bash
DB_CLIENT=pg
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=meme_manager
DB_USER=postgres
DB_PASSWORD=your_password
```

**Export depuis SQLite** :
```bash
# Exporter les données
npm run export

# Importer dans PostgreSQL
npm run import
```

---

## Ressources

### Documentation officielle
- [Directus Documentation](https://docs.directus.io/)
- [Directus SDK](https://docs.directus.io/reference/sdk/)
- [Meilisearch Docs](https://www.meilisearch.com/docs)
- [SQLite](https://www.sqlite.org/docs.html)

### Outils
- [Directus Studio](http://localhost:8055/admin) - Interface d'administration
- [Insomnia](https://insomnia.rest/) - Client API REST
- [SQLite Browser](https://sqlitebrowser.org/) - Explorateur SQLite

---

**Dernière mise à jour** : Janvier 2026
