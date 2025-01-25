import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  bandwidthLimit: {
    type: Number,
    required: true,
    default: 100 // Default bandwidth limit in Mbps
  },
  priority: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
    max: 5
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
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
departmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Department = mongoose.model('Department', departmentSchema);
