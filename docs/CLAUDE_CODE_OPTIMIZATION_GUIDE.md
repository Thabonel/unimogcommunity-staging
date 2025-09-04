# Claude Code Optimization Guide
*Transform Claude Code into a Persistent Engineering Partner*

## 🔧 Core Principles

1. **Claude Code is an AI agent**, not just a chatbot. Use it for **multi-step, long-running tasks**.
2. **Context is everything** — invest time in building rich context before execution.
3. **Don't skip the planning phase** — jumping straight to "execute" leads to poor results.
4. **Use Opus for complex tasks**, Sonnet for faster/cheaper ones (`/model opus` or `/model sonnet`).

---

## 📁 Context Engineering System

### Master Context Files

#### ✅ Root `cloud.md`
Located at project root, contains:
```markdown
# Project Overview
- Frontend: React 18 + TypeScript + Vite
- Backend: Supabase (PostgreSQL) + Edge Functions
- Key Libraries: React Query, shadcn/ui, Mapbox GL
- Architectural Style: SPA with serverless backend
- UI Style Guide: Unimog military theme
- Commit Standards: Conventional commits with Claude co-author

# Instructions for Claude
- Always check this file first.
- Use subfolder `cloud.md` files for detailed context.
- Prefer new, clean code over patching legacy.
- Never assume — ask if unsure.
```

#### ✅ Per-Subfolder Context
In each major folder (`/src`, `/supabase`, `/docs`):
```markdown
# Frontend Context (src/cloud.md)
- Structure: Component-based React with custom hooks
- State: React Context + React Query
- Styling: Tailwind CSS + shadcn/ui
- Security: Input validation, auth checks, error boundaries
- Patterns: Functional components, TypeScript strict mode
```

### Context Building Workflow

#### 🔍 **Phase 1: Explore & Build Context**
> *Never skip this foundation step.*

**Prompt:**
```
Prepare to discuss how our [frontend/backend/API] works. Read all relevant files including cloud.md files. Summarize the architecture, key patterns, and potential pitfalls. Do not write code yet.
```

**What to expect:**
- 50K+ tokens of detailed analysis
- Architecture understanding
- Pattern identification
- Risk assessment

**Validation:**
- If summary is wrong: **`/clear`** and restart
- If summary is accurate: **`/double escape`** to save context state

---

## 🔄 Advanced Context Management

### Double Escape & Resume (Context Forking)
Revolutionary workflow for parallel development:

1. **Build Strong Context**: Complete exploration phase
2. **Save State**: Type **`/double escape`**
   - This creates a "checkpoint" of your current context
3. **Fork Context**: Open new terminal tab, type **`/resume`**
   - You now have identical context in multiple sessions
4. **Parallel Work**: Use different tabs for different tasks

**Use Cases:**
- Frontend dev in one tab, backend in another
- Feature development while running tests
- Multiple approaches to same problem
- Code review while implementing

### Context Persistence Strategy
```
Session 1 (Main): Architecture exploration + planning
├── /double escape → Save state
├── Session 2: Frontend implementation  
├── Session 3: Backend development
└── Session 4: Testing & validation
```

---

## 📝 Structured Planning System

### Planning Phase Protocol
> *Force high-level thinking — avoid immediate code dumps.*

**Planning Prompt:**
```
Think hard. Create a plan to [complete task]. 
- Break into testable, PR-sized chunks (200–500 lines max)
- For each step:
  - Write 1–3 sentences on what the function does
  - List 5–10 word test descriptions
- Think architecturally — avoid over-engineering
```

**Simplification Trigger:**
```
This plan is too enterprise. Simplify by 50%. 
Focus on working, minimal solution.
```

### Plan Validation (Critical Technique)
**"My Developer" Critique Pattern:**
```
My developer came up with this plan. Review it critically. 
- What are the risks?
- Where might it break?
- How would you improve it?
- Be honest — I'm on your team, not theirs.
```

> This bypasses Claude's tendency to praise its own work and provides honest feedback.

