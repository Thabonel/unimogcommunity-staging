# Trip Planner Testing Guide

## Overview

This document provides comprehensive guidance for testing the Trip Planner functionality in the Unimog Community Hub. Our testing strategy ensures reliability, performance, and user experience across all platforms and browsers.

## 📋 Testing Strategy

### Test Pyramid

```
                    🔺 E2E Tests (30 tests)
                       - User workflows
                       - Cross-browser compatibility
                       - Mobile responsiveness
                     
               🔶 Integration Tests (50 tests)
                  - Service interactions
                  - API integrations
                  - Database operations
                  - Error handling
                
          🔷 Unit Tests (35 tests)
             - Individual functions
             - Component behavior  
             - Utility functions
             - Business logic
```

### Test Categories

1. **Unit Tests** - Test individual components and utilities in isolation
2. **Integration Tests** - Test service interactions and data flow
3. **E2E Tests** - Test complete user workflows across browsers
4. **Performance Tests** - Benchmark performance and monitor regressions
5. **Accessibility Tests** - Ensure WCAG compliance
6. **Security Tests** - Prevent vulnerabilities and data leaks

## 🚀 Quick Start

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Running Tests

```bash
# Run all unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:ui

# Run E2E tests
npx playwright test

# Run specific test file
npx vitest src/__tests__/unit/utils/gpxParser.test.ts

# Run tests for specific browser
npx playwright test --project=chromium
```

## 📁 Test Structure

```
src/__tests__/
├── mocks/                    # Mock implementations
│   ├── supabase.ts          # Supabase client mock
│   ├── mapbox.ts            # Mapbox API mock
│   └── openroute.ts         # OpenRouteService mock
├── unit/                    # Unit tests
│   ├── components/          # Component tests
│   ├── hooks/              # React hook tests
│   ├── services/           # Service tests
│   └── utils/              # Utility function tests
├── integration/            # Integration tests
│   └── tripPlanner.integration.test.ts
└── performance/            # Performance benchmarks
    └── tripPlannerBenchmarks.test.ts

tests/
├── e2e/                    # End-to-end tests
│   ├── trip-planner.spec.ts
│   └── save-route.spec.ts
├── page-objects/           # Page Object Model
│   └── TripPlannerPage.ts
└── global-setup.ts         # Test environment setup
```

## 🧪 Writing Tests

### Unit Tests

Unit tests focus on individual components and functions. Use the comprehensive mock frameworks provided.

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { mockSupabase } from '@/../../__tests__/mocks/supabase';

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.__resetMocks();
  });

  it('should handle user interaction correctly', async () => {
    render(<MyComponent />);
    
    const button = screen.getByRole('button');
    await fireEvent.click(button);
    
    expect(mockSupabase.from).toHaveBeenCalledWith('tracks');
  });
});
```

### Integration Tests

Integration tests verify service interactions and data flow.

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWaypointManager } from '@/hooks/use-waypoint-manager';

describe('Trip Planning Workflow', () => {
  it('should complete end-to-end planning and saving', async () => {
    const { result } = renderHook(() => useWaypointManager());
    
    // Add waypoints
    await waitFor(() => {
      result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
    });
    
    // Verify route calculation
    await waitFor(() => {
      expect(result.current.route).not.toBeNull();
    });
  });
});
```

### E2E Tests

E2E tests use the Page Object Model for maintainable browser automation.

```typescript
import { test, expect } from '@playwright/test';
import { TripPlannerPage } from '../page-objects/TripPlannerPage';

test('should plan and save route', async ({ page }) => {
  const tripPlanner = new TripPlannerPage(page);
  await tripPlanner.goto();
  
  await tripPlanner.createBasicRoute([
    { name: 'Geneva', searchTerm: 'Geneva, Switzerland' },
    { name: 'Zurich', searchTerm: 'Zurich, Switzerland' }
  ]);
  
  await tripPlanner.saveRoute({
    name: 'Alpine Route',
    description: 'Beautiful Swiss route'
  });
  
  await tripPlanner.waitForToast('success');
});
```

## 🔍 Mock Frameworks

### Supabase Mock

The Supabase mock provides realistic database interactions:

```typescript
import { mockSupabase } from '@/../../__tests__/mocks/supabase';

// Set custom data
mockSupabase.__setMockData('tracks', customTrackData);

// Verify calls
expect(mockSupabase.from).toHaveBeenCalledWith('tracks');

// Reset state
mockSupabase.__resetMocks();
```

### Mapbox Mock

The Mapbox mock simulates map interactions and routing:

```typescript
import { setupMapboxMocks, mapboxTestUtils } from '@/../../__tests__/mocks/mapbox';

setupMapboxMocks();

// Simulate map events
mapboxTestUtils.simulateMapLoad();
mapboxTestUtils.simulateMapClick({ lng: 6.1432, lat: 46.2044 });

// Verify map operations
expect(mockMapboxMap.addSource).toHaveBeenCalled();
```

## 📊 Performance Testing

### Benchmarks

Performance tests ensure the application remains fast and responsive:

```typescript
import { PerformanceBenchmark } from '@/../../__tests__/performance/tripPlannerBenchmarks.test.ts';

const benchmark = new PerformanceBenchmark();

await benchmark.measure('GPX Parse', () => {
  return parseGPX(largeLpxString);
});

// Verify performance baseline
const avgTime = benchmark.getAverageTime('GPX Parse');
expect(avgTime).toBeLessThan(100); // Should complete in <100ms
```

