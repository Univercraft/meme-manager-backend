import axios from 'axios';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const DIRECTUS_URL = 'http://localhost:8055';
// Utiliser le token admin statique depuis .env
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || process.env.KEY;

async function fixPermissions() {
  console.log('🔧 Configuration forcée des permissions...\n');

  try {
    if (!ADMIN_TOKEN) {
      console.error('❌ ADMIN_TOKEN ou KEY non trouvé dans .env');
      console.error('💡 Vérifiez votre fichier backend/.env');
      process.exit(1);
    }

    const headers = { Authorization: `Bearer ${ADMIN_TOKEN}` };
    console.log('✅ Utilisation du token admin statique\n');

    // 2. Récupérer tous les rôles
    console.log('🔍 Recherche du rôle Authenticated...');
    const rolesResponse = await axios.get(`${DIRECTUS_URL}/roles`, { headers });
    const allRoles = rolesResponse.data.data;
    
    console.log('\n📋 Rôles disponibles:');
    allRoles.forEach(role => {
      console.log(`   - "${role.name}" (id: ${role.id})`);
    });
    console.log();

    const authenticatedRole = allRoles.find(r => 
      r.name.toLowerCase().includes('authenticated')
    );

    if (!authenticatedRole) {
      console.error('❌ Rôle Authenticated introuvable !');
      process.exit(1);
    }

    const roleId = authenticatedRole.id;
    console.log(`✅ Rôle sélectionné: "${authenticatedRole.name}" (${roleId})\n`);

    // 3. Récupérer les permissions existantes
    console.log('📋 Récupération des permissions existantes...');
    const permissionsResponse = await axios.get(`${DIRECTUS_URL}/permissions?filter[role][_eq]=${roleId}`, { headers });
    const existingPermissions = permissionsResponse.data.data;
    console.log(`   Permissions existantes: ${existingPermissions.length}\n`);

    // 4. Supprimer les anciennes permissions pour les collections concernées
    const collectionsToFix = ['saved_memes', 'notifications', 'memes'];
    
    console.log('🗑️  Suppression des anciennes permissions...');
    for (const collection of collectionsToFix) {
      const oldPerms = existingPermissions.filter(p => p.collection === collection);
      for (const perm of oldPerms) {
        console.log(`   - ${collection} (${perm.action})`);
        try {
          await axios.delete(`${DIRECTUS_URL}/permissions/${perm.id}`, { headers });
        } catch (err) {
          console.log(`     ⚠️  Impossible de supprimer (${err.message})`);
        }
      }
    }
    console.log();

    // 5. Créer les nouvelles permissions pour saved_memes
    console.log('📝 Configuration saved_memes...');
    
    await axios.post(`${DIRECTUS_URL}/permissions`, {
      role: roleId,
      collection: 'saved_memes',
      action: 'create',
      permissions: {},
      fields: ['*']
    }, { headers });
    console.log('   ✅ CREATE configuré');

    await axios.post(`${DIRECTUS_URL}/permissions`, {
      role: roleId,
      collection: 'saved_memes',
      action: 'read',
      permissions: {
        _and: [
          { user_id: { _eq: '$CURRENT_USER' } }
        ]
      },
      fields: ['*']
    }, { headers });
    console.log('   ✅ READ configuré');

    await axios.post(`${DIRECTUS_URL}/permissions`, {
      role: roleId,
      collection: 'saved_memes',
      action: 'delete',
      permissions: {
        _and: [
          { user_id: { _eq: '$CURRENT_USER' } }
        ]
      },
      fields: ['*']
    }, { headers });
    console.log('   ✅ DELETE configuré\n');

    // 6. Créer les nouvelles permissions pour notifications
    console.log('📝 Configuration notifications...');
    
    await axios.post(`${DIRECTUS_URL}/permissions`, {
      role: roleId,
      collection: 'notifications',
      action: 'create',
      permissions: {},
      fields: ['*']
    }, { headers });
    console.log('   ✅ CREATE configuré');

    await axios.post(`${DIRECTUS_URL}/permissions`, {
      role: roleId,
      collection: 'notifications',
      action: 'read',
      permissions: {
        _and: [
          { user_id: { _eq: '$CURRENT_USER' } }
        ]
      },
      fields: ['*']
    }, { headers });
    console.log('   ✅ READ configuré');

    await axios.post(`${DIRECTUS_URL}/permissions`, {
      role: roleId,
      collection: 'notifications',
      action: 'update',
      permissions: {
        _and: [
          { user_id: { _eq: '$CURRENT_USER' } }
        ]
      },
      fields: ['is_read']
    }, { headers });
    console.log('   ✅ UPDATE configuré');

    await axios.post(`${DIRECTUS_URL}/permissions`, {
      role: roleId,
      collection: 'notifications',
      action: 'delete',
      permissions: {
        _and: [
          { user_id: { _eq: '$CURRENT_USER' } }
        ]
      },
      fields: ['*']
    }, { headers });
    console.log('   ✅ DELETE configuré\n');

    // 7. Mise à jour des permissions pour memes (UPDATE)
    console.log('📝 Configuration memes UPDATE...');
    
    await axios.post(`${DIRECTUS_URL}/permissions`, {
      role: roleId,
      collection: 'memes',
      action: 'update',
      permissions: {
        _and: [
          { user_created: { _eq: '$CURRENT_USER' } }
        ]
      },
      fields: ['*']
    }, { headers });
    console.log('   ✅ UPDATE configuré\n');

    console.log('🎉 Permissions configurées avec succès !');
    console.log('\n⚠️  IMPORTANT : Redémarrez Directus maintenant :');
    console.log('   1. Faites Ctrl+C dans le terminal backend');
    console.log('   2. Lancez: npx directus start');
    console.log('   3. Rafraîchissez le frontend: Ctrl+Shift+R\n');

  } catch (error) {
    console.error('\n❌ Erreur:');
    console.error('   Message:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

fixPermissions();
