import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SaveRouteModal, SaveRouteData } from '@/components/trips/SaveRouteModal';
import { mockSupabase } from '@/../../__tests__/mocks/supabase';
import { Waypoint } from '@/types/waypoint';
import { DirectionsRoute } from '@/services/mapboxDirections';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

// Mock supabase client
vi.mock('@/lib/supabase-client', () => ({
  supabase: mockSupabase
}));

describe('SaveRouteModal', () => {
  const mockWaypoints: Waypoint[] = [
    {
      id: '1',
      name: 'Start Point',
      coords: [6.6323, 46.5197],
      type: 'start'
    },
    {
      id: '2',
      name: 'End Point',
      coords: [6.6423, 46.5287],
      type: 'destination'
    }
  ];

  const mockRoute: DirectionsRoute = {
    distance: 2543.7,
    duration: 420.5,
    geometry: {
      coordinates: [
        [6.6323, 46.5197],
        [6.6423, 46.5287]
      ],
      type: 'LineString'
    }
  };

  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    waypoints: mockWaypoints,
    route: mockRoute,
    routeProfile: 'driving' as const,
    onSave: mockOnSave
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.__resetMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when open', () => {
      render(<SaveRouteModal {...defaultProps} />);
      
      expect(screen.getByText('Save Route')).toBeInTheDocument();
      expect(screen.getByLabelText(/route name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/difficulty/i)).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      render(<SaveRouteModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Save Route')).not.toBeInTheDocument();
    });

    it('should display route information', () => {
      render(<SaveRouteModal {...defaultProps} />);
      
      expect(screen.getByText('2.5 km')).toBeInTheDocument(); // Distance
      expect(screen.getByText('7.0 min')).toBeInTheDocument(); // Duration
      expect(screen.getByText('2')).toBeInTheDocument(); // Waypoints count
      expect(screen.getByText('driving')).toBeInTheDocument(); // Route profile
    });

    it('should handle route without geometry', () => {
      const routeWithoutGeometry = { ...mockRoute, geometry: null };
      render(<SaveRouteModal {...defaultProps} route={routeWithoutGeometry} />);
      
      expect(screen.getByText('Save Route')).toBeInTheDocument();
    });

    it('should handle null route', () => {
      render(<SaveRouteModal {...defaultProps} route={null} />);
      
      expect(screen.getByText('Save Route')).toBeInTheDocument();
      expect(screen.queryByText(/distance/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('should allow entering route name', async () => {
      const user = userEvent.setup();
      render(<SaveRouteModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/route name/i);
      await user.type(nameInput, 'My Test Route');
      
      expect(nameInput).toHaveValue('My Test Route');
    });

    it('should allow entering description', async () => {
      const user = userEvent.setup();
      render(<SaveRouteModal {...defaultProps} />);
      
      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, 'A beautiful mountain route');
      
      expect(descriptionInput).toHaveValue('A beautiful mountain route');
    });

    it('should allow entering notes', async () => {
      const user = userEvent.setup();
      render(<SaveRouteModal {...defaultProps} />);
      
      const notesInput = screen.getByLabelText(/notes/i);
      await user.type(notesInput, 'Watch out for steep sections');
      
      expect(notesInput).toHaveValue('Watch out for steep sections');
    });

    it('should allow changing difficulty level', async () => {
      const user = userEvent.setup();
      render(<SaveRouteModal {...defaultProps} />);
      
      const difficultySelect = screen.getByRole('combobox');
      await user.click(difficultySelect);
      
      const hardOption = screen.getByText('Hard');
      await user.click(hardOption);
      
      expect(screen.getByDisplayValue('hard')).toBeInTheDocument();
    });

    it('should allow toggling public sharing', async () => {
      const user = userEvent.setup();
      render(<SaveRouteModal {...defaultProps} />);
      
      const publicSwitch = screen.getByRole('switch');
      expect(publicSwitch).not.toBeChecked();
      
      await user.click(publicSwitch);
      expect(publicSwitch).toBeChecked();
    });
  });

  describe('Image Upload', () => {
    beforeEach(() => {
      // Mock FileReader
      global.FileReader = vi.fn().mockImplementation(() => ({
        readAsDataURL: vi.fn(),
        onloadend: null,
        result: 'data:image/jpeg;base64,mockbase64data'
      }));
    });

    it('should handle image file selection', async () => {
      const user = userEvent.setup();
      render(<SaveRouteModal {...defaultProps} />);
      
      const imageInput = screen.getByLabelText(/route photo/i);
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await user.upload(imageInput, file);
      
      expect(imageInput.files[0]).toBe(file);
    });

    it('should reject non-image files', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');
      
      render(<SaveRouteModal {...defaultProps} />);
      
      const imageInput = screen.getByLabelText(/route photo/i);
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      await user.upload(imageInput, file);
      
      expect(toast.error).toHaveBeenCalledWith('Please select an image file');
    });

    it('should reject files over 5MB', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');
      
      render(<SaveRouteModal {...defaultProps} />);
      
      const imageInput = screen.getByLabelText(/route photo/i);
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { 
        type: 'image/jpeg' 
      });
      
      await user.upload(imageInput, largeFile);
      
      expect(toast.error).toHaveBeenCalledWith('Image size should be less than 5MB');
    });

    it('should show image preview after upload', async () => {
      const user = userEvent.setup();
      render(<SaveRouteModal {...defaultProps} />);
      
      const imageInput = screen.getByLabelText(/route photo/i);
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock FileReader to immediately call onloadend
      const mockFileReader = {
        readAsDataURL: vi.fn().mockImplementation(function(this: any) {
          setTimeout(() => {
            this.result = 'data:image/jpeg;base64,mockbase64data';
            if (this.onloadend) this.onloadend();
          }, 0);
        }),
        onloadend: null,
        result: null
      };
      global.FileReader = vi.fn().mockImplementation(() => mockFileReader);
      
      await user.upload(imageInput, file);
      
      await waitFor(() => {
        const preview = screen.getByAltText('Route preview');
        expect(preview).toBeInTheDocument();
        expect(preview).toHaveAttribute('src', 'data:image/jpeg;base64,mockbase64data');
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onSave with form data when submitted', async () => {
      const user = userEvent.setup();
      render(<SaveRouteModal {...defaultProps} />);
      
      // Fill form
      await user.type(screen.getByLabelText(/route name/i), 'Test Route');
      await user.type(screen.getByLabelText(/description/i), 'Test description');
      await user.type(screen.getByLabelText(/notes/i), 'Test notes');
      
      // Submit form
      const saveButton = screen.getByRole('button', { name: /save route/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          name: 'Test Route',
          description: 'Test description',
          difficulty: 'moderate',
          isPublic: false,
          imageUrl: undefined,
          notes: 'Test notes'
        });
      });
    });

    it('should prevent submission without route name', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');
      
      render(<SaveRouteModal {...defaultProps} />);
      
      const saveButton = screen.getByRole('button', { name: /save route/i });
      await user.click(saveButton);
      
      expect(toast.error).toHaveBeenCalledWith('Please enter a route name');
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should trim whitespace from inputs', async () => {
      const user = userEvent.setup();
      render(<SaveRouteModal {...defaultProps} />);
      
      await user.type(screen.getByLabelText(/route name/i), '  Test Route  ');
      await user.type(screen.getByLabelText(/description/i), '  Test description  ');
      
      const saveButton = screen.getByRole('button', { name: /save route/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Route',
            description: 'Test description'
          })
        );
      });
    });

    it('should disable save button during submission', async () => {
      const user = userEvent.setup();
      mockOnSave.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<SaveRouteModal {...defaultProps} />);
      
      await user.type(screen.getByLabelText(/route name/i), 'Test Route');
      
      const saveButton = screen.getByRole('button', { name: /save route/i });
      await user.click(saveButton);
      
      expect(saveButton).toBeDisabled();
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should handle save errors gracefully', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');
      const saveError = new Error('Save failed');
      mockOnSave.mockRejectedValue(saveError);
      
      render(<SaveRouteModal {...defaultProps} />);
      
      await user.type(screen.getByLabelText(/route name/i), 'Test Route');
      
      const saveButton = screen.getByRole('button', { name: /save route/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to save route: Save failed');
      });
    });
  });

  describe('Modal Behavior', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<SaveRouteModal {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should reset form on close', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<SaveRouteModal {...defaultProps} />);
      
      // Fill form
      await user.type(screen.getByLabelText(/route name/i), 'Test Route');
      
      // Close modal
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      // Reopen modal
      rerender(<SaveRouteModal {...defaultProps} isOpen={true} />);
      
      expect(screen.getByLabelText(/route name/i)).toHaveValue('');
    });

    it('should prevent closing while saving', async () => {
      const user = userEvent.setup();
      mockOnSave.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<SaveRouteModal {...defaultProps} />);
      
      await user.type(screen.getByLabelText(/route name/i), 'Test Route');
      
      const saveButton = screen.getByRole('button', { name: /save route/i });
      await user.click(saveButton);
      
      // Try to cancel while saving
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });

    it('should close modal after successful save', async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);
      
      render(<SaveRouteModal {...defaultProps} />);
      
      await user.type(screen.getByLabelText(/route name/i), 'Test Route');
      
      const saveButton = screen.getByRole('button', { name: /save route/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Image Upload to Supabase', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      });
      
      mockSupabase.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'user-photos/test-file.jpg' },
          error: null
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/test-file.jpg' }
        })
      });
    });

    it('should upload image to Supabase during save', async () => {
      const user = userEvent.setup();
      render(<SaveRouteModal {...defaultProps} />);
      
      // Upload image
      const imageInput = screen.getByLabelText(/route photo/i);
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(imageInput, file);
      
      // Fill form and save
      await user.type(screen.getByLabelText(/route name/i), 'Test Route');
      
      const saveButton = screen.getByRole('button', { name: /save route/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            imageUrl: 'https://storage.example.com/test-file.jpg'
          })
        );
      });
    });

    it('should handle image upload failure gracefully', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');
      
      mockSupabase.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Upload failed' }
        })
      });
      
      render(<SaveRouteModal {...defaultProps} />);
      
      // Upload image
      const imageInput = screen.getByLabelText(/route photo/i);
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(imageInput, file);
      
      // Fill form and save
      await user.type(screen.getByLabelText(/route name/i), 'Test Route');
      
      const saveButton = screen.getByRole('button', { name: /save route/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            imageUrl: undefined // Should proceed without image
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<SaveRouteModal {...defaultProps} />);
      
      expect(screen.getByLabelText(/route name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/difficulty/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/route photo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/share with community/i)).toBeInTheDocument();
    });

    it('should mark required fields', () => {
      render(<SaveRouteModal {...defaultProps} />);
      
      const nameLabel = screen.getByText(/route name \*/i);
      expect(nameLabel).toBeInTheDocument();
    });

    it('should have proper button roles', () => {
      render(<SaveRouteModal {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save route/i })).toBeInTheDocument();
    });
  });
});