---

## 🚀 Execution Workflows

### High-Context Execution
Reuse your context-rich session:
```
Work on PR #1: [Description]. Think hard. Write elegant, simple code that passes tests.
- Do not prioritize backward compatibility
- No graceful fallbacks — fail fast, fail loudly
- Run linting and tests
- Use existing patterns from cloud.md files
```

### Test-Driven Development
```
Do TDD: Write failing test first, then code to pass.
Follow our testing patterns from src/cloud.md.
```

### Code Quality Enforcement
```
After writing the code:
1. Run `eslint` and fix errors
2. Run tests — if failing, debug
3. Check TypeScript compilation
4. Verify against cloud.md guidelines
5. Confirm it works before submitting
```

---

## 🛠️ Essential Commands Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/model opus` | Most powerful model | Complex architecture, debugging |
| `/model sonnet` | Default, faster | Standard development tasks |
| `/double escape` | Save context state | Before parallel development |
| `/resume` | Restore saved context | Start new tab with same context |
| `/clear` | Fresh start | When context is corrupted/wrong |
| `/plan` | Enter planning mode | Use custom prompts instead |

---

## 🤖 GitHub Integration & Automation

### GitHub Bot Setup
```bash
# Set up Claude as GitHub bot
claude code github setup

# This creates a bot that listens to issues/PRs
```

### Auto-Generate PRs from Issues
Create GitHub issue:
```
@claude 
Add dark mode toggle to settings page.
- Use React context pattern from src/cloud.md
- Persist preference in localStorage
- Follow existing color variables from Tailwind config
```

**Claude will automatically:**
- Create pull request
- Implement code following your patterns
- Add proper checklist
- Tag you for review

### Batch Processing
```bash
claude code "Generate PRs for all items in FEATURES.md. 
Follow patterns from cloud.md files. 
Tag @claude at end of each PR."
```

---

## 🧠 Advanced Techniques

### Agent Swarms (Simulated)
Use context forking for parallel approaches:

1. **Main Session**: Build context with `/double escape`
2. **Session A**: Conservative approach  
3. **Session B**: Innovative approach
4. **Session C**: Performance-focused approach
5. **Comparison**: New session to evaluate all three

**Evaluation Prompt:**
```
Here are 3 implementations of [feature]. Which is best? 
Score on: simplicity, correctness, maintainability.
Consider our cloud.md architectural principles.
```

### Automated Validation Pipeline
```
After implementation:
1. Run `npm run lint` and fix errors
2. Run `npm run test` — debug failures
3. Check `npm run build` — resolve build issues
4. Verify against security guidelines in cloud.md
5. Test user flows manually
6. Create PR with proper documentation
```

### Context-Aware Code Generation
```
Generate [component/function] following:
- Patterns from src/cloud.md
- Security guidelines from supabase/cloud.md  
- UI standards from our shadcn/ui setup
- TypeScript strict mode requirements
- Error handling patterns we use
```

---

## 📊 Quality Assurance System

### Pre-Implementation Checklist
- [ ] Read relevant `cloud.md` files
- [ ] Understand existing patterns
- [ ] Plan architecture approach
- [ ] Consider security implications
- [ ] Define test strategy

### Post-Implementation Validation
- [ ] Code follows established patterns
- [ ] All tests pass
- [ ] Linting passes
- [ ] TypeScript compilation succeeds
- [ ] Security guidelines met
- [ ] Documentation updated

### Code Review Integration
```
Review this code against our standards:
- Check against cloud.md guidelines
- Verify security patterns
- Assess architectural fit
- Suggest improvements
- Rate: Architecture, Security, Maintainability
```

---

## 🎯 Workflow Templates

### Feature Development Template
```
1. EXPLORE → Build context (cloud.md + codebase analysis)
2. PLAN → Break into PR-sized chunks, get critique
3. SAVE → /double escape to preserve context
4. EXECUTE → Implement following established patterns
5. VALIDATE → Test, lint, security check
6. DOCUMENT → Update relevant cloud.md files
```

