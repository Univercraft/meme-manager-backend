import Database from 'better-sqlite3';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'data', 'database.db');

const token = crypto.randomBytes(32).toString('hex');

try {
  const db = new Database(dbPath);
  
  console.log('🔍 Recherche de l\'admin...');
  const admin = db.prepare('SELECT id, email FROM directus_users WHERE email = ?')
    .get('admin@example.com');
  
  if (!admin) {
    console.error('❌ Admin non trouvé !');
    process.exit(1);
  }
  
  console.log(`✅ Admin trouvé: ${admin.email} (${admin.id})\n`);
  
  console.log('🔑 Génération du token statique...');
  db.prepare('UPDATE directus_users SET token = ? WHERE id = ?')
    .run(token, admin.id);
  
  console.log('✅ Token créé avec succès !\n');
  console.log('📋 Votre Static Token :');
  console.log(token);
  console.log('\n📝 Mettez à jour votre .env :');
  console.log(`KEY=${token}`);
  console.log(`ADMIN_TOKEN=${token}\n`);
  
  db.close();
} catch (error) {
  console.error('❌ Erreur:', error.message);
}
