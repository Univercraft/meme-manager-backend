import axios from 'axios';

const DIRECTUS_URL = 'http://localhost:8055';
const MEILISEARCH_URL = 'http://localhost:7701';
const MEILISEARCH_KEY = 'dev-meilisearch-key-123';
const ADMIN_TOKEN = '42a28c3d17d6d83727a7a1788ecba82de845b4853d92541bc6f75a7594649ce1';

async function setupMeilisearch() {
  console.log('🔍 Configuration de Meilisearch...\n');

  try {
    // 1. Créer l'index
    console.log('📝 Création de l\'index directus_memes...');
    await axios.post(`${MEILISEARCH_URL}/indexes`, {
      uid: 'directus_memes',
      primaryKey: 'id'
    }, {
      headers: { Authorization: `Bearer ${MEILISEARCH_KEY}` }
    });
    console.log('✅ Index créé\n');

    // 2. Configurer les champs recherchables
    console.log('⚙️ Configuration des champs recherchables...');
    await axios.put(`${MEILISEARCH_URL}/indexes/directus_memes/settings/searchable-attributes`, 
      ['title'],
      { headers: { Authorization: `Bearer ${MEILISEARCH_KEY}` } }
    );
    console.log('✅ Champs recherchables configurés\n');

    // 3. Configurer les champs filtrables
    console.log('⚙️ Configuration des champs filtrables...');
    await axios.put(`${MEILISEARCH_URL}/indexes/directus_memes/settings/filterable-attributes`,
      ['status', 'user_created', 'date_created'],
      { headers: { Authorization: `Bearer ${MEILISEARCH_KEY}` } }
    );
    console.log('✅ Champs filtrables configurés\n');

    // 4. Configurer les champs triables
    console.log('⚙️ Configuration des champs triables...');
    await axios.put(`${MEILISEARCH_URL}/indexes/directus_memes/settings/sortable-attributes`,
      ['date_created', 'views', 'likes'],
      { headers: { Authorization: `Bearer ${MEILISEARCH_KEY}` } }
    );
    console.log('✅ Champs triables configurés\n');

    // 5. Récupérer et indexer les memes existants
    console.log('📥 Récupération des memes depuis Directus...');
    const memesResponse = await axios.get(`${DIRECTUS_URL}/items/memes`, {
      params: {
        filter: { status: { _eq: 'published' } },
        fields: 'id,title,status,date_created,user_created'
      },
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    });

    const memes = memesResponse.data.data;
    console.log(`✅ ${memes.length} memes récupérés\n`);

    if (memes.length > 0) {
      console.log('📤 Indexation des memes dans Meilisearch...');
      await axios.post(`${MEILISEARCH_URL}/indexes/directus_memes/documents`,
        memes,
        { headers: { Authorization: `Bearer ${MEILISEARCH_KEY}` } }
      );
      console.log('✅ Memes indexés\n');
    } else {
      console.log('⚠️ Aucun meme à indexer. Créez des memes dans l\'application d\'abord.\n');
    }

    console.log('🎉 Meilisearch configuré avec succès !');
    console.log('\n🧪 Testez la recherche :');
    console.log('   http://localhost:7701/indexes/directus_memes/search?q=test');

  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

setupMeilisearch();
