# Frontend Components Documentation

## Component Structure

### Layout Components
- `App.tsx`: Root component with providers and routing
- `ProtectedRoute`: Authentication wrapper for protected pages

### Page Components
- `HomePage`: Main landing page with post listings
- `ChatPage`: Messaging interface
- `ProfilePage`: User profile and settings
- `AuthPage`: Login and registration
- `AboutPage`: Platform information

### Chat Components
- `ChatList`: List of user conversations
  - Shows user avatars, online status, and last message
  - Real-time updates for new messages
  
- `ChatMessages`: Message display area
  - Message grouping by date
  - Read receipts
  - Real-time message updates
  
- `ChatHeader`: Conversation header
  - User info and online status
  - Chat actions (search, menu)
  
- `ChatInput`: Message composition
  - Text input with validation
  - Message sending functionality

### Post Components
- `PostList`: Grid/list of room/job posts
- `PostCard`: Individual post display
- `PostForm`: Create/edit post form
- `CommentSection`: Post comments and replies

### User Components
- `UserAvatar`: User profile picture/initials
- `UserStatus`: Online/offline indicator
- `UserProfile`: Profile information display

### UI Components (from shadcn/ui)
- `Button`: Action buttons
- `Input`: Form inputs
- `Dialog`: Modal dialogs
- `DropdownMenu`: Context menus
- `ScrollArea`: Scrollable containers
- `Toast`: Notifications

## Custom Hooks
- `useAuth`: Authentication state and actions
- `useTour`: Onboarding tour management
- `useSocket`: WebSocket connection management
- `useToast`: Toast notifications

## Styling
- Tailwind CSS for utility classes
- CSS Modules for component-specific styles
- Theme customization through theme.json

## State Management
- React Query for server state
- React Context for global state
- Local state with useState/useReducer

## Routing
- Wouter for client-side routing
- Protected routes for authenticated pages
- Dynamic route parameters

## Tour Implementation
Each page implements guided tours for new users:

### Home Page Tour
```typescript
const homeSteps = [
  {
    target: '.post-list',
    content: 'Browse available rooms and jobs'
  },
  {
    target: '.create-post',
    content: 'Create new listings'
  },
  // ...
];
```

### Chat Page Tour
```typescript
const chatSteps = [
  {
    target: '.chat-list',
    content: 'View your conversations'
  },
  {
    target: '.online-status',
    content: 'See who is online'
  },
  // ...
];
```
