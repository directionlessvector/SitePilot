import mongoose from 'mongoose';

const deploymentSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  websiteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Website',
    required: true,
    index: true
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contentSnapshot: [{
    pageId: mongoose.Schema.Types.ObjectId,
    title: String,
    slug: String,
    content: [mongoose.Schema.Types.Mixed]
  }]
}, {
  timestamps: true
});

// Indexes
deploymentSchema.index({ tenantId: 1 });
deploymentSchema.index({ websiteId: 1 });

const Deployment = mongoose.model('Deployment', deploymentSchema);

export default Deployment;