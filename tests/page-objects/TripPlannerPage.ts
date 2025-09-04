import { Page, Locator, expect } from '@playwright/test';

export class TripPlannerPage {
  readonly page: Page;
  readonly mapContainer: Locator;
  readonly waypointsList: Locator;
  readonly addWaypointButton: Locator;
  readonly clearRouteButton: Locator;
  readonly saveRouteButton: Locator;
  readonly routeProfileSelector: Locator;
  readonly routeInfoPanel: Locator;
  readonly searchInput: Locator;
  readonly searchResults: Locator;
  readonly loadingIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Map elements
    this.mapContainer = page.locator('[data-testid="trip-planner-map"]');
    
    // Waypoint management
    this.waypointsList = page.locator('[data-testid="waypoints-list"]');
    this.addWaypointButton = page.locator('[data-testid="add-waypoint-button"]');
    this.clearRouteButton = page.locator('[data-testid="clear-route-button"]');
    this.saveRouteButton = page.locator('[data-testid="save-route-button"]');
    
    // Route configuration
    this.routeProfileSelector = page.locator('[data-testid="route-profile-selector"]');
    this.routeInfoPanel = page.locator('[data-testid="route-info-panel"]');
    
    // Search functionality
    this.searchInput = page.locator('[data-testid="location-search-input"]');
    this.searchResults = page.locator('[data-testid="search-results"]');
    
