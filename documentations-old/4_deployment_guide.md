# EyeNet Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Installation Steps](#installation-steps)
4. [Configuration](#configuration)
5. [Deployment](#deployment)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Backup & Recovery](#backup--recovery)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- CPU: 4+ cores
- RAM: 16GB minimum
- Storage: 100GB+ SSD
- Network: 1Gbps dedicated connection

### Software Requirements
- Node.js 20.x
- Docker 24.x
- Docker Compose 2.x
- Git
- MongoDB 6.x
- Redis 7.x

### Network Requirements
- Open ports:
  - 80/443 (HTTP/HTTPS)
  - 27017 (MongoDB)
  - 6379 (Redis)
  - 9090 (Prometheus)
  - 3000 (Grafana)

## Environment Setup

### 1. Directory Structure
```
/opt/eyenet/
├── backend/
├── frontend/
├── docker/
├── config/
├── data/
│   ├── mongodb/
│   ├── redis/
│   └── ml_models/
├── logs/
└── scripts/
```

### 2. Environment Variables
```bash
# .env.production
# Server
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database
MONGODB_URI=mongodb://mongodb:27017/eyenet
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=your-secret-key
JWT_EXPIRY=1h
API_KEY_SALT=your-api-key-salt

# Services
ML_MODEL_PATH=/opt/eyenet/data/ml_models
LOG_LEVEL=info

# External Services
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password

# Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true
```

## Installation Steps

### 1. Clone Repository
```bash
git clone https://github.com/organization/eyenet.git /opt/eyenet
cd /opt/eyenet
```

### 2. Install Dependencies
```bash
# Backend dependencies
cd backend
npm install --production

# Frontend dependencies
cd ../frontend
npm install --production
```

### 3. Build Docker Images
```bash
docker-compose build
```

## Configuration

### 1. MongoDB Configuration
```javascript
// config/mongod.conf
storage:
  dbPath: /data/db
  journal:
    enabled: true
  engine: wiredTiger

systemLog:
  destination: file
  path: /var/log/mongodb/mongod.log
  logAppend: true

net:
  port: 27017
  bindIp: 0.0.0.0

security:
  authorization: enabled

replication:
  replSetName: eyenet_replica
```

### 2. Redis Configuration
```bash
# config/redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
appendonly yes
appendfsync everysec
```

### 3. Nginx Configuration
```nginx
# config/nginx.conf
upstream backend {
    server backend:5000;
}

server {
    listen 80;
    server_name eyenet.example.com;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

## Deployment

### 1. Using Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
    volumes:
      - ./data:/data
      - ./logs:/logs
    depends_on:
      - mongodb
      - redis

  mongodb:
    image: mongo:6
    volumes:
      - ./data/mongodb:/data/db
      - ./config/mongod.conf:/etc/mongod.conf
    command: ["--config", "/etc/mongod.conf"]

  redis:
    image: redis:7
    volumes:
      - ./data/redis:/data
      - ./config/redis.conf:/usr/local/etc/redis/redis.conf
    command: ["redis-server", "/usr/local/etc/redis/redis.conf"]

  nginx:
    image: nginx:latest
    volumes:
      - ./config/nginx.conf:/etc/nginx/conf.d/default.conf
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
```

### 2. Deployment Commands
```bash
# Start services
docker-compose up -d

# Scale backend service
docker-compose up -d --scale backend=3

# Check logs
docker-compose logs -f

# Update services
docker-compose pull
docker-compose up -d
```

## Monitoring & Maintenance

### 1. Health Checks
```bash
#!/bin/bash
# scripts/health_check.sh

# Check backend service
curl -f http://localhost:5000/health

# Check MongoDB
mongo --eval "db.adminCommand('ping')"

# Check Redis
redis-cli ping
```

### 2. Logging Configuration
```javascript
// config/winston.config.js
{
    file: {
        level: 'info',
        filename: '/logs/app.log',
        handleExceptions: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        format: combine(
            timestamp(),
            json()
        )
    },
    console: {
        level: 'debug',
        handleExceptions: true
    }
}
```

## Backup & Recovery

### 1. Database Backup
```bash
#!/bin/bash
# scripts/backup.sh

# MongoDB backup
mongodump --out /backup/mongodb/$(date +%Y%m%d)

# Redis backup
redis-cli save
cp /data/redis/dump.rdb /backup/redis/dump.rdb.$(date +%Y%m%d)
```

### 2. Recovery Procedures
```bash
# MongoDB restore
mongorestore /backup/mongodb/20250107

# Redis restore
systemctl stop redis
cp /backup/redis/dump.rdb.20250107 /data/redis/dump.rdb
systemctl start redis
```

## Troubleshooting

### Common Issues

1. **Connection Issues**
```bash
# Check network connectivity
netstat -tulpn

# Check logs
tail -f /logs/app.log

# Check container status
docker-compose ps
```

2. **Performance Issues**
```bash
# Check system resources
top
df -h
free -m

# Check MongoDB metrics
mongostat

# Check Redis metrics
redis-cli info
```

3. **Memory Issues**
```bash
# Node.js heap dump
node --prof app.js
node --prof-process isolate-*.log

# Redis memory analysis
redis-cli info memory
```
