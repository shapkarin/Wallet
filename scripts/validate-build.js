#!/usr/bin/env node

import { readFileSync, statSync, readdirSync, existsSync } from 'fs';
import { join, extname } from 'path';

const BUILD_DIR = process.env.BUILD_DIR || 'build';
const EXTENSION_DIR = 'dist-extension';
const MAX_JS_CHUNK_SIZE = 1024 * 1024; // 1MB
const MAX_CSS_CHUNK_SIZE = 512 * 1024; // 512KB
const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_EXTENSION_SIZE = 5 * 1024 * 1024; // 5MB for extension

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeDirectory(dir, basePath = '') {
  const files = [];
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const relativePath = join(basePath, item);
    const stats = statSync(fullPath);
    
    if (stats.isDirectory()) {
      files.push(...analyzeDirectory(fullPath, relativePath));
    } else {
      files.push({
        path: relativePath,
        size: stats.size,
        ext: extname(item).toLowerCase()
      });
    }
  }
  
  return files;
}

function validateBuild(buildDir, isExtension = false) {
  const buildType = isExtension ? 'extension' : 'web';
  console.log(`🔍 Validating ${buildType} production build...\n`);
  
  try {
    const files = analyzeDirectory(buildDir);
    const jsFiles = files.filter(f => f.ext === '.js');
    const cssFiles = files.filter(f => f.ext === '.css');
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const maxSize = isExtension ? MAX_EXTENSION_SIZE : MAX_TOTAL_SIZE;
    
    console.log(`📊 ${buildType.toUpperCase()} Build Analysis:`);
    console.log(`Total files: ${files.length}`);
    console.log(`Total size: ${formatBytes(totalSize)}`);
    console.log(`JS files: ${jsFiles.length} (${formatBytes(jsFiles.reduce((sum, f) => sum + f.size, 0))})`);
    console.log(`CSS files: ${cssFiles.length} (${formatBytes(cssFiles.reduce((sum, f) => sum + f.size, 0))})`);
    console.log('');
    
    let hasErrors = false;
    
    // Check total bundle size
    if (totalSize > maxSize) {
      console.error(`❌ Total bundle size (${formatBytes(totalSize)}) exceeds limit (${formatBytes(maxSize)})`);
      hasErrors = true;
    } else {
      console.log(`✅ Total bundle size within limits`);
    }
    
    // Check individual JS chunks
    const largeJsFiles = jsFiles.filter(f => f.size > MAX_JS_CHUNK_SIZE);
    if (largeJsFiles.length > 0) {
      console.error(`❌ Large JS chunks found:`);
      largeJsFiles.forEach(f => {
        console.error(`  - ${f.path}: ${formatBytes(f.size)}`);
      });
      hasErrors = true;
    } else {
      console.log(`✅ All JS chunks within size limits`);
    }
    
    // Check individual CSS chunks
    const largeCssFiles = cssFiles.filter(f => f.size > MAX_CSS_CHUNK_SIZE);
    if (largeCssFiles.length > 0) {
      console.error(`❌ Large CSS chunks found:`);
      largeCssFiles.forEach(f => {
        console.error(`  - ${f.path}: ${formatBytes(f.size)}`);
      });
      hasErrors = true;
    } else {
      console.log(`✅ All CSS chunks within size limits`);
    }
    
    // Check for essential files
    if (isExtension) {
      const hasManifest = files.some(f => f.path === 'manifest.json');
      const hasPopup = files.some(f => f.path === 'popup.html');
      const hasBackground = files.some(f => f.path === 'background.js');
      
      if (!hasManifest) {
        console.error(`❌ Missing manifest.json`);
        hasErrors = true;
      } else {
        console.log(`✅ manifest.json found`);
      }
      
      if (!hasPopup) {
        console.error(`❌ Missing popup.html`);
        hasErrors = true;
      } else {
        console.log(`✅ popup.html found`);
      }
      
      if (!hasBackground) {
        console.error(`❌ Missing background.js`);
        hasErrors = true;
      } else {
        console.log(`✅ background.js found`);
      }
    } else {
      const hasEntryClient = files.some(f => f.path.includes('entry.client'));
      
      if (!hasEntryClient) {
        console.error(`❌ Missing entry.client.js`);
        hasErrors = true;
      } else {
        console.log(`✅ entry.client.js found`);
      }
    }
    
    // Validate that crypto libraries are properly bundled
    const cryptoChunk = files.find(f => f.path.includes('crypto-vendor'));
    if (cryptoChunk) {
      console.log(`✅ Crypto vendor chunk found: ${formatBytes(cryptoChunk.size)}`);
    } else {
      console.warn(`⚠️  No crypto vendor chunk found - may be inlined`);
    }
    
    // Check for source maps in production
    const sourceMaps = files.filter(f => f.ext === '.map');
    if (sourceMaps.length > 0) {
      console.warn(`⚠️  Source maps found in production build (${sourceMaps.length} files)`);
    } else {
      console.log(`✅ No source maps in production build`);
    }
    
    console.log('\n📈 Largest files:');
    files
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
      .forEach(f => {
        console.log(`  ${formatBytes(f.size).padStart(8)} - ${f.path}`);
      });
    
    if (hasErrors) {
      console.error(`\n❌ ${buildType.toUpperCase()} build validation failed!`);
      return false;
    } else {
      console.log(`\n✅ ${buildType.toUpperCase()} build validation passed!`);
      return true;
    }
    
  } catch (error) {
    console.error(`❌ Error validating ${buildType} build:`, error.message);
    return false;
  }
}

function main() {
  let success = true;
  
  if (existsSync(BUILD_DIR)) {
    console.log(`Found web build in ${BUILD_DIR}`);
    success = validateBuild(BUILD_DIR, false) && success;
    console.log('\n' + '='.repeat(50) + '\n');
  }
  
  if (existsSync(EXTENSION_DIR)) {
    console.log(`Found extension build in ${EXTENSION_DIR}`);
    success = validateBuild(EXTENSION_DIR, true) && success;
  }
  
  if (!existsSync(BUILD_DIR) && !existsSync(EXTENSION_DIR)) {
    console.error('❌ No build directories found! Run build first.');
    process.exit(1);
  }
  
  if (!success) {
    process.exit(1);
  }
}

main();