    // UI state indicators
    this.loadingIndicator = page.locator('[data-testid="loading-indicator"]');
  }

  async goto() {
    await this.page.goto('/trips');
    await this.waitForMapToLoad();
  }

  async waitForMapToLoad() {
    // Wait for the map container to be visible
    await this.mapContainer.waitFor({ state: 'visible' });
    
    // Wait for map to actually load (check for canvas element)
    await this.page.locator('.mapboxgl-canvas').waitFor({ state: 'visible' });
    
    // Wait a bit more for tiles to load
    await this.page.waitForTimeout(1000);
  }

  async clickOnMap(coordinates: { x: number; y: number }) {
    await this.mapContainer.click({ position: coordinates });
  }

  async clickOnMapAtCoordinates(lng: number, lat: number) {
    // Convert lng/lat to pixel coordinates on the map
    // This is a simplified conversion - in reality, you'd need proper projection
    const mapBounds = await this.mapContainer.boundingBox();
    if (!mapBounds) throw new Error('Map not visible');
    
    const x = mapBounds.x + mapBounds.width * 0.5; // Center for now
    const y = mapBounds.y + mapBounds.height * 0.5;
    
    await this.mapContainer.click({ position: { x: x - mapBounds.x, y: y - mapBounds.y } });
  }

  async addWaypointBySearch(searchTerm: string) {
    await this.searchInput.fill(searchTerm);
    await this.searchInput.press('Enter');
    
    // Wait for search results
    await this.searchResults.waitFor({ state: 'visible' });
    
    // Click first result
    await this.searchResults.locator('.search-result').first().click();
    
    // Wait for waypoint to be added
    await this.waitForWaypointToBeAdded();
  }

  async addWaypointByClick(coordinates?: { x: number; y: number }) {
    const clickPosition = coordinates || { x: 300, y: 200 }; // Default position
    await this.clickOnMap(clickPosition);
    await this.waitForWaypointToBeAdded();
  }

  async waitForWaypointToBeAdded() {
    // Wait for the waypoint to appear in the list
    await expect(this.waypointsList.locator('.waypoint-item')).toHaveCount(1, { timeout: 5000 });
  }

  async getWaypointCount(): Promise<number> {
    const waypoints = this.waypointsList.locator('.waypoint-item');
    return await waypoints.count();
  }

  async getWaypointNames(): Promise<string[]> {
    const waypoints = this.waypointsList.locator('.waypoint-item .waypoint-name');
    return await waypoints.allTextContents();
  }

  async removeWaypoint(index: number) {
    const waypoint = this.waypointsList.locator('.waypoint-item').nth(index);
    await waypoint.locator('.remove-waypoint-button').click();
  }

  async reorderWaypoints(fromIndex: number, toIndex: number) {
    const fromWaypoint = this.waypointsList.locator('.waypoint-item').nth(fromIndex);
    const toWaypoint = this.waypointsList.locator('.waypoint-item').nth(toIndex);
    
    // Drag and drop
    await fromWaypoint.dragTo(toWaypoint);
  }

  async clearAllWaypoints() {
    await this.clearRouteButton.click();
    
    // Wait for waypoints to be cleared
    await expect(this.waypointsList.locator('.waypoint-item')).toHaveCount(0, { timeout: 3000 });
  }

  async setRouteProfile(profile: 'driving' | 'cycling' | 'walking') {
    await this.routeProfileSelector.click();
    await this.page.locator(`[data-value="${profile}"]`).click();
  }

  async waitForRouteCalculation() {
    // Wait for loading to start
    await this.loadingIndicator.waitFor({ state: 'visible', timeout: 1000 }).catch(() => {});
    
    // Wait for loading to finish
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    
    // Wait for route info to appear
    await this.routeInfoPanel.waitFor({ state: 'visible', timeout: 5000 });
  }

  async getRouteInfo(): Promise<{ distance: string; duration: string }> {
    await this.routeInfoPanel.waitFor({ state: 'visible' });
    
    const distance = await this.routeInfoPanel.locator('[data-testid="route-distance"]').textContent() || '';
    const duration = await this.routeInfoPanel.locator('[data-testid="route-duration"]').textContent() || '';
    
    return { distance, duration };
  }

  async hasRoute(): Promise<boolean> {
    try {
      await this.routeInfoPanel.waitFor({ state: 'visible', timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  async openSaveRouteModal() {
    await this.saveRouteButton.click();
    
    // Wait for modal to appear
    await this.page.locator('[data-testid="save-route-modal"]').waitFor({ state: 'visible' });
  }

  async saveRoute(routeData: {
    name: string;
    description?: string;
    difficulty?: 'easy' | 'moderate' | 'hard' | 'expert';
    isPublic?: boolean;
    notes?: string;
  }) {
    await this.openSaveRouteModal();
    
    const modal = this.page.locator('[data-testid="save-route-modal"]');
    
    // Fill form
    await modal.locator('input[name="name"]').fill(routeData.name);
    
    if (routeData.description) {
      await modal.locator('textarea[name="description"]').fill(routeData.description);
    }
    
    if (routeData.difficulty) {
      await modal.locator('[data-testid="difficulty-select"]').click();
      await this.page.locator(`[data-value="${routeData.difficulty}"]`).click();
    }
    
    if (routeData.isPublic) {
      await modal.locator('[data-testid="public-switch"]').check();
    }
    
    if (routeData.notes) {
      await modal.locator('textarea[name="notes"]').fill(routeData.notes);
    }
    
    // Submit
    await modal.locator('button[type="submit"]').click();
    
    // Wait for success message or modal to close
    await this.page.waitForSelector('[data-testid="save-route-modal"]', { state: 'hidden', timeout: 10000 });
  }

  async searchLocation(searchTerm: string): Promise<string[]> {
    await this.searchInput.fill(searchTerm);
    
    // Wait for search results
    await this.searchResults.waitFor({ state: 'visible' });
    
    // Get result texts
    const results = this.searchResults.locator('.search-result .result-name');
    return await results.allTextContents();
  }

  async selectSearchResult(index: number) {
    const result = this.searchResults.locator('.search-result').nth(index);
    await result.click();
  }

  async hasError(): Promise<boolean> {
    try {
      await this.page.locator('[data-testid="error-message"]').waitFor({ state: 'visible', timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  async getErrorMessage(): Promise<string> {
    const errorElement = this.page.locator('[data-testid="error-message"]');
    return await errorElement.textContent() || '';
  }

  async dismissError() {
    const dismissButton = this.page.locator('[data-testid="dismiss-error-button"]');
    if (await dismissButton.isVisible()) {
      await dismissButton.click();
    }
  }

  // Helper methods for complex interactions

  async createBasicRoute(waypoints: Array<{ name: string; searchTerm: string }>) {
    for (const waypoint of waypoints) {
      await this.addWaypointBySearch(waypoint.searchTerm);
    }
    
    if (waypoints.length >= 2) {
      await this.waitForRouteCalculation();
    }
  }

  async createRouteByClicking(clickPositions: Array<{ x: number; y: number }>) {
    for (const position of clickPositions) {
      await this.addWaypointByClick(position);
    }
    
    if (clickPositions.length >= 2) {
      await this.waitForRouteCalculation();
    }
  }

  async verifyRouteVisualization() {
    // Check if route line is visible on map
    const routeLine = this.page.locator('.mapboxgl-canvas');
    await expect(routeLine).toBeVisible();
    
    // Check if waypoint markers are visible
    const markers = this.page.locator('.mapboxgl-marker');
    await expect(markers).toHaveCountGreaterThan(0);
  }

  async verifyWaypointOrder(expectedNames: string[]) {
    const actualNames = await this.getWaypointNames();
    expect(actualNames).toEqual(expectedNames);
  }

  async waitForToast(type: 'success' | 'error' = 'success') {
    const toastSelector = `[data-testid="${type}-toast"]`;
    await this.page.locator(toastSelector).waitFor({ state: 'visible', timeout: 5000 });
  }

  async getToastMessage(type: 'success' | 'error' = 'success'): Promise<string> {
    const toastSelector = `[data-testid="${type}-toast"]`;
    const toast = this.page.locator(toastSelector);
    return await toast.textContent() || '';
  }

  // Utility methods for test setup/teardown

  async resetState() {
    // Clear any existing waypoints and routes
    if (await this.getWaypointCount() > 0) {
      await this.clearAllWaypoints();
    }
    
    // Dismiss any error messages
    await this.dismissError();
    
    // Reset map view to default
    await this.mapContainer.click(); // Focus map
    await this.page.keyboard.press('Escape'); // Clear any selections
  }

  async isLoading(): Promise<boolean> {
    try {
      await this.loadingIndicator.waitFor({ state: 'visible', timeout: 100 });
      return true;
    } catch {
      return false;
    }
  }

  async waitForStableState(timeout = 5000) {
    // Wait for no loading indicators
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout }).catch(() => {});
    
    // Wait a bit more for any animations to settle
    await this.page.waitForTimeout(500);
  }
}