#!/bin/bash

echo "🚀 Installation du Backend Directus Meme Manager"

# Installation des dépendances principales
echo "📦 Installation des dépendances..."
npm install

# Installation des dépendances des extensions
echo "🔌 Installation des extensions..."
cd extensions/meilisearch-sync && npm install && cd ../..
cd extensions/like-manager && npm install && cd ../..
cd extensions/search-setup && npm install && cd ../..
cd extensions/search && npm install && cd ../..

# Compilation des extensions
echo "🔨 Compilation des extensions..."
cd extensions/meilisearch-sync && npm run build && cd ../..
cd extensions/like-manager && npm run build && cd ../..
cd extensions/search-setup && npm run build && cd ../..
cd extensions/search && npm run build && cd ../..

# Bootstrap Directus
echo "🎯 Initialisation de Directus..."
npx directus bootstrap

echo "✅ Installation terminée !"
echo "👉 Lancez 'npm start' pour démarrer le serveur"
