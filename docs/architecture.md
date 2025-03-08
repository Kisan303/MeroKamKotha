# Architecture Overview

## System Architecture
The application follows a modern full-stack architecture with:

### Frontend (React + TypeScript)
- React for UI components
- TypeScript for type safety
- TanStack Query for data fetching and caching
- Socket.IO client for real-time updates
- Shadcn UI components for consistent design
- Tailwind CSS for styling
- Wouter for routing

### Backend (Express + TypeScript)
- Express.js server
- TypeScript for type safety
- Socket.IO server for real-time communication
- Passport.js for authentication
- Multer for file uploads
- DrizzleORM for database operations

### Database (PostgreSQL)
- Relational database for data persistence
- Tables for users, posts, chats, and messages
- Foreign key relationships for data integrity

## Key Components

### Authentication Flow
1. User registers/logs in through frontend forms
2. Backend validates credentials
3. Session-based authentication with Passport.js
4. Protected routes require authentication

### Real-time Communication
1. Socket.IO handles WebSocket connections
2. Users join chat rooms for direct messaging
3. Online status tracking for all users
4. Real-time message delivery and status updates

### File Storage
1. Image uploads handled by Multer
2. Files stored in local uploads directory
3. Served statically through Express

### State Management
1. React Query manages server state
2. Local state with React hooks
3. Real-time updates through Socket.IO events

## Security Measures
- Password hashing with scrypt
- Session-based authentication
- CSRF protection
- File upload validation
- Input sanitization and validation

## Performance Optimizations
- Query caching with React Query
- Real-time updates to minimize polling
- Efficient database indexing
- Image optimization
- Lazy loading for components
