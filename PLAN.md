# Task Planning Template

**Task Name**: [Brief, descriptive name]  
**Date**: [YYYY-MM-DD]  
**Estimated Effort**: [Small/Medium/Large]  
**Priority**: [Low/Medium/High/Critical]

## 🎯 Goals & Objectives
*What are we trying to achieve?*

### Primary Goal
- [ ] [Main objective with measurable outcome]

### Secondary Goals  
- [ ] [Additional objectives if applicable]

### Success Criteria
- [ ] [How do we know we've succeeded?]
- [ ] [Specific metrics or outcomes]

## 📋 Context & Background
*What led to this task?*

### Problem Statement
[Describe the problem or opportunity]

### Current State
[What exists now?]

### Desired End State  
[What should exist after completion?]

### Assumptions
- [Any assumptions being made]
- [Dependencies on other systems/features]

## 🔍 Analysis & Research

### Context Files to Review
- [ ] `/cloud.md` - Project overview
- [ ] `/src/cloud.md` - Frontend patterns  
- [ ] `/supabase/cloud.md` - Backend patterns
- [ ] [Other relevant context files]

### Existing Code to Analyze
- [ ] [File/component/service to understand]
- [ ] [Related functionality to review]
- [ ] [Similar implementations for reference]

### External Dependencies
- [ ] [APIs, libraries, or services involved]
- [ ] [Documentation to review]

## 📐 Architecture & Design

### Architectural Approach
[High-level approach - which patterns from cloud.md apply?]

### Key Design Decisions
1. **[Decision 1]**: [Rationale]
2. **[Decision 2]**: [Rationale]  
3. **[Decision 3]**: [Rationale]

### Security Considerations
- [ ] [Authentication/authorization requirements]
- [ ] [Input validation needs]
- [ ] [Data privacy considerations]  
- [ ] [RLS policy requirements]

### Performance Considerations
- [ ] [Load/performance requirements]
- [ ] [Caching strategy]
- [ ] [Database optimization needs]

## 🏗️ Implementation Plan

### Phase 1: Foundation
**Estimated Effort**: [Time estimate]
- [ ] **Task 1.1**: [Description] 
  - *Test*: [5-10 word test description]
  - *Files*: [Files to modify/create]
- [ ] **Task 1.2**: [Description]
  - *Test*: [5-10 word test description]  
  - *Files*: [Files to modify/create]

### Phase 2: Core Implementation  
**Estimated Effort**: [Time estimate]
- [ ] **Task 2.1**: [Description]
  - *Test*: [5-10 word test description]
  - *Files*: [Files to modify/create]
- [ ] **Task 2.2**: [Description]
  - *Test*: [5-10 word test description]
  - *Files*: [Files to modify/create]

### Phase 3: Integration & Polish
**Estimated Effort**: [Time estimate]
- [ ] **Task 3.1**: [Description]
  - *Test*: [5-10 word test description]
  - *Files*: [Files to modify/create]
- [ ] **Task 3.2**: [Description]
  - *Test*: [5-10 word test description]
  - *Files*: [Files to modify/create]

## 🧪 Testing Strategy

### Unit Tests
- [ ] [Component/function to test]
- [ ] [Test scenarios to cover]

### Integration Tests  
- [ ] [Feature flows to test]
- [ ] [API integration points]

### End-to-End Tests
- [ ] [Critical user journeys]
- [ ] [Cross-browser/device testing]

### Manual Testing
- [ ] [UI/UX validation]
- [ ] [Edge case scenarios]

## 🚀 Deployment Plan

### Prerequisites
- [ ] [Environment setup requirements]
- [ ] [Database migrations needed]
- [ ] [Configuration changes]

### Deployment Steps
1. **Staging Deployment**
   - [ ] Deploy to staging
   - [ ] Run smoke tests
   - [ ] User acceptance testing

2. **Production Deployment**
   - [ ] Deploy to production  
   - [ ] Monitor for issues
   - [ ] Rollback plan ready

### Rollback Plan
- [ ] [How to revert if needed]
- [ ] [Data recovery procedures]

## 🎯 Risk Assessment

### High Risk Items
- **Risk**: [Description]
  - *Impact*: [High/Medium/Low]
  - *Probability*: [High/Medium/Low]
  - *Mitigation*: [How to address]

### Medium Risk Items  
- **Risk**: [Description]
  - *Impact*: [High/Medium/Low]
  - *Probability*: [High/Medium/Low]
  - *Mitigation*: [How to address]

## 📚 Learning & Knowledge Gaps

### What I Need to Learn
- [ ] [Technical concepts to research]
- [ ] [Tools/libraries to understand]
- [ ] [Domain knowledge to acquire]

### Resources
- [ ] [Documentation links]
- [ ] [Tutorial/guide references]
- [ ] [Team members to consult]

## 📝 Documentation Updates

### Code Documentation
- [ ] [Inline code comments needed]
- [ ] [README updates required]
- [ ] [API documentation changes]

### Project Documentation
- [ ] [cloud.md file updates]
- [ ] [Architecture diagrams]
- [ ] [User guides/tutorials]

## ✅ Acceptance Criteria

### Functional Requirements
- [ ] [Feature works as specified]
- [ ] [Edge cases handled properly]
- [ ] [Error states display correctly]

### Non-Functional Requirements
- [ ] [Performance meets standards]
- [ ] [Security requirements met]
- [ ] [Accessibility standards followed]
- [ ] [Mobile responsiveness verified]

### Code Quality
- [ ] [Follows project patterns from cloud.md]
- [ ] [TypeScript types are proper]
- [ ] [Tests provide good coverage]
- [ ] [Linting passes]
- [ ] [No console errors]

## 🔄 Review & Iteration

### Peer Review Checklist
- [ ] [Code review completed]
- [ ] [Security review passed]
- [ ] [Performance review done]
- [ ] [UX review approved]

### Post-Implementation Review
- [ ] [What went well?]
- [ ] [What could be improved?]
- [ ] [Lessons learned]
- [ ] [Pattern updates needed for cloud.md?]

---

## 📋 Quick Reference

### Related Files
- [List key files that will be modified]

### Key Commands
```bash
# Development
npm run dev
npm run build
npm run test
npm run lint

# Database
supabase migration new [name]
supabase db push
supabase db reset

# Git
git checkout -b feature/[branch-name]
git add .
git commit -m "[type]: [description]"
git push staging main:main
```

### Claude Code Integration
- **Context Built**: [ ] Yes / [ ] No
- **Double Escape Used**: [ ] Yes / [ ] No
- **Parallel Development**: [ ] Yes / [ ] No

---

*This plan serves as a living document. Update as implementation progresses and new insights emerge.*

**Plan Status**: [ ] Draft / [ ] Approved / [ ] In Progress / [ ] Complete
**Last Updated**: [Date]