const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const nextDir = path.join(process.cwd(), '.next');
const routesManifest = path.join(nextDir, 'routes-manifest.json');
const mode = process.argv[2] || 'dev'; // 'dev', 'build', 'start'

function isCorrupted() {
  if (!fs.existsSync(nextDir)) return false;
  if (fs.existsSync(routesManifest)) {
    try {
      const stats = fs.statSync(routesManifest);
      if (stats.size === 0) return true;
      const content = fs.readFileSync(routesManifest, 'utf8');
      JSON.parse(content);
      return false;
    } catch (err) {
      console.warn('⚠️ Corrupted routes-manifest.json detected:', err.message);
      return true;
    }
  }
  return false;
}

function cleanCache() {
  if (fs.existsSync(nextDir)) {
    console.log('🧹 Auto-cleaning .next build cache...');
    try {
      fs.rmSync(nextDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
      console.log('✨ Cleaned .next cache successfully.');
    } catch (err) {
      console.warn('⚠️ Note: File lock encountered during cache clean:', err.message);
    }
  }
}

try {
  if (mode === 'build') {
    cleanCache();
  } else if (isCorrupted()) {
    cleanCache();
  }

  if (mode === 'start' && (!fs.existsSync(routesManifest) || isCorrupted())) {
    console.log('📦 Build manifest missing or incomplete. Building production application...');
    execSync('npx next build', { stdio: 'inherit' });
  }
} catch (error) {
  console.error('❌ Cache verification check error:', error.message);
}
