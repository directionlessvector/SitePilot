import mongoose from 'mongoose';

const pageSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  websiteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Website',
    required: true,
    index: true
  },
  title: {
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
  draftContent: [{
    type: mongoose.Schema.Types.Mixed
  }],
  liveContent: [{
    type: mongoose.Schema.Types.Mixed
  }],
  order: {
    type: Number,
    default: 0
  },
  isHomepage: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// ✅ Keep ONLY these indexes
pageSchema.index({ websiteId: 1, slug: 1 }, { unique: true });
pageSchema.index({ tenantId: 1 });

const Page = mongoose.model('Page', pageSchema);

export default Page;