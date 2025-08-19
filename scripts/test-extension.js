#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const EXTENSION_DIR = 'dist-extension';

function testExtensionInstallation() {
  console.log('🔍 Testing Chrome extension installation readiness...\n');
  
  if (!existsSync(EXTENSION_DIR)) {
    console.error('❌ Extension build directory not found! Run build:extension:prod first.');
    process.exit(1);
  }
  
  const requiredFiles = [
    'manifest.json',
    'popup.html', 
    'background.js',
    'favicon.ico'
  ];
  
  let hasErrors = false;
  
  for (const file of requiredFiles) {
    const filePath = join(EXTENSION_DIR, file);
    if (existsSync(filePath)) {
      console.log(`✅ ${file} found`);
      
      if (file === 'manifest.json') {
        try {
          const manifest = JSON.parse(readFileSync(filePath, 'utf-8'));
          console.log(`   Version: ${manifest.version}`);
          console.log(`   Name: ${manifest.name}`);
          console.log(`   Permissions: ${manifest.permissions.join(', ')}`);
        } catch (error) {
          console.error(`❌ Invalid manifest.json: ${error.message}`);
          hasErrors = true;
        }
      }
      
      if (file === 'popup.html') {
        const content = readFileSync(filePath, 'utf-8');
        if (content.includes('/app/entry.extension.tsx')) {
          console.error(`❌ popup.html contains unbundled script reference`);
          hasErrors = true;
        } else if (content.includes('assets/')) {
          console.log(`   Contains bundled assets ✅`);
        }
      }
      
    } else {
      console.error(`❌ ${file} missing`);
      hasErrors = true;
    }
  }
  
  const assetsDir = join(EXTENSION_DIR, 'assets');
  if (existsSync(assetsDir)) {
    console.log(`✅ Assets directory found`);
  } else {
    console.error(`❌ Assets directory missing`);
    hasErrors = true;
  }
  
  console.log('\n📋 Installation Instructions:');
  console.log('1. Open Chrome and go to chrome://extensions/');
  console.log('2. Enable "Developer mode" in the top right');
  console.log('3. Click "Load unpacked" and select the dist-extension folder');
  console.log('4. The TrustWallet extension should appear in your extensions list');
  
  if (hasErrors) {
    console.error('\n❌ Extension installation test failed!');
    process.exit(1);
  } else {
    console.log('\n✅ Extension ready for installation!');
  }
}

testExtensionInstallation();
