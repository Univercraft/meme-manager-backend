import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function updateEnvFile(roleId) {
  const envPath = join(__dirname, '.env');
  let envContent = readFileSync(envPath, 'utf-8');
  
  // Remplacer ou ajouter PUBLIC_REGISTRATION_ROLE
  if (envContent.includes('PUBLIC_REGISTRATION_ROLE=')) {
    envContent = envContent.replace(
      /PUBLIC_REGISTRATION_ROLE=.*/,
      `PUBLIC_REGISTRATION_ROLE=${roleId}`
    );
  } else {
    envContent += `\nPUBLIC_REGISTRATION_ROLE=${roleId}\n`;
  }
  
  writeFileSync(envPath, envContent, 'utf-8');
  console.log(`✅ .env mis à jour avec PUBLIC_REGISTRATION_ROLE=${roleId}`);
}
