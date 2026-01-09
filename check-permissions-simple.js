import fetch from 'node-fetch';

const DIRECTUS_URL = 'http://localhost:8055';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

async function checkPermissions() {
  try {
    // 1. Login admin
    const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });

    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.status}`);
    }

    const loginData = await loginRes.json();
    const token = loginData.data.access_token;
    console.log('✅ Connecté en tant qu\'admin\n');

    // 2. Récupérer le rôle Authenticated
    const rolesRes = await fetch(`${DIRECTUS_URL}/roles?filter[name][_eq]=Authenticated&fields=id,name,admin_access`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const rolesData = await rolesRes.json();
    
    if (!rolesData.data || rolesData.data.length === 0) {
      console.log('❌ Rôle "Authenticated" non trouvé');
      return;
    }

    const role = rolesData.data[0];
    console.log(`📋 Rôle trouvé: ${role.name} (${role.id})`);
    console.log(`   Admin access: ${role.admin_access}\n`);

    // 3. Récupérer les policies
    const policiesRes = await fetch(`${DIRECTUS_URL}/policies?fields=id,name,admin_access,app_access,roles`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const policiesData = await policiesRes.json();
    const policies = policiesData.data || [];
    
    // Filtrer les policies qui incluent notre rôle
    const rolePolicies = policies.filter(p => 
      p.roles && Array.isArray(p.roles) && p.roles.includes(role.id)
    );

    console.log(`📜 Policies associées au rôle: ${rolePolicies.length}`);
    rolePolicies.forEach(policy => {
      console.log(`   - ${policy.name} (${policy.id})`);
      console.log(`     Admin: ${policy.admin_access}, App: ${policy.app_access}`);
    });
    console.log();

    if (rolePolicies.length === 0) {
      console.log('❌ AUCUNE POLICY ASSOCIÉE AU RÔLE AUTHENTICATED!');
      console.log('   Les utilisateurs n\'auront aucune permission.\n');
      console.log('🔧 SOLUTION: Vous devez configurer les permissions manuellement dans Directus:');
      console.log('   1. Ouvrez http://localhost:8055');
      console.log('   2. Allez dans Settings → Access Control → Policies');
      console.log('   3. Créez une policy pour le rôle Authenticated');
      console.log('   4. Ajoutez les permissions nécessaires\n');
      return;
    }

    // 4. Récupérer les permissions
    const policyIds = rolePolicies.map(p => p.id);
    const permissionsRes = await fetch(
      `${DIRECTUS_URL}/permissions?filter[policy][_in]=${policyIds.join(',')}&fields=id,collection,action,permissions,validation,fields,policy&limit=-1`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    const permissionsData = await permissionsRes.json();
    const permissions = permissionsData.data || [];

    console.log(`🔐 Permissions trouvées: ${permissions.length}\n`);

    // 5. Analyser par collection
    const collections = ['memes', 'memes_likes', 'saved_memes', 'notifications'];
    
    console.log('📊 PERMISSIONS PAR COLLECTION:\n');
    collections.forEach(collection => {
      console.log(`📁 ${collection}:`);
      const collectionPerms = permissions.filter(p => p.collection === collection);
      
      if (collectionPerms.length === 0) {
        console.log('   ❌ AUCUNE PERMISSION\n');
      } else {
        const actions = collectionPerms.map(p => p.action);
        console.log(`   ✅ Actions: ${actions.join(', ')}`);
        
        collectionPerms.forEach(perm => {
          const policyName = rolePolicies.find(p => p.id === perm.policy)?.name || 'Unknown';
          if (perm.permissions && Object.keys(perm.permissions).length > 0) {
            console.log(`      └─ ${perm.action}: filter = ${JSON.stringify(perm.permissions)}`);
          }
        });
        console.log();
      }
    });

    // 6. Vérifier les permissions manquantes
    console.log('\n⚠️  VÉRIFICATION DES PERMISSIONS REQUISES:\n');
    
    const checks = [
      { collection: 'saved_memes', action: 'create', reason: 'pour sauvegarder des memes' },
      { collection: 'saved_memes', action: 'read', reason: 'pour lire les memes sauvegardés' },
      { collection: 'saved_memes', action: 'delete', reason: 'pour retirer un meme des favoris' },
      { collection: 'notifications', action: 'create', reason: 'pour créer des notifications' },
      { collection: 'notifications', action: 'read', reason: 'pour lire les notifications' },
      { collection: 'notifications', action: 'update', reason: 'pour marquer comme lu' },
      { collection: 'memes_likes', action: 'create', reason: 'pour liker un meme' },
      { collection: 'memes_likes', action: 'read', reason: 'pour vérifier si liké' },
      { collection: 'memes_likes', action: 'delete', reason: 'pour unliker un meme' },
      { collection: 'memes', action: 'update', reason: 'pour mettre à jour le compteur de likes' }
    ];

    let allOk = true;
    checks.forEach(check => {
      const hasPermission = permissions.some(
        p => p.collection === check.collection && p.action === check.action
      );
      
      if (!hasPermission) {
        console.log(`❌ MANQUE: ${check.collection}.${check.action} ${check.reason}`);
        allOk = false;
      } else {
        console.log(`✅ OK: ${check.collection}.${check.action}`);
      }
    });

    if (!allOk) {
      console.log('\n🔧 ACTIONS REQUISES:');
      console.log('   Configurez les permissions manquantes dans Directus UI');
      console.log('   Settings → Access Control → Policies → [Votre Policy] → Permissions');
    } else {
      console.log('\n✅ Toutes les permissions requises sont configurées!');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkPermissions();
