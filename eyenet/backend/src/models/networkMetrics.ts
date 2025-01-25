import mongoose from 'mongoose';
import { NetworkState } from '../types/monitoring';

const networkMetricsSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  latency: {
    type: Number,
    required: true
  },
  packetLoss: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'degraded'],
    required: true
  },
  bandwidth: {
    download: {
      type: Number,
      required: true
    },
    upload: {
      type: Number,
      required: true
    }
  },
  departmentUsage: [{
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    usage: {
      type: Number,
      required: true
    }
  }],
  applicationUsage: [{
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true
    },
    bandwidth: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['normal', 'high', 'critical'],
      required: true
    },
    trend: {
      type: String,
      enum: ['up', 'down', 'stable'],
      required: true
    }
  }]
});

// Index for efficient time-based queries
networkMetricsSchema.index({ timestamp: -1 });

export const NetworkMetrics = mongoose.model('NetworkMetrics', networkMetricsSchema);
