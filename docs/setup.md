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

## Database Setup

1. Install PostgreSQL:
   - For Ubuntu/Debian: `sudo apt-get install postgresql`
   - For macOS: `brew install postgresql`
   - For Windows: Download from https://www.postgresql.org/download/windows/

2. Create a database:
```bash
psql -U postgres
CREATE DATABASE your_database_name;
```

3. Run database migrations:
```bash
npm run db:push
```

This will create all necessary tables using the schema defined in `shared/schema.ts`.

## Running the Application

1. Start the development server:
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

## Setting Up for Production

1. Build the project:
```bash
npm run build
```

2. Configure your production environment:
   - Set up a production PostgreSQL database
   - Configure environment variables for production
   - Set up a process manager (e.g., PM2) for running the Node.js application

3. Production environment variables:
```env
DATABASE_URL=postgresql://username:password@your-production-db-host:5432/dbname
SESSION_SECRET=your_secure_production_secret
NODE_ENV=production
```

## Database Migration in Production

1. Back up your existing database:
```bash
pg_dump -U username database_name > backup.sql
```

2. Run migrations:
```bash
NODE_ENV=production npm run db:push
```

## Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Build the project
- `npm run db:push`: Update database schema
- `npm test`: Run tests

## Troubleshooting

### Database Connection Issues
1. Verify PostgreSQL is running:
```bash
sudo service postgresql status  # Linux
brew services list             # macOS
```

2. Check connection string format:
```
postgresql://username:password@host:port/database
```

3. Common solutions:
   - Ensure PostgreSQL is running on the default port (5432)
   - Check user permissions in PostgreSQL
   - Verify database name exists
   - Check network access if using a remote database

### Common Issues
1. If the server won't start:
   - Check if port 3000 is already in use
   - Verify all dependencies are installed
   - Check environment variables are properly set

2. If database migrations fail:
   - Check database connection string
   - Ensure PostgreSQL user has proper permissions
   - Verify schema.ts file for any syntax errors

## Security Considerations
1. Never commit `.env` files to version control
2. Use strong SESSION_SECRET values in production
3. Configure proper CORS settings for production
4. Implement rate limiting for API endpoints
5. Use HTTPS in production