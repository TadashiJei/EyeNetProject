# API Reference

## Overview

The EyeNet API provides programmatic access to network monitoring and management capabilities. This documentation covers all available endpoints, authentication methods, and example usage.

## Authentication

All API requests require authentication using JWT (JSON Web Tokens).

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" https://api.eyenet.com/v1/metrics
```

## Base URL

```
Development: http://localhost:3000/api/v1
Production: https://api.eyenet.com/v1
```

## Endpoints

### Network Metrics

#### Get Current Metrics

```http
GET /metrics/current
```

Response:
```json
{
  "timestamp": "2025-01-25T10:30:00Z",
  "metrics": {
    "bandwidth": {
      "download": 100.5,
      "upload": 50.2
    },
    "latency": 15,
    "packetLoss": 0.01
  }
}
```

#### Get Historical Metrics

```http
GET /metrics/historical?start={start_date}&end={end_date}
```

Parameters:
- start_date (ISO 8601)
- end_date (ISO 8601)

### Device Management

#### List Devices

```http
GET /devices
```

Response:
```json
{
  "devices": [
    {
      "id": "device_1",
      "name": "Router-01",
      "type": "router",
      "status": "online",
      "lastSeen": "2025-01-25T10:30:00Z"
    }
  ]
}
```

#### Update Device Configuration

```http
PUT /devices/{device_id}/config
```

Request Body:
```json
{
  "name": "Router-01",
  "config": {
    "qos": {
      "bandwidth": 1000,
      "priority": "high"
    }
  }
}
```

### ML Predictions

#### Get Bandwidth Prediction

```http
GET /ml/predict/bandwidth?horizon=6
```

Response:
```json
{
  "predictions": [
    {
      "timestamp": "2025-01-25T11:00:00Z",
      "value": 120.5,
      "confidence": 0.85
    }
  ]
}
```

#### Detect Anomalies

```http
POST /ml/detect/anomalies
```

Request Body:
```json
{
  "metrics": {
    "bandwidth": 150.5,
    "latency": 20,
    "packetLoss": 0.02
  }
}
```

Response:
```json
{
  "isAnomaly": true,
  "score": 0.85,
  "details": [
    {
      "metric": "bandwidth",
      "contribution": 0.7
    }
  ]
}
```

## Error Handling

### Error Codes

- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Detailed error message",
    "details": {
      "field": "Additional information"
    }
  }
}
```

## Rate Limiting

- 1000 requests per hour per API key
- Rate limit headers included in response:
  - X-RateLimit-Limit
  - X-RateLimit-Remaining
  - X-RateLimit-Reset

## Webhooks

### Available Events

- device.status.changed
- anomaly.detected
- threshold.exceeded

### Webhook Format

```json
{
  "event": "device.status.changed",
  "timestamp": "2025-01-25T10:30:00Z",
  "data": {
    "deviceId": "device_1",
    "oldStatus": "online",
    "newStatus": "offline"
  }
}
```

## SDKs and Client Libraries

- [JavaScript/TypeScript SDK](https://github.com/eyenet/js-sdk)
- [Python SDK](https://github.com/eyenet/python-sdk)
- [Go SDK](https://github.com/eyenet/go-sdk)

## Best Practices

1. Authentication
   - Rotate JWT tokens regularly
   - Use environment variables for tokens
   - Implement token refresh mechanism

2. Error Handling
   - Implement proper error handling
   - Log API errors appropriately
   - Provide meaningful error messages

3. Rate Limiting
   - Implement exponential backoff
   - Cache responses when possible
   - Monitor rate limit headers

4. Data Handling
   - Validate input data
   - Handle timezone differences
   - Implement proper data serialization
