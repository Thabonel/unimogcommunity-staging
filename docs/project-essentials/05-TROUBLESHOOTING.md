# Troubleshooting Guide - Unimog Community Hub

## Common Issues and Solutions

### 1. Invalid API Key Errors

**Symptoms:**
- "Invalid API key" errors in console
- Authentication failures
- Unable to access protected routes

**Solutions:**
1. Check environment variables are set correctly
2. Clear browser localStorage and cookies
3. Verify Supabase keys in `.env` file
4. Ensure no hardcoded keys in code

### 2. Build Failures

**Symptoms:**
- `npm run build` fails
- TypeScript errors
- Missing modules

**Solutions:**
1. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
2. Clear build cache: `rm -rf dist`
3. Check for circular dependencies
4. Verify all imports have correct paths

### 3. Map Not Loading

**Symptoms:**
- Map area shows blank
- Mapbox token errors
- "Invalid access token" messages

**Solutions:**
1. Verify `VITE_MAPBOX_ACCESS_TOKEN` is set
2. Check token hasn't expired
3. Clear localStorage: `localStorage.removeItem('mapbox_token')`
4. Ensure token has correct scopes

### 4. Database Connection Issues

**Symptoms:**
- "Connection refused" errors
- Slow queries
- Timeout errors

**Solutions:**
1. Check Supabase service status
2. Verify connection pooling settings
3. Check RLS policies aren't blocking queries
4. Monitor rate limits

### 5. Authentication Problems

**Symptoms:**
- Login loops
- Session expiry issues
- "Unauthorized" errors

**Solutions:**
1. Clear all auth cookies and localStorage
2. Check JWT token expiry settings
3. Verify auth provider configuration
4. Ensure RLS policies include auth checks

### 6. Service Worker Issues

**Symptoms:**
- Old content being served
- PWA not updating
- Offline mode not working

**Solutions:**
1. Unregister service worker: Developer Tools > Application > Service Workers > Unregister
2. Clear cache storage
3. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
4. Check service worker registration in main.tsx

### 7. PDF Viewer Not Working

**Symptoms:**
- PDFs not displaying
- "Failed to load PDF" errors
- Worker errors in console

**Solutions:**
1. Check PDF.js worker is loaded
2. Verify manual files exist in storage
3. Check CORS settings on storage bucket
4. Ensure bucket is public or has correct policies

### 8. GPX Upload Failures

**Symptoms:**
- GPX files not processing
- "Invalid file format" errors
- Upload timeout

**Solutions:**
1. Verify file is valid GPX format
2. Check file size limits (usually 10MB)
3. Ensure Edge Function is deployed
4. Check Supabase function logs

### 9. Barry AI Not Responding

**Symptoms:**
- No response from Barry
- "API key invalid" for OpenAI
- Timeout errors

**Solutions:**
1. Verify `VITE_OPENAI_API_KEY` is set
2. Check OpenAI API quota/limits
3. Ensure manual chunks are processed
4. Check network connectivity

### 10. Development Server Issues

**Symptoms:**
- Port already in use
- Hot reload not working
- Module not found errors

**Solutions:**
1. Kill process on port: `lsof -ti:5173 | xargs kill -9`
2. Clear Vite cache: `rm -rf node_modules/.vite`
3. Restart with clean state: `npm run dev -- --force`
4. Check for file watchers limit on Linux

## Emergency Recovery

If the site completely breaks:

```bash
# 1. Find last working backup
git branch -a | grep backup-working

# 2. Restore from backup
git checkout backup-working-2025-08-20

# 3. Test locally
npm install
npm run dev

# 4. If working, create new branch
git checkout -b recovery-branch

# 5. Push to staging
git push staging recovery-branch:main
```

## Environment Variables Checklist

Required environment variables:
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `VITE_MAPBOX_ACCESS_TOKEN`
- [ ] `VITE_OPENAI_API_KEY`

Optional but recommended:
- [ ] `VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID`
- [ ] `VITE_STRIPE_LIFETIME_PRICE_ID`
- [ ] `VITE_ENABLE_DEV_LOGIN`

## Debug Commands

```bash
# Check environment variables
npm run check:env

# Verify Supabase connection
npm run test:supabase

# Test build without deploying
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Find large bundle sizes
npx vite-bundle-visualizer
```

## Support Resources

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Mapbox Account**: https://account.mapbox.com
- **OpenAI Platform**: https://platform.openai.com
- **Netlify Dashboard**: https://app.netlify.com

## Contact

For urgent issues:
- Developer: Thabonel (thabonel0@gmail.com)
- Backup branches available on GitHub
- Recovery scripts in `/scripts` directory