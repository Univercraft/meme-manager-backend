import axios from 'axios';

const DIRECTUS_URL = 'http://localhost:8055';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

async function createNotificationsCollection() {
  console.log('🔔 Création de la collection notifications...\n');

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
      const collectionExists = existingCollections.data.data.some(c => c.collection === 'notifications');
      
      if (collectionExists) {
        console.log('⚠️  La collection notifications existe déjà !');
        return;
      }
    } catch (err) {
      console.log('Vérification de l\'existence ignorée');
    }

    console.log('📦 Création de la collection...');
    await axios.post(`${DIRECTUS_URL}/collections`, {
      collection: 'notifications',
      meta: { icon: 'notifications', note: 'Notifications utilisateurs' },
      schema: { name: 'notifications' }
    }, { headers });
    console.log('✅ Collection créée\n');

    console.log('📝 Création des champs...');
    
    await axios.post(`${DIRECTUS_URL}/fields/notifications`, {
      field: 'user_id',
      type: 'uuid',
      meta: { interface: 'select-dropdown-m2o', special: ['m2o'], required: true },
      schema: { foreign_key_table: 'directus_users', foreign_key_column: 'id' }
    }, { headers });
    console.log('✅ user_id créé');

    await axios.post(`${DIRECTUS_URL}/fields/notifications`, {
      field: 'type',
      type: 'string',
      meta: { interface: 'select-dropdown', required: true },
      schema: { default_value: 'like' }
    }, { headers });
    console.log('✅ type créé');

    await axios.post(`${DIRECTUS_URL}/fields/notifications`, {
      field: 'meme_id',
      type: 'uuid',
      meta: { interface: 'select-dropdown-m2o', special: ['m2o'] },
      schema: { foreign_key_table: 'memes', foreign_key_column: 'id' }
    }, { headers });
    console.log('✅ meme_id créé');

    await axios.post(`${DIRECTUS_URL}/fields/notifications`, {
      field: 'from_user_id',
      type: 'uuid',
      meta: { interface: 'select-dropdown-m2o', special: ['m2o'], required: true },
      schema: { foreign_key_table: 'directus_users', foreign_key_column: 'id' }
    }, { headers });
    console.log('✅ from_user_id créé');

    await axios.post(`${DIRECTUS_URL}/fields/notifications`, {
      field: 'is_read',
      type: 'boolean',
      meta: { interface: 'boolean', required: true },
      schema: { default_value: false }
    }, { headers });
    console.log('✅ is_read créé');

    await axios.post(`${DIRECTUS_URL}/fields/notifications`, {
      field: 'message',
      type: 'text',
      meta: { interface: 'input-multiline', required: true }
    }, { headers });
    console.log('✅ message créé');

    console.log('\n🎉 Collection notifications créée avec succès !');

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

createNotificationsCollection();
