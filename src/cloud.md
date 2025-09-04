# Frontend - React Application Context

## Structure Overview
```
src/
├── components/        # Reusable UI components
├── pages/            # Route pages  
├── services/         # Business logic & API clients
├── hooks/            # Custom React hooks
├── contexts/         # React contexts for state
├── utils/            # Helper functions
├── lib/              # Core libraries & configurations
├── styles/           # Global styles and themes
└── integrations/     # External service integrations
```

## Component Architecture

### UI Components (`components/ui/`)
- **Source**: shadcn/ui component library
- **Customization**: Tailwind CSS variants
- **Pattern**: Compound components for complex UI
- **Naming**: PascalCase, descriptive names

### Feature Components
- **auth/**: Authentication forms and flows
- **knowledge/**: PDF viewers, Barry AI interface  
- **marketplace/**: Parts trading, vehicle listings
- **trips/**: Trip planning, GPX handling, waypoints
- **vehicle/**: Vehicle management and profiles
- **community/**: Social posts, comments, connections

### Component Guidelines
- **Functional only**: No class components
- **TypeScript**: Proper prop types, no `any`
- **Hooks**: Use custom hooks for complex logic
- **Error boundaries**: Wrap risky components
- **Loading states**: Always show loading/error states

## State Management

### React Context Pattern
```typescript
// Pattern: Context + Custom Hook
const MyContext = createContext<MyContextType | undefined>(undefined);

export const useMyContext = () => {
  const context = useContext(MyContext);
  if (!context) throw new Error('useMyContext must be used within MyProvider');
  return context;
};
```

### Key Contexts
- **AuthContext**: User authentication state
- **SupabaseContext**: Database client and operations
- **ThemeContext**: Dark/light theme switching
- **ToastContext**: Global notifications

### React Query Usage
- **Server state**: Use React Query for API calls
- **Caching**: Implement proper cache invalidation
- **Background updates**: Enable background refetching
- **Error handling**: Consistent error boundaries

## Custom Hooks Pattern

### Naming Convention
- **Prefix**: Always start with `use`
- **Descriptive**: `useAuth`, `useTripPlanning`, `useBarryChat`
- **Single responsibility**: One hook, one purpose

### Common Hook Patterns
```typescript
// Data fetching hook
export const useTrips = () => {
  return useQuery({
    queryKey: ['trips'],
    queryFn: () => tripService.fetchTrips(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// State management hook  
export const useModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  return { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) };
};
```

## Service Layer (`services/`)

### Service Organization
- **core/**: Authentication, Supabase client, error handling
- **chatgpt/**: Barry AI integration
- **mapbox/**: Maps and geolocation
- **offline/**: PWA and offline sync

### Service Pattern
```typescript
class TripService {
  async fetchTrips(): Promise<Trip[]> {
    // Implementation with error handling
  }
  
  async saveTrip(trip: CreateTripRequest): Promise<Trip> {
    // Implementation with validation
  }
}

export const tripService = new TripService();
```

## Styling System

### Tailwind Configuration
- **Colors**: Custom Unimog color palette
- **Components**: shadcn/ui design tokens
- **Responsive**: Mobile-first breakpoints
- **Dark mode**: System preference + manual toggle

### CSS Organization
```
styles/
├── globals.css         # Base Tailwind imports
├── components.css      # Component-specific styles  
├── animations.css      # Custom animations
└── themes.css          # Color themes and variables
```

## Routing & Navigation

### React Router Structure
- **Pages**: Top-level route components in `/pages`
- **Layout**: Shared layout components
- **Guards**: Authentication route protection
- **Lazy loading**: Code splitting for performance

### Route Protection
```typescript
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/auth" />;
  return <>{children}</>;
};
```

## Form Handling

### React Hook Form + Zod Pattern
```typescript
const schema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
});

const MyForm = () => {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });
  
  // Form implementation
};
```

## Error Handling

### Error Boundary Strategy
- **Global boundary**: Catch all unhandled errors
- **Feature boundaries**: Isolate component failures  
- **Service errors**: Handle API/network failures
- **User feedback**: Show meaningful error messages

### Error Logging
- **Console logging**: Development environment
- **Error tracking**: Production error monitoring
- **User context**: Include user ID and action context

## Performance Optimization

### Code Splitting
- **Route-based**: Lazy load page components
- **Feature-based**: Split large feature bundles
- **Vendor**: Separate vendor libraries

### Memory Management
- **Cleanup**: Remove event listeners in useEffect cleanup
- **Refs**: Use useCallback/useMemo appropriately
- **Subscriptions**: Clean up API subscriptions

## Development Guidelines

### File Naming
- **Components**: PascalCase (`TripPlanner.tsx`)
- **Hooks**: camelCase with `use` prefix (`useTripPlanner.ts`)
- **Services**: camelCase (`tripService.ts`)
- **Utils**: camelCase (`formatDate.ts`)

### Import Organization
```typescript
// 1. React/third-party imports
import React from 'react';
import { useState } from 'react';

// 2. Internal imports (absolute paths)
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

// 3. Relative imports
import './MyComponent.css';
```

### TypeScript Standards
- **Strict mode**: Enable all strict checks
- **Interface over type**: Use interfaces for object shapes
- **Enums**: Use const assertions over enums
- **Utility types**: Leverage built-in utility types

## Testing Strategy

### Test Organization
- **Unit tests**: Individual component/hook testing
- **Integration tests**: Feature flow testing  
- **E2E tests**: Critical user journey testing
- **Visual tests**: Component visual regression

### Testing Libraries
- **React Testing Library**: Component testing
- **Jest**: Test runner and assertions
- **MSW**: Mock service worker for API mocking
- **Playwright**: End-to-end testing

## Security Considerations

### Client-Side Security
- **Input validation**: All user inputs validated
- **XSS prevention**: Sanitize user content  
- **CSRF protection**: Use CSRF tokens where needed
- **Environment variables**: No secrets in frontend code

### Authentication
- **Token management**: Secure token storage
- **Session handling**: Proper session lifecycle
- **Route protection**: Protect sensitive routes
- **Logout**: Complete session cleanup

---

*This file provides detailed context for the React frontend application. Refer to this when working on frontend components, hooks, and services.*