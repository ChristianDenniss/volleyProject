#!/usr/bin/env node

// Simple cache-busting script for development
const fs = require('fs');
const path = require('path');

// Generate a timestamp for cache busting
const timestamp = Date.now();

// Update package.json with a cache version
const packagePath = path.join(__dirname, 'package.json');
const package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Add or update cache version
package.cacheVersion = timestamp;

fs.writeFileSync(packagePath, JSON.stringify(package, null, 2));

console.log(`✅ Cache version updated to: ${timestamp}`);
console.log('🔄 Restart your dev server to apply changes');
console.log('💡 This forces browsers to reload all CSS files'); 