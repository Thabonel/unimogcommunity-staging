
# Unimog Off-road Planning App - Deployment Guide

## Prerequisites

Before deploying the Unimog Off-road Planning app, ensure you have:

1. A Mapbox account with an active API key
2. Node.js 16.x or higher
3. npm 7.x or higher
4. A hosting service that supports static site deployment

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
VITE_APP_URL=unimogcommunityhub.com
```

**Important**: Never commit your `.env` file to version control. Make sure it's listed in your `.gitignore` file.

## Build Process

### For Production Deployment

1. Install dependencies:
   ```
   npm install
   ```

2. Build the application:
   ```
   npm run build
   ```

3. The build output will be in the `dist` directory, which can be deployed to any static hosting service.

## Deployment Options

### Netlify

1. Install the Netlify CLI:
   ```
   npm install -g netlify-cli
   ```

2. Deploy the application:
   ```
   netlify deploy
   ```

3. For production deployment:
   ```
   netlify deploy --prod
   ```

### Vercel

1. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Deploy the application:
   ```
   vercel
   ```

3. For production deployment:
   ```
   vercel --prod
   ```

### GitHub Pages

1. Install gh-pages:
   ```
   npm install -g gh-pages
   ```

2. Add the following to your package.json:
   ```json
   "scripts": {
     "deploy": "gh-pages -d dist"
   }
   ```

3. Deploy:
   ```
   npm run deploy
   ```

### AWS S3 + CloudFront

1. Build the project:
   ```
   npm run build
   ```

2. Upload the contents of the `dist` directory to an S3 bucket
3. Configure CloudFront to serve your S3 bucket
4. Set up appropriate cache headers

## Post-Deployment Verification

After deploying, verify the following:

1. The application loads correctly
2. Mapbox maps are displayed properly
3. Route planning functionality works
4. The application is responsive on different devices

## Security Considerations

1. Restrict your Mapbox API key to specific domains
   - Go to Mapbox Dashboard > Access tokens > URL restrictions
   - Add your production domain to restrict usage

2. Set appropriate Content Security Policy (CSP) headers
   - Include directives for map tile servers
   - Allow Mapbox API endpoints

3. Use HTTPS for all connections

## Performance Optimization

1. Enable HTTP/2 on your server
2. Configure appropriate caching headers:
   - Cache static assets (JS, CSS, images) for 1 year
   - Set appropriate cache for map tiles

3. Enable Brotli or Gzip compression
4. Use a CDN for static assets

## Monitoring and Error Handling

1. Set up error tracking (e.g., Sentry)
2. Monitor API usage to avoid exceeding Mapbox quotas
3. Implement logging for critical operations

## Troubleshooting Common Issues

### Maps Not Loading

- Verify your Mapbox API key is correct and not restricted
- Check browser console for CORS or other errors
- Ensure the Mapbox API key has the necessary permissions

### Performance Issues

- Reduce initial bundle size by optimizing imports
- Implement code splitting for large components
- Optimize map tile loading and caching

## Backup and Recovery

1. Maintain a backup of your deployment configuration
2. Document the deployment process for quick recovery
3. Implement a rollback strategy for failed deployments
