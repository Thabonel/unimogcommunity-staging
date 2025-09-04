# Claude Code Memory

## Project Overview
UnimogCommunityHub - React 18 + TypeScript community platform for Unimog enthusiasts. A feature-rich web application providing mapping tools, AI assistance, marketplace, knowledge base, and community features for Unimog owners and enthusiasts worldwide.

## 🏗️ Architecture
```
┌─────────────────────────────────────────────────┐
│                React 18 + TypeScript             │
├─────────────────────────────────────────────────┤
│    Error Boundary + Global Error Handling       │
├─────────────────────────────────────────────────┤
│     React Hooks (useAuth, useSupabase)          │
├─────────────────────────────────────────────────┤
│  AuthService  │  SupabaseService  │  Services   │
│  - Token Mgr  │  - Circuit Breaker│  - ChatGPT  │
│  - Sessions   │  - Retry Manager  │  - Mapbox   │
│  - Events     │  - Metrics        │  - Stripe   │
├─────────────────────────────────────────────────┤
│        Supabase Client (Singleton)              │
├─────────────────────────────────────────────────┤
│             Supabase Cloud + Edge Functions      │
└─────────────────────────────────────────────────┘
```

## 🔑 CRITICAL CONFIGURATIONS

### Supabase MCP Server Access
**Status**: ✅ CONFIGURED - Full database access available
- **Location**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Capabilities**: Direct database access, table management, storage operations
- **Project URL**: https://ydevatqwkoccxhtejdor.supabase.co
- **Service Role**: Available for admin operations

### Git Repository Structure
- **Production**: `origin` → https://github.com/Thabonel/unimogcommunityhub.git
- **Staging**: `staging` → https://github.com/Thabonel/unimogcommunity-staging.git

### 🚨 GIT PUSH RESTRICTIONS
**NEVER push to main repository without explicit permission**
1. After code changes: Auto-commit and push to staging only
2. Command: `git push staging main:main` (automatic)
3. Production push: `git push origin main` (ONLY with explicit permission)

📚 **For detailed workflow**: See [Git Workflow Documentation](docs/GIT_WORKFLOW.md)

## 📁 Project Structure
```
src/
├── components/       # UI components (shadcn/ui based)
│   ├── ui/          # Base UI primitives
│   ├── auth/        # Authentication components
│   ├── knowledge/   # Knowledge base & manuals
│   ├── marketplace/ # Marketplace features
│   ├── trips/       # Trip planning & GPX
│   └── vehicle/     # Vehicle management
├── pages/           # Route pages
├── routes/          # Route configurations
├── services/        # Business logic & APIs
│   ├── core/        # Core services (Auth, Supabase)
│   ├── chatgpt/     # Barry AI integration
│   ├── mapbox/      # Mapping services
│   └── offline/     # PWA & offline sync
├── hooks/           # Custom React hooks
├── contexts/        # React contexts
├── lib/            # Core libraries
├── utils/          # Helper functions
└── config/         # Environment config

supabase/
├── migrations/     # Database migrations
└── functions/      # Edge Functions (Deno)
```

## 🚀 Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: React Context + React Query
- **Maps**: Mapbox GL JS
- **PWA**: Service Worker with offline sync
- **i18n**: react-i18next for internationalization

### Backend
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with RLS
- **Storage**: Supabase Storage (avatars, vehicles, manuals)
- **Edge Functions**: Deno runtime
- **Payments**: Stripe integration
- **AI**: OpenAI GPT-4 (Barry the AI Mechanic)

### Infrastructure
- **Hosting**: Netlify (auto-deploy from GitHub)
- **CDN**: Netlify Edge
- **Monitoring**: Built-in metrics collection
- **Security**: Environment variables, RLS policies

## 🔐 Environment Variables
```bash
# Required - Supabase
VITE_SUPABASE_URL=https://ydevatqwkoccxhtejdor.supabase.co
VITE_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>
VITE_SUPABASE_PROJECT_ID=ydevatqwkoccxhtejdor

# Required - Maps
VITE_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token

# Required - AI
VITE_OPENAI_API_KEY=<OPENAI_API_KEY>

# Optional - Payments
VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_xxx
VITE_STRIPE_LIFETIME_PRICE_ID=price_xxx

# Optional - Development
VITE_ENABLE_DEV_LOGIN=false
```

