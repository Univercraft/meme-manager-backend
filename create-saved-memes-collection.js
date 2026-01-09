import axios from 'axios';

const DIRECTUS_URL = 'http://localhost:8055';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

async function createSavedMemesCollection() {
  console.log('🔧 Création de la collection saved_memes...\n');

  try {
    console.log('🔐 Tentative de connexion à', DIRECTUS_URL);
    console.log('   Email:', ADMIN_EMAIL);
    
    const loginResponse = await axios.post(`${DIRECTUS_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    const token = loginResponse.data.data.access_token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Connecté\n');

    // Vérifier si la collection existe déjà
    try {
      const existingCollections = await axios.get(`${DIRECTUS_URL}/collections`, { headers });
      const collectionExists = existingCollections.data.data.some(c => c.collection === 'saved_memes');
      
      if (collectionExists) {
        console.log('⚠️  La collection saved_memes existe déjà !');
        return;
      }
    } catch (err) {
      console.log('Vérification de l\'existence ignorée');
    }

    console.log('📦 Création de la collection...');
    await axios.post(`${DIRECTUS_URL}/collections`, {
      collection: 'saved_memes',
      meta: { icon: 'bookmark', note: 'Memes enregistrés' },
      schema: { name: 'saved_memes' }
    }, { headers });
    console.log('✅ Collection créée\n');

    console.log('📝 Création du champ user_id...');
    await axios.post(`${DIRECTUS_URL}/fields/saved_memes`, {
      field: 'user_id',
      type: 'uuid',
      meta: { interface: 'select-dropdown-m2o', special: ['m2o'], required: true },
      schema: { foreign_key_table: 'directus_users', foreign_key_column: 'id' }
    }, { headers });
    console.log('✅ user_id créé');

    console.log('📝 Création du champ meme_id...');
    await axios.post(`${DIRECTUS_URL}/fields/saved_memes`, {
      field: 'meme_id',
      type: 'uuid',
      meta: { interface: 'select-dropdown-m2o', special: ['m2o'], required: true },
      schema: { foreign_key_table: 'memes', foreign_key_column: 'id' }
    }, { headers });
    console.log('✅ meme_id créé');

    console.log('\n🎉 Collection saved_memes créée avec succès !');

  } catch (error) {
    console.error('\n❌ Erreur détaillée:');
    console.error('   Message:', error.message);
    console.error('   Code:', error.code);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Directus ne semble pas démarré. Lancez: npx directus start');
    }
    process.exit(1);
  }
}

createSavedMemesCollection();
