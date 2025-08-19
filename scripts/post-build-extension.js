#!/usr/bin/env node

import { copyFileSync, unlinkSync, existsSync } from 'fs';

const EXTENSION_DIR = 'dist-extension';
const SOURCE_POPUP = `${EXTENSION_DIR}/public/popup.html`;
const TARGET_POPUP = `${EXTENSION_DIR}/popup.html`;

function postBuildExtension() {
  console.log('🔧 Post-processing extension build...');
  
  if (existsSync(SOURCE_POPUP)) {
    if (existsSync(TARGET_POPUP)) {
      unlinkSync(TARGET_POPUP);
      console.log('   Removed source popup.html');
    }
    
    copyFileSync(SOURCE_POPUP, TARGET_POPUP);
    console.log('   Moved built popup.html to root');
    console.log('✅ Extension post-build complete');
  } else {
    console.error('❌ Built popup.html not found');
    process.exit(1);
  }
}

postBuildExtension();
