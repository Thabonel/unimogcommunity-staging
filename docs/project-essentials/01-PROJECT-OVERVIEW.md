# UnimogCommunityHub Documentation

Welcome to the UnimogCommunityHub documentation. This directory contains all technical documentation, guides, and references for developers and maintainers.

## 📁 Documentation Structure

### 🚀 `/deployment/`
Deployment, hosting, and infrastructure documentation
- `NETLIFY_DEPLOYMENT.md` - Netlify deployment guide
- `NETLIFY_SETUP.md` - Initial Netlify configuration
- `DOMAIN_SETUP.md` - Domain configuration guide
- `DEPLOYMENT.md` - General deployment procedures

### 🔧 `/development/`
Development setup and coding guidelines
- `ENVIRONMENT_SETUP.md` - Local development environment
- `CODEBASE_OVERVIEW.md` - Project structure and architecture
- `STYLE_GUIDE.md` - Code style and conventions
- `COMMIT_CONVENTION.md` - Git commit message format
- `CONTRIBUTING.md` - Contribution guidelines
- `GIT_WORKFLOW.md` - Git branching and workflow
- `TESTING_CHECKLIST.md` - Testing requirements
- `PACKAGE_UPDATES.md` - Package management guide

### 🔐 `/authentication/`
Authentication and security documentation
- `AUTH_ERROR_PREVENTION.md` - Auth error handling strategies
- `SUPABASE_AUTH_FIX.md` - Supabase authentication fixes
- `auth-recovery-system.md` - Auth recovery mechanisms

### 🗺️ `/features/`
Feature-specific documentation

#### `/features/maps/`
- `MAPBOX_FIX.md` - Mapbox integration fixes
- `MAP_OPTIONS_DROPDOWN_IMPLEMENTATION.md` - Map controls implementation

#### `/features/chatgpt/`
- `CHATGPT_INTEGRATION_COMPLETE.md` - Barry AI integration
- `CHATGPT_SETUP.md` - ChatGPT configuration
- `SECURE_CHATGPT_SETUP.md` - Security considerations
- `DEPLOY_SECURE_CHATGPT.md` - Deployment guide

#### `/features/wis-system/`
Mercedes WIS/EPC system documentation
- `WIS_SYSTEM_COMPREHENSIVE_GUIDE.md` - Complete WIS guide
- `WIS-EPC-DEPLOYMENT-GUIDE.md` - Deployment instructions
- `WIS-EPC-SUPABASE-ARCHITECTURE.md` - Database architecture
- `WIS_EPC_INTEGRATION_PLAN.md` - Integration roadmap
- Extraction guides and session summaries

#### `/features/manuals/`
- `MANUAL_BUCKET_FIX.md` - Manual storage fixes

### 🐛 `/troubleshooting/`
Problem resolution and debugging guides
- `TROUBLESHOOTING.md` - General troubleshooting
- `2025-08-23-profile-accountsettings-fix.md` - Profile flashing fix
- Session-specific fixes and solutions

### 💬 `/conversations/`
Historical conversation logs and session summaries
- Dated conversation summaries
- Architecture decisions
- Major refactoring sessions

### 🧹 `/cleanup/`
Code cleanup and optimization reports
- `cleanup-test-report-phase1-2.md`
- `cleanup-test-report-phase3-4.md`
- `cleanup-test-report-phase5.md`

### 📚 `/guides/`
User and developer guides
- `UNIMOG_SPECIFIC_GUIDELINES.md` - Unimog terminology and conventions
- Setup and configuration guides

### 🗄️ `/archive/`
Deprecated or historical documentation
- Old backups
- Superseded documentation
- Historical references

## 🔍 Quick Navigation

### For New Developers
1. Start with [`ENVIRONMENT_SETUP.md`](development/ENVIRONMENT_SETUP.md)
2. Read [`CODEBASE_OVERVIEW.md`](development/CODEBASE_OVERVIEW.md)
3. Review [`GIT_WORKFLOW.md`](development/GIT_WORKFLOW.md)
4. Check [`STYLE_GUIDE.md`](development/STYLE_GUIDE.md)

### For Deployment
1. [`NETLIFY_DEPLOYMENT.md`](deployment/NETLIFY_DEPLOYMENT.md)
2. [`DEPLOYMENT.md`](deployment/DEPLOYMENT.md)
3. [`DOMAIN_SETUP.md`](deployment/DOMAIN_SETUP.md)

### For Debugging Issues
1. [`TROUBLESHOOTING.md`](troubleshooting/TROUBLESHOOTING.md)
2. Check specific fixes in `/troubleshooting/`
3. Review `/conversations/` for similar issues

### For Feature Development
1. Check relevant `/features/` subdirectory
2. Review integration guides
3. Follow [`CONTRIBUTING.md`](development/CONTRIBUTING.md)

## 📝 Documentation Standards

### File Naming Convention
- Use UPPERCASE for general guides: `DEPLOYMENT.md`
- Use lowercase-with-dashes for specific items: `2025-08-23-profile-fix.md`
- Include dates for time-sensitive docs: `YYYY-MM-DD-description.md`

### Document Structure
Each document should include:
1. **Title** - Clear, descriptive heading
2. **Date** - When written/last updated
3. **Purpose** - What the document covers
4. **Content** - Well-organized sections
5. **Examples** - Code samples where relevant
6. **Related** - Links to related docs

### Updating Documentation
- Keep docs current with code changes
- Archive outdated docs to `/archive/`
- Update this README when adding new categories
- Use clear, concise language
- Include examples and commands

## 🔗 External Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 📋 Maintenance

This documentation is maintained alongside the codebase. When making significant changes:
1. Update relevant documentation
2. Add new guides if introducing features
3. Document troubleshooting solutions
4. Keep the structure organized

Last Updated: 2025-08-23