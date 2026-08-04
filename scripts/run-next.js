const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const index = trimmed.indexOf('=');
      if (index !== -1) {
        const key = trimmed.substring(0, index).trim();
        let value = trimmed.substring(index + 1).trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

let port = process.env.PORT || '3000';

// Validate port
const portNum = parseInt(port, 10);
if (isNaN(portNum) || portNum <= 0 || portNum > 65535) {
  console.warn(`⚠️ Warning: Invalid PORT "${port}" in env. Falling back to 3000.`);
  port = '3000';
  process.env.PORT = '3000';
} else {
  process.env.PORT = port;
}

// Adjust NEXTAUTH_URL dynamically if it points to localhost/127.0.0.1
if (process.env.NEXTAUTH_URL) {
  try {
    const url = new URL(process.env.NEXTAUTH_URL);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      url.port = port;
      process.env.NEXTAUTH_URL = url.origin;
    }
  } catch (e) {
    // Ignore invalid URL format
  }
} else {
  process.env.NEXTAUTH_URL = `http://localhost:${port}`;
}

const args = process.argv.slice(2); // 'dev', 'start', etc.
const nextMode = args[0] || 'dev';

console.log(`📡 Launching Next.js in "${nextMode}" mode on port ${port}...`);
console.log(`🔗 NEXTAUTH_URL is configured as: ${process.env.NEXTAUTH_URL}`);

const child = spawn('npx', ['next', nextMode, '-p', port], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('close', (code) => {
  process.exit(code || 0);
});
