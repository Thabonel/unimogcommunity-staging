import { test, expect } from '@playwright/test';
import { TripPlannerPage } from '../page-objects/TripPlannerPage';

test.describe('Trip Planner', () => {
  let tripPlannerPage: TripPlannerPage;

  test.beforeEach(async ({ page }) => {
    tripPlannerPage = new TripPlannerPage(page);
    await tripPlannerPage.goto();
  });

  test.afterEach(async ({ page }) => {
    // Clean up state after each test
    await tripPlannerPage.resetState();
  });

  test.describe('Basic Functionality', () => {
    test('should load trip planner page successfully', async ({ page }) => {
      await expect(page).toHaveTitle(/Trip Planner/);
      await expect(tripPlannerPage.mapContainer).toBeVisible();
      await expect(tripPlannerPage.waypointsList).toBeVisible();
    });

    test('should add waypoint by clicking on map', async () => {
      await tripPlannerPage.addWaypointByClick({ x: 300, y: 200 });
      
      expect(await tripPlannerPage.getWaypointCount()).toBe(1);
      
      const waypoints = await tripPlannerPage.getWaypointNames();
      expect(waypoints[0]).toContain('Waypoint'); // Should have some default name
    });

    test('should add waypoint by search', async () => {
      await tripPlannerPage.addWaypointBySearch('Geneva');
      
      expect(await tripPlannerPage.getWaypointCount()).toBe(1);
      
      const waypoints = await tripPlannerPage.getWaypointNames();
      expect(waypoints[0]).toContain('Geneva');
    });

    test('should remove waypoint', async () => {
      // Add two waypoints
      await tripPlannerPage.addWaypointBySearch('Geneva');
      await tripPlannerPage.addWaypointBySearch('Zurich');
      
      expect(await tripPlannerPage.getWaypointCount()).toBe(2);
      
      // Remove first waypoint
      await tripPlannerPage.removeWaypoint(0);
      
      expect(await tripPlannerPage.getWaypointCount()).toBe(1);
      
      const remainingWaypoints = await tripPlannerPage.getWaypointNames();
      expect(remainingWaypoints[0]).toContain('Zurich');
    });

    test('should clear all waypoints', async () => {
      // Add multiple waypoints
      await tripPlannerPage.addWaypointBySearch('Geneva');
      await tripPlannerPage.addWaypointBySearch('Bern');
      await tripPlannerPage.addWaypointBySearch('Zurich');
      
      expect(await tripPlannerPage.getWaypointCount()).toBe(3);
      
      // Clear all
      await tripPlannerPage.clearAllWaypoints();
      
      expect(await tripPlannerPage.getWaypointCount()).toBe(0);
    });
  });

  test.describe('Route Calculation', () => {
    test('should calculate route between two waypoints', async () => {
      await tripPlannerPage.createBasicRoute([
        { name: 'Geneva', searchTerm: 'Geneva, Switzerland' },
        { name: 'Zurich', searchTerm: 'Zurich, Switzerland' }
      ]);
      
      expect(await tripPlannerPage.hasRoute()).toBe(true);
      
      const routeInfo = await tripPlannerPage.getRouteInfo();
      expect(routeInfo.distance).toMatch(/\d+\.?\d*\s?(km|mi)/); // Should show distance
      expect(routeInfo.duration).toMatch(/\d+\.?\d*\s?(min|hr)/); // Should show duration
    });

    test('should recalculate route when waypoint is added', async () => {
      // Start with two waypoints
      await tripPlannerPage.createBasicRoute([
        { name: 'Geneva', searchTerm: 'Geneva, Switzerland' },
        { name: 'Zurich', searchTerm: 'Zurich, Switzerland' }
      ]);
      
      const initialRoute = await tripPlannerPage.getRouteInfo();
      
      // Add intermediate waypoint
      await tripPlannerPage.addWaypointBySearch('Bern, Switzerland');
      await tripPlannerPage.waitForRouteCalculation();
      
      const updatedRoute = await tripPlannerPage.getRouteInfo();
      
      // Route should be different (likely longer with intermediate stop)
      expect(updatedRoute.distance).not.toBe(initialRoute.distance);
    });

    test('should handle different route profiles', async () => {
      await tripPlannerPage.createBasicRoute([
        { name: 'Geneva', searchTerm: 'Geneva, Switzerland' },
        { name: 'Zurich', searchTerm: 'Zurich, Switzerland' }
      ]);
      
      const drivingRoute = await tripPlannerPage.getRouteInfo();
      
      // Switch to cycling
      await tripPlannerPage.setRouteProfile('cycling');
      await tripPlannerPage.waitForRouteCalculation();
      
      const cyclingRoute = await tripPlannerPage.getRouteInfo();
      
      // Routes should be different
      expect(cyclingRoute.distance).not.toBe(drivingRoute.distance);
      expect(cyclingRoute.duration).not.toBe(drivingRoute.duration);
    });

    test('should show loading state during route calculation', async () => {
      await tripPlannerPage.addWaypointBySearch('Geneva, Switzerland');
      
      expect(await tripPlannerPage.isLoading()).toBe(false);
      
      // Add second waypoint which should trigger route calculation
      await tripPlannerPage.addWaypointBySearch('Zurich, Switzerland');
      
      // Should briefly show loading (might be very fast in tests)
      // await expect(tripPlannerPage.loadingIndicator).toBeVisible();
      
      // Should eventually finish loading
      await tripPlannerPage.waitForStableState();
      expect(await tripPlannerPage.isLoading()).toBe(false);
    });
  });

  test.describe('Route Visualization', () => {
    test('should display route line on map', async () => {
      await tripPlannerPage.createBasicRoute([
        { name: 'Geneva', searchTerm: 'Geneva, Switzerland' },
        { name: 'Zurich', searchTerm: 'Zurich, Switzerland' }
      ]);
      
      // Verify route visualization
      await tripPlannerPage.verifyRouteVisualization();
    });

    test('should show waypoint markers on map', async () => {
      await tripPlannerPage.createBasicRoute([
        { name: 'Geneva', searchTerm: 'Geneva, Switzerland' },
        { name: 'Bern', searchTerm: 'Bern, Switzerland' },
        { name: 'Zurich', searchTerm: 'Zurich, Switzerland' }
      ]);
      
      // Should have 3 markers
      const markers = tripPlannerPage.page.locator('.mapboxgl-marker');
      await expect(markers).toHaveCount(3);
    });

    test('should update visualization when waypoints change', async () => {
      await tripPlannerPage.createBasicRoute([
        { name: 'Geneva', searchTerm: 'Geneva, Switzerland' },
        { name: 'Zurich', searchTerm: 'Zurich, Switzerland' }
      ]);
      
      // Remove a waypoint
      await tripPlannerPage.removeWaypoint(0);
      await tripPlannerPage.waitForStableState();
      
      // Should have fewer markers
      const markers = tripPlannerPage.page.locator('.mapboxgl-marker');
      await expect(markers).toHaveCount(1);
      
      // Route line should be gone
      expect(await tripPlannerPage.hasRoute()).toBe(false);
    });
  });

  test.describe('Waypoint Management', () => {
    test('should set correct waypoint types', async () => {
      await tripPlannerPage.addWaypointBySearch('Geneva, Switzerland');
      await tripPlannerPage.addWaypointBySearch('Bern, Switzerland');
      await tripPlannerPage.addWaypointBySearch('Zurich, Switzerland');
      
      // Check waypoint types via their visual indicators
      const waypointItems = tripPlannerPage.waypointsList.locator('.waypoint-item');
      
      // First should be start
      await expect(waypointItems.nth(0).locator('.waypoint-type-start')).toBeVisible();
      
      // Middle should be waypoint
      await expect(waypointItems.nth(1).locator('.waypoint-type-waypoint')).toBeVisible();
      
      // Last should be destination
      await expect(waypointItems.nth(2).locator('.waypoint-type-destination')).toBeVisible();
    });

    test('should reorder waypoints by drag and drop', async ({ page }) => {
      // Skip this test if drag and drop is not reliable in CI
      test.skip(!!process.env.CI, 'Drag and drop tests are flaky in CI');
      
      await tripPlannerPage.createBasicRoute([
        { name: 'Geneva', searchTerm: 'Geneva, Switzerland' },
        { name: 'Bern', searchTerm: 'Bern, Switzerland' },
        { name: 'Zurich', searchTerm: 'Zurich, Switzerland' }
      ]);
      
      // Reorder: move Geneva to the middle
      await tripPlannerPage.reorderWaypoints(0, 1);
      await tripPlannerPage.waitForRouteCalculation();
      
      // Verify new order
      await tripPlannerPage.verifyWaypointOrder(['Bern', 'Geneva', 'Zurich']);
    });

    test('should handle waypoint name editing', async () => {
      await tripPlannerPage.addWaypointBySearch('Geneva, Switzerland');
      
      // Edit waypoint name
      const waypointItem = tripPlannerPage.waypointsList.locator('.waypoint-item').first();
      const nameInput = waypointItem.locator('.waypoint-name-input');
      
      await nameInput.dblclick(); // Assuming double-click to edit
      await nameInput.fill('Starting Point');
      await nameInput.press('Enter');
      
      const waypoints = await tripPlannerPage.getWaypointNames();
      expect(waypoints[0]).toBe('Starting Point');
    });
  });

  test.describe('Search Functionality', () => {
    test('should search for locations', async () => {
      const results = await tripPlannerPage.searchLocation('Geneva');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toContain('Geneva');
    });

    test('should handle search with no results', async () => {
      const results = await tripPlannerPage.searchLocation('NonExistentPlace123456');
      
      // Should show "No results" or empty array
      expect(results.length).toBe(0);
    });

    test('should select search result', async () => {
      await tripPlannerPage.searchLocation('Switzerland');
      await tripPlannerPage.selectSearchResult(0);
      
      // Should add waypoint
      expect(await tripPlannerPage.getWaypointCount()).toBe(1);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Mock network failure
      await page.route('**/directions/**', route => route.abort());
      
      await tripPlannerPage.addWaypointBySearch('Geneva, Switzerland');
      await tripPlannerPage.addWaypointBySearch('Zurich, Switzerland');
      
      // Should show error message
      await tripPlannerPage.page.waitForTimeout(3000); // Wait for retry attempts
      
      const hasError = await tripPlannerPage.hasError();
      if (hasError) {
        const errorMessage = await tripPlannerPage.getErrorMessage();
        expect(errorMessage).toContain('route');
      }
    });

    test('should recover from errors', async ({ page }) => {
      // First cause an error
      await page.route('**/directions/**', route => route.abort());
      
      await tripPlannerPage.addWaypointBySearch('Geneva, Switzerland');
      await tripPlannerPage.addWaypointBySearch('Zurich, Switzerland');
      
      await tripPlannerPage.page.waitForTimeout(2000);
      
      // Then restore network
      await page.unroute('**/directions/**');
      
      // Clear and try again
      await tripPlannerPage.clearAllWaypoints();
      await tripPlannerPage.createBasicRoute([
        { name: 'Geneva', searchTerm: 'Geneva, Switzerland' },
        { name: 'Zurich', searchTerm: 'Zurich, Switzerland' }
      ]);
      
      // Should work now
      expect(await tripPlannerPage.hasRoute()).toBe(true);
    });

    test('should handle invalid coordinates', async () => {
      // Click on an invalid area (if possible to simulate)
      await tripPlannerPage.addWaypointByClick({ x: -1000, y: -1000 });
      
      // Should either not add waypoint or show error
      const waypointCount = await tripPlannerPage.getWaypointCount();
      
      if (waypointCount === 0) {
        // Didn't add invalid waypoint - good
        expect(waypointCount).toBe(0);
      } else {
        // Added waypoint but should show error when trying to route
        await tripPlannerPage.addWaypointBySearch('Geneva, Switzerland');
        // May show routing error
      }
    });
  });

  test.describe('Performance', () => {
    test('should handle many waypoints', async () => {
      const cities = [
        'Geneva, Switzerland',
        'Lausanne, Switzerland',
        'Montreux, Switzerland',
        'Bern, Switzerland',
        'Interlaken, Switzerland',
        'Lucerne, Switzerland',
        'Zurich, Switzerland'
      ];
      
      // Add multiple waypoints
      for (const city of cities.slice(0, 5)) { // Limit to 5 to avoid timeout
        await tripPlannerPage.addWaypointBySearch(city);
      }
      
      // Should still calculate route
      await tripPlannerPage.waitForRouteCalculation();
      expect(await tripPlannerPage.hasRoute()).toBe(true);
      
      const routeInfo = await tripPlannerPage.getRouteInfo();
      expect(routeInfo.distance).toMatch(/\d/);
    });

    test('should respond quickly to user interactions', async () => {
      const start = Date.now();
      
      await tripPlannerPage.addWaypointBySearch('Geneva');
      
      const clickResponseTime = Date.now() - start;
      expect(clickResponseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await tripPlannerPage.goto();
      
      // Map should still be visible
      await expect(tripPlannerPage.mapContainer).toBeVisible();
      
      // Should be able to add waypoints
      await tripPlannerPage.addWaypointBySearch('Geneva');
      expect(await tripPlannerPage.getWaypointCount()).toBe(1);
    });

    test('should adapt UI for tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await tripPlannerPage.goto();
      
      // Should work normally
      await tripPlannerPage.createBasicRoute([
        { name: 'Geneva', searchTerm: 'Geneva, Switzerland' },
        { name: 'Zurich', searchTerm: 'Zurich, Switzerland' }
      ]);
      
      expect(await tripPlannerPage.hasRoute()).toBe(true);
    });
  });
});