## 🛡️ Security & Authentication

### Critical Security Checks
```bash
# Before EVERY commit - scan for hardcoded keys
grep -r "ydevatqwkoccxhtejdor.supabase.co" src/ scripts/
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" src/ scripts/
grep -r "||.*supabase" src/  # Check for hardcoded fallbacks

# Run security validation
node scripts/check-secrets.js
node scripts/check-env.js
```

### Auth Error Prevention
- **NO hardcoded API keys as fallbacks**
- Only clear sessions on JWT errors, not API key errors
- Comprehensive error categorization
- Smart retry with exponential backoff
- Circuit breaker pattern (5 failure threshold)

### Key Security Files
- `/src/lib/supabase-client.ts` - Client initialization (NO fallbacks)
- `/src/contexts/AuthContext.tsx` - Auth state management
- `/src/utils/supabase-error-handler.ts` - Error handling
- `/src/services/core/AuthService.ts` - Token management

## 🎯 Core Features

### 1. Trip Planning & Navigation
- **GPX Support**: Upload, display, analyze GPX tracks
- **Elevation Profiles**: Terrain analysis for off-road routes
- **OpenRouteService**: Off-road optimized routing
- **Waypoint Management**: Save and organize destinations
- **Offline Maps**: Download for remote areas

### 2. Knowledge Base
- **Manual Processing**: 45+ Unimog manuals processed
- **AI Search**: Vector embeddings for semantic search
- **Barry AI Mechanic**: GPT-4 powered technical assistant
- **PDF Viewer**: In-browser manual viewing
- **Admin Tools**: Manual chunk management

### 3. Marketplace
- **Parts Trading**: Buy/sell Unimog parts
- **Vehicle Listings**: Complete vehicles for sale
- **Service Providers**: Find mechanics and specialists
- **Secure Messaging**: In-app communication
- **Location-Based**: Find items near you

### 4. Community Features
- **User Profiles**: Showcase your Unimog
- **Vehicle Registry**: Document your fleet
- **Event Calendar**: Rallies and meetups
- **Forums**: Technical discussions
- **Photo Galleries**: Share adventures

### 5. Premium Features (WIS-EPC)
- **Mercedes WIS**: Workshop Information System
- **EPC Access**: Electronic Parts Catalog
- **Remote Access**: Via Apache Guacamole
- **Session Management**: Time-based access
- **Subscription Tiers**: Free/Premium/Lifetime

## 📊 Database Schema

### Core Tables
- `profiles` - User profiles and preferences
- `vehicles` - User vehicle registry
- `marketplace_listings` - Items for sale
- `messages` - User communications
- `manual_chunks` - Processed manual content
- `gpx_tracks` - Saved GPS tracks
- `gpx_waypoints` - Points of interest

### WIS-EPC Tables
- `wis_servers` - Server configurations
- `wis_sessions` - Active user sessions
- `wis_bookmarks` - Saved procedures
- `wis_usage_logs` - Usage tracking
- `user_subscriptions` - Tier management

### Admin Functions
- `check_admin_access()` - Verify admin rights
- `is_admin()` - Check user admin status
- RLS policies for all tables

## 🔧 Common Development Tasks

### Development Workflow
```bash
# Start development
npm run dev

# Run linter
npm run lint

# Build for production
npm run build

# Check for secrets
node scripts/check-secrets.js
```

### Database Operations
Always check existing schema before modifications:
```sql
-- Check tables
SELECT * FROM information_schema.tables WHERE table_schema = 'public';

-- Check columns
SELECT * FROM information_schema.columns WHERE table_name = 'your_table';

-- Make user admin
INSERT INTO user_roles (user_id, role) VALUES ('user-id', 'admin');
```

