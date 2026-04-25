import mongoose from 'mongoose';

const websiteSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'deleted'],
    default: 'draft'
  },
  publishedAt: Date,
  businessType: {
    type: String,
    trim: true
  },
  settings: {
    favicon: String,
    seoTitle: String,
    seoDescription: String
  }
}, {
  timestamps: true
});

// Compound unique index for slug per tenant
websiteSchema.index({ tenantId: 1, slug: 1 }, { unique: true });

// Index for status queries
websiteSchema.index({ status: 1 });

const Website = mongoose.model('Website', websiteSchema);

export default Website;