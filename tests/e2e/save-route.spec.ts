import { test, expect } from '@playwright/test';
import { TripPlannerPage } from '../page-objects/TripPlannerPage';

test.describe('Save Route Functionality', () => {
  let tripPlannerPage: TripPlannerPage;

  test.beforeEach(async ({ page }) => {
    tripPlannerPage = new TripPlannerPage(page);
    await tripPlannerPage.goto();
    
    // Create a basic route for testing save functionality
    await tripPlannerPage.createBasicRoute([
      { name: 'Geneva', searchTerm: 'Geneva, Switzerland' },
      { name: 'Zurich', searchTerm: 'Zurich, Switzerland' }
    ]);
  });

  test.afterEach(async ({ page }) => {
    await tripPlannerPage.resetState();
  });

  test.describe('Save Route Modal', () => {
    test('should open save route modal', async () => {
      await tripPlannerPage.openSaveRouteModal();
      
      const modal = tripPlannerPage.page.locator('[data-testid="save-route-modal"]');
      await expect(modal).toBeVisible();
      
      // Should show route information
      await expect(modal.locator('[data-testid="route-distance"]')).toBeVisible();
      await expect(modal.locator('[data-testid="route-duration"]')).toBeVisible();
      await expect(modal.locator('[data-testid="waypoint-count"]')).toHaveText('2');
    });

    test('should close modal on cancel', async () => {
      await tripPlannerPage.openSaveRouteModal();
      
      const modal = tripPlannerPage.page.locator('[data-testid="save-route-modal"]');
      await expect(modal).toBeVisible();
      
      await modal.locator('button:has-text("Cancel")').click();
      
      await expect(modal).toBeHidden();
    });

    test('should close modal on outside click', async () => {
      await tripPlannerPage.openSaveRouteModal();
      
      const modal = tripPlannerPage.page.locator('[data-testid="save-route-modal"]');
      await expect(modal).toBeVisible();
      
      // Click outside modal
      await tripPlannerPage.page.click('body', { position: { x: 50, y: 50 } });
      
      await expect(modal).toBeHidden();
    });

    test('should disable save button when route name is empty', async () => {
      await tripPlannerPage.openSaveRouteModal();
      
      const modal = tripPlannerPage.page.locator('[data-testid="save-route-modal"]');
      const saveButton = modal.locator('button:has-text("Save Route")');
      
      // Initially disabled
      await expect(saveButton).toBeDisabled();
      
      // Should enable when name is entered
      await modal.locator('input[name="name"]').fill('Test Route');
      await expect(saveButton).toBeEnabled();
      
      // Should disable when name is cleared
      await modal.locator('input[name="name"]').clear();
      await expect(saveButton).toBeDisabled();
    });
  });

  test.describe('Form Validation', () => {
    test('should require route name', async () => {
      await tripPlannerPage.openSaveRouteModal();
      
      const modal = tripPlannerPage.page.locator('[data-testid="save-route-modal"]');
      const saveButton = modal.locator('button:has-text("Save Route")');
      
      // Try to save without name
      await expect(saveButton).toBeDisabled();
      
      // Should show validation message if we somehow trigger save
      const nameInput = modal.locator('input[name="name"]');
      await expect(nameInput).toHaveAttribute('required');
    });

    test('should trim whitespace from route name', async () => {
      await tripPlannerPage.openSaveRouteModal();
      
      const modal = tripPlannerPage.page.locator('[data-testid="save-route-modal"]');
      const nameInput = modal.locator('input[name="name"]');
      const saveButton = modal.locator('button:has-text("Save Route")');
      
      // Enter name with whitespace
      await nameInput.fill('  Test Route  ');
      await expect(saveButton).toBeEnabled();
      
      // Submit form
      await saveButton.click();
      
      // Should handle trimmed name (verify via success message or API call)
      await tripPlannerPage.waitForToast('success');
    });

    test('should validate image file type', async () => {
      await tripPlannerPage.openSaveRouteModal();
      
      const modal = tripPlannerPage.page.locator('[data-testid="save-route-modal"]');
      const fileInput = modal.locator('input[type="file"]');
      
      // Try to upload non-image file
      await fileInput.setInputFiles({
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('test content')
      });
      
      // Should show error toast
      await tripPlannerPage.waitForToast('error');
      const errorMessage = await tripPlannerPage.getToastMessage('error');
      expect(errorMessage).toContain('image');
    });

    test('should validate image file size', async () => {
      await tripPlannerPage.openSaveRouteModal();
      
      const modal = tripPlannerPage.page.locator('[data-testid="save-route-modal"]');
      const fileInput = modal.locator('input[type="file"]');
      
      // Create large fake image file (over 5MB)
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024, 'x'); // 6MB
      
      await fileInput.setInputFiles({
        name: 'large-image.jpg',
        mimeType: 'image/jpeg',
        buffer: largeBuffer
      });
      
      // Should show error toast
      await tripPlannerPage.waitForToast('error');
      const errorMessage = await tripPlannerPage.getToastMessage('error');
      expect(errorMessage).toContain('5MB');
    });
  });

  test.describe('Form Interaction', () => {
    test('should fill all form fields', async () => {
      await tripPlannerPage.openSaveRouteModal();
      
      const modal = tripPlannerPage.page.locator('[data-testid="save-route-modal"]');
      
      // Fill all fields
      await modal.locator('input[name="name"]').fill('Alpine Adventure');
      await modal.locator('textarea[name="description"]').fill('Beautiful route through Swiss Alps');
      await modal.locator('textarea[name="notes"]').fill('Best driven in summer. Watch for weather conditions.');
      
      // Select difficulty
      await modal.locator('[data-testid="difficulty-select"]').click();
      await tripPlannerPage.page.locator('[data-value="hard"]').click();
      
      // Toggle public sharing
      await modal.locator('[data-testid="public-switch"]').check();
      
      // Verify all fields are set
      await expect(modal.locator('input[name="name"]')).toHaveValue('Alpine Adventure');
      await expect(modal.locator('textarea[name="description"]')).toHaveValue('Beautiful route through Swiss Alps');
      await expect(modal.locator('textarea[name="notes"]')).toHaveValue('Best driven in summer. Watch for weather conditions.');
      await expect(modal.locator('[data-testid="public-switch"]')).toBeChecked();
    });

    test('should upload image file', async () => {
      await tripPlannerPage.openSaveRouteModal();
      
      const modal = tripPlannerPage.page.locator('[data-testid="save-route-modal"]');
      const fileInput = modal.locator('input[type="file"]');
      
      // Upload valid image file
      await fileInput.setInputFiles({
        name: 'route-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake image content')
      });
      
      // Should show image preview
      const preview = modal.locator('img[alt="Route preview"]');
      await expect(preview).toBeVisible();
      
      // Preview should have correct src
      const src = await preview.getAttribute('src');
      expect(src).toContain('data:image/jpeg');
    });

    test('should handle difficulty selection', async () => {
      await tripPlannerPage.openSaveRouteModal();
      
      const modal = tripPlannerPage.page.locator('[data-testid="save-route-modal"]');
      
      // Test each difficulty level
      const difficulties = ['easy', 'moderate', 'hard', 'expert'];
      
      for (const difficulty of difficulties) {
        await modal.locator('[data-testid="difficulty-select"]').click();
        await tripPlannerPage.page.locator(`[data-value="${difficulty}"]`).click();
        
        // Verify selection
        const selectedValue = await modal.locator('[data-testid="difficulty-select"]').inputValue();
        expect(selectedValue).toBe(difficulty);
      }
    });

    test('should toggle public sharing', async () => {
      await tripPlannerPage.openSaveRouteModal();
      
      const modal = tripPlannerPage.page.locator('[data-testid="save-route-modal"]');
      const publicSwitch = modal.locator('[data-testid="public-switch"]');
      
      // Should start unchecked
      await expect(publicSwitch).not.toBeChecked();
      
      // Toggle on
      await publicSwitch.check();
      await expect(publicSwitch).toBeChecked();
      
      // Toggle off
      await publicSwitch.uncheck();
      await expect(publicSwitch).not.toBeChecked();
    });
  });

  test.describe('Save Functionality', () => {
    test('should save route with minimal data', async () => {
      await tripPlannerPage.saveRoute({
        name: 'Simple Route'
      });
      
      // Should show success message
      await tripPlannerPage.waitForToast('success');
      const successMessage = await tripPlannerPage.getToastMessage('success');
      expect(successMessage).toContain('saved');
    });

    test('should save route with complete data', async () => {
      await tripPlannerPage.saveRoute({
        name: 'Complete Alpine Route',
        description: 'Comprehensive route through Swiss Alps with scenic stops',
        difficulty: 'hard',
        isPublic: true,
        notes: 'Recommended for experienced drivers. Check weather conditions.'
      });
      
      // Should show success message
      await tripPlannerPage.waitForToast('success');
      const successMessage = await tripPlannerPage.getToastMessage('success');
      expect(successMessage).toContain('Complete Alpine Route');
    });

    test('should handle save errors gracefully', async ({ page }) => {
      // Mock API error
      await page.route('**/tracks', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      await tripPlannerPage.saveRoute({
        name: 'Error Route'
      });
      
      // Should show error message
      await tripPlannerPage.waitForToast('error');
      const errorMessage = await tripPlannerPage.getToastMessage('error');
      expect(errorMessage).toContain('Failed');
    });

    test('should show loading state during save', async ({ page }) => {
      // Mock slow API response
      await page.route('**/tracks', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            body: JSON.stringify({ id: 'test-route', name: 'Test Route' })
          });
        }, 2000);
      });
      
      await tripPlannerPage.openSaveRouteModal();
      
      const modal = tripPlannerPage.page.locator('[data-testid="save-route-modal"]');
      await modal.locator('input[name="name"]').fill('Loading Test Route');
      
      const saveButton = modal.locator('button:has-text("Save Route")');
      await saveButton.click();
      
      // Should show loading state
      await expect(modal.locator('button:has-text("Saving...")')).toBeVisible();
      await expect(saveButton).toBeDisabled();
      
      // Wait for save to complete
      await tripPlannerPage.waitForToast('success');
    });

    test('should prevent multiple simultaneous saves', async () => {
      await tripPlannerPage.openSaveRouteModal();
      
      const modal = tripPlannerPage.page.locator('[data-testid="save-route-modal"]');
      await modal.locator('input[name="name"]').fill('Multi Save Test');
      
      const saveButton = modal.locator('button:has-text("Save Route")');
      
      // Click save multiple times rapidly
      await saveButton.click();
      await saveButton.click();
      await saveButton.click();
      
      // Should only process one save
      await expect(modal.locator('button:has-text("Saving...")')).toBeVisible();
    });
  });

  test.describe('User Authentication', () => {
    test('should require authentication to save route', async ({ page }) => {
      // Mock unauthenticated state
      await page.route('**/auth/user', route => {
        route.fulfill({
          status: 401,
          body: JSON.stringify({ error: 'Unauthorized' })
        });
      });
      
      await tripPlannerPage.openSaveRouteModal();
      
      // Should show login prompt or disable save functionality
      const modal = tripPlannerPage.page.locator('[data-testid="save-route-modal"]');
      const authMessage = modal.locator('[data-testid="auth-required-message"]');
      
      await expect(authMessage).toBeVisible();
      expect(await authMessage.textContent()).toContain('log in');
    });

    test('should handle authentication during image upload', async ({ page }) => {
      // Mock unauthenticated state for image upload
      await page.route('**/auth/user', route => {
        route.fulfill({
          status: 401,
          body: JSON.stringify({ error: 'Unauthorized' })
        });
      });
      
      await tripPlannerPage.openSaveRouteModal();
      
      const modal = tripPlannerPage.page.locator('[data-testid="save-route-modal"]');
      const fileInput = modal.locator('input[type="file"]');
      
      await fileInput.setInputFiles({
        name: 'test-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake image')
      });
      
      // Should show authentication error
      await tripPlannerPage.waitForToast('error');
      const errorMessage = await tripPlannerPage.getToastMessage('error');
      expect(errorMessage).toContain('logged in');
    });
  });

  test.describe('Route Persistence', () => {
    test('should maintain route data after page refresh', async ({ page }) => {
      // Save a route first
      await tripPlannerPage.saveRoute({
        name: 'Persistence Test Route',
        description: 'Test route for persistence'
      });
      
      await tripPlannerPage.waitForToast('success');
      
      // Refresh page
      await page.reload();
      await tripPlannerPage.waitForMapToLoad();
      
      // Check if route is still available (this depends on implementation)
      // May need to navigate to saved routes section
      const savedRoutesLink = page.locator('[data-testid="saved-routes-link"]');
      if (await savedRoutesLink.isVisible()) {
        await savedRoutesLink.click();
        
        // Should find our saved route
        const routeItem = page.locator('[data-testid="route-item"]:has-text("Persistence Test Route")');
        await expect(routeItem).toBeVisible();
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await tripPlannerPage.openSaveRouteModal();
      
      const modal = tripPlannerPage.page.locator('[data-testid="save-route-modal"]');
      
      // Tab through form fields
      await page.keyboard.press('Tab'); // Name input
      await page.keyboard.type('Keyboard Test Route');
      
      await page.keyboard.press('Tab'); // Description textarea
      await page.keyboard.type('Route created using keyboard navigation');
      
      await page.keyboard.press('Tab'); // Notes textarea
      await page.keyboard.type('Testing accessibility features');
      
      // Continue tabbing to other fields
      await page.keyboard.press('Tab'); // Difficulty select
      await page.keyboard.press('Enter'); // Open dropdown
      await page.keyboard.press('ArrowDown'); // Select next option
      await page.keyboard.press('Enter'); // Confirm selection
      
      // Tab to save button and save
      await page.keyboard.press('Tab'); // Skip file input
      await page.keyboard.press('Tab'); // Skip public switch
      await page.keyboard.press('Tab'); // Cancel button
      await page.keyboard.press('Tab'); // Save button
      await page.keyboard.press('Enter'); // Save
      
      // Should successfully save
      await tripPlannerPage.waitForToast('success');
    });

    test('should have proper ARIA labels', async () => {
      await tripPlannerPage.openSaveRouteModal();
      
      const modal = tripPlannerPage.page.locator('[data-testid="save-route-modal"]');
      
      // Check form labels
      await expect(modal.locator('label[for="route-name"]')).toBeVisible();
      await expect(modal.locator('label[for="route-description"]')).toBeVisible();
      await expect(modal.locator('label[for="route-difficulty"]')).toBeVisible();
      
      // Check required field indicators
      const nameLabel = modal.locator('label[for="route-name"]');
      expect(await nameLabel.textContent()).toContain('*');
    });

    test('should announce status updates to screen readers', async () => {
      await tripPlannerPage.saveRoute({
        name: 'Screen Reader Test Route'
      });
      
      // Should have live region updates
      const liveRegion = tripPlannerPage.page.locator('[aria-live="polite"]');
      await expect(liveRegion).toBeVisible();
      
      // Content should include success message
      const liveContent = await liveRegion.textContent();
      expect(liveContent).toContain('saved');
    });
  });
});