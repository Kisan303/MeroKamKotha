# Mero KamKotha - Room & Job Listing Platform

A modern social platform for posting and discovering rooms and jobs, featuring an enhanced bento-style UI with advanced user interaction capabilities and personalized content experience.

## Features

- 🏠 Room Listings with Image Support
- 💼 Job Postings
- 👤 User Authentication
- 🔖 Post Bookmarking
- 💬 Real-time Comments
- 🎨 Modern Bento-grid UI Design
- 📱 Responsive Design

## Tech Stack

- **Frontend**:
  - React + TypeScript
  - TailwindCSS + shadcn/ui
  - Framer Motion for animations
  - TanStack Query for data fetching
  - Socket.IO for real-time features

- **Backend**:
  - Express server
  - PostgreSQL database
  - Drizzle ORM
  - Passport.js for authentication

## Project Structure

```
├── client/
│   └── src/
│       ├── components/     # Reusable UI components
│       │   ├── posts/     # Post-related components
│       │   └── ui/        # shadcn UI components
│       ├── hooks/         # Custom React hooks
│       ├── lib/           # Utility functions and configurations
│       └── pages/         # Page components
├── server/                # Express backend
├── shared/               # Shared types and schemas
└── theme.json           # UI theme configuration
```

### Key Directories

- `client/src/components/posts/`: Contains post-related components like post cards, forms, and comment threads
- `client/src/components/ui/`: Houses all shadcn UI components
- `client/src/pages/`: Main page components (Home, Profile, Auth, About)
- `client/src/hooks/`: Custom hooks for auth, toast notifications, etc.
- `client/src/lib/`: Contains configurations for query client, WebSocket, and protected routes
- `server/`: Backend implementation with Express routes and database logic
- `shared/`: Shared TypeScript types and Drizzle schema definitions

## Setup Instructions

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with:
```env
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your_session_secret
```

4. Initialize the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Database Schema

The application uses PostgreSQL with Drizzle ORM. Key tables include:
- Users
- Posts
- Comments
- Bookmarks

## Key Features Implementation

### Authentication
- Uses session-based authentication with Passport.js
- Protected routes redirect unauthorized users to login
- User sessions are stored in PostgreSQL

### Posts
- Supports both room and job listings
- Room listings can include multiple images
- Real-time updates using Socket.IO
- Comments and nested replies

### UI/UX
- Modern bento-grid layout
- Fluid animations using Framer Motion
- Responsive design for all screen sizes
- Dark/light theme support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Documentation

For detailed documentation, please refer to the following guides in the `docs` directory:

- [Setup Guide](docs/setup.md) - Complete setup instructions
- [Deployment Guide](docs/deployment.md) - Production deployment steps
- [API Documentation](docs/api.md) - API endpoints and usage
- [Database Schema](docs/database.md) - Database structure and relationships
- [Frontend Components](docs/frontend.md) - UI components and features
- [Architecture Overview](docs/architecture.md) - System design and tech stack
- [Features Documentation](docs/features.md) - Detailed feature descriptions

## License

MIT License