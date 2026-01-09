import axios from 'axios';
import crypto from 'crypto';

const DIRECTUS_URL = 'http://localhost:8055';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

async function createStaticToken() {
  try {
    console.log('🔐 Connexion admin...');
    const loginResponse = await axios.post(`${DIRECTUS_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    const accessToken = loginResponse.data.data.access_token;
    const headers = { Authorization: `Bearer ${accessToken}` };
    console.log('✅ Connecté\n');

    // Récupérer l'ID de l'utilisateur admin
    console.log('🔍 Recherche de l\'utilisateur admin...');
    const usersResponse = await axios.get(`${DIRECTUS_URL}/users/me`, { headers });
    const adminUserId = usersResponse.data.data.id;
    console.log(`✅ Admin ID: ${adminUserId}\n`);

    // Générer un token statique aléatoire
    const staticToken = crypto.randomBytes(32).toString('hex');
    console.log('🔑 Génération d\'un token statique...');

    // Mettre à jour l'utilisateur avec le token statique
    await axios.patch(`${DIRECTUS_URL}/users/${adminUserId}`, {
      token: staticToken
    }, { headers });

    console.log('✅ Token statique créé avec succès !\n');
    console.log('📋 Votre Static Token :');
    console.log(staticToken);
    console.log('\n📝 Mettez à jour votre .env avec ce token :');
    console.log(`KEY=${staticToken}`);
    console.log(`ADMIN_TOKEN=${staticToken}`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

createStaticToken();
