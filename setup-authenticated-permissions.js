import axios from 'axios';

const DIRECTUS_URL = 'http://localhost:8055';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

async function setupAuthenticatedPermissions() {
  console.log('\n🔧 Configuration Authenticated User...\n');

  try {
    // 1. Connexion
    console.log('🔐 Connexion...');
    const loginResponse = await axios.post(`${DIRECTUS_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    const token = loginResponse.data.data.access_token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Connecté\n');

    // 2. Récupérer le rôle
    console.log('🔍 Recherche du rôle...');
    const rolesResponse = await axios.get(`${DIRECTUS_URL}/roles`, { headers });
    const authRole = rolesResponse.data.data.find(role => 
      role.name.trim() === 'Authenticated User' || role.name.trim() === 'Authenticated'
    );
    
    if (!authRole) {
      throw new Error('Rôle Authenticated User introuvable');
    }
    console.log(`✅ Rôle trouvé (ID: ${authRole.id})\n`);

    // 3. Créer la Policy
    console.log('🔍 Création de la Policy...');
    const policyResponse = await axios.post(`${DIRECTUS_URL}/policies`, {
      name: 'Authenticated User Policy',
      icon: 'verified_user',
      description: 'Access policy for authenticated users',
      admin_access: false,
      app_access: true
    }, { headers });
    const policy = policyResponse.data.data;
    console.log(`✅ Policy créée (ID: ${policy.id})\n`);

    // 4. Associer au rôle
    console.log('🔗 Association...');
    await axios.patch(`${DIRECTUS_URL}/roles/${authRole.id}`, {
      policies: [policy.id]
    }, { headers });
    console.log('✅ Policy associée\n');

    // 5. Créer les permissions
    console.log('📝 Création des permissions...\n');

    const permissions = [
      // Memes
      { policy: policy.id, collection: 'memes', action: 'create', permissions: {}, fields: ['*'] },
      { policy: policy.id, collection: 'memes', action: 'read', permissions: {}, fields: ['*'] },
      { policy: policy.id, collection: 'memes', action: 'update', permissions: { user_created: { _eq: '$CURRENT_USER' } }, fields: ['*'] },
      { policy: policy.id, collection: 'memes', action: 'delete', permissions: { user_created: { _eq: '$CURRENT_USER' } }, fields: ['*'] },

      // Likes
      { policy: policy.id, collection: 'memes_likes', action: 'create', permissions: {}, fields: ['*'] },
      { policy: policy.id, collection: 'memes_likes', action: 'read', permissions: {}, fields: ['*'] },
      { policy: policy.id, collection: 'memes_likes', action: 'delete', permissions: { user_id: { _eq: '$CURRENT_USER' } }, fields: ['*'] },

      // Tags
      { policy: policy.id, collection: 'tags', action: 'create', permissions: {}, fields: ['*'] },
      { policy: policy.id, collection: 'tags', action: 'read', permissions: {}, fields: ['*'] },

      // Relations
      { policy: policy.id, collection: 'memes_tags', action: 'create', permissions: {}, fields: ['*'] },
      { policy: policy.id, collection: 'memes_tags', action: 'read', permissions: {}, fields: ['*'] },
      { policy: policy.id, collection: 'memes_tags', action: 'delete', permissions: {}, fields: ['*'] },

      // Files
      { policy: policy.id, collection: 'directus_files', action: 'create', permissions: {}, fields: ['*'] },
      { policy: policy.id, collection: 'directus_files', action: 'read', permissions: {}, fields: ['*'] },
      { policy: policy.id, collection: 'directus_files', action: 'update', permissions: { uploaded_by: { _eq: '$CURRENT_USER' } }, fields: ['*'] },
      { policy: policy.id, collection: 'directus_files', action: 'delete', permissions: { uploaded_by: { _eq: '$CURRENT_USER' } }, fields: ['*'] },

      // Users
      { policy: policy.id, collection: 'directus_users', action: 'read', permissions: { id: { _eq: '$CURRENT_USER' } }, fields: ['*'] },
      { policy: policy.id, collection: 'directus_users', action: 'update', permissions: { id: { _eq: '$CURRENT_USER' } }, fields: ['first_name', 'last_name', 'email', 'avatar'] }
    ];

    let successCount = 0;
    for (const permission of permissions) {
      try {
        await axios.post(`${DIRECTUS_URL}/permissions`, permission, { headers });
        console.log(`✅ ${permission.collection} (${permission.action})`);
        successCount++;
      } catch (err) {
        console.log(`⚠️  ${permission.collection}: ${err.response?.data?.errors?.[0]?.message || err.message}`);
      }
    }

    console.log(`\n🎉 Configuration terminée: ${successCount}/${permissions.length} permissions créées !`);

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.response?.data) {
      console.error('📄 Détails:', error.response.data);
    }
    process.exit(1);
  }
}

setupAuthenticatedPermissions();
