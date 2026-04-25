import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'editor'],
    default: 'editor'
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ tenantId: 1 });
userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);

export default User;