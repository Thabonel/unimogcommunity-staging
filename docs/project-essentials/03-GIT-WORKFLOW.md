# Git Workflow - Unimog Community Hub

## Overview

The Unimog Community Hub uses a **dual-repository workflow** for safe development and deployment. This ensures that all changes are thoroughly tested before reaching production users.

## 🏗️ Repository Structure

### Production Repository
- **URL**: `https://github.com/Thabonel/unimogcommunityhub.git`
- **Remote**: `origin`
- **Purpose**: Live production code
- **Deployment**: Netlify auto-deploys from main branch
- **Live Site**: https://unimogcommunityhub.com

### Staging Repository  
- **URL**: `https://github.com/Thabonel/unimogcommunity-staging.git`
- **Remote**: `staging`
- **Purpose**: Testing and validation
- **Deployment**: Netlify auto-deploys from main branch
- **Staging Site**: https://unimogcommunity-staging.netlify.app

## 🔄 Development Workflow

### 1. Local Development
All development happens on the local `main` branch:

```bash
# Start development
npm run dev

# Make changes, test locally
git add .
git commit -m "feat: your feature description"
```

### 2. Push to Staging (Testing)
**Always push to staging first** for testing:

```bash
# Push to staging for testing
git push staging main:main
```

**Wait for deployment** and test on: https://unimogcommunity-staging.netlify.app

### 3. Push to Production (Live)
**Only after staging validation** and **with explicit permission**:

```bash
# Create backup first (recommended)
git tag backup-main-$(date +%Y%m%d-%H%M)
git push origin backup-main-$(date +%Y%m%d-%H%M)

# Push to production
git push origin main
```

## 🚨 Safety Rules

### ⛔ Restrictions
- **NEVER** push directly to production without staging validation
- **NEVER** skip the staging step for "small" changes
- **ALWAYS** test on staging first

### ✅ Requirements
- All changes must pass staging validation
- Production pushes require explicit permission
- Backup tags should be created before major releases

## 🛡️ Backup Strategy

### Creating Backups
Before any major changes or production deployment:

```bash
# Create a backup tag with timestamp
git tag backup-main-$(date +%Y%m%d-%H%M)

# Push the backup tag to origin
git push origin backup-main-$(date +%Y%m%d-%H%M)

# Example result: backup-main-20250820-1430
```

### Listing Backups
```bash
# List all backup tags
git tag | grep backup-main

# Show recent backups
git tag | grep backup-main | tail -5
```

### Emergency Rollback
If production needs to be rolled back:

```bash
# Find the backup tag
git tag | grep backup-main

# Reset to backup (DANGEROUS - creates new commit)
git reset --hard backup-main-20250820-1430
git push origin main --force-with-lease

# Alternative: Revert specific commits
git revert <commit-hash>
git push origin main
```

## 📋 Common Commands

### Daily Development
```bash
# Check current status
git status

# View recent commits
git log --oneline -5

# Push to staging for testing
git push staging main:main

# After staging validation, push to production
git push origin main
```

### Repository Management
```bash
# Check which remotes are configured
git remote -v

# Fetch latest from both repositories
git fetch origin
git fetch staging

# Compare staging vs production
git log origin/main..staging/main
```

### Sync Repositories
Keep staging and production in sync:

```bash
# Push latest main to staging
git push staging main:main

# Or pull from staging to local then push to production
git fetch staging
git reset --hard staging/main
git push origin main
```

## 🧪 Testing Checklist

### Before Staging Push
- [ ] Code builds successfully (`npm run build`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No console errors in development
- [ ] Core functionality tested locally

### Before Production Push
- [ ] Staging deployment successful
- [ ] All critical features tested on staging
- [ ] Performance acceptable on staging
- [ ] No broken links or 404 errors
- [ ] Barry AI functioning correctly
- [ ] Pricing system working
- [ ] Authentication flow tested

## 🚀 Deployment Process

### Staging Deployment
1. **Commit changes** with descriptive message
2. **Push to staging**: `git push staging main:main`
3. **Wait for Netlify build** (usually 2-3 minutes)
4. **Test on staging site**: https://unimogcommunity-staging.netlify.app
5. **Validate all functionality**

### Production Deployment
1. **Staging validation complete** ✅
2. **Create backup** (recommended)
3. **Get deployment permission** (if required)
4. **Push to production**: `git push origin main`
5. **Monitor live site**: https://unimogcommunityhub.com
6. **Verify deployment successful**

## 🔧 Troubleshooting

### Common Issues

**Staging and production out of sync:**
```bash
# Check differences
git fetch origin staging
git log origin/main..staging/main

# Sync staging to match production
git push staging origin/main:main
```

**Build fails on Netlify:**
```bash
# Test build locally first
npm run build

# Check environment variables in Netlify dashboard
# Common issues: missing VITE_ prefixed variables
```

**Git conflicts:**
```bash
# If push rejected due to conflicts
git fetch origin
git rebase origin/main
git push origin main
```

### Emergency Procedures

**Production site is broken:**
1. **Immediate**: Rollback to last known good backup
2. **Identify**: Check recent commits for issues
3. **Fix**: Make corrections on local main
4. **Test**: Validate fix on staging first
5. **Deploy**: Push corrected version to production

**Staging site is broken:**
1. **Check**: Recent commits for obvious issues
2. **Rollback**: Reset staging to last known good state
3. **Fix**: Correct issues locally
4. **Re-test**: Push fixed version to staging

## 📚 Related Documentation

- [Contributing Guide](./CONTRIBUTING.md) - Development setup and standards
- [Deployment Guide](./DEPLOYMENT.md) - Environment configuration
- [Testing Checklist](./TESTING_CHECKLIST.md) - Validation procedures

## 💡 Best Practices

### Commit Messages
Use conventional commit format:
```
feat: add currency conversion system
fix: resolve Barry avatar loading issue
docs: update Git workflow documentation
refactor: simplify pricing calculation logic
```

### Branch Management
- **Main branch only**: Keep it simple with single branch
- **No feature branches**: Direct commits to main with good testing
- **Clean history**: Use meaningful commit messages

### Collaboration
- **Communicate**: Announce production deployments
- **Document**: Update CLAUDE.md with significant changes
- **Backup**: Always create tags before major releases
- **Test**: Never skip staging validation

## 🆘 Support

### Getting Help
- **Documentation**: Check `/docs` folder for specific guides
- **Logs**: Check Netlify deployment logs for build issues
- **Local Testing**: Use `npm run dev` and `npm run build`

### Emergency Contacts
- **Developer**: Thabonel (thabonel0@gmail.com)
- **Repository**: Both staging and production repos in GitHub
- **Hosting**: Netlify dashboard for deployment issues

---

**Remember**: The staging environment is your safety net. Always use it! 🛡️