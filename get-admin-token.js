import axios from 'axios';

const DIRECTUS_URL = 'http://localhost:8055';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

async function getAdminToken() {
  try {
    console.log('🔐 Connexion admin...');
    const response = await axios.post(`${DIRECTUS_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    const token = response.data.data.access_token;
    console.log('\n✅ Token obtenu :');
    console.log(token);
    console.log('\n📝 Copiez ce token dans votre .env :');
    console.log(`ADMIN_TOKEN=${token}`);
    console.log(`KEY=${token}`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

getAdminToken();
