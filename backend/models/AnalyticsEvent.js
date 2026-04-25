import mongoose from 'mongoose';

const analyticsEventSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  websiteId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  pageSlug: {
    type: String,
    required: true,
    trim: true
  },
  viewedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  userAgent: {
    type: String,
    trim: true
  }
}, {
  timestamps: false // No need for createdAt/updatedAt on events
});

// TTL index to auto-delete after 90 days
analyticsEventSchema.index({ viewedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

// Additional indexes for queries
analyticsEventSchema.index({ tenantId: 1 });
analyticsEventSchema.index({ websiteId: 1 });

const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);

export default AnalyticsEvent;