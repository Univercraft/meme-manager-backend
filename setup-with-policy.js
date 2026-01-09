import axios from 'axios';

const DIRECTUS_URL = 'http://localhost:8055';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

async function setupPermissionsWithPolicy() {
  console.log('🔧 Configuration avec Policy...\n');

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
    console.log(`✅ Rôle: ${authenticatedRole.name} (${roleId})\n`);

    // 3. Créer ou récupérer une policy
    console.log('📋 Vérification de la policy...');
    let policyId;
    
    try {
      // Essayer de récupérer les policies existantes
      const policiesResponse = await axios.get(`${DIRECTUS_URL}/policies`, { headers });
      const existingPolicy = policiesResponse.data.data.find(p => 
        p.name === 'Authenticated User Policy'
      );
      
      if (existingPolicy) {
        policyId = existingPolicy.id;
        console.log(`✅ Policy existante trouvée: ${policyId}\n`);
      }
    } catch (err) {
      console.log('⚠️  Impossible de lire les policies\n');
    }

    // Si pas de policy trouvée, en créer une
    if (!policyId) {
      console.log('📝 Création de la policy...');
      try {
        const policyResponse = await axios.post(`${DIRECTUS_URL}/policies`, {
          name: 'Authenticated User Policy',
          icon: 'verified_user',
          description: 'Access policy for authenticated users',
          admin_access: false,
          app_access: true
        }, { headers });
        
        policyId = policyResponse.data.data.id;
        console.log(`✅ Policy créée: ${policyId}\n`);

        // Associer la policy au rôle
        console.log('🔗 Association au rôle...');
        await axios.patch(`${DIRECTUS_URL}/roles/${roleId}`, {
          policies: [policyId]
        }, { headers });
        console.log('✅ Policy associée au rôle\n');
      } catch (err) {
        console.error('❌ Impossible de créer la policy');
        console.error(err.response?.data || err.message);
        process.exit(1);
      }
    }

    // 4. Créer les permissions avec la policy
    const permissions = [
      // saved_memes
      { policy: policyId, collection: 'saved_memes', action: 'create', permissions: {}, fields: ['*'] },
      { policy: policyId, collection: 'saved_memes', action: 'read', permissions: { user_id: { _eq: '$CURRENT_USER' } }, fields: ['*'] },
      { policy: policyId, collection: 'saved_memes', action: 'delete', permissions: { user_id: { _eq: '$CURRENT_USER' } }, fields: ['*'] },
      
      // notifications
      { policy: policyId, collection: 'notifications', action: 'create', permissions: {}, fields: ['*'] },
      { policy: policyId, collection: 'notifications', action: 'read', permissions: { user_id: { _eq: '$CURRENT_USER' } }, fields: ['*'] },
      { policy: policyId, collection: 'notifications', action: 'update', permissions: { user_id: { _eq: '$CURRENT_USER' } }, fields: ['is_read'] },
      { policy: policyId, collection: 'notifications', action: 'delete', permissions: { user_id: { _eq: '$CURRENT_USER' } }, fields: ['*'] },
      
      // memes_likes
      { policy: policyId, collection: 'memes_likes', action: 'create', permissions: {}, fields: ['*'] },
      { policy: policyId, collection: 'memes_likes', action: 'read', permissions: {}, fields: ['*'] },
      { policy: policyId, collection: 'memes_likes', action: 'delete', permissions: { user_id: { _eq: '$CURRENT_USER' } }, fields: ['*'] },
      
      // memes
      { policy: policyId, collection: 'memes', action: 'create', permissions: {}, fields: ['*'] },
      { policy: policyId, collection: 'memes', action: 'read', permissions: {}, fields: ['*'] },
      { policy: policyId, collection: 'memes', action: 'update', permissions: { user_created: { _eq: '$CURRENT_USER' } }, fields: ['*'] },
      { policy: policyId, collection: 'memes', action: 'delete', permissions: { user_created: { _eq: '$CURRENT_USER' } }, fields: ['*'] },
      
      // directus_files (pour upload)
      { policy: policyId, collection: 'directus_files', action: 'create', permissions: {}, fields: ['*'] },
      { policy: policyId, collection: 'directus_files', action: 'read', permissions: {}, fields: ['*'] },
      { policy: policyId, collection: 'directus_files', action: 'update', permissions: { uploaded_by: { _eq: '$CURRENT_USER' } }, fields: ['*'] },
      
      // tags
      { policy: policyId, collection: 'tags', action: 'read', permissions: {}, fields: ['*'] },
      
      // memes_tags (relation)
      { policy: policyId, collection: 'memes_tags', action: 'create', permissions: {}, fields: ['*'] },
      { policy: policyId, collection: 'memes_tags', action: 'read', permissions: {}, fields: ['*'] },
      { policy: policyId, collection: 'memes_tags', action: 'delete', permissions: {}, fields: ['*'] }
    ];

    console.log('📝 Création des permissions...\n');
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const perm of permissions) {
      try {
        await axios.post(`${DIRECTUS_URL}/permissions`, perm, { headers });
        console.log(`✅ ${perm.collection.padEnd(20)} ${perm.action}`);
        successCount++;
      } catch (err) {
        const errorMsg = err.response?.data?.errors?.[0]?.message || '';
        if (errorMsg.includes('already exists') || errorMsg.includes('unique')) {
          console.log(`⏭️  ${perm.collection.padEnd(20)} ${perm.action} (existe)`);
          skipCount++;
        } else {
          console.log(`❌ ${perm.collection.padEnd(20)} ${perm.action}`);
          errorCount++;
        }
      }
    }

    console.log(`\n🎉 Configuration terminée !`);
    console.log(`   ✅ ${successCount} créées`);
    console.log(`   ⏭️  ${skipCount} existantes`);
    if (errorCount > 0) {
      console.log(`   ❌ ${errorCount} erreurs`);
    }
    console.log(`   📊 Total: ${successCount + skipCount}/${permissions.length}\n`);

    console.log('🔄 Maintenant:');
    console.log('   1. Rechargez le frontend (F5)');
    console.log('   2. Testez les fonctionnalités\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.response?.data) {
      console.error('📄 Détails:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

setupPermissionsWithPolicy();
