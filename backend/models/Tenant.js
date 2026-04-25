import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'business'],
    default: 'free'
  },
  usage: {
    aiCallsUsed: { type: Number, default: 0 },
    storageUsed: { type: Number, default: 0 },
    periodStart: { type: Date, default: Date.now }
  },
  branding: {
    primaryColor: { type: String, default: '#1a6ef5' },
    logoUrl: { type: String, default: null },
    fontFamily: { type: String, default: 'Inter' }
  },
  customDomain: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for faster queries
tenantSchema.index({ status: 1 });

const Tenant = mongoose.model('Tenant', tenantSchema);

export default Tenant;