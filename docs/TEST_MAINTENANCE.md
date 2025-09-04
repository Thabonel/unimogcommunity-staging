# Test Maintenance Guide

## Overview

This guide provides instructions for maintaining, updating, and troubleshooting the Trip Planner test suite to ensure long-term reliability and effectiveness.

## 🔄 Regular Maintenance Tasks

### Weekly Tasks

1. **Review Test Results**
   - Check CI/CD pipeline status
   - Analyze failure trends
   - Update flaky test list

2. **Performance Baseline Review**
   - Monitor performance degradation
   - Update baselines if necessary
   - Investigate performance regressions

3. **Dependency Updates**
   ```bash
   # Check for test dependency updates
   npm outdated @testing-library/react
   npm outdated @playwright/test
   npm outdated vitest
   
   # Update with caution
   npm update --dev
   ```

### Monthly Tasks

1. **Coverage Analysis**
   - Review coverage reports
   - Identify untested code paths
   - Add missing test cases

2. **Test Suite Cleanup**
   - Remove obsolete tests
   - Refactor duplicated test logic
   - Update test documentation

3. **Mock Data Updates**
   - Refresh mock data to match production
   - Add new API response scenarios
   - Update error cases

### Quarterly Tasks

1. **Performance Baseline Updates**
   - Re-evaluate performance expectations
   - Update baseline values in tests
   - Document performance improvements

2. **Browser Compatibility Review**
   - Test on latest browser versions
   - Update browser test matrix
   - Remove deprecated browser support

3. **Security Test Updates**
   - Update vulnerability checks
   - Review secret detection patterns
   - Test new security measures

## 📊 Monitoring & Metrics

### Key Metrics to Track

```typescript
// Performance metrics tracked in benchmarks
export const performanceBaselines = {
  'GPX Parse (100 points)': 50,      // ms
  'Distance Calculations': 20,        // ms
  'Route Save Operation': 50,         // ms
  'Map Render': 2000,                // ms
  'Memory Usage': 50 * 1024 * 1024   // bytes
};

// Coverage targets
export const coverageTargets = {
  statements: 90,
  branches: 85,
  functions: 90,
  lines: 90
};
```

### Monitoring Dashboard

Create a simple monitoring script:

```bash
#!/bin/bash
# scripts/test-health-check.sh

echo "🔍 Test Health Check Report"
echo "=========================="

# Test execution time
echo "⏱️ Recent test execution times:"
npm test -- --reporter=json | jq '.testResults[].perfStats.runtime' | sort -n | tail -5

# Coverage status  
echo "📊 Current coverage:"
npm run test:coverage -- --reporter=text-summary

# Flaky test detection
echo "🔄 Potentially flaky tests (failed in last 10 runs):"
# Custom logic to detect flaky tests

# Performance regression check
echo "⚡ Performance status:"
npm run test:performance 2>&1 | grep "baseline" | grep "EXCEEDED" || echo "✅ All within baselines"

echo "📈 Full report: $(date)"
```

## 🛠️ Troubleshooting Guide

### Common Issues and Solutions

#### 1. Flaky E2E Tests

**Symptoms:**
- Tests pass locally but fail in CI
- Intermittent failures with timing issues

**Solutions:**
```typescript
// Add proper waits
await page.waitForSelector('[data-testid="route-info"]', { 
  state: 'visible',
  timeout: 10000 
});

// Use retry logic for flaky operations
await expect(async () => {
  const element = page.locator('[data-testid="route-distance"]');
  await expect(element).toHaveText(/\d+\.?\d*\s?km/);
}).toPass({ timeout: 15000 });

// Add debug information
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === 'failed') {
    await page.screenshot({ 
      path: `screenshots/failed-${testInfo.title}.png` 
    });
  }
});
```

#### 2. Mock-Related Failures

**Symptoms:**
- Tests fail with "Cannot read property of undefined"
- Mocks not resetting between tests

**Solutions:**
```typescript
// Ensure proper mock cleanup
beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase.__resetMocks();
  mapboxTestUtils.resetMocks();
});

// Verify mock setup
beforeEach(() => {
  expect(vi.isMockFunction(mockSupabase.from)).toBe(true);
});

// Debug mock calls
console.log('Mock calls:', mockSupabase.from.mock.calls);
```

#### 3. Performance Test Failures

**Symptoms:**
- Performance tests failing due to environment differences
- Baseline violations in CI

**Solutions:**
```typescript
// Use relative performance comparisons
const baseline = process.env.CI ? 150 : 100; // Higher baseline for CI
expect(executionTime).toBeLessThan(baseline);

// Account for system load
const tolerance = 1.5; // 50% tolerance
expect(avgTime).toBeLessThan(baseline * tolerance);

// Use multiple iterations for stability
for (let i = 0; i < 5; i++) {
  times.push(await measureTime(operation));
}
const avgTime = times.reduce((a, b) => a + b) / times.length;
```

#### 4. Memory Leak Detection

**Symptoms:**
- Tests using increasing memory
- Performance degradation over test runs