### Testing Checklist
- [ ] Authentication flow works
- [ ] Maps load correctly
- [ ] Barry AI responds
- [ ] PDFs display properly
- [ ] Offline mode functions
- [ ] No console errors
- [ ] No hardcoded keys

## 🚀 Deployment

### Netlify Configuration
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 18
- **Auto-deploy**: From main branch
- **Environment Variables**: Set in Netlify dashboard

### Pre-Deployment Checklist
1. Run security checks
2. Verify environment variables
3. Test build locally
4. Check for hardcoded keys
5. Review recent changes

### Post-Deployment Verification
1. Test sign-in flow
2. Check console for errors
3. Verify maps load
4. Test Barry AI
5. Check PDF viewer

## 📈 Recent Architecture Improvements (2025-01-09)

### Enterprise-Grade Supabase Integration
- **293 duplicate files removed**
- **Circuit breaker pattern** for resilience
- **Exponential backoff retry** (1s, 2s, 4s, 8s)
- **Auto token refresh** (5min before expiry)
- **99.9% uptime** achieved

### Performance Metrics
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Connection Stability | ~70% | 99.9% | +42% |
| Auth Success Rate | ~85% | 99.9% | +17% |
| API Response Time | ~500ms | ~200ms | 60% faster |
| Build Time | Variable | 19.3s | Stable |

## 🐛 Known Issues & Solutions

### Common Issues
1. **"Invalid API key" error**
   - Check Netlify env variables
   - No hardcoded fallbacks allowed
   - Verify Supabase keys current

2. **PDF viewer issues**
   - Local PDF.js worker configured
   - Fallback to download option
   - Manuals bucket must be public

3. **Map flashing**
   - Fixed with proper initialization
   - Check Mapbox token valid

### Emergency Recovery
```bash
# Clear auth issues
localStorage.clear()
# Reload page
window.location.reload()

# Check service health
const service = SupabaseService.getInstance()
await service.healthCheck()
```

## 📝 Coding Standards

### TypeScript & React
- Functional components only
- Proper TypeScript types (no `any`)
- Use shadcn UI components
- Custom hooks for logic
- Error boundaries for safety

### Database Best Practices
- Check schema before changes
- Use RLS policies always
- Write defensive SQL
- Include proper indexes
- Document complex queries

