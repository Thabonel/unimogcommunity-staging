# UnimogCommunityHub - Claude Code Context

## Project Overview
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL) + Edge Functions (Deno)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Maps**: Mapbox GL JS
- **AI**: OpenAI GPT-4 (Barry the AI Mechanic)
- **Authentication**: Supabase Auth with RLS
- **Storage**: Supabase Storage (avatars, vehicles, manuals)
- **Deployment**: Netlify (auto-deploy from GitHub)

## Architecture Style
- **Type**: Single Page Application (SPA) with serverless backend
- **Pattern**: Component-based React with custom hooks
- **State Management**: React Context + React Query
- **Database**: PostgreSQL with Row Level Security (RLS)
- **File Organization**: Feature-based folder structure

## Key Directories & Their Context Files
- `/src` - Frontend React application (`src/cloud.md`)
- `/supabase` - Database migrations & edge functions (`supabase/cloud.md`)
- `/docs` - Documentation and guides (`docs/cloud.md`)

## Core Technologies & Libraries

### Frontend Stack
- **React 18**: Functional components with hooks
- **TypeScript**: Strict type checking, no `any` types allowed
- **Vite**: Build tool and dev server
- **shadcn/ui**: Component library (prefer over custom components)
- **Tailwind CSS**: Utility-first styling
- **React Query**: Server state management
- **React Hook Form + Zod**: Form handling and validation

### Backend & Services  
- **Supabase**: Primary backend service
- **PostgreSQL**: Database with RLS policies
- **Edge Functions**: Deno runtime for serverless functions
- **OpenAI API**: Barry AI assistant integration
- **Mapbox API**: Mapping and geolocation services
- **Stripe**: Payment processing (premium features)

### Development Tools
- **ESLint**: Code linting
- **TypeScript**: Type checking
- **Git**: Version control with dual repo strategy
- **Netlify**: Deployment and hosting

## Architectural Principles

### Code Standards
- **Functional Components Only**: No class components
- **TypeScript Strict**: Proper types, no `any`
- **Component Composition**: Prefer composition over inheritance  
- **Custom Hooks**: Extract logic into reusable hooks
- **Error Boundaries**: Wrap components in error boundaries
- **Defensive Programming**: Always validate inputs and handle errors

### Database Patterns
- **RLS Everywhere**: Every table has Row Level Security
- **SECURITY DEFINER**: Functions use `SECURITY DEFINER` + `SET search_path = 'public'`
- **Migrations**: All schema changes via migrations
- **Indexes**: Proper indexing for performance
- **Audit Trails**: Track important changes

### Security Guidelines
- **No Hardcoded Secrets**: All secrets in environment variables
- **Input Validation**: Validate on both client and server
- **Auth Checks**: Verify authentication before protected operations
- **CORS**: Proper CORS configuration
- **CSP**: Content Security Policy headers

## Git Workflow & Branching

### Repository Strategy
- **Production**: `origin` → https://github.com/Thabonel/unimogcommunityhub.git
- **Staging**: `staging` → https://github.com/Thabonel/unimogcommunity-staging.git

### Commit Standards
```
type(scope): description

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Branch Protection
- **NEVER** push directly to production without explicit permission
- **ALWAYS** push to staging first: `git push staging main:main`
- **CREATE** backup branches before major changes
- **TEST** on staging before production deployment

## UI/UX Guidelines

### Design System
- **Color Palette**: Military green, camo brown, mud black, khaki tan, sand beige
- **Typography**: Clean, readable fonts
- **Icons**: Lucide React icon library
- **Responsive**: Mobile-first design approach
- **Accessibility**: WCAG 2.1 AA compliance

### Component Patterns
- **shadcn/ui First**: Use existing components before creating custom
- **Compound Components**: For complex UI patterns
- **Render Props**: For flexible component composition
- **Custom Hooks**: For stateful logic
- **Error States**: Always handle loading and error states

## Instructions for Claude Code

### Context Building
1. **Always read this file first** before starting any task
2. **Check subfolder `cloud.md`** files for detailed context
3. **Review existing patterns** before implementing new features
4. **Ask questions** if architectural decisions are unclear

### Code Quality Standards
- **Prefer new, clean code** over patching legacy systems
- **Follow existing patterns** found in the codebase
- **Write self-documenting code** with meaningful names
- **Add TypeScript types** for all new code
- **Include error handling** for all operations

### Database Operations
- **Check schema first** before creating new tables/functions
- **Use migrations** for all database changes
- **Add RLS policies** for new tables
- **Include proper indexes** for query performance
- **Test with real data** before deployment

### Security Practices
- **Never expose secrets** in code or commits
- **Validate inputs** on both client and server
- **Use SECURITY DEFINER** for database functions
- **Implement proper auth checks** for protected routes
- **Follow principle of least privilege**

### Development Workflow
1. **Understand the problem** thoroughly before coding
2. **Plan the implementation** with clear steps
3. **Write tests first** when applicable (TDD)
4. **Implement incrementally** with frequent testing
5. **Document significant changes** in CLAUDE.md
6. **Test on staging** before production

### Never Assume
- **API availability**: Check if libraries/services are actually used
- **Database schema**: Verify table/column existence
- **Environment variables**: Confirm required env vars are set
- **User permissions**: Validate auth state before operations
- **Data formats**: Check actual data structure vs assumptions

## Current Project Status
- ✅ **Core Platform**: Complete and live with real users
- ✅ **Security**: Database functions secured, RLS implemented
- ✅ **AI Integration**: Barry assistant fully functional
- ✅ **Maps**: Full trip planning and waypoint system
- ✅ **Community**: Posts, comments, user connections active
- ✅ **Premium Features**: WIS-EPC system operational

## Maintenance Philosophy
- **If it's not broken, don't fix it** - Platform has real users
- **Careful, incremental improvements only**
- **Test thoroughly** before any deployments  
- **Monitor user impact** of all changes
- **Focus on user-requested features** only

---

*This file serves as the master context for all Claude Code interactions with this project. Update when architecture changes.*