import axios from 'axios';

const DIRECTUS_URL = 'http://localhost:8055';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

async function setupPermissions() {
  console.log('🔧 Configuration simple des permissions...\n');

  try {
    // 1. Connexion admin
    console.log('🔐 Connexion...');
    const loginResponse = await axios.post(`${DIRECTUS_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    const token = loginResponse.data.data.access_token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Connecté\n');

    // 2. Récupérer le rôle Authenticated
    console.log('🔍 Recherche du rôle...');
    const rolesResponse = await axios.get(`${DIRECTUS_URL}/roles`, { headers });
    const authenticatedRole = rolesResponse.data.data.find(r => 
      r.name.toLowerCase().includes('authenticated')
    );

    if (!authenticatedRole) {
      console.error('❌ Rôle Authenticated introuvable !');
      process.exit(1);
    }

    const roleId = authenticatedRole.id;
    console.log(`✅ Rôle: ${authenticatedRole.name}\n`);

    // 3. Créer toutes les permissions (ignore les erreurs si elles existent déjà)
    const permissions = [
      // saved_memes
      { role: roleId, collection: 'saved_memes', action: 'create', permissions: {}, fields: ['*'] },
      { role: roleId, collection: 'saved_memes', action: 'read', permissions: { user_id: { _eq: '$CURRENT_USER' } }, fields: ['*'] },
      { role: roleId, collection: 'saved_memes', action: 'delete', permissions: { user_id: { _eq: '$CURRENT_USER' } }, fields: ['*'] },
      
      // notifications
      { role: roleId, collection: 'notifications', action: 'create', permissions: {}, fields: ['*'] },
      { role: roleId, collection: 'notifications', action: 'read', permissions: { user_id: { _eq: '$CURRENT_USER' } }, fields: ['*'] },
      { role: roleId, collection: 'notifications', action: 'update', permissions: { user_id: { _eq: '$CURRENT_USER' } }, fields: ['is_read'] },
      { role: roleId, collection: 'notifications', action: 'delete', permissions: { user_id: { _eq: '$CURRENT_USER' } }, fields: ['*'] },
      
      // memes_likes
      { role: roleId, collection: 'memes_likes', action: 'create', permissions: {}, fields: ['*'] },
      { role: roleId, collection: 'memes_likes', action: 'read', permissions: {}, fields: ['*'] },
      { role: roleId, collection: 'memes_likes', action: 'delete', permissions: { user_id: { _eq: '$CURRENT_USER' } }, fields: ['*'] },
      
      // memes (au cas où)
      { role: roleId, collection: 'memes', action: 'create', permissions: {}, fields: ['*'] },
      { role: roleId, collection: 'memes', action: 'read', permissions: {}, fields: ['*'] },
      { role: roleId, collection: 'memes', action: 'update', permissions: { user_created: { _eq: '$CURRENT_USER' } }, fields: ['*'] },
      { role: roleId, collection: 'memes', action: 'delete', permissions: { user_created: { _eq: '$CURRENT_USER' } }, fields: ['*'] }
    ];

    console.log('📝 Création des permissions...\n');
    let successCount = 0;
    let skipCount = 0;

    for (const perm of permissions) {
      try {
        await axios.post(`${DIRECTUS_URL}/permissions`, perm, { headers });
        console.log(`✅ ${perm.collection} - ${perm.action}`);
        successCount++;
      } catch (err) {
        const errorMsg = err.response?.data?.errors?.[0]?.message || '';
        if (errorMsg.includes('already exists') || errorMsg.includes('unique')) {
          console.log(`⏭️  ${perm.collection} - ${perm.action} (existe déjà)`);
          skipCount++;
        } else {
          console.log(`⚠️  ${perm.collection} - ${perm.action}: ${errorMsg}`);
        }
      }
    }

    console.log(`\n🎉 Terminé !`);
    console.log(`   ✅ ${successCount} permissions créées`);
    console.log(`   ⏭️  ${skipCount} permissions existantes`);
    console.log(`   📊 Total: ${successCount + skipCount}/${permissions.length}\n`);

    if (successCount > 0 || skipCount > 0) {
      console.log('🔄 Rechargez maintenant le frontend (F5) pour voir les changements\n');
    }

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.response?.data) {
      console.error('📄 Détails:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

setupPermissions();
