# EyeNet Database Schema Documentation

## Overview
EyeNet uses a combination of MongoDB (primary database) and Redis (caching & real-time data) to manage its data. This document outlines the database schemas and their relationships.

## MongoDB Collections

### 1. Users Collection
```javascript
{
    _id: ObjectId,
    username: String,
    email: String,
    password: String (hashed),
    role: String (enum: ['admin', 'operator', 'viewer']),
    organization: ObjectId,
    settings: {
        notifications: {
            email: Boolean,
            slack: Boolean,
            webhook: String
        },
        timezone: String,
        theme: String
    },
    lastLogin: Date,
    createdAt: Date,
    updatedAt: Date
}
```

### 2. Devices Collection
```javascript
{
    _id: ObjectId,
    name: String,
    type: String (enum: ['router', 'switch', 'access_point', 'server', 'workstation']),
    manufacturer: String,
    model: String,
    serialNumber: String,
    firmwareVersion: String,
    location: {
        building: String,
        floor: String,
        room: String,
        coordinates: {
            x: Number,
            y: Number
        }
    },
    interfaces: [{
        name: String,
        type: String (enum: ['ethernet', 'wifi', 'fiber']),
        macAddress: String,
        ipAddress: String,
        speed: Number,
        duplex: String,
        status: String
    }],
    status: String (enum: ['active', 'inactive', 'maintenance', 'error']),
    metrics: {
        cpu: Number,
        memory: Number,
        temperature: Number,
        lastUpdate: Date
    },
    maintenance: {
        lastCheck: Date,
        nextScheduled: Date,
        history: [{
            date: Date,
            type: String,
            description: String,
            technician: ObjectId
        }]
    },
    createdAt: Date,
    updatedAt: Date
}
```

### 3. Metrics Collection
```javascript
{
    _id: ObjectId,
    deviceId: ObjectId,
    timestamp: Date,
    type: String,
    values: {
        cpu: Number,
        memory: Number,
        diskUsage: Number,
        networkIn: Number,
        networkOut: Number,
        temperature: Number,
        fanSpeed: Number
    },
    metadata: {
        source: String,
        reliability: Number
    }
}
```

### 4. Alerts Collection
```javascript
{
    _id: ObjectId,
    deviceId: ObjectId,
    type: String,
    severity: String (enum: ['low', 'medium', 'high', 'critical']),
    status: String (enum: ['active', 'acknowledged', 'resolved']),
    message: String,
    details: {
        metric: String,
        threshold: Number,
        value: Number,
        duration: Number
    },
    notifications: [{
        channel: String,
        status: String,
        timestamp: Date
    }],
    acknowledgedBy: ObjectId,
    resolvedBy: ObjectId,
    createdAt: Date,
    updatedAt: Date
}
```

### 5. ML Models Collection
```javascript
{
    _id: ObjectId,
    name: String,
    version: String,
    type: String (enum: ['anomaly', 'prediction', 'classification']),
    parameters: {
        algorithm: String,
        hyperparameters: Object,
        features: [String]
    },
    performance: {
        accuracy: Number,
        precision: Number,
        recall: Number,
        f1Score: Number
    },
    training: {
        startDate: Date,
        endDate: Date,
        dataSize: Number,
        epochs: Number
    },
    status: String,
    createdAt: Date,
    updatedAt: Date
}
```

## Redis Data Structures

### 1. Real-time Metrics
```
Key: device:{deviceId}:metrics
Type: Hash
Fields:
    - cpu
    - memory
    - temperature
    - lastUpdate
TTL: 60 seconds
```

### 2. Device Status
```
Key: device:{deviceId}:status
Type: String
Value: active|inactive|maintenance|error
TTL: 30 seconds
```

### 3. Alert Queues
```
Key: alerts:active
Type: Sorted Set
Score: timestamp
Members: {alertId}
```

### 4. Session Management
```
Key: session:{sessionId}
Type: Hash
Fields:
    - userId
    - role
    - permissions
    - lastActivity
TTL: 3600 seconds
```

### 5. Rate Limiting
```
Key: ratelimit:{ip}:{endpoint}
Type: String
Value: count
TTL: 60 seconds
```

## Indexes

### MongoDB Indexes

#### Devices Collection
```javascript
{
    "name": 1,
    "status": 1,
    "type": 1,
    "location.building": 1,
    "location.floor": 1
}
```

#### Metrics Collection
```javascript
{
    "deviceId": 1,
    "timestamp": -1,
    "type": 1
}
```

#### Alerts Collection
```javascript
{
    "deviceId": 1,
    "status": 1,
    "severity": 1,
    "createdAt": -1
}
```

## Data Retention Policies

### Metrics Data
- Real-time metrics: 1 hour in Redis
- High-resolution metrics: 7 days
- Aggregated hourly metrics: 30 days
- Aggregated daily metrics: 1 year

### Alert History
- Active alerts: Indefinite
- Resolved alerts: 90 days
- Alert metadata: 1 year

### Device History
- Status changes: 90 days
- Configuration changes: 1 year
- Maintenance records: 5 years