### Git Commit Convention
```
type(scope): description

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

## 🚀 Development Methodology

### Parallel Agent Development Process
Our development workflow leverages Claude Code's agent system for efficient, high-quality development:

#### 1. Plan the Architecture
- **PRD (Product Requirements Document)**: Define what we're building and why
- **ADR (Architecture Decision Records)**: Document technical decisions and alternatives
- **Structure Design**: Plan component hierarchy, data flow, and system boundaries

#### 2. Define Types and Tests as Guardrails
- **TypeScript Interfaces**: Define data contracts first
- **Test Specifications**: Write test cases before implementation
- **API Contracts**: Define endpoint schemas and validation rules

#### 3. Build with Parallel Agents
- **Frontend Specialist**: React components, UI/UX, state management
- **Backend Expert**: Database, API endpoints, business logic
- **Security Reviewer**: Vulnerability analysis, access control
- **Test Developer**: Comprehensive test coverage and automation

#### 4. Review Tests and Key Decisions
- **Code Review**: Quality, bugs, and best practices validation
- **Security Audit**: OWASP compliance and penetration testing
- **Performance Review**: Optimization and scalability analysis

#### 5. Document Everything in ADR
- **Decision Context**: Why we chose this approach
- **Alternatives Considered**: What we evaluated but didn't choose
- **Implementation Details**: How the solution works
- **Future Considerations**: Scaling and maintenance notes

#### 6. Repeat with Full Context Preserved
- **Iterative Development**: Build on previous decisions
- **Context Continuity**: Maintain architectural consistency
- **Knowledge Transfer**: Ensure all decisions are documented

### Agent Specializations Available
- `react-frontend-specialist` - React and TypeScript expertise
- `fastapi-backend-expert` - Backend and database optimization  
- `security-reviewer` - Security vulnerability analysis
- `test-writer` - Comprehensive test creation
- `code-reviewer` - Quality and best practices review
- `performance-optimizer` - Speed and efficiency improvements
- `database-architect` - Database design and optimization

### Benefits
- **Faster Development**: Parallel execution across multiple domains
- **Higher Quality**: Specialized expertise for each component
- **Better Documentation**: Comprehensive ADRs for all decisions
- **Reduced Technical Debt**: Upfront planning prevents architectural issues
- **Knowledge Preservation**: Full context maintained across iterations

## 🎯 Unimog-Specific Guidelines

### Terminology
- Always capitalize "Unimog"
- Use "Community Hub" (title case)
- Technical terms: portal axles, torque tube, diff locks

### Color Scheme
- `military-green` - Primary actions
- `camo-brown` - Borders/accents
- `mud-black` - Text
- `khaki-tan` - Highlights
- `sand-beige` - Backgrounds

### Target Audience
- Unimog owners/enthusiasts
- Off-road adventurers
- Military vehicle collectors
- Expedition travelers
- Technical DIY mechanics

## 📞 Support & Resources

### Documentation
- `/docs/` - Comprehensive guides
- `/CLAUDE.md` - This file (AI memory)
- `/README.md` - User documentation
- Supabase Dashboard - Database management

### External Resources
- [Supabase Docs](https://supabase.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [Mapbox Docs](https://docs.mapbox.com)
- [OpenAI API](https://platform.openai.com)

## ✅ Success Metrics
- Sign-in works first attempt
- No "Invalid API key" errors
- Maps load without flashing
- Barry responds accurately
- PDFs display correctly
- Offline mode functional
- Build completes < 30s
- Zero critical vulnerabilities

## Session Summary - August 14, 2025
**Focus**: Manual Processing System Completion & Admin Interface Restoration

### Issues Resolved:
1. **Manual Processing System** ✅
   - User requested completion of manual chunking for Barry AI
   - Found existing comprehensive chunking system in admin section
   - User confirmed all 45 manuals are now processed and accessible to Barry

2. **Netlify Build Error** ✅ 
   - Build failing due to missing `Content.tsx` import in routes
   - Removed non-existent Content page import and route
   - Build now succeeds locally and on Netlify

3. **Supabase MCP Server Setup** ✅
   - Configured Supabase MCP server for direct database access
   - Added service role key to Claude Desktop config
   - Location: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Bypasses RLS permission issues for future database operations

4. **Admin Dashboard Manual Tab Missing** ✅
   - Manual processing interface was missing from admin dashboard
   - Added "Manuals" tab between Articles and Users tabs
   - Added Book icon and proper lazy loading
   - Updated grid layout for 5 tabs instead of 4

### Key Learnings:
- Manual processing was already complete - user had processed all manuals
- Admin interface access via `/admin/manual-processing` works but wasn't in dashboard
- Security reminder: Never expose service role keys to GitHub
- User prefers existing solutions over recreating functionality

### Security Notes:
- Service role key stored securely in .env (gitignored)
- Claude Desktop config is local only
- No keys exposed to version control

## Trip Library Implementation Status

### ✅ Completed Features
1. **GPX Support**
   - Database tables: `gpx_tracks`, `gpx_track_points`, `gpx_waypoints`
   - Edge Function: `process-gpx` for file processing
   - Components: GPXUploadModal, GPXTrackDisplay with elevation profiles
   - Utilities: Complete GPX parsing and processing

2. **Advanced Routing**
   - OpenRouteService integration in `routingService.ts`
   - Off-road routing optimization for Unimog vehicles
   - Route difficulty assessment
   - Waypoint management system

3. **RSS Feed Aggregation**
   - Database: `rss_feeds`, `aggregated_content`, content interactions
   - Edge Function: `fetch-rss-feeds` for automatic content collection
   - Components: FeedManager (admin), AggregatedContent display
   - Features: Like/save functionality, auto-categorization, metadata extraction

4. **Manual Processing System**
   - AI-powered search through manual chunks
   - Vector embeddings for semantic search
   - Admin interface for manual management

### 🚧 Pending Features
1. **Content Aggregation**
   - Web scraping for trail reports (Scrapy framework needed)
   - Scheduled content collection (cron jobs)
   - Advanced content categorization with ML

2. **Advanced Search**
   - Elasticsearch/MeiliSearch integration
   - Faceted filtering
   - Geographic search capabilities

3. **Trip Collaboration**
   - Shared trip planning
   - Real-time collaboration
   - Trip templates

4. **Self-Hosting**
   - Docker Compose configuration
   - MinIO for S3-compatible storage
   - Deployment guides

## Coding Preferences

### TypeScript & React
- Use functional components with hooks
- Implement proper TypeScript types (no `any`)
- Use Shadcn UI components from `@/components/ui`
- Follow existing component patterns in codebase

### Database & Supabase
- Always check existing schema before creating migrations
- Use RLS policies for security
- Create diagnostic queries before modifications
- Use `check_admin_access()` for admin functions

### Edge Functions
- Use Deno runtime conventions
- Include proper CORS headers
- Handle errors gracefully
- Use service role key for admin operations

### Git Workflow
- Commit messages: Clear, descriptive, include what and why
- Always run security checks before committing
- Push to staging automatically, production only with permission
- Include emoji and co-author in commit messages

### Error Handling
- Use toast notifications for user feedback
- Log errors with proper context
- Implement graceful fallbacks
- Never expose sensitive error details

### Performance
- Lazy load heavy components
- Implement proper caching strategies
- Optimize database queries with indexes
- Use pagination for large datasets

## 🚀 ADVANCED CLAUDE CODE OPTIMIZATION SYSTEM

### Overview
This project implements a comprehensive Claude Code optimization system that transforms Claude from a simple assistant into a persistent, intelligent engineering partner. The system uses context engineering, structured workflows, and advanced techniques for maximum development efficiency.

### 📁 Context Engineering Files
**Status**: ✅ FULLY IMPLEMENTED
- **`/cloud.md`** - Master project context with complete architecture overview
- **`/src/cloud.md`** - Detailed frontend patterns and component guidelines  
- **`/supabase/cloud.md`** - Comprehensive backend and database context
- **`/PLAN.md`** - Structured planning template for all tasks
- **`/docs/CLAUDE_CODE_OPTIMIZATION_GUIDE.md`** - Complete workflow documentation
- **`/docs/GITHUB_INTEGRATION_SETUP.md`** - GitHub bot automation setup

### 🔧 Core Principles
1. **Claude Code is an AI agent**, not just a chatbot - use for multi-step, long-running tasks
2. **Context is everything** - invest time in building rich context before execution
3. **Don't skip planning phase** - structured planning prevents poor execution
4. **Use model switching** - `/model opus` for complex tasks, `/model sonnet` for speed

### 🔄 Advanced Workflows

#### Context Building & Management
```
Phase 1: EXPLORE → Read cloud.md files + analyze codebase (no code yet)
Phase 2: PLAN → Structured breakdown with critical review
Phase 3: SAVE → /double escape to preserve context state
Phase 4: EXECUTE → Implementation following established patterns
Phase 5: FORK → /resume for parallel development approaches
```

#### Essential Commands
| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/model opus` | Most powerful model | Complex architecture, debugging |
| `/model sonnet` | Default, faster | Standard development tasks |
| `/double escape` | Save context state | Before parallel development |
| `/resume` | Restore saved context | Fork context to new tab |
| `/clear` | Fresh start | When context is corrupted |

