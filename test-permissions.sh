#!/bin/bash

echo "Test des permissions Directus..."

# Test 1: Accès public aux memes
echo "1. Test lecture publique des memes..."
curl -s "http://localhost:8055/items/memes?filter[status][_eq]=published&limit=1" | jq .

# Test 2: Accès public aux tags
echo "2. Test lecture publique des tags..."
curl -s "http://localhost:8055/items/tags?limit=1" | jq .

# Test 3: Inscription (devrait fonctionner)
echo "3. Test inscription..."
curl -X POST http://localhost:8055/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "first_name": "Test",
    "last_name": "User",
    "status": "active"
  }' | jq .

echo "Tests terminés !"
