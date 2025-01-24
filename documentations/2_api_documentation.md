# EyeNet API Documentation

## Table of Contents
1. [Authentication](#authentication)
2. [Network Monitoring](#network-monitoring)
3. [ML Services](#ml-services)
4. [Alert Management](#alert-management)
5. [Device Management](#device-management)
6. [Analytics](#analytics)

## Base URL
```
Production: https://api.eyenet.com/v1
Development: http://localhost:5000/v1
```

## Authentication

### Generate Access Token
```http
POST /auth/token
Content-Type: application/json

{
    "username": "string",
    "password": "string"
}
```

#### Response
```json
{
    "token": "string",
    "refreshToken": "string",
    "expiresIn": 3600
}
```

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
    "refreshToken": "string"
}
```

## Network Monitoring

### Get Network Status
```http
GET /network/status
Authorization: Bearer {token}
```

#### Response
```json
{
    "status": "healthy",
    "deviceCount": 150,
    "activeAlerts": 2,
    "metrics": {
        "bandwidth": 1024,
        "latency": 15,
        "packetLoss": 0.01
    }
}
```

### Get Device Details
```http
GET /network/device/{deviceId}
Authorization: Bearer {token}
```

#### Response
```json
{
    "id": "string",
    "name": "string",
    "type": "router|switch|access_point",
    "status": "active|inactive|maintenance",
    "location": {
        "building": "string",
        "floor": "string",
        "coordinates": {
            "x": 0,
            "y": 0
        }
    },
    "metrics": {
        "cpu": 45.5,
        "memory": 60.2,
        "temperature": 35.5
    }
}
```

## ML Services

### Submit Analysis Job
```http
POST /ml/analyze
Authorization: Bearer {token}
Content-Type: application/json

{
    "deviceId": "string",
    "timeRange": {
        "start": "ISO8601",
        "end": "ISO8601"
    },
    "analysisType": "anomaly|prediction|pattern",
    "config": {
        "sensitivity": 0.8,
        "threshold": 0.95
    }
}
```

#### Response
```json
{
    "jobId": "string",
    "status": "queued|processing|completed",
    "estimatedTime": 300
}
```

### Get Analysis Results
```http
GET /ml/results/{jobId}
Authorization: Bearer {token}
```

## Alert Management

### Create Alert Rule
```http
POST /alerts/rules
Authorization: Bearer {token}
Content-Type: application/json

{
    "name": "string",
    "condition": {
        "metric": "cpu|memory|traffic",
        "operator": ">|<|=",
        "value": 90
    },
    "severity": "low|medium|high",
    "notifications": {
        "email": true,
        "slack": false,
        "webhook": "string"
    }
}
```

### Get Active Alerts
```http
GET /alerts/active
Authorization: Bearer {token}
```

## Device Management

### Register Device
```http
POST /devices
Authorization: Bearer {token}
Content-Type: application/json

{
    "name": "string",
    "type": "string",
    "location": {
        "building": "string",
        "floor": "string",
        "room": "string"
    },
    "config": {
        "monitoring": {
            "interval": 60,
            "metrics": ["cpu", "memory", "traffic"]
        },
        "alerts": {
            "enabled": true,
            "thresholds": {
                "cpu": 90,
                "memory": 85,
                "traffic": 1000
            }
        }
    }
}
```

## Analytics

### Get Performance Report
```http
GET /analytics/performance
Authorization: Bearer {token}
Query Parameters:
    - timeRange: string (1h|24h|7d|30d)
    - metrics: array (cpu,memory,traffic)
    - devices: array (deviceIds)
```

### Get Prediction Analysis
```http
GET /analytics/predictions
Authorization: Bearer {token}
Query Parameters:
    - metric: string
    - horizon: string (1h|24h|7d)
    - confidence: number (0-1)
```

## WebSocket Events

### Connection
```javascript
const socket = io('wss://api.eyenet.com', {
    auth: {
        token: 'Bearer token'
    }
});
```

### Event Types
```javascript
// Real-time metrics
socket.on('metrics', (data) => {
    // Handle real-time metric updates
});

// Alert notifications
socket.on('alert', (data) => {
    // Handle real-time alerts
});

// Status changes
socket.on('status', (data) => {
    // Handle status changes
});
```

## Error Responses

### Standard Error Format
```json
{
    "error": {
        "code": "string",
        "message": "string",
        "details": {}
    },
    "requestId": "string",
    "timestamp": "ISO8601"
}
```

### Common Error Codes
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Resource not found
- `422`: Validation error
- `429`: Too many requests
- `500`: Internal server error
