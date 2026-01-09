import axios from 'axios';
import { updateEnvFile } from './update-env.js';

const DIRECTUS_URL = 'http://localhost:8055';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

async function setupPermissions() {
  console.log('🔧 Configuration automatique des permissions Directus...\n');

  try {
    // 1. Connexion admin
    console.log('🔐 Connexion en tant qu\'administrateur...');
    const loginResponse = await axios.post(`${DIRECTUS_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    const token = loginResponse.data.data.access_token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Connecté\n');

    // 2. Récupérer ou créer le rôle Public
    console.log('🔍 Recherche du rôle Public...');
    const rolesResponse = await axios.get(`${DIRECTUS_URL}/roles`, { headers });
    let publicRole = rolesResponse.data.data.find(role => role.name === 'Public');
    
    if (!publicRole) {
      console.log('⚠️  Rôle Public introuvable, création en cours...');
      
      const createRoleResponse = await axios.post(`${DIRECTUS_URL}/roles`, {
        name: 'Public',
        icon: 'public',
        description: 'Public role for unauthenticated users'
      }, { headers });
      
      publicRole = createRoleResponse.data.data;
      console.log(`✅ Rôle Public créé (ID: ${publicRole.id})\n`);
      
      // Mettre à jour .env
      updateEnvFile(publicRole.id);
    } else {
      console.log(`✅ Rôle Public trouvé (ID: ${publicRole.id})\n`);
    }

    // 3. Créer ou récupérer la Policy
    console.log('🔍 Création de la Policy Public...');
    const policyResponse = await axios.post(`${DIRECTUS_URL}/policies`, {
      name: 'Public Access Policy',
      icon: 'public',
      description: 'Access policy for public users',
      admin_access: false,
      app_access: false
    }, { headers });
    const policy = policyResponse.data.data;
    console.log(`✅ Policy créée (ID: ${policy.id})\n`);

    // 4. Associer la policy au rôle
    console.log('🔗 Association de la policy au rôle...');
    await axios.patch(`${DIRECTUS_URL}/roles/${publicRole.id}`, {
      policies: [policy.id]
    }, { headers });
    console.log('✅ Policy associée au rôle\n');

    // 5. Créer les permissions
    console.log('📝 Création des permissions...\n');

    const permissions = [
      {
        policy: policy.id,
        collection: 'memes',
        action: 'read',
        permissions: { status: { _eq: 'published' } },
        fields: ['*']
      },
      {
        policy: policy.id,
        collection: 'directus_users',
        action: 'create',
        permissions: {},
        fields: ['email', 'password', 'first_name', 'last_name', 'role', 'status']
      },
      {
        policy: policy.id,
        collection: 'directus_users',
        action: 'read',
        permissions: {},
        fields: ['id', 'first_name', 'last_name', 'email', 'avatar']
      },
      {
        policy: policy.id,
        collection: 'directus_files',
        action: 'read',
        permissions: {},
        fields: ['*']
      },
      {
        policy: policy.id,
        collection: 'tags',
        action: 'read',
        permissions: {},
        fields: ['*']
      },
      {
        policy: policy.id,
        collection: 'memes_tags',
        action: 'read',
        permissions: {},
        fields: ['*']
      },
      {
        policy: policy.id,
        collection: 'memes_likes',
        action: 'read',
        permissions: {},
        fields: ['*']
      }
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const permission of permissions) {
      try {
        await axios.post(`${DIRECTUS_URL}/permissions`, permission, { headers });
        console.log(`✅ ${permission.collection} (${permission.action})`);
        successCount++;
      } catch (err) {
        const errorMsg = err.response?.data?.errors?.[0]?.message || err.message;
        console.log(`⚠️  ${permission.collection} (${permission.action}): ${errorMsg}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Résultat: ${successCount} succès, ${errorCount} erreurs`);
    
    if (successCount > 0) {
      console.log('\n🎉 Configuration Public terminée !');
      console.log('\n📋 Permissions configurées:');
      console.log('   ✅ memes: Read (status = published)');
      console.log('   ✅ directus_users: Create + Read');
      console.log('   ✅ directus_files: Read');
      console.log('   ✅ tags: Read');
      console.log('   ✅ memes_tags: Read');
      console.log('   ✅ memes_likes: Read');
    }

  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    if (error.response?.data) {
      console.error('📄 Détails:', error.response.data);
    }
    process.exit(1);
  }
}

setupPermissions();