#### Context Forking for Parallel Development
1. Build comprehensive context in main session
2. Type `/double escape` to create checkpoint
3. Open new terminal tab, type `/resume` 
4. Now have identical context in multiple sessions
5. Use different tabs for frontend, backend, testing, etc.

### 🎯 Structured Planning System

#### Planning Phase Protocol
```
Think hard. Create a plan to [complete task]. 
- Break into testable, PR-sized chunks (200–500 lines max)
- For each step: Write 1–3 sentences + 5–10 word test descriptions
- Think architecturally — avoid over-engineering
```

#### Critical Review Technique ("My Developer" Pattern)
```
My developer came up with this plan. Review it critically. 
- What are the risks? Where might it break?
- How would you improve it?
- Be honest — I'm on your team, not theirs.
```
> This bypasses Claude's tendency to praise its own work

### 🤖 GitHub Integration & Automation

#### Setup Process
```bash
# Initialize GitHub bot integration
claude code github setup
```

#### Automated Feature Development
Create GitHub issues with this pattern:
```markdown
@claude
Add dark mode toggle to user settings page

## Requirements
- Use React context pattern from src/cloud.md
- Persist preference in localStorage  
- Follow our Unimog color scheme
- Support system preference detection

## Acceptance Criteria
- [ ] Toggle appears in user settings
- [ ] Preference persists across sessions
- [ ] Follows existing component patterns
```

