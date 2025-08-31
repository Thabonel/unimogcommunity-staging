# Project Essentials - Quick Start Guide

**Welcome to the Unimog Community Hub!** 🚙

This folder contains all the essential documentation needed to get up to speed with the project quickly.

## 📚 Documentation Structure

Files are numbered in the order you should read them:

### Core Documentation

1. **[01-PROJECT-OVERVIEW.md](01-PROJECT-OVERVIEW.md)**
   - What the project is and its purpose
   - Key features and functionality
   - Target audience and goals

2. **[02-ENVIRONMENT-SETUP.md](02-ENVIRONMENT-SETUP.md)**
   - Required environment variables
   - Local development setup
   - Dependencies and prerequisites

3. **[03-GIT-WORKFLOW.md](03-GIT-WORKFLOW.md)** ⚠️ CRITICAL
   - Dual repository structure (staging + production)
   - **NEVER push to production without permission**
   - Safe deployment practices

4. **[04-DEPLOYMENT.md](04-DEPLOYMENT.md)**
   - Netlify deployment configuration
   - Build settings and environment
   - Post-deployment verification

5. **[05-TROUBLESHOOTING.md](05-TROUBLESHOOTING.md)**
   - Common issues and solutions
   - Error recovery procedures
   - Debug strategies

6. **[06-TESTING-CHECKLIST.md](06-TESTING-CHECKLIST.md)**
   - Pre-deployment testing steps
   - Feature verification checklist
   - Critical functionality tests

7. **[07-AI-MEMORY-CLAUDE.md](07-AI-MEMORY-CLAUDE.md)** 🤖
   - Complete project context for AI assistants
   - Architecture and patterns
   - Coding standards and conventions

8. **[08-RECENT-CRITICAL-FIXES.md](08-RECENT-CRITICAL-FIXES.md)**
   - Latest critical fixes and safeguards
   - Repository restoration procedures
   - Lessons learned from incidents

## 🚀 Quick Start for New Developers

### Day 1: Understanding the Project
1. Read **01-PROJECT-OVERVIEW.md** to understand what we're building
2. Review **07-AI-MEMORY-CLAUDE.md** for complete technical context
3. Check **08-RECENT-CRITICAL-FIXES.md** for recent issues to avoid

### Day 2: Setting Up
1. Follow **02-ENVIRONMENT-SETUP.md** to configure your environment
2. Study **03-GIT-WORKFLOW.md** carefully - this is critical!
3. Review **05-TROUBLESHOOTING.md** for common setup issues

### Day 3: Start Coding
1. Use **06-TESTING-CHECKLIST.md** before any commits
2. Refer to **04-DEPLOYMENT.md** when ready to deploy to staging
3. Keep **07-AI-MEMORY-CLAUDE.md** open as your reference guide

## 🏗️ Project Architecture Summary

```
Frontend: React 18 + TypeScript + Vite
Backend: Supabase (PostgreSQL + Auth + Storage)
Hosting: Netlify
Maps: Mapbox GL JS
AI: OpenAI GPT-4 (Barry the AI Mechanic)
Payments: Stripe
```

## 📁 Key Project Locations

- **Source Code**: `/src/`
- **Components**: `/src/components/`
- **Database Migrations**: `/supabase/migrations/`
- **Edge Functions**: `/supabase/functions/`
- **Documentation**: `/docs/`
- **Configuration**: Root directory files

## 🔑 Critical Environment Variables

```bash
VITE_SUPABASE_URL        # Supabase project URL
VITE_SUPABASE_ANON_KEY   # Supabase anonymous key
VITE_MAPBOX_ACCESS_TOKEN # Mapbox token for maps
VITE_OPENAI_API_KEY      # OpenAI key for Barry AI
```

## ⚠️ Critical Safety Rules

1. **NEVER push directly to production** (`origin`)
   - Always push to staging first: `git push staging main:main`
   - Production requires explicit permission

2. **Check file count before pushing**
   - Repository should have ~2,950 files
   - Use: `git ls-files | wc -l`
   - If count drops significantly, STOP and investigate

3. **No hardcoded API keys**
   - All keys must be in environment variables
   - Check before committing: `grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" src/`

4. **Test locally before deploying**
   - Run: `npm run dev`
   - Check console for errors
   - Verify maps and Barry AI work

## 🛡️ Repository Safeguards

We have protective measures in place:

1. **Pre-push Git Hook** - Validates file count before allowing push
2. **Safe-push Script** - Use `./scripts/safe-push.sh` for validated pushing
3. **Staging Repository** - Test everything here first

## 📊 Current Project Status

- **Platform**: ✅ LIVE and functional
- **Users**: Active real users on platform
- **Features**: All core features implemented
- **Focus**: Maintenance and user-requested features only

## 🆘 Emergency Contacts

- **GitHub Repositories**:
  - Production: https://github.com/Thabonel/unimogcommunityhub
  - Staging: https://github.com/Thabonel/unimogcommunity-staging

- **Live Sites**:
  - Production: https://unimogcommunityhub.com
  - Staging: https://unimogcommunity-staging.netlify.app

- **Supabase Dashboard**: https://ydevatqwkoccxhtejdor.supabase.co

## 📝 Development Philosophy

**"If it's not broken, don't fix it!"**

The platform is complete and working. Focus on:
- Bug fixes only when reported by users
- Security updates as needed
- Performance optimizations if metrics show issues
- Feature additions only upon explicit user request

## 🔄 Update Schedule

This documentation is actively maintained. Check back regularly for updates, especially:
- After major feature additions
- After critical bug fixes
- When development practices change

---

**Last Updated**: January 31, 2025  
**Maintained By**: Development Team  
**AI Assistant**: Claude Code

*For detailed information on any topic, refer to the numbered documentation files above.*