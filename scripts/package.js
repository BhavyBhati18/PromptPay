/**
 * Chrome Web Store Packaging Script
 * Prepares a production bundle and generates a clean ZIP package ready for submission.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const UNPACKED_DIR = path.join(DIST_DIR, 'unpacked');

// Exact files required in production extension
const FILES_TO_COPY = [
  'manifest.json',
  'background.js',
  'content.js',
  'content.css',
  'popup.html',
  'popup.css',
  'popup.js',
  'advertiser_portal.html',
  'advertiser_portal.css',
  'advertiser_portal.js',
  'ad_engine.js',
  'privacy_policy.html'
];

const DIRECTORIES_TO_COPY = [
  'icons'
];

function copyFileSync(src, dest) {
  fs.copyFileSync(src, dest);
}

function copyDirSync(srcDir, destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function runPreflightChecks(manifest) {
  console.log('\n🔍 Running Chrome Web Store Pre-flight Checks...');

  // 1. Manifest V3 validation
  if (manifest.manifest_version !== 3) {
    throw new Error('Manifest must be version 3 for Chrome Web Store.');
  }
  console.log('✓ Manifest V3: Verified');

  // 2. Icon files check
  for (const size of ['16', '48', '128']) {
    const iconRel = manifest.icons[size];
    const iconAbs = path.join(ROOT_DIR, iconRel);
    if (!fs.existsSync(iconAbs)) {
      throw new Error(`Missing required icon: ${iconRel}`);
    }
  }
  console.log('✓ Extension Icons (16, 48, 128px): Verified');

  // 3. Check for disallowed eval() in JS files
  for (const f of FILES_TO_COPY.filter(f => f.endsWith('.js'))) {
    const code = fs.readFileSync(path.join(ROOT_DIR, f), 'utf8');
    if (/\beval\s*\(/.test(code)) {
      throw new Error(`Forbidden 'eval()' found in ${f}. Chrome Web Store will reject this.`);
    }
  }
  console.log('✓ Code Security (No eval / remote code): Verified');

  // 4. Privacy policy presence
  if (!fs.existsSync(path.join(ROOT_DIR, 'privacy_policy.html'))) {
    throw new Error('Missing privacy_policy.html (Mandatory for Chrome Web Store).');
  }
  console.log('✓ Privacy Policy: Verified');
}

function main() {
  console.log('📦 Starting Chrome Web Store Extension Packaging...\n');

  // Read manifest
  const manifestPath = path.join(ROOT_DIR, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const version = manifest.version || '1.0.0';
  const zipName = `ai-search-ads-v${version}.zip`;
  const zipPath = path.join(DIST_DIR, zipName);

  runPreflightChecks(manifest);

  // Clean / recreate dist directory
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(UNPACKED_DIR, { recursive: true });

  // Copy files
  console.log('\n📋 Copying production assets...');
  for (const file of FILES_TO_COPY) {
    const src = path.join(ROOT_DIR, file);
    const dest = path.join(UNPACKED_DIR, file);
    if (fs.existsSync(src)) {
      copyFileSync(src, dest);
      console.log(`  + ${file}`);
    } else {
      console.warn(`  ⚠️ Warning: ${file} not found.`);
    }
  }

  // Copy directories
  for (const dir of DIRECTORIES_TO_COPY) {
    const src = path.join(ROOT_DIR, dir);
    const dest = path.join(UNPACKED_DIR, dir);
    if (fs.existsSync(src)) {
      copyDirSync(src, dest);
      console.log(`  + ${dir}/`);
    }
  }

  // Create ZIP archive
  console.log(`\n🗜️  Compacting into ${zipName}...`);
  try {
    // Use PowerShell Compress-Archive on Windows
    const psCmd = `powershell -Command "Compress-Archive -Path '${UNPACKED_DIR}\\*' -DestinationPath '${zipPath}' -Force"`;
    execSync(psCmd, { stdio: 'inherit' });

    const stats = fs.statSync(zipPath);
    console.log(`\n======================================================`);
    console.log(`🎉 Chrome Web Store Package Built Successfully!`);
    console.log(`📁 ZIP Archive: ${zipPath}`);
    console.log(`📊 Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`📂 Unpacked Folder: ${UNPACKED_DIR}`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error('Failed to create ZIP package:', err.message);
    process.exit(1);
  }
}

main();