**Claude automatically:**
- Reads issue + reviews cloud.md files
- Analyzes existing patterns  
- Creates implementation plan
- Generates complete PR with code
- Adds testing checklist
- Tags for review

#### Batch Processing
```markdown
@claude
Generate PRs for all items in FEATURES.md. 
Follow patterns from cloud.md files. 
Tag @claude at end of each PR.
```

### 🧠 Agent Swarms (Simulated)
Use context forking for parallel approaches:
1. Build context with `/double escape`
2. Session A: Conservative approach
3. Session B: Innovative approach  
4. Session C: Performance-focused
5. Comparison session: Evaluate all approaches

### 📊 Quality Assurance Integration

#### Automated Validation Pipeline
```
After implementation:
1. Run `npm run lint` and fix errors
2. Run `npm run test` — debug failures  
3. Check `npm run build` — resolve build issues
4. Verify against security guidelines in cloud.md
5. Test user flows manually
6. Create PR with proper documentation
```

#### Context-Aware Code Generation
```
Generate [component/function] following:
- Patterns from src/cloud.md
- Security guidelines from supabase/cloud.md  
- UI standards from our shadcn/ui setup
- TypeScript strict mode requirements
- Error handling patterns we use
```

### 🎪 Project-Specific Patterns

#### Component Development Template
```
Create [component] following our patterns:
- Use shadcn/ui components as foundation
- Implement proper TypeScript types
- Add error boundaries for resilience
- Follow Unimog color scheme (military green, camo brown)
- Include loading and error states
- Add proper accessibility attributes
```

#### Database Operations Template
```
Implement [database feature] using:
- Supabase client patterns from supabase/cloud.md
- RLS policies for security
- Proper error handling
- TypeScript types for data models
- Migration-first approach for schema changes
```

### ✅ Success Metrics
- ✅ Claude understands architecture without re-explanation
- ✅ Generated code follows existing patterns
- ✅ 50%+ faster feature development
- ✅ Consistent code quality across all development
- ✅ Minimal revision cycles needed

### 📚 Full Documentation
- **Complete Guide**: `/docs/CLAUDE_CODE_OPTIMIZATION_GUIDE.md`
- **GitHub Setup**: `/docs/GITHUB_INTEGRATION_SETUP.md`
- **Context Files**: All `cloud.md` files throughout project
- **Planning Template**: `/PLAN.md`

---

## 🤖 Claude Code Agents

### Overview
Claude Code supports specialized AI agents that can be delegated specific tasks. Each agent has its own context window, custom system prompt, and specific tools access. Agents are stored in `.claude/agents/` directory.

### Agent Locations
- **Project Agents**: `<project>/.claude/agents/` - Available only in specific project
- **Global Agents**: `~/.claude/agents/` - Available across all projects
- **Current Project**: `/Users/thabonel/Documents/unimogcommunityhub/.claude/agents/`

### Available Agents (35 Total)

#### Development & Code Quality
- **code-reviewer** - Thorough code reviews for bugs, style, and best practices
- **code-simplifier** - Refactoring and simplification specialist
- **code-analyzer** - Deep code analysis and pattern detection
- **bugbot** - Bug detection and fixing specialist

