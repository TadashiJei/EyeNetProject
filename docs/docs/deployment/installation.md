# Installation Guide

## System Requirements

### Hardware Requirements
- CPU: 4+ cores
- RAM: 8GB minimum, 16GB recommended
- Storage: 50GB minimum

### Software Requirements
- Node.js v18 or higher
- MongoDB v6 or higher
- Docker (optional)
- Nginx (for production)

## Installation Methods

### 1. Docker Installation (Recommended)

1. **Pull Docker Images**
```bash
docker pull eyenet/backend:latest
docker pull eyenet/frontend:latest
docker pull mongo:latest
```

2. **Create Docker Network**
```bash
docker network create eyenet-network
```

3. **Start MongoDB**
```bash
docker run -d \
  --name mongodb \
  --network eyenet-network \
  -v mongodb_data:/data/db \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=secret \
  mongo:latest
```

4. **Start Backend**
```bash
docker run -d \
  --name eyenet-backend \
  --network eyenet-network \
  -p 3000:3000 \
  -e MONGODB_URI=mongodb://admin:secret@mongodb:27017/eyenet \
  -e JWT_SECRET=your_jwt_secret \
  eyenet/backend:latest
```

5. **Start Frontend**
```bash
docker run -d \
  --name eyenet-frontend \
  --network eyenet-network \
  -p 3001:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:3000/api \
  eyenet/frontend:latest
```

### 2. Manual Installation

1. **Install MongoDB**
```bash
# Ubuntu
sudo apt-get update
sudo apt-get install -y mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

2. **Clone Repository**
```bash
git clone https://github.com/TadashiJei/EyeNetProject.git
cd EyeNetProject
```

3. **Install Backend**
```bash
cd eyenet/backend
npm install
npm run build

# Create systemd service
sudo nano /etc/systemd/system/eyenet-backend.service
```

```ini
[Unit]
Description=EyeNet Backend Service
After=network.target

[Service]
Type=simple
User=eyenet
WorkingDirectory=/path/to/eyenet/backend
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=MONGODB_URI=mongodb://localhost:27017/eyenet
Environment=JWT_SECRET=your_jwt_secret

[Install]
WantedBy=multi-user.target
```

4. **Install Frontend**
```bash
cd ../frontend
npm install
npm run build

# Create systemd service
sudo nano /etc/systemd/system/eyenet-frontend.service
```

```ini
[Unit]
Description=EyeNet Frontend Service
After=network.target

[Service]
Type=simple
User=eyenet
WorkingDirectory=/path/to/eyenet/frontend
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production
Environment=NEXT_PUBLIC_API_URL=http://localhost:3000/api

[Install]
WantedBy=multi-user.target
```

5. **Start Services**
```bash
sudo systemctl start eyenet-backend
sudo systemctl enable eyenet-backend
sudo systemctl start eyenet-frontend
sudo systemctl enable eyenet-frontend
```

## Production Setup

### 1. Nginx Configuration

```nginx
# /etc/nginx/sites-available/eyenet
server {
    listen 80;
    server_name eyenet.example.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. SSL Configuration

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d eyenet.example.com
```

### 3. MongoDB Security

1. **Enable Authentication**
```bash
# Create admin user
mongo
use admin
db.createUser({
  user: "admin",
  pwd: "secure_password",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})
```

2. **Update MongoDB Configuration**
```bash
# /etc/mongodb.conf
security:
  authorization: enabled
```

### 4. Firewall Configuration

```bash
# Allow necessary ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 27017/tcp
```

## Post-Installation

### 1. Verify Installation
```bash
# Check services
sudo systemctl status eyenet-backend
sudo systemctl status eyenet-frontend
sudo systemctl status mongodb
sudo systemctl status nginx

# Check logs
sudo journalctl -u eyenet-backend
sudo journalctl -u eyenet-frontend
```

### 2. Initial Setup
1. Create admin user
2. Configure network devices
3. Set up monitoring
4. Configure backup system

### 3. Backup Configuration
1. Set up MongoDB backups
2. Configure log rotation
3. Set up system backups
4. Test restore procedures
