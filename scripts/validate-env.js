#!/usr/bin/env node

/**
 * Build-time environment variable validation
 * This script runs before build to ensure all required environment variables are set
 */

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_MAPBOX_ACCESS_TOKEN'
];

const optionalEnvVars = [
  'VITE_OPENAI_API_KEY',  // Optional - only needed for Barry AI feature
  'VITE_SUPABASE_PROJECT_ID',
  'VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID',
  'VITE_STRIPE_LIFETIME_PRICE_ID',
  'VITE_APP_URL'
];

console.log('🔍 Validating environment variables...\n');

let hasErrors = false;
const missing = [];
const invalid = [];

// Check required variables
console.log('Required Environment Variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`  ❌ ${varName}: NOT SET`);
    missing.push(varName);
    hasErrors = true;
  } else if (value.includes('YOUR_') || value.includes('xxx')) {
    console.log(`  ⚠️  ${varName}: PLACEHOLDER VALUE DETECTED`);
    invalid.push(varName);
    hasErrors = true;
  } else {
    const masked = value.substring(0, 8) + '...' + value.substring(value.length - 4);
    console.log(`  ✅ ${varName}: ${masked}`);
  }
});

// Check optional variables
console.log('\nOptional Environment Variables:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`  ⚪ ${varName}: Not set (optional)`);
  } else {
    const masked = value.substring(0, 8) + '...' + value.substring(value.length - 4);
    console.log(`  ✅ ${varName}: ${masked}`);
  }
});

// Check for Supabase URL format
if (process.env.VITE_SUPABASE_URL) {
  const url = process.env.VITE_SUPABASE_URL;
  if (!url.includes('.supabase.co')) {
    console.log('\n⚠️  Warning: VITE_SUPABASE_URL does not appear to be a valid Supabase URL');
    console.log(`  Expected format: https://YOUR_PROJECT_ID.supabase.co`);
    console.log(`  Current value: ${url}`);
    hasErrors = true;
  }
}

// Check for API key format
if (process.env.VITE_SUPABASE_ANON_KEY) {
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (key.length < 100) {
    console.log('\n⚠️  Warning: VITE_SUPABASE_ANON_KEY appears to be too short');
    console.log(`  Expected: A JWT token (usually 200+ characters)`);
    console.log(`  Current length: ${key.length} characters`);
    hasErrors = true;
  }
}

// Environment detection
console.log('\nEnvironment Detection:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`  CI: ${process.env.CI ? 'true' : 'false'}`);
console.log(`  NETLIFY: ${process.env.NETLIFY ? 'true' : 'false'}`);

if (process.env.NETLIFY) {
  console.log('\n📍 Running on Netlify:');
  console.log(`  Context: ${process.env.CONTEXT || 'unknown'}`);
  console.log(`  Branch: ${process.env.BRANCH || 'unknown'}`);
  console.log(`  Deploy URL: ${process.env.DEPLOY_URL || 'unknown'}`);
}

// Final summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.error('❌ VALIDATION FAILED\n');
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:');
    missing.forEach(v => console.error(`  - ${v}`));
    console.error('\nTo fix:');
    console.error('1. For local development: Add these to your .env file');
    console.error('2. For Netlify: Add these in Dashboard > Site Settings > Environment Variables');
  }
  
  if (invalid.length > 0) {
    console.error('\nInvalid environment variables (placeholder values detected):');
    invalid.forEach(v => console.error(`  - ${v}`));
    console.error('\nReplace placeholder values with actual API keys/tokens');
  }
  
  console.error('\nRequired environment variables:');
  console.error('  VITE_SUPABASE_URL: Your Supabase project URL');
  console.error('  VITE_SUPABASE_ANON_KEY: Your Supabase anonymous key');
  console.error('  VITE_MAPBOX_ACCESS_TOKEN: Your Mapbox access token');
  console.error('\nOptional but recommended:');
  console.error('  VITE_OPENAI_API_KEY: Your OpenAI API key (for Barry AI feature)');
  
  // In CI/production, exit with error to fail the build
  if (process.env.CI || process.env.NETLIFY) {
    console.error('\n🛑 Build cancelled due to missing environment variables');
    process.exit(1);
  } else {
    console.warn('\n⚠️  Continuing with warnings (local development)');
  }
} else {
  console.log('✅ All required environment variables are properly configured\n');
}