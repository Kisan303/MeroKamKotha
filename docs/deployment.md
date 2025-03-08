# Deployment Guide

## Prerequisites
- Node.js v18 or higher
- PostgreSQL database server
- PM2 or similar process manager for production
- Domain name (optional)

## Local Development Setup

### 1. Clone and Install Dependencies
```bash
git clone <your-repository>
cd <project-directory>
npm install
```

### 2. Database Configuration
1. Install PostgreSQL on your machine
2. Create a new database:
```bash
psql -U postgres
CREATE DATABASE your_database_name;
```

3. Set up environment variables in `.env`:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/your_database_name
SESSION_SECRET=your_secure_session_secret
NODE_ENV=development
```

4. Run database migrations:
```bash
npm run db:push
```

### 3. Start Development Server
```bash
npm run dev
```

## Production Deployment

### 1. Server Requirements
- Ubuntu 20.04 LTS or similar
- 1GB RAM minimum
- PostgreSQL 12 or higher
- Node.js 18 or higher
- Nginx (for reverse proxy)

### 2. Production Database Setup
1. Install PostgreSQL:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

2. Create production database:
```bash
sudo -u postgres psql
CREATE DATABASE your_production_db;
CREATE USER your_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE your_production_db TO your_user;
```

3. Configure database connection:
```env
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/your_production_db
```

### 3. Application Deployment

1. Clone repository and install dependencies:
```bash
git clone <your-repository>
cd <project-directory>
npm install --production
```

2. Set up environment variables:
```env
NODE_ENV=production
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/your_production_db
SESSION_SECRET=your_secure_production_secret
```

3. Build the application:
```bash
npm run build
```

4. Install PM2:
```bash
npm install -g pm2
```

5. Create PM2 configuration (ecosystem.config.js):
```javascript
module.exports = {
  apps: [{
    name: "social-platform",
    script: "npm",
    args: "start",
    env: {
      NODE_ENV: "production",
    },
    max_memory_restart: "500M"
  }]
};
```

6. Start with PM2:
```bash
pm2 start ecosystem.config.js
```

### 4. Nginx Configuration

1. Install Nginx:
```bash
sudo apt install nginx
```

2. Create Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Enable the configuration:
```bash
sudo ln -s /etc/nginx/sites-available/your-config /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. SSL Configuration (Optional)

1. Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
```

2. Obtain SSL certificate:
```bash
sudo certbot --nginx -d your-domain.com
```

## Database Maintenance

### Backup
Regular backups are crucial. Set up automated backups:

1. Create backup script (backup.sh):
```bash
#!/bin/bash
BACKUP_DIR="/path/to/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
pg_dump -U your_user your_production_db > "$BACKUP_DIR/backup_$TIMESTAMP.sql"
```

2. Schedule with cron:
```bash
0 0 * * * /path/to/backup.sh
```

### Migrations
Run migrations in production:
```bash
NODE_ENV=production npm run db:push
```

## Monitoring and Maintenance

### PM2 Commands
- Monitor application: `pm2 monit`
- View logs: `pm2 logs`
- Restart application: `pm2 restart social-platform`
- List applications: `pm2 list`

### Health Checks
1. Database connection:
```bash
psql -U your_user -d your_production_db -c "SELECT 1"
```

2. Application status:
```bash
pm2 status
```

## Troubleshooting

### Common Issues

1. Database Connection Errors
- Check DATABASE_URL format
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check database user permissions
- Verify network/firewall settings

2. Application Won't Start
- Check for port conflicts
- Verify environment variables
- Check application logs: `pm2 logs`
- Ensure build was successful

3. WebSocket Connection Issues
- Verify Nginx WebSocket configuration
- Check client-side connection logs
- Ensure proper SSL configuration for secure WebSocket connections

## Security Considerations

1. Database Security
- Use strong passwords
- Limit database user permissions
- Regular security updates
- Enable SSL for database connections

2. Application Security
- Keep dependencies updated
- Implement rate limiting
- Use secure session configuration
- Enable CORS appropriately

3. Server Security
- Configure firewall rules
- Regular system updates
- Monitor server resources
- Set up intrusion detection

## Performance Optimization

1. Database
- Index frequently queried columns
- Regular VACUUM operations
- Monitor query performance

2. Application
- Enable compression in Nginx
- Configure proper caching
- Optimize static asset delivery
- Monitor memory usage

## Scaling Considerations

1. Vertical Scaling
- Increase server resources
- Optimize database configuration
- Tune Node.js memory limits

2. Horizontal Scaling
- Load balancer configuration
- Session store configuration
- Database replication setup
