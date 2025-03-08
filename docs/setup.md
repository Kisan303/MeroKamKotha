# Project Setup Guide

## Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- Git

## Local Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/dbname
SESSION_SECRET=your_session_secret
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Project Structure
```
├── client/             # Frontend React application
│   ├── src/
│   │   ├── components/ # Reusable React components
│   │   ├── hooks/     # Custom React hooks
│   │   ├── lib/       # Utility functions and configurations
│   │   └── pages/     # Page components
├── server/            # Backend Express server
│   ├── routes.ts     # API routes
│   ├── storage.ts    # Database interactions
│   └── auth.ts       # Authentication logic
├── shared/           # Shared types and schemas
│   └── schema.ts     # Database schema and types
└── docs/            # Project documentation
```

## Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Build the project
- `npm run db:push`: Update database schema
- `npm test`: Run tests