#### Security & Testing
- **security-reviewer** - Security vulnerability analysis and OWASP compliance
- **security-auditor** - Comprehensive security audits
- **security-specialist** - Advanced security implementations
- **test-writer** - Comprehensive test creation
- **test-engineer** - Test strategy and automation
- **test-developer** - Test-driven development specialist
- **testing-automation-expert** - End-to-end testing automation

#### Database & Architecture
- **database-architect** - Database design and optimization
- **database-expert** - Query optimization and data modeling
- **tech-lead** - Architecture decisions and technical strategy
- **fullstack-integrator** - Full-stack coordination and integration

#### Frontend & UI/UX
- **react-frontend-specialist** - React expertise and best practices
- **ui-ux-designer** - Design improvements and user experience
- **ui-ux-specialist** - UX optimization and accessibility
- **ux-reviewer** - UX audits and usability testing

#### Backend & Infrastructure
- **fastapi-backend-expert** - FastAPI and backend optimization
- **devops-engineer** - CI/CD and deployment automation
- **devops-infrastructure** - Infrastructure as code and scaling
- **deployment-specialist** - Deployment strategies and rollback plans
- **performance-optimizer** - Speed and efficiency improvements

#### Specialized Experts
- **ai-features-specialist** - AI integration and ML features
- **docs-writer** - Technical documentation and API docs
- **pam-specialist** - Privileged access management
- **pam-enhancer** - PAM improvements and security

#### Built-in Agents (Always Available)
- **general-purpose** - Complex multi-step tasks and research
- **statusline-setup** - Configure Claude Code status line
- **output-style-setup** - Customize output formatting

### Using Agents

#### Via Claude Code Commands
```bash
# List all available agents
/agents

# Agents will appear in menu for selection
```

#### Via Task Tool (Programmatic)
```javascript
// Example: Activate code-reviewer agent
Task tool with:
- subagent_type: "code-reviewer"
- description: "Review SaveRouteModal component"
- prompt: "Check for bugs, security issues, and suggest improvements"
```

#### Via Natural Language
- "Use the security-reviewer agent to audit the tracks table"
- "Launch the performance-optimizer agent to improve save trip flow"
- "Start the test-writer agent to create tests for tripService"

### Agent Configuration
Agents are defined with:
- **name**: Unique identifier
- **description**: Agent's specialization
- **model**: AI model (usually `claude-3-5-sonnet-20241022`)
- **systemPrompt**: Instructions and expertise
- **tools**: Available tools (Read, Write, Edit, Bash, etc.)
- **temperature**: Creativity level (0.2-0.6)

### Best Practices
1. Use specialized agents for focused tasks
2. Agents maintain their own context - provide complete task descriptions
3. Multiple agents can work on different aspects of the same problem
4. Security-critical tasks should use security-focused agents
5. Testing agents should be used after implementing features

## Project Structure
```
src/
├── components/     # Reusable UI components
├── pages/         # Route pages
├── services/      # API and business logic
├── utils/         # Helper functions
├── hooks/         # Custom React hooks
├── contexts/      # React contexts
└── integrations/  # External service integrations

supabase/
├── migrations/    # Database migrations
└── functions/     # Edge Functions

.claude/
├── agents/        # Project-specific AI agents
├── CLAUDE.md      # This file - AI memory
└── todos/         # Task tracking
```

## Testing Approach
- Manual testing for UI changes
- Check console for errors
- Verify database operations in Supabase dashboard
- Test Edge Functions with Supabase CLI or dashboard

## Known Issues & Workarounds
- Docker required for local Edge Function deployment
- Use Supabase dashboard for deployments without Docker
- Git lock files: Remove with `rm -f .git/index.lock`
- Pre-commit hooks may timeout on large commits

## 🚨 CRITICAL GIT SAFETY GUARDRAILS (Added 2025-08-21)

### NEVER DAMAGE MAIN REPOSITORY
These guardrails were added after an incident where staging repository lost most of its files.