**Solutions:**
```typescript
// Force garbage collection in tests
if (global.gc) {
  global.gc();
}

// Monitor memory usage
const memoryBefore = process.memoryUsage();
// ... run tests
const memoryAfter = process.memoryUsage();
const leaked = memoryAfter.heapUsed - memoryBefore.heapUsed;

expect(leaked).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
```

## 🔄 Updating Test Infrastructure

### Updating Vitest

```bash
# Check current version
npm list vitest

# Update to latest version
npm install --save-dev vitest@latest

# Update config if needed
# Check breaking changes in release notes
```

### Updating Playwright

```bash
# Update Playwright
npm install --save-dev @playwright/test@latest

# Update browsers
npx playwright install

# Update config for new features
# Check migration guide
```

### Updating Mock Frameworks

When APIs change, update mocks accordingly:

```typescript
// Update Supabase mock for new methods
export const mockSupabase = {
  // Existing methods...
  
  // New methods added in latest version
  rpc: vi.fn().mockImplementation(() => ({
    // New RPC mock implementation
  }))
};
```

## 📋 Test Review Checklist

### Code Review Checklist

When reviewing test-related PRs:

- [ ] Tests cover new functionality
- [ ] Tests follow naming conventions
- [ ] Mocks are properly configured
- [ ] No hardcoded values (use constants/config)
- [ ] Error cases are tested
- [ ] Performance impact considered
- [ ] Documentation updated if needed

### PR Template for Test Changes

```markdown
## Test Changes

### Type of Changes
- [ ] New tests added
- [ ] Existing tests modified  
- [ ] Test infrastructure changes
- [ ] Performance baseline updates

### Test Coverage
- [ ] Unit tests: XX% coverage
- [ ] Integration tests cover new features
- [ ] E2E tests cover user workflows

### Performance Impact
- [ ] No performance regression
- [ ] Baselines updated if needed
- [ ] Memory usage within limits

### Cross-Browser Testing
- [ ] Tested on Chrome
- [ ] Tested on Firefox  
- [ ] Tested on Safari
- [ ] Mobile testing completed

### Checklist
- [ ] All tests pass locally
- [ ] CI tests pass
- [ ] No flaky tests introduced
- [ ] Documentation updated
```

## 🚨 Emergency Procedures

### Test Suite Completely Broken

1. **Immediate Action**
   ```bash
   # Revert to last known good state
   git revert HEAD~1
   
   # Or restore from backup
   git checkout HEAD~1 -- src/__tests__/
   ```

2. **Diagnosis**
   ```bash
   # Run minimal test
   npm test -- --run src/__tests__/unit/utils/geoUtils.test.ts
   
   # Check environment
   node -e "console.log(process.env)"
   ```

3. **Recovery**
   ```bash
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   
   # Reinstall browsers
   npx playwright install
   ```

### CI/CD Pipeline Failure

1. **Check Status**
   - Review GitHub Actions logs
   - Check for infrastructure issues
   - Verify environment variables

2. **Bypass if Critical**
   ```yaml
   # Temporarily skip failing job
   if: false  # Add to job in workflow
   ```

3. **Fix and Re-enable**
   - Address root cause
   - Remove bypass
   - Monitor for stability

## 📈 Performance Optimization

### Test Execution Speed

1. **Parallel Execution**
   ```typescript
   // vitest.config.ts
   export default defineConfig({
     test: {
       maxConcurrency: 4,      // Adjust based on CI resources
       minWorkers: 1,
       maxWorkers: 4
     }
   });
   ```

2. **Selective Testing**
   ```bash
   # Run only changed tests
   npx vitest related src/components/MyComponent.tsx
   
   # Run specific test pattern
   npx vitest run --testNamePattern="trip planner"
   ```

3. **Mock Optimization**
   ```typescript
   // Heavy mocks only when needed
   const heavyMock = vi.fn().mockImplementation(async () => {
     if (process.env.NODE_ENV === 'test') {
       return mockData;
     }
     return realImplementation();
   });
   ```

### Resource Management

1. **Memory Cleanup**
   ```typescript
   afterEach(() => {
     // Clear large objects
     largeTestData = null;
     
     // Force garbage collection
     if (global.gc) {
       global.gc();
     }
   });
   ```

2. **File System Cleanup**
   ```typescript
   afterAll(async () => {
     // Clean up temp files
     await fs.rm('temp-test-files', { recursive: true, force: true });
   });
   ```

## 📚 Best Practices Summary

### Test Organization
- Group related tests in describe blocks
- Use consistent naming conventions
- Keep test files close to source code
- Separate unit/integration/e2e concerns

### Mock Management
- Use centralized mock factories
- Keep mocks simple and focused
- Update mocks when APIs change
- Verify mock behavior periodically

### Performance Testing
- Set realistic baselines
- Account for environment differences
- Use statistical analysis for stability
- Monitor trends over time

### Maintenance
- Automate routine tasks
- Document changes and decisions
- Review and cleanup regularly
- Monitor key metrics

---

*For questions or issues with test maintenance, consult the team lead or create an issue in the repository.*