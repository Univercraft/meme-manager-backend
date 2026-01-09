import { createDirectus, rest, authentication, readRoles, readPermissions, readPolicies } from '@directus/sdk';

const client = createDirectus('http://localhost:8055')
  .with(rest())
  .with(authentication('json'));

async function checkPermissions() {
  try {
    // Connexion admin
    await client.login('admin@example.com', 'admin123');
    console.log('✅ Connecté en tant qu\'admin\n');

    // Récupérer le rôle Authenticated
    const roles = await client.request(
      readRoles({
        filter: { name: { _eq: 'Authenticated' } },
        fields: ['id', 'name', 'admin_access']
      })
    );

    if (roles.length === 0) {
      console.log('❌ Rôle "Authenticated" non trouvé');
      return;
    }

    const roleId = roles[0].id;
    console.log(`📋 Rôle trouvé: ${roles[0].name} (${roleId})`);
    console.log(`   Admin access: ${roles[0].admin_access}\n`);

    // Récupérer les policies associées au rôle
    const policies = await client.request(
      readPolicies({
        filter: { roles: { _contains: roleId } },
        fields: ['id', 'name', 'admin_access', 'app_access']
      })
    );

    console.log(`📜 Policies associées au rôle: ${policies.length}`);
    policies.forEach(policy => {
      console.log(`   - ${policy.name} (${policy.id})`);
      console.log(`     Admin: ${policy.admin_access}, App: ${policy.app_access}`);
    });
    console.log();

    if (policies.length === 0) {
      console.log('❌ Aucune policy associée au rôle Authenticated!');
      console.log('   Les utilisateurs n\'auront aucune permission.\n');
      return;
    }

    // Récupérer toutes les permissions pour ces policies
    const policyIds = policies.map(p => p.id);
    
    const permissions = await client.request(
      readPermissions({
        filter: { policy: { _in: policyIds } },
        fields: ['id', 'collection', 'action', 'permissions', 'validation', 'presets', 'fields', 'policy']
      })
    );

    console.log(`🔐 Permissions trouvées: ${permissions.length}\n`);

    // Grouper par collection
    const collections = ['memes', 'memes_likes', 'saved_memes', 'notifications'];
    
    collections.forEach(collection => {
      console.log(`\n📁 Collection: ${collection}`);
      const collectionPerms = permissions.filter(p => p.collection === collection);
      
      if (collectionPerms.length === 0) {
        console.log('   ❌ AUCUNE PERMISSION');
      } else {
        collectionPerms.forEach(perm => {
          const policyName = policies.find(p => p.id === perm.policy)?.name || 'Unknown';
          console.log(`   ✅ ${perm.action.toUpperCase()}`);
          console.log(`      Policy: ${policyName}`);
          if (perm.permissions) {
            console.log(`      Filter: ${JSON.stringify(perm.permissions)}`);
          }
          if (perm.fields && perm.fields.length > 0) {
            console.log(`      Fields: ${perm.fields.join(', ')}`);
          }
        });
      }
    });

    console.log('\n\n📊 RÉSUMÉ DES PERMISSIONS PAR COLLECTION:');
    collections.forEach(collection => {
      const collectionPerms = permissions.filter(p => p.collection === collection);
      const actions = collectionPerms.map(p => p.action);
      console.log(`   ${collection}: [${actions.join(', ')}]`);
      
      if (collection === 'saved_memes' && !actions.includes('create')) {
        console.log(`      ⚠️  MANQUE: permission CREATE pour sauvegarder des memes`);
      }
      if (collection === 'notifications' && !actions.includes('create')) {
        console.log(`      ⚠️  MANQUE: permission CREATE pour créer des notifications`);
      }
      if (collection === 'memes_likes' && !actions.includes('create')) {
        console.log(`      ⚠️  MANQUE: permission CREATE pour liker des memes`);
      }
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.errors) {
      console.error('   Détails:', error.errors);
    }
  }
}

checkPermissions();
