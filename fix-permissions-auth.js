import axios from 'axios';

const DIRECTUS_URL = 'http://localhost:8055';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

async function fixPermissions() {
  console.log('🔧 Configuration des permissions...\n');

  try {
    // 1. Connexion admin
    console.log('🔐 Connexion admin...');
    const loginResponse = await axios.post(`${DIRECTUS_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    const token = loginResponse.data.data.access_token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Connecté\n');

    // 2. Récupérer le rôle Authenticated
    console.log('🔍 Recherche du rôle Authenticated...');
    const rolesResponse = await axios.get(`${DIRECTUS_URL}/roles`, { headers });
    const authenticatedRole = rolesResponse.data.data.find(r => 
      r.name.toLowerCase().includes('authenticated')
    );

    if (!authenticatedRole) {
      console.error('❌ Rôle Authenticated introuvable !');
      process.exit(1);
    }

    const roleId = authenticatedRole.id;
    console.log(`✅ Rôle trouvé: "${authenticatedRole.name}" (${roleId})\n`);

    // 3. Récupérer les permissions existantes
    console.log('📋 Récupération des permissions existantes...');
    const permissionsResponse = await axios.get(`${DIRECTUS_URL}/permissions`, { 
      headers,
      params: { 'filter[role][_eq]': roleId }
    });
    const existingPermissions = permissionsResponse.data.data;
    console.log(`   ${existingPermissions.length} permissions existantes\n`);

    // 4. Supprimer les anciennes permissions pour nos collections
    const collectionsToFix = ['saved_memes', 'notifications', 'memes_likes'];
    
    console.log('🗑️  Suppression des anciennes permissions...');
    for (const collection of collectionsToFix) {
      const oldPerms = existingPermissions.filter(p => p.collection === collection);
      for (const perm of oldPerms) {
        try {
          await axios.delete(`${DIRECTUS_URL}/permissions/${perm.id}`, { headers });
          console.log(`   ✓ ${collection} (${perm.action})`);
        } catch (err) {
          // Ignore les erreurs de suppression
        }
      }
    }
    console.log();

    // 5. Créer les permissions pour saved_memes
    console.log('📝 Configuration saved_memes...');
    
    const savedMemesPermissions = [
      { action: 'create', permissions: {}, fields: ['*'] },
      { 
        action: 'read', 
        permissions: { user_id: { _eq: '$CURRENT_USER' } }, 
        fields: ['*'] 
      },
      { 
        action: 'delete', 
        permissions: { user_id: { _eq: '$CURRENT_USER' } }, 
        fields: ['*'] 
      }
    ];

    for (const perm of savedMemesPermissions) {
      try {
        await axios.post(`${DIRECTUS_URL}/permissions`, {
          role: roleId,
          collection: 'saved_memes',
          ...perm
        }, { headers });
        console.log(`   ✅ ${perm.action.toUpperCase()} configuré`);
      } catch (err) {
        console.log(`   ⚠️  ${perm.action}: ${err.response?.data?.errors?.[0]?.message || err.message}`);
      }
    }
    console.log();

    // 6. Créer les permissions pour notifications
    console.log('📝 Configuration notifications...');
    
    const notificationsPermissions = [
      { action: 'create', permissions: {}, fields: ['*'] },
      { 
        action: 'read', 
        permissions: { user_id: { _eq: '$CURRENT_USER' } }, 
        fields: ['*'] 
      },
      { 
        action: 'update', 
        permissions: { user_id: { _eq: '$CURRENT_USER' } }, 
        fields: ['is_read'] 
      },
      { 
        action: 'delete', 
        permissions: { user_id: { _eq: '$CURRENT_USER' } }, 
        fields: ['*'] 
      }
    ];

    for (const perm of notificationsPermissions) {
      try {
        await axios.post(`${DIRECTUS_URL}/permissions`, {
          role: roleId,
          collection: 'notifications',
          ...perm
        }, { headers });
        console.log(`   ✅ ${perm.action.toUpperCase()} configuré`);
      } catch (err) {
        console.log(`   ⚠️  ${perm.action}: ${err.response?.data?.errors?.[0]?.message || err.message}`);
      }
    }
    console.log();

    // 7. Créer les permissions pour memes_likes
    console.log('📝 Configuration memes_likes...');
    
    const likesPermissions = [
      { action: 'create', permissions: {}, fields: ['*'] },
      { action: 'read', permissions: {}, fields: ['*'] },
      { 
        action: 'delete', 
        permissions: { user_id: { _eq: '$CURRENT_USER' } }, 
        fields: ['*'] 
      }
    ];

    for (const perm of likesPermissions) {
      try {
        await axios.post(`${DIRECTUS_URL}/permissions`, {
          role: roleId,
          collection: 'memes_likes',
          ...perm
        }, { headers });
        console.log(`   ✅ ${perm.action.toUpperCase()} configuré`);
      } catch (err) {
        console.log(`   ⚠️  ${perm.action}: ${err.response?.data?.errors?.[0]?.message || err.message}`);
      }
    }
    console.log();

    // 8. Vérifier les permissions pour memes
    console.log('📝 Vérification permissions memes...');
    const memesPerms = existingPermissions.filter(p => p.collection === 'memes');
    if (memesPerms.length === 0) {
      console.log('   ⚠️  Aucune permission pour memes, création...');
      
      const memesPermissions = [
        { action: 'create', permissions: {}, fields: ['*'] },
        { action: 'read', permissions: {}, fields: ['*'] },
        { 
          action: 'update', 
          permissions: { user_created: { _eq: '$CURRENT_USER' } }, 
          fields: ['*'] 
        },
        { 
          action: 'delete', 
          permissions: { user_created: { _eq: '$CURRENT_USER' } }, 
          fields: ['*'] 
        }
      ];

      for (const perm of memesPermissions) {
        try {
          await axios.post(`${DIRECTUS_URL}/permissions`, {
            role: roleId,
            collection: 'memes',
            ...perm
          }, { headers });
          console.log(`   ✅ ${perm.action.toUpperCase()} configuré`);
        } catch (err) {
          console.log(`   ⚠️  ${perm.action}: ${err.response?.data?.errors?.[0]?.message || err.message}`);
        }
      }
    } else {
      console.log(`   ✅ ${memesPerms.length} permissions déjà configurées`);
    }
    console.log();

    console.log('🎉 Configuration terminée avec succès !\n');
    console.log('Vous pouvez maintenant:');
    console.log('  ✅ Créer des memes');
    console.log('  ✅ Liker des memes');
    console.log('  ✅ Sauvegarder des memes');
    console.log('  ✅ Recevoir des notifications\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.response?.data) {
      console.error('📄 Détails:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

fixPermissions();