### Bug Fix Template
```
1. UNDERSTAND → Analyze issue + context
2. REPRODUCE → Create failing test
3. DIAGNOSE → Use cloud.md patterns for root cause
4. FIX → Minimal, targeted solution  
5. VERIFY → Confirm fix + no regressions
6. DOCUMENT → Update if architectural insight gained
```

### Refactoring Template
```
1. ANALYZE → Current code vs cloud.md patterns
2. PLAN → Incremental refactoring steps
3. SAVE → /double escape for experimentation
4. REFACTOR → Small, testable changes
5. VALIDATE → Extensive testing
6. UPDATE → Refresh cloud.md if patterns change
```

---

## 🧩 Non-Coding Applications

### Documentation Management
```
Organize our documentation structure:
- Follow cloud.md hierarchy
- Create clear cross-references
- Maintain consistency with our style guide
- Generate missing documentation
```

### Codebase Analysis
```
Analyze our codebase for:
- Adherence to cloud.md patterns
- Security vulnerabilities  
- Performance bottlenecks
- Technical debt areas
- Refactoring opportunities
```

### Knowledge Management
```
Create searchable index of our:
- Architecture decisions
- Design patterns
- Security practices
- Performance optimizations
- Common solutions
```

---

## ✅ Golden Workflow Summary

### Foundation Phase
1. **CONTEXT** → Build comprehensive understanding with `cloud.md` files
2. **EXPLORE** → Deep analysis of relevant systems and patterns  
3. **SAVE** → `/double escape` to preserve context state

### Development Phase  
4. **PLAN** → Structured breakdown with critical review
5. **EXECUTE** → Implementation following established patterns
6. **VALIDATE** → Testing, linting, security verification

### Optimization Phase
7. **FORK** → `/resume` for parallel development approaches
8. **COMPARE** → Evaluate multiple solutions objectively
9. **INTEGRATE** → Merge best approaches with documentation updates

### Automation Phase
10. **AUTOMATE** → GitHub integration for hands-off workflows
11. **MONITOR** → Track code quality and pattern adherence
12. **EVOLVE** → Update `cloud.md` files as architecture evolves

---

## 🎪 Project-Specific Customizations

### UnimogCommunityHub Patterns

#### Component Development
```
Create [component] following our patterns:
- Use shadcn/ui components as foundation
- Implement proper TypeScript types
- Add error boundaries for resilience
- Follow Unimog color scheme (military green, camo brown)
- Include loading and error states
- Add proper accessibility attributes
```

#### Database Operations  
```
Implement [database feature] using:
- Supabase client patterns from supabase/cloud.md
- RLS policies for security
- Proper error handling
- TypeScript types for data models
- Migration-first approach for schema changes
```

#### Security Implementation
```
Add [security feature] ensuring:
- Input validation on client and server
- Proper authentication checks
- RLS policy compliance
- SECURITY DEFINER function patterns
- Audit logging for sensitive operations
```

---

## 🚦 Success Metrics

### Context Quality Indicators
- ✅ Claude understands architecture without re-explanation
- ✅ Generated code follows existing patterns
- ✅ Minimal revision cycles needed
- ✅ Security and performance considerations automatic

### Development Efficiency Gains
- ✅ 50%+ faster feature development
- ✅ Consistent code quality across team
- ✅ Reduced code review cycles
- ✅ Fewer production bugs

### Knowledge Management Benefits
- ✅ Self-documenting development process
- ✅ Easy onboarding for new team members
- ✅ Consistent architectural decisions
- ✅ Institutional knowledge preservation

---

*This guide transforms Claude Code from a code generator into a persistent, intelligent engineering partner that understands your project's unique patterns, security requirements, and architectural decisions.*

**Next Steps:**
1. Set up `cloud.md` files (✅ Complete)
2. Practice `/double escape` and `/resume` workflows
3. Implement GitHub integration
4. Establish team adoption process
5. Measure and iterate on effectiveness