# Production Deployment Guide

## Environment Setup

### 1. Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Required Variables:**
- `MONGO_URI`: Production MongoDB connection string
- `JWT_SECRET`: Strong, random secret key (use `openssl rand -hex 32`)
- `NODE_ENV=production`
- `PORT`: Server port (default: 8000)
- `FRONTEND_URL`: Your frontend domain

### 2. MongoDB Setup
- Use MongoDB Atlas or self-hosted MongoDB
- Ensure proper indexing for performance
- Set up regular backups

### 3. Build and Start

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start in production mode
npm run prod
```

## Performance Optimizations

### 1. Database Indexing
The app automatically creates these indexes:
- User email/username uniqueness
- Route analytics geospatial indexes
- Pool member queries
- Ride request status and user queries

### 2. Rate Limiting
Configured rate limits:
- General API: 100 requests/15 minutes
- Auth endpoints: 5 requests/15 minutes  
- Ride requests: 10 requests/5 minutes

### 3. Logging
- Production logs to files in `logs/` directory
- Error logs separate from general logs
- Log rotation recommended

## Security Checklist

- ✅ JWT token authentication
- ✅ Password hashing with bcrypt
- ✅ Rate limiting on all endpoints
- ✅ CORS configuration
- ✅ Input validation with Zod
- ✅ Error handling middleware
- ⚠️ Add HTTPS in production
- ⚠️ Add helmet.js for security headers
- ⚠️ Add environment-specific CORS origins

## Monitoring

### Health Check
Endpoint: `GET /health`
Returns server status and uptime.

### Analytics
- Platform analytics: `GET /api/analytics/platform`
- User stats: `GET /api/analytics/user`
- Popular routes: `GET /api/analytics/routes/popular`
- Peak hours: `GET /api/analytics/peak-hours`

## Backup Strategy

### Automated Backups
```bash
# Create backup
./scripts/backup.sh create

# List backups
./scripts/backup.sh list

# Cleanup old backups
./scripts/backup.sh cleanup
```

### Backup Schedule
Set up cron job for regular backups:
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/your/app/scripts/backup.sh create
```

## Scaling Considerations

### Horizontal Scaling
- Use Redis for session storage (instead of in-memory)
- Implement database read replicas
- Use load balancer with sticky sessions for Socket.IO

### Database Optimization
- Monitor slow queries
- Add compound indexes for complex queries
- Consider sharding for large datasets

### Socket.IO Scaling
- Use Redis adapter for multiple server instances
- Implement proper room management

## Docker Deployment (Optional)

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 8000

CMD ["node", "dist/index.js"]
```

## Process Management

Use PM2 for production:
```bash
npm install -g pm2

# Start with PM2
pm2 start dist/index.js --name "carpool-api"

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup
```

## SSL/HTTPS Setup

### Using Let's Encrypt with Nginx
```nginx
server {
    listen 443 ssl;
    server_name your-api-domain.com;
    
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Environment-Specific Notes

### Development
- Uses console logging
- Detailed error messages
- CORS allows localhost origins

### Production
- File-based logging only
- Generic error messages
- Restricted CORS origins
- Rate limiting enforced
