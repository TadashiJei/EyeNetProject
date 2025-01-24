# EyeNet Security Implementation

## Table of Contents
1. [Authentication System](#authentication-system)
2. [Authorization Framework](#authorization-framework)
3. [Data Security](#data-security)
4. [Network Security](#network-security)
5. [Security Monitoring](#security-monitoring)
6. [Incident Response](#incident-response)

## Authentication System

### 1. JWT Implementation
```javascript
// services/auth.service.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

class AuthService {
    constructor() {
        this.tokenSecret = process.env.JWT_SECRET;
        this.refreshSecret = process.env.REFRESH_TOKEN_SECRET;
        this.tokenExpiry = '1h';
        this.refreshExpiry = '7d';
    }

    async generateTokens(user) {
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            this.tokenSecret,
            { expiresIn: this.tokenExpiry }
        );

        const refreshToken = jwt.sign(
            { userId: user._id },
            this.refreshSecret,
            { expiresIn: this.refreshExpiry }
        );

        // Store refresh token hash
        await this.storeRefreshToken(user._id, refreshToken);

        return { token, refreshToken };
    }

    async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.tokenSecret);
            return decoded;
        } catch (error) {
            throw new AuthenticationError('Invalid token');
        }
    }

    private async storeRefreshToken(userId, token) {
        const hash = await bcrypt.hash(token, 10);
        await RefreshToken.create({
            userId,
            tokenHash: hash,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
    }
}
```

### 2. Password Security
```javascript
// utils/password.util.js
class PasswordManager {
    static async hashPassword(password) {
        const salt = await bcrypt.genSalt(12);
        return bcrypt.hash(password, salt);
    }

    static async verifyPassword(password, hash) {
        return bcrypt.compare(password, hash);
    }

    static validatePasswordStrength(password) {
        const requirements = {
            minLength: 8,
            hasUpperCase: /[A-Z]/,
            hasLowerCase: /[a-z]/,
            hasNumbers: /\d/,
            hasSpecialChar: /[!@#$%^&*]/
        };

        const errors = [];
        
        if (password.length < requirements.minLength) {
            errors.push('Password must be at least 8 characters');
        }
        if (!requirements.hasUpperCase.test(password)) {
            errors.push('Password must contain uppercase letters');
        }
        // Add more validation...

        return errors;
    }
}
```

## Authorization Framework

### 1. Role-Based Access Control (RBAC)
```javascript
// middleware/rbac.middleware.js
class RBACMiddleware {
    constructor() {
        this.permissions = {
            admin: ['read', 'write', 'delete', 'manage'],
            operator: ['read', 'write'],
            viewer: ['read']
        };
    }

    checkPermission(role, action) {
        return (req, res, next) => {
            const userRole = req.user.role;
            
            if (!this.permissions[userRole]?.includes(action)) {
                return res.status(403).json({
                    error: 'Insufficient permissions'
                });
            }
            
            next();
        };
    }

    async validateResourceAccess(userId, resourceId, action) {
        const resource = await Resource.findById(resourceId);
        
        if (!resource) {
            throw new NotFoundError('Resource not found');
        }

        if (!this.canAccessResource(userId, resource, action)) {
            throw new ForbiddenError('Access denied');
        }
    }
}
```

### 2. API Security
```javascript
// middleware/security.middleware.js
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import xss from 'xss-clean';

export const securityMiddleware = {
    rateLimiter: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP'
    }),

    helmet: helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'", 'wss://api.eyenet.com']
            }
        },
        frameguard: { action: 'deny' }
    }),

    xssPrevention: xss(),

    corsConfig: {
        origin: process.env.ALLOWED_ORIGINS.split(','),
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    }
};
```

## Data Security

### 1. Encryption Service
```javascript
// services/encryption.service.js
import crypto from 'crypto';

class EncryptionService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    }

    encrypt(data) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(
            this.algorithm,
            this.key,
            iv
        );

        let encrypted = cipher.update(
            typeof data === 'string' ? data : JSON.stringify(data),
            'utf8',
            'hex'
        );
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }

    decrypt(encryptedData) {
        const decipher = crypto.createDecipheriv(
            this.algorithm,
            this.key,
            Buffer.from(encryptedData.iv, 'hex')
        );

        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

        let decrypted = decipher.update(
            encryptedData.encrypted,
            'hex',
            'utf8'
        );
        decrypted += decipher.final('utf8');

        return JSON.parse(decrypted);
    }
}
```

### 2. Data Masking
```javascript
// utils/data-masking.util.js
class DataMasking {
    static maskSensitiveData(data, fields) {
        const masked = { ...data };
        
        fields.forEach(field => {
            if (masked[field]) {
                masked[field] = this.maskField(
                    masked[field],
                    field
                );
            }
        });
        
        return masked;
    }

    static maskField(value, type) {
        switch (type) {
            case 'email':
                return this.maskEmail(value);
            case 'phone':
                return this.maskPhone(value);
            case 'creditCard':
                return this.maskCreditCard(value);
            default:
                return '*'.repeat(value.length);
        }
    }

    static maskEmail(email) {
        const [local, domain] = email.split('@');
        return `${local[0]}${'*'.repeat(local.length - 2)}${local.slice(-1)}@${domain}`;
    }
}
```

## Network Security

### 1. WebSocket Security
```javascript
// services/websocket.service.js
class SecureWebSocketService {
    constructor() {
        this.io = null;
        this.connectedClients = new Map();
    }

    initialize(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.ALLOWED_ORIGINS.split(','),
                methods: ['GET', 'POST'],
                credentials: true
            },
            pingTimeout: 60000,
            pingInterval: 25000
        });

        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Authentication required'));
                }

                const user = await this.verifyToken(token);
                socket.user = user;
                next();
            } catch (error) {
                next(new Error('Authentication failed'));
            }
        });

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            this.connectedClients.set(socket.id, {
                userId: socket.user.id,
                connectedAt: new Date()
            });

            socket.on('disconnect', () => {
                this.connectedClients.delete(socket.id);
            });

            // Rate limiting per socket
            const rateLimiter = new RateLimiter(socket);
            
            socket.use(([event, ...args], next) => {
                if (!rateLimiter.checkLimit(event)) {
                    return next(new Error('Rate limit exceeded'));
                }
                next();
            });
        });
    }
}
```

### 2. SSL/TLS Configuration
```javascript
// config/ssl.config.js
import fs from 'fs';
import https from 'https';

export const sslConfig = {
    key: fs.readFileSync('/path/to/private.key'),
    cert: fs.readFileSync('/path/to/certificate.crt'),
    ca: fs.readFileSync('/path/to/ca_bundle.crt'),
    
    options: {
        requestCert: true,
        rejectUnauthorized: true,
        ciphers: [
            'ECDHE-ECDSA-AES128-GCM-SHA256',
            'ECDHE-RSA-AES128-GCM-SHA256',
            'ECDHE-ECDSA-AES256-GCM-SHA384',
            'ECDHE-RSA-AES256-GCM-SHA384'
        ].join(':'),
        honorCipherOrder: true,
        minVersion: 'TLSv1.2'
    }
};
```

## Security Monitoring

### 1. Audit Logging
```javascript
// services/audit.service.js
class AuditService {
    async logAction(action) {
        const auditLog = new AuditLog({
            userId: action.userId,
            action: action.type,
            resource: action.resource,
            details: action.details,
            ip: action.ip,
            userAgent: action.userAgent,
            timestamp: new Date()
        });

        await auditLog.save();

        if (this.isSecurityCritical(action)) {
            await this.notifySecurityTeam(action);
        }
    }

    async getAuditTrail(filters) {
        const query = {};
        
        if (filters.userId) {
            query.userId = filters.userId;
        }
        if (filters.action) {
            query.action = filters.action;
        }
        if (filters.dateRange) {
            query.timestamp = {
                $gte: filters.dateRange.start,
                $lte: filters.dateRange.end
            };
        }

        return AuditLog.find(query)
            .sort({ timestamp: -1 })
            .limit(filters.limit || 100);
    }
}
```

### 2. Security Alerts
```javascript
// services/security-alert.service.js
class SecurityAlertService {
    constructor() {
        this.alertThresholds = {
            failedLogins: 5,
            suspiciousIPs: new Set(),
            rateLimit: 100
        };
    }

    async monitorSecurityEvents() {
        // Monitor failed login attempts
        const failedLogins = await this.getRecentFailedLogins();
        this.checkFailedLogins(failedLogins);

        // Monitor suspicious activities
        const suspiciousActivities = await this.getSuspiciousActivities();
        this.analyzeSuspiciousActivities(suspiciousActivities);

        // Monitor API usage
        const apiUsage = await this.getAPIUsage();
        this.checkAPIUsage(apiUsage);
    }

    async handleSecurityAlert(alert) {
        // Log alert
        await this.logSecurityAlert(alert);

        // Notify security team
        await this.notifySecurityTeam(alert);

        // Take automated action if configured
        if (alert.severity === 'high') {
            await this.takeAutomatedAction(alert);
        }
    }
}
```

## Incident Response

### 1. Incident Handler
```javascript
// services/incident.service.js
class IncidentHandler {
    async handleSecurityIncident(incident) {
        // Log incident
        await this.logIncident(incident);

        // Assess severity
        const severity = this.assessSeverity(incident);

        // Take immediate action
        await this.takeImmediateAction(incident, severity);

        // Notify relevant parties
        await this.notifyStakeholders(incident, severity);

        // Start investigation
        await this.initiateInvestigation(incident);
    }

    async takeImmediateAction(incident, severity) {
        switch (severity) {
            case 'critical':
                await this.lockdownSystem();
                break;
            case 'high':
                await this.restrictAccess(incident.affectedResources);
                break;
            case 'medium':
                await this.increasedMonitoring(incident.affectedResources);
                break;
            default:
                await this.logAndMonitor(incident);
        }
    }
}
```

### 2. Recovery Procedures
```javascript
// services/recovery.service.js
class RecoveryService {
    async initiateRecovery(incident) {
        // Create recovery plan
        const recoveryPlan = await this.createRecoveryPlan(incident);

        // Execute recovery steps
        for (const step of recoveryPlan.steps) {
            await this.executeRecoveryStep(step);
        }

        // Verify recovery
        await this.verifyRecovery(incident);

        // Document lessons learned
        await this.documentLessonsLearned(incident);
    }

    async verifyRecovery(incident) {
        // Check system integrity
        await this.checkSystemIntegrity();

        // Verify security measures
        await this.verifySecurityMeasures();

        // Test affected components
        await this.testAffectedComponents(incident.affectedComponents);

        // Generate recovery report
        await this.generateRecoveryReport(incident);
    }
}
```
