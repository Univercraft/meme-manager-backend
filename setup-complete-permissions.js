/**
 * Script de configuration complete des permissions et roles Directus
 * Ce script configure tous les roles et permissions necessaires pour le projet
 * 
 * Roles configures:
 * 1. Public (non authentifie)
 * 2. Authenticated User
 * 3. Administrator (deja existant)
 * 
 * Execution: node setup-complete-permissions.js
 */

import 'dotenv/config';
import axios from 'axios';
import chalk from 'chalk';

const API_URL = process.env.PUBLIC_URL || 'http://localhost:8055';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let adminToken = '';

// Obtenir le token admin
async function getAdminToken() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    adminToken = response.data.data.access_token;
    console.log(chalk.green('✅ Token admin obtenu'));
    return adminToken;
  } catch (error) {
    console.error(chalk.red('❌ Erreur lors de l\'obtention du token admin:'), error.message);
    throw error;
  }
}

// Fonction pour effectuer des requetes API avec le token admin
async function apiRequest(method, endpoint, data = null) {
  const config = {
    method,
    url: `${API_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(chalk.red(`❌ Erreur API ${endpoint}:`), error.response.data);
    }
    throw error;
  }
}

// 1. Configurer le role Public
async function setupPublicRole() {
  console.log(chalk.blue('\n📝 Configuration du role Public...'));
  
  const publicPermissions = [
    // Lire les memes publies
    {
      role: null,
      collection: 'memes',
      action: 'read',
      permissions: {
        status: { _eq: 'published' }
      },
      fields: ['*']
    },
    // Lire les tags
    {
      role: null,
      collection: 'tags',
      action: 'read',
      permissions: {},
      fields: ['*']
    },
    // Lire les fichiers
    {
      role: null,
      collection: 'directus_files',
      action: 'read',
      permissions: {},
      fields: ['*']
    },
    // Creer un compte utilisateur (inscription)
    {
      role: null,
      collection: 'directus_users',
      action: 'create',
      permissions: {},
      fields: ['email', 'password', 'first_name', 'last_name']
    }
  ];
  
  for (const permission of publicPermissions) {
    try {
      await apiRequest('POST', '/permissions', permission);
      console.log(chalk.green(`  ✅ Permission Public ${permission.action} sur ${permission.collection}`));
    } catch (error) {
      console.log(chalk.yellow(`  ⚠️  Permission existe deja: ${permission.collection} ${permission.action}`));
    }
  }
}

// 2. Creer et configurer le role Authenticated User
async function setupAuthenticatedRole() {
  console.log(chalk.blue('\n📝 Configuration du role Authenticated User...'));
  
  // Creer le role s'il n'existe pas
  let roleId;
  try {
    const rolesResponse = await apiRequest('GET', '/roles?filter[name][_eq]=Authenticated User');
    if (rolesResponse.data.length > 0) {
      roleId = rolesResponse.data[0].id;
      console.log(chalk.green('  ✅ Role Authenticated User existe deja'));
    } else {
      const newRole = await apiRequest('POST', '/roles', {
        name: 'Authenticated User',
        icon: 'person',
        description: 'Role pour les utilisateurs authentifies',
        admin_access: false,
        app_access: true
      });
      roleId = newRole.data.id;
      console.log(chalk.green('  ✅ Role Authenticated User cree'));
    }
  } catch (error) {
    console.error(chalk.red('  ❌ Erreur creation role'));
    throw error;
  }
  
  // Permissions pour Authenticated User
  const authenticatedPermissions = [
    // MEMES - CRUD complet avec restrictions
    {
      role: roleId,
      collection: 'memes',
      action: 'create',
      permissions: {},
      fields: ['*']
    },
    {
      role: roleId,
      collection: 'memes',
      action: 'read',
      permissions: {},
      fields: ['*']
    },
    {
      role: roleId,
      collection: 'memes',
      action: 'update',
      permissions: {
        user_created: { _eq: '$CURRENT_USER' }
      },
      fields: ['title', 'description', 'status', 'tags']
    },
    {
      role: roleId,
      collection: 'memes',
      action: 'delete',
      permissions: {
        user_created: { _eq: '$CURRENT_USER' }
      },
      fields: []
    },
    
    // TAGS - Lecture et creation
    {
      role: roleId,
      collection: 'tags',
      action: 'read',
      permissions: {},
      fields: ['*']
    },
    {
      role: roleId,
      collection: 'tags',
      action: 'create',
      permissions: {},
      fields: ['name', 'slug']
    },
    
    // MEMES_TAGS - Relation many-to-many
    {
      role: roleId,
      collection: 'memes_tags',
      action: 'create',
      permissions: {},
      fields: ['*']
    },
    {
      role: roleId,
      collection: 'memes_tags',
      action: 'read',
      permissions: {},
      fields: ['*']
    },
    {
      role: roleId,
      collection: 'memes_tags',
      action: 'delete',
      permissions: {},
      fields: []
    },
    
    // LIKES - Creer et supprimer ses propres likes
    {
      role: roleId,
      collection: 'memes_likes',
      action: 'create',
      permissions: {},
      fields: ['*']
    },
    {
      role: roleId,
      collection: 'memes_likes',
      action: 'read',
      permissions: {},
      fields: ['*']
    },
    {
      role: roleId,
      collection: 'memes_likes',
      action: 'delete',
      permissions: {
        user_id: { _eq: '$CURRENT_USER' }
      },
      fields: []
    },
    
    // SAVED_MEMES - Gerer ses memes sauvegardes
    {
      role: roleId,
      collection: 'saved_memes',
      action: 'create',
      permissions: {},
      fields: ['*']
    },
    {
      role: roleId,
      collection: 'saved_memes',
      action: 'read',
      permissions: {
        user_id: { _eq: '$CURRENT_USER' }
      },
      fields: ['*']
    },
    {
      role: roleId,
      collection: 'saved_memes',
      action: 'delete',
      permissions: {
        user_id: { _eq: '$CURRENT_USER' }
      },
      fields: []
    },
    
    // NOTIFICATIONS - Lire et marquer comme lu ses propres notifications
    {
      role: roleId,
      collection: 'notifications',
      action: 'read',
      permissions: {
        user_id: { _eq: '$CURRENT_USER' }
      },
      fields: ['*']
    },
    {
      role: roleId,
      collection: 'notifications',
      action: 'update',
      permissions: {
        user_id: { _eq: '$CURRENT_USER' }
      },
      fields: ['is_read']
    },
    
    // FILES - Upload et lecture
    {
      role: roleId,
      collection: 'directus_files',
      action: 'create',
      permissions: {},
      fields: ['*']
    },
    {
      role: roleId,
      collection: 'directus_files',
      action: 'read',
      permissions: {},
      fields: ['*']
    },
    
    // USERS - Lire les infos des autres utilisateurs
    {
      role: roleId,
      collection: 'directus_users',
      action: 'read',
      permissions: {},
      fields: ['id', 'email', 'first_name', 'last_name', 'avatar']
    }
  ];
  
  for (const permission of authenticatedPermissions) {
    try {
      await apiRequest('POST', '/permissions', permission);
      console.log(chalk.green(`  ✅ Permission ${permission.action} sur ${permission.collection}`));
    } catch (error) {
      console.log(chalk.yellow(`  ⚠️  Permission existe deja: ${permission.collection} ${permission.action}`));
    }
  }
  
  // Mettre a jour le role par defaut pour l'inscription publique
  try {
    await apiRequest('PATCH', '/settings', {
      public_registration: true,
      public_registration_role: roleId,
      public_registration_verify_email: false
    });
    console.log(chalk.green('  ✅ Inscription publique activee avec le role Authenticated User'));
  } catch (error) {
    console.log(chalk.yellow('  ⚠️  Impossible de mettre a jour les settings'));
  }
  
  return roleId;
}

// 3. Verifier les collections necessaires
async function verifyCollections() {
  console.log(chalk.blue('\n📋 Verification des collections...'));
  
  const requiredCollections = [
    'memes',
    'tags',
    'memes_tags',
    'memes_likes',
    'saved_memes',
    'notifications'
  ];
  
  for (const collection of requiredCollections) {
    try {
      await apiRequest('GET', `/collections/${collection}`);
      console.log(chalk.green(`  ✅ Collection ${collection} existe`));
    } catch (error) {
      console.log(chalk.red(`  ❌ Collection ${collection} manquante`));
    }
  }
}

// Fonction principale
async function main() {
  console.log(chalk.cyan('╔══════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║  Configuration Complete des Permissions Directus ║'));
  console.log(chalk.cyan('╚══════════════════════════════════════════════════╝\n'));
  
  try {
    // 1. Obtenir le token admin
    await getAdminToken();
    
    // 2. Verifier les collections
    await verifyCollections();
    
    // 3. Configurer le role Public
    await setupPublicRole();
    
    // 4. Configurer le role Authenticated User
    const roleId = await setupAuthenticatedRole();
    
    // 5. Resume
    console.log(chalk.cyan('\n╔══════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║              Configuration Terminee              ║'));
    console.log(chalk.cyan('╚══════════════════════════════════════════════════╝\n'));
    
    console.log(chalk.green('✅ Roles configures:'));
    console.log(chalk.white('  - Public (null): Lecture memes publies, tags, fichiers'));
    console.log(chalk.white(`  - Authenticated User (${roleId}): CRUD complet avec restrictions`));
    console.log(chalk.white('  - Administrator: Acces complet (pre-existant)\n'));
    
    console.log(chalk.yellow('📝 Prochaines etapes:'));
    console.log(chalk.white('  1. Tester l\'inscription d\'un nouvel utilisateur'));
    console.log(chalk.white('  2. Verifier les permissions dans l\'admin Directus'));
    console.log(chalk.white('  3. Creer des memes de test\n'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Erreur lors de la configuration:'), error.message);
    process.exit(1);
  }
}

// Executer le script
main();
