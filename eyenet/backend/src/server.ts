import express from 'express';
import cors from 'cors';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import NetworkMonitor from './websocket/networkMonitor';
import monitoringRoutes from './api/routes/monitoring';
import authRoutes from './api/routes/auth';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eyenet';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3006'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

const HTTP_PORT = parseInt(process.env.PORT || '3006', 10);
const WS_PORT = HTTP_PORT + 1; // Use next port number for WebSocket

// Initialize WebSocket server
const networkMonitor = new NetworkMonitor(WS_PORT);

server.listen(HTTP_PORT, () => {
  console.log(`HTTP server running on port ${HTTP_PORT}`);
  console.log(`WebSocket server running on port ${WS_PORT}`);
});
