import fs from 'fs';
import { execSync } from 'child_process';

const mode = process.argv[2] || 'on';
const configPath = './capacitor.config.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

if (mode === 'on') {
  config.server = {
    url: 'http://localhost:3000',
    cleartext: true
  };
  console.log('[LiveReload] Set capacitor server.url to http://localhost:3000');
} else {
  config.server = {
    androidScheme: 'https'
  };
  console.log('[LiveReload] Restored offline bundled mode');
}

fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

try {
  execSync('npx cap copy android', { stdio: 'inherit' });
} catch (e) {
  // Ignore
}
