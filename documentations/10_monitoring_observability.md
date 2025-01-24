# EyeNet Monitoring & Observability

## Table of Contents
1. [Metrics Collection](#metrics-collection)
2. [Logging System](#logging-system)
3. [Tracing Framework](#tracing-framework)
4. [Alerting System](#alerting-system)
5. [Dashboards](#dashboards)
6. [Health Checks](#health-checks)

## Metrics Collection

### 1. Prometheus Configuration
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'eyenet-backend'
    static_configs:
      - targets: ['localhost:5000']
    metrics_path: '/metrics'
    scheme: 'http'

  - job_name: 'eyenet-frontend'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'

  - job_name: 'mongodb'
    static_configs:
      - targets: ['localhost:27017']

  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:6379']
```

### 2. Custom Metrics
```javascript
// services/metrics.service.js
import client from 'prom-client';

class MetricsService {
    constructor() {
        this.register = new client.Registry();
        
        // Counter metrics
        this.requestCounter = new client.Counter({
            name: 'http_requests_total',
            help: 'Total HTTP requests',
            labelNames: ['method', 'path', 'status']
        });

        // Gauge metrics
        this.activeConnections = new client.Gauge({
            name: 'websocket_active_connections',
            help: 'Number of active WebSocket connections'
        });

        // Histogram metrics
        this.requestDuration = new client.Histogram({
            name: 'http_request_duration_seconds',
            help: 'HTTP request duration',
            buckets: [0.1, 0.5, 1, 2, 5]
        });

        this.register.registerMetric(this.requestCounter);
        this.register.registerMetric(this.activeConnections);
        this.register.registerMetric(this.requestDuration);
    }

    recordRequest(method, path, status, duration) {
        this.requestCounter.inc({ method, path, status });
        this.requestDuration.observe(duration);
    }

    updateConnections(count) {
        this.activeConnections.set(count);
    }
}
```

## Logging System

### 1. Winston Configuration
```javascript
// config/logger.config.js
import winston from 'winston';
import 'winston-daily-rotate-file';

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { service: 'eyenet-backend' },
    transports: [
        new winston.transports.DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxFiles: '30d'
        }),
        new winston.transports.DailyRotateFile({
            filename: 'logs/combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '30d'
        })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}
```

### 2. Structured Logging
```javascript
// middleware/request-logger.middleware.js
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        
        logger.info('HTTP Request', {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration,
            userAgent: req.get('user-agent'),
            ip: req.ip,
            userId: req.user?.id
        });
    });
    
    next();
};
```

## Tracing Framework

### 1. OpenTelemetry Setup
```javascript
// config/tracing.config.js
import { NodeTracerProvider } from '@opentelemetry/node';
import { SimpleSpanProcessor } from '@opentelemetry/tracing';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const provider = new NodeTracerProvider();

const exporter = new JaegerExporter({
    endpoint: 'http://localhost:14268/api/traces'
});

provider.addSpanProcessor(
    new SimpleSpanProcessor(exporter)
);

provider.register();

const tracer = provider.getTracer('eyenet-backend');
```

### 2. Request Tracing
```javascript
// middleware/tracing.middleware.js
const tracingMiddleware = async (req, res, next) => {
    const span = tracer.startSpan('http_request');
    
    span.setAttribute('http.method', req.method);
    span.setAttribute('http.url', req.url);
    
    // Inject trace context into response headers
    const traceContext = {};
    tracer.inject(traceContext, {
        'x-trace-id': span.context().traceId
    });
    
    res.locals.span = span;
    
    res.on('finish', () => {
        span.setAttribute('http.status_code', res.statusCode);
        span.end();
    });
    
    next();
};
```

## Alerting System

### 1. Alert Configuration
```javascript
// config/alerts.config.js
export const alertRules = {
    highCpuUsage: {
        condition: (metrics) => metrics.cpu > 80,
        severity: 'warning',
        message: 'High CPU usage detected',
        interval: '5m'
    },
    errorSpike: {
        condition: (metrics) => metrics.errorRate > 0.05,
        severity: 'critical',
        message: 'Error rate spike detected',
        interval: '1m'
    },
    slowRequests: {
        condition: (metrics) => metrics.p95Latency > 1000,
        severity: 'warning',
        message: 'Slow request performance detected',
        interval: '5m'
    }
};
```

### 2. Alert Manager
```javascript
// services/alert-manager.service.js
class AlertManager {
    constructor() {
        this.activeAlerts = new Map();
        this.notifiers = new Map();
    }

    async checkAlertRules(metrics) {
        for (const [ruleName, rule] of Object.entries(alertRules)) {
            const isTriggered = rule.condition(metrics);
            
            if (isTriggered && !this.activeAlerts.has(ruleName)) {
                await this.triggerAlert(ruleName, rule, metrics);
            } else if (!isTriggered && this.activeAlerts.has(ruleName)) {
                await this.resolveAlert(ruleName);
            }
        }
    }

    async triggerAlert(ruleName, rule, metrics) {
        const alert = {
            id: uuid(),
            ruleName,
            severity: rule.severity,
            message: rule.message,
            metrics,
            timestamp: new Date()
        };

        this.activeAlerts.set(ruleName, alert);
        await this.notifyAlert(alert);
    }

    async notifyAlert(alert) {
        const notifiers = this.getNotifiersForSeverity(alert.severity);
        
        for (const notifier of notifiers) {
            try {
                await notifier.notify(alert);
            } catch (error) {
                logger.error('Alert notification failed', {
                    notifier: notifier.name,
                    alert,
                    error
                });
            }
        }
    }
}
```

## Dashboards

### 1. Grafana Dashboard Configuration
```javascript
// dashboards/system-overview.json
{
    "dashboard": {
        "id": null,
        "title": "System Overview",
        "tags": ["eyenet"],
        "timezone": "browser",
        "panels": [
            {
                "title": "CPU Usage",
                "type": "graph",
                "datasource": "Prometheus",
                "targets": [
                    {
                        "expr": "system_cpu_usage",
                        "legendFormat": "CPU %"
                    }
                ]
            },
            {
                "title": "Memory Usage",
                "type": "graph",
                "datasource": "Prometheus",
                "targets": [
                    {
                        "expr": "system_memory_usage_bytes",
                        "legendFormat": "Memory"
                    }
                ]
            }
        ]
    }
}
```

### 2. Custom Metrics Dashboard
```javascript
// dashboards/application-metrics.json
{
    "dashboard": {
        "title": "Application Metrics",
        "panels": [
            {
                "title": "Request Rate",
                "type": "graph",
                "datasource": "Prometheus",
                "targets": [
                    {
                        "expr": "rate(http_requests_total[5m])",
                        "legendFormat": "{{method}} {{path}}"
                    }
                ]
            },
            {
                "title": "Response Times",
                "type": "heatmap",
                "datasource": "Prometheus",
                "targets": [
                    {
                        "expr": "rate(http_request_duration_seconds_bucket[5m])",
                        "format": "heatmap"
                    }
                ]
            }
        ]
    }
}
```

## Health Checks

### 1. Health Check Implementation
```javascript
// services/health.service.js
class HealthService {
    async checkHealth() {
        const checks = await Promise.all([
            this.checkDatabase(),
            this.checkRedis(),
            this.checkExternalServices(),
            this.checkDiskSpace()
        ]);

        return {
            status: checks.every(check => check.status === 'healthy')
                ? 'healthy'
                : 'unhealthy',
            checks: checks.reduce((acc, check) => ({
                ...acc,
                [check.name]: check
            }), {})
        };
    }

    async checkDatabase() {
        try {
            await mongoose.connection.db.admin().ping();
            return {
                name: 'database',
                status: 'healthy',
                latency: await this.measureDbLatency()
            };
        } catch (error) {
            return {
                name: 'database',
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    async measureDbLatency() {
        const start = Date.now();
        await mongoose.connection.db.admin().ping();
        return Date.now() - start;
    }
}
```

### 2. Health Check Routes
```javascript
// routes/health.routes.js
router.get('/health', async (req, res) => {
    const health = await healthService.checkHealth();
    
    res.status(health.status === 'healthy' ? 200 : 503)
        .json(health);
});

router.get('/health/live', (req, res) => {
    res.status(200).json({ status: 'alive' });
});

router.get('/health/ready', async (req, res) => {
    const ready = await healthService.checkReadiness();
    
    res.status(ready ? 200 : 503)
        .json({ status: ready ? 'ready' : 'not ready' });
});
```