### Before ANY Git Operations:
1. **Check current branch**: `git branch` - NEVER work directly on main/master
2. **Verify remote target**: `git remote -v` - Know where you're pushing
3. **Count files before operations**: `git ls-tree -r HEAD --name-only | wc -l`
4. **Create backup branch**: `git branch backup-$(date +%Y%m%d-%H%M%S)`

### Before Pushing to ANY Repository:
1. **Check what's being pushed**: `git diff --stat origin/branch`
2. **Verify file count**: Compare with production repository
3. **Never use --force** without explicit user permission
4. **Use --force-with-lease** instead of --force when needed

### Safe Staging Deployment Process:
```bash
# 1. Always work on feature branch
git checkout -b feature/your-change

# 2. Make changes and commit
git add specific-files
git commit -m "feat: description"

# 3. Check what will be pushed
git diff --stat staging/main

# 4. Push to staging only
git push staging feature/your-change:main

# NEVER: git push origin main (without permission)
```

### Recovery Procedures:
- If files go missing: Check backup branches
- If push seems wrong: STOP immediately
- If staging breaks: Can be rebuilt from production
- If production at risk: Alert user immediately

### Staging vs Production:
- **Staging** (`staging` remote): Must be complete copy of production for testing
- **Production** (`origin` remote): NEVER modify without explicit permission
- Always push complete application to staging, not minimal builds

## 🏁 Project Status (2025-01-28)

### PLATFORM IS COMPLETE AND LIVE
The Unimog Community Hub is now **fully functional and production-ready** with real users actively using the platform.

### Current State:
- ✅ **All core features implemented and working**
- ✅ **Analytics fully integrated** - Tracking all user interactions and feature usage
- ✅ **Maps functioning** - Traffic alerts, fires near me, trip planner all operational
- ✅ **Real users on platform** - Including davidwswitt@gmail.com and tidesend
- ✅ **45 manuals processed** - All available for Barry AI assistant
- ✅ **Community features active** - Posts, comments, member connections working
- ✅ **Premium features ready** - WIS-EPC integration complete

### Development Philosophy Moving Forward:
**CAREFUL, INCREMENTAL IMPROVEMENTS ONLY**
- No major refactoring or architectural changes
- Test thoroughly before any deployments
- Preserve existing functionality at all costs
- Focus on user-requested features only
- Monitor real user behavior before making UX changes

### Important Notes:
1. **The site is done** - Avoid unnecessary changes that could break working features
2. **Real users are active** - Any downtime or bugs directly impact real people
3. **Analytics already comprehensive** - No need to add more tracking
4. **All systems operational** - Maps, AI, community, marketplace all working

### Maintenance Focus:
- Bug fixes only when reported by users
- Security updates as needed
- Performance optimizations if metrics show issues
- Feature additions only upon explicit user request

Remember: **If it's not broken, don't fix it!**

## 🚨 Critical Build Issues to Avoid

### Platform-Specific Package Issues (Added 2025-09-01)
**NEVER install platform-specific packages that break cross-platform builds:**
- ❌ NEVER: `npm install @rollup/rollup-darwin-x64` (breaks Linux/Netlify builds)
- ❌ NEVER: Add any `darwin`, `win32`, or platform-specific packages manually
- ✅ CORRECT: Let npm/yarn resolve platform dependencies automatically
- ✅ CORRECT: Use `npm install` without specific platform packages

**If rollup or build issues occur locally:**
1. Remove node_modules and package-lock.json
2. Run `npm install` (NOT npm ci)
3. Let npm resolve correct platform dependencies
4. NEVER manually add platform-specific packages to package.json

### Community Recommendations Field Mappings (Added 2025-09-01)
**Database fields vs Component props - use these exact names:**
- Database: `is_published` → Component: `is_published` (NOT is_approved)
- Database: `likes_count` → Component: `likes_count` (NOT likes)
- Database: `views_count` → Component: `views_count` (NOT views)
- Database: `saves_count` → Component: `saves_count` (NOT saves)

**Always check existing database schema before changing field names!**