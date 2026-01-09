import axios from 'axios';

const DIRECTUS_URL = 'http://localhost:8055';

async function testConnection() {
  console.log('🔍 Test de connexion à Directus...\n');

  try {
    // Test 1: Ping server
    console.log('1️⃣ Test du serveur...');
    const serverResponse = await axios.get(`${DIRECTUS_URL}/server/info`);
    console.log('✅ Serveur accessible');
    console.log('   Version:', serverResponse.data.data.directus.version);

    // Test 2: Login
    console.log('\n2️⃣ Test de connexion admin...');
    const loginResponse = await axios.post(`${DIRECTUS_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    console.log('✅ Connexion réussie');
    console.log('   Token:', loginResponse.data.data.access_token.substring(0, 20) + '...');

    // Test 3: Roles
    console.log('\n3️⃣ Test des rôles...');
    const token = loginResponse.data.data.access_token;
    const rolesResponse = await axios.get(`${DIRECTUS_URL}/roles`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Rôles récupérés');
    console.log('   Rôles disponibles:');
    rolesResponse.data.data.forEach(role => {
      console.log(`      - ${role.name} (ID: ${role.id})`);
    });

    // Test 4: Collections
    console.log('\n4️⃣ Test des collections...');
    const collectionsResponse = await axios.get(`${DIRECTUS_URL}/collections`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Collections récupérées');
    const relevantCollections = ['memes', 'tags', 'memes_tags', 'memes_likes'];
    const existingCollections = collectionsResponse.data.data
      .filter(c => relevantCollections.includes(c.collection))
      .map(c => c.collection);
    console.log('   Collections pertinentes:');
    relevantCollections.forEach(col => {
      if (existingCollections.includes(col)) {
        console.log(`      ✅ ${col}`);
      } else {
        console.log(`      ❌ ${col} (manquante)`);
      }
    });

    console.log('\n🎉 Tous les tests ont réussi !');
    console.log('\n💡 Vous pouvez maintenant lancer: npm run setup:all');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.response) {
      console.error('📄 Réponse:', error.response.data);
      console.error('🔢 Status:', error.response.status);
    }
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Directus ne semble pas démarré. Lancez: npx directus start');
    }
  }
}

testConnection();
