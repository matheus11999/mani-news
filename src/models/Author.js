const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const authorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    maxlength: [100, 'Nome deve ter no máximo 100 caracteres'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: [6, 'Senha deve ter no mínimo 6 caracteres']
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio deve ter no máximo 500 caracteres'],
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  social: {
    twitter: {
      type: String,
      trim: true
    },
    linkedin: {
      type: String,
      trim: true
    },
    instagram: {
      type: String,
      trim: true
    },
    facebook: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    }
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'author'],
    default: 'author'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  postCount: {
    type: Number,
    default: 0
  },
  totalViews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes
authorSchema.index({ email: 1 });
authorSchema.index({ role: 1, isActive: 1 });
authorSchema.index({ name: 'text', bio: 'text' });

// Virtual for account locked
authorSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for full name display
authorSchema.virtual('displayName').get(function() {
  return this.name;
});

// Virtual for avatar URL
authorSchema.virtual('avatarUrl').get(function() {
  if (this.avatar) {
    return this.avatar.startsWith('http') ? this.avatar : `/uploads/authors/${this.avatar}`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&size=150&background=3b82f6&color=fff`;
});

// Pre-save middleware
authorSchema.pre('save', async function(next) {
  // Hash password if modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Static methods
authorSchema.statics.getActive = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

authorSchema.statics.updatePostCount = async function(authorId) {
  const Post = mongoose.model('Post');
  const count = await Post.countDocuments({
    author: authorId,
    status: 'published'
  });
  
  await this.findByIdAndUpdate(authorId, { postCount: count });
  return count;
};

authorSchema.statics.updateTotalViews = async function(authorId) {
  const Post = mongoose.model('Post');
  const result = await Post.aggregate([
    { $match: { author: mongoose.Types.ObjectId(authorId), status: 'published' } },
    { $group: { _id: null, totalViews: { $sum: '$views' } } }
  ]);
  
  const totalViews = result.length > 0 ? result[0].totalViews : 0;
  await this.findByIdAndUpdate(authorId, { totalViews });
  return totalViews;
};

// Instance methods
authorSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

authorSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account for 2 hours after 5 failed attempts
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

authorSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: new Date() }
  });
};

authorSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

authorSchema.methods.isEditor = function() {
  return this.role === 'admin' || this.role === 'editor';
};

authorSchema.methods.canEdit = function() {
  return this.role === 'admin' || this.role === 'editor';
};

module.exports = mongoose.model('Author', authorSchema);