### Performance Baselines

| Operation | Baseline | Current |
|-----------|----------|---------|
| GPX Parse (100 points) | <50ms | ✅ 25ms |
| Distance Calculation (1000 pairs) | <20ms | ✅ 12ms |
| Route Save | <50ms | ✅ 35ms |
| Map Render | <2s | ✅ 1.2s |

## 🎯 Test Coverage

### Coverage Goals

- **Unit Tests**: >90% line coverage
- **Integration Tests**: >80% feature coverage  
- **E2E Tests**: 100% critical user paths

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/index.html
```

## 🌍 Cross-Browser Testing

### Supported Browsers

- **Chrome** (latest 2 versions)
- **Firefox** (latest 2 versions)
- **Safari** (latest 2 versions)
- **Edge** (latest 2 versions)

### Mobile Testing

- **Mobile Chrome** (Android)
- **Mobile Safari** (iOS)

### Running Cross-Browser Tests

```bash
# Test all browsers
npx playwright test

# Test specific browser
npx playwright test --project=firefox

# Test mobile
npx playwright test --project="Mobile Chrome"
```

## 🔧 CI/CD Integration

### GitHub Actions

Tests run automatically on:

- **Push to main/staging** - Full test suite
- **Pull requests** - Critical tests only
- **Nightly** - Cross-platform tests
- **Manual trigger** - Custom test selection

### Workflow Files

- `.github/workflows/test-trip-planner.yml` - Main test workflow
- `.github/workflows/cross-platform-tests.yml` - Platform compatibility

### Test Results

- Test results uploaded as artifacts
- Coverage reports sent to Codecov
- Performance metrics tracked over time
- Notifications on failures

## 🐛 Debugging Tests

### Common Issues

1. **Flaky E2E Tests**
   ```bash
   # Run with debugging
   npx playwright test --debug
   
   # Record test execution
   npx playwright test --trace on
   ```

2. **Mock Not Working**
   ```typescript
   // Check mock setup
   expect(vi.isMockFunction(mockFunction)).toBe(true);
   
   // Verify mock calls
   expect(mockFunction).toHaveBeenCalledWith(expectedArgs);
   ```

3. **Async Test Issues**
   ```typescript
   // Always await async operations
   await waitFor(() => {
     expect(element).toBeInTheDocument();
   });
   ```

### Debug Tools

- **Vitest UI**: `npm run test:ui` - Interactive test runner
- **Playwright Inspector**: `npx playwright test --debug`
- **VS Code Extension**: Playwright Test for VS Code

## 📈 Performance Monitoring

### Metrics Tracked

- Test execution time
- Memory usage
- Bundle size impact
- API response times
- Rendering performance

### Performance Reports

Generated automatically and stored for 30 days:

- Benchmark comparisons
- Regression detection
- Platform differences
- Trend analysis

## 🔒 Security Testing

### Security Checks

1. **Dependency Audit**
   ```bash
   npm audit --audit-level=high
   ```

2. **Secret Detection**
   ```bash
   # Check for hardcoded keys
   grep -r "sk-" src/ --include="*.ts"
   ```

3. **Input Validation**
   - SQL injection prevention
   - XSS protection
   - CSRF tokens

## ♿ Accessibility Testing

### WCAG Compliance

Tests ensure compliance with WCAG 2.1 AA standards:

- Keyboard navigation
- Screen reader compatibility
- Color contrast ratios
- Focus management

### Running A11y Tests

```bash
# Accessibility test suite
npx playwright test tests/accessibility.spec.ts

# Manual testing with axe
npx axe-cli http://localhost:5173/trips
```

## 📚 Best Practices

### Test Writing

1. **Follow AAA Pattern**
   - **Arrange** - Set up test data
   - **Act** - Execute the functionality
   - **Assert** - Verify results

2. **Use Descriptive Names**
   ```typescript
   // Good
   it('should calculate route distance when two waypoints are added')
   
   // Bad  
   it('should work with waypoints')
   ```

3. **Test Behavior, Not Implementation**
   ```typescript
   // Good - tests behavior
   expect(screen.getByText('Route saved')).toBeInTheDocument();
   
   // Bad - tests implementation
   expect(saveFunctionMock).toHaveBeenCalled();
   ```

### Performance

1. **Parallel Execution** - Tests run concurrently where possible
2. **Smart Retries** - Flaky tests retry with exponential backoff
3. **Resource Cleanup** - Proper teardown prevents memory leaks

### Maintenance

1. **Regular Updates** - Keep test dependencies current
2. **Baseline Reviews** - Update performance baselines quarterly
3. **Coverage Monitoring** - Maintain >90% coverage for critical paths

## 🆘 Troubleshooting

### Test Failures

1. **Check CI Status** - View GitHub Actions results
2. **Local Reproduction** - Run failing tests locally
3. **Mock Issues** - Verify mock setup and data
4. **Environment** - Check environment variables

### Getting Help

1. **Documentation** - Check this guide and inline comments
2. **Test Examples** - Reference existing test files
3. **Team Support** - Ask in development channels

## 📞 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

---

*Last updated: January 2025*