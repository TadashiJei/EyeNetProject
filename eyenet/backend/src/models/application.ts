import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'Communication',
      'Database',
      'Development',
      'Office',
      'Security',
      'Streaming',
      'Other'
    ]
  },
  description: {
    type: String,
    trim: true
  },
  bandwidthLimit: {
    type: Number,
    required: true,
    default: 50 // Default bandwidth limit in Mbps
  },
  priority: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
    max: 5
  },
  ports: [{
    port: {
      type: Number,
      required: true
    },
    protocol: {
      type: String,
      enum: ['TCP', 'UDP', 'Both'],
      required: true
    }
  }],
  departments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }],
  thresholds: {
    warning: {
      type: Number,
      required: true,
      default: 70 // 70% of bandwidth limit
    },
    critical: {
      type: Number,
      required: true,
      default: 90 // 90% of bandwidth limit
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
applicationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create compound index for efficient queries
applicationSchema.index({ name: 1, type: 1 });

export const Application = mongoose.model('Application', applicationSchema);
