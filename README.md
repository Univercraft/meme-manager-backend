# Meme Manager - Backend (Directus)

Backend du projet Meme Manager utilisant Directus comme headless CMS et Meilisearch pour la recherche.

## 📋 Prérequis

- Node.js (version 18+)
- npm ou yarn
- Meilisearch (optionnel, pour la recherche)

## 🚀 Installation

1. Installer les dépendances :
```bash
npm install
```

2. Configurer les variables d'environnement :
   - Copier `.env.example` vers `.env`
   - Modifier les valeurs si nécessaire (par défaut configuré pour localhost)

3. **(Optionnel)** Installer Meilisearch pour la recherche :
   - Télécharger depuis [https://www.meilisearch.com/docs/learn/getting_started/installation](https://www.meilisearch.com/docs/learn/getting_started/installation)
   - Extraire dans le dossier `meilisearch-bin/`
   - Ou utiliser Docker : `docker run -p 7701:7700 getmeili/meilisearch:latest`

## ▶️ Démarrage

### Démarrage complet (Directus + Meilisearch)
```bash
npm run dev
```

### Démarrage Directus uniquement
```bash
npm start
```

### Démarrage Meilisearch uniquement
```bash
npm run meilisearch
```

Le backend sera accessible sur : http://localhost:8055

## 🔧 Configuration initiale

### Créer les collections
```bash
npm run create:collections
```

### Configurer les permissions
```bash
npm run setup:all
```

## 📚 Collections disponibles

- **memes** : Collection principale des mèmes
- **saved_memes** : Mèmes sauvegardés par les utilisateurs
- **notifications** : Notifications système
- **directus_users** : Utilisateurs (géré par Directus)
- **directus_roles** : Rôles (géré par Directus)

## 🔑 Authentification

Le backend supporte l'authentification GitHub OAuth :
- CLIENT_ID : Configuré dans `.env`
- CLIENT_SECRET : Configuré dans `.env`
- Redirect URL : http://localhost:4200

## 🔍 Meilisearch

Meilisearch est utilisé pour la recherche full-text des mèmes.
- Host : http://localhost:7701
- Master Key : dev-meilisearch-key-123

## 📁 Structure

```
backend/
├── data/                    # Base de données SQLite et données Meilisearch
├── extensions/             # Extensions Directus personnalisées
├── uploads/                # Fichiers uploadés
├── migrations/             # Migrations de schéma
├── .env                    # Configuration (non versionné)
└── package.json           # Dépendances
```

## 🛠️ Scripts utiles

- `npm run test:connection` : Tester la connexion à Directus
- `npm run fix:permissions` : Corriger les permissions
- `npm run setup:meilisearch` : Configurer Meilisearch

## 📝 Notes

- Base de données SQLite stockée dans `data/database.db`
- Admin par défaut : admin@example.com / admin123 (à changer en production)
- Token statique disponible dans `.env` (ADMIN_TOKEN)
