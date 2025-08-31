# UnimogCommunityHub Environment Setup Guide

## Required Environment Variables

This document outlines all the environment variables required to run the UnimogCommunityHub application properly.

## Quick Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Fill in your actual values in the `.env` file

## Environment Variables Reference

### Core Requirements (MUST HAVE)

#### Supabase Configuration
```bash
# Your Supabase project URL
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co

# Your Supabase anonymous key (safe to use in browser)
VITE_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>

# Your Supabase project ID
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
```

**Where to find these:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings > API
4. Copy the URL and anon/public key

#### Mapbox Configuration
```bash
# Your Mapbox access token for map features
VITE_MAPBOX_ACCESS_TOKEN=YOUR_MAPBOX_TOKEN_HERE
```

**Where to get this:**
1. Sign up at [Mapbox](https://account.mapbox.com)
2. Go to your Account > Tokens
3. Create a new token or use the default public token

#### OpenAI Configuration
```bash
# Your OpenAI API key for Barry AI Mechanic
VITE_OPENAI_API_KEY=<OPENAI_API_KEY>
```

**Where to get this:**
1. Sign up at [OpenAI Platform](https://platform.openai.com)
2. Go to API Keys
3. Create a new secret key
4. **Important:** Keep this key secure and never commit it to git

### Optional Configuration

#### Stripe Payment Processing
```bash
# For subscription features (optional)
VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_xxx
VITE_STRIPE_LIFETIME_PRICE_ID=price_xxx
```

#### Application Settings
```bash
# Your application URL (change for production)
VITE_APP_URL=http://localhost:5173

# Application name
VITE_APP_NAME=UnimogCommunityHub
```

## Security Best Practices

1. **Never commit `.env` to version control**
   - The `.env` file is already in `.gitignore`
   - Double-check before committing

2. **Use different keys for development and production**
   - Create separate Supabase projects
   - Use restricted Mapbox tokens for production
   - Use separate OpenAI keys with spending limits

3. **Rotate keys regularly**
   - Update API keys every 3-6 months
   - Immediately rotate if exposed

4. **Set API limits**
   - Configure rate limits in Supabase
   - Set spending limits in OpenAI
   - Use domain restrictions for Mapbox

## Troubleshooting

### Missing Environment Variables
If you see errors about missing environment variables:
1. Check that `.env` file exists in the root directory
2. Verify all required variables are set
3. Restart the development server after changes

### Invalid API Keys
If you get authentication errors:
1. Verify keys are copied correctly (no extra spaces)
2. Check key hasn't expired or been revoked
3. Ensure you're using the correct key type (anon vs service role)

### Development vs Production
- Use `.env.local` for local overrides
- Use `.env.production` for production builds
- Never expose service role keys to the frontend

## Testing Your Setup

Run the following command to verify your environment:
```bash
npm run dev
```

Then visit:
- http://localhost:5173/test-supabase - Test Supabase connection
- http://localhost:5173/test-chatgpt - Test OpenAI integration

## Common Issues and Solutions

### Issue: Supabase connection fails
**Solution:** 
- Verify URL format: `https://[PROJECT_ID].supabase.co`
- Check anon key is the public/anon key, not service role
- Ensure project is not paused in Supabase dashboard

### Issue: Maps not loading
**Solution:**
- Verify Mapbox token starts with `pk.`
- Check token has proper scopes enabled
- Ensure token isn't restricted to specific URLs in development

### Issue: Barry AI not responding
**Solution:**
- Verify OpenAI key starts with `sk-`
- Check OpenAI account has credits
- Ensure API key has correct permissions
- Check browser console for specific error messages

### Issue: Build fails
**Solution:**
- Run `npm install` to ensure all dependencies are installed
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npx tsc --noEmit`

## Need Help?

If you're still having issues:
1. Check the browser console for specific error messages
2. Review the [Troubleshooting Guide](./TROUBLESHOOTING.md)
3. Open an issue on GitHub with:
   - Error messages
   - Steps to reproduce
   - Environment details (OS, Node version, etc.)