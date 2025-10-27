#!/usr/bin/env node

/**
 * Script to generate a new NEXTAUTH_SECRET
 * Run with: node scripts/generate-secret.js
 */

const crypto = require('crypto');

function generateSecret() {
  return crypto.randomBytes(32).toString('hex');
}

const newSecret = generateSecret();

console.log('Generated new NEXTAUTH_SECRET:');
console.log(newSecret);
console.log('\nAdd this to your .env.local file:');
console.log(`NEXTAUTH_SECRET=${newSecret}`);
console.log('\nNote: After updating the secret, all existing sessions will be invalidated.');
