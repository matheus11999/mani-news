const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  author: {
    name: {
      type: String,
      required: [true, 'Nome é obrigatório'],
      maxlength: [100, 'Nome deve ter no máximo 100 caracteres'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email é obrigatório'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
    },
    website: {
      type: String,
      trim: true
    }
  },
  content: {
    type: String,
    required: [true, 'Comentário é obrigatório'],
    maxlength: [1000, 'Comentário deve ter no máximo 1000 caracteres'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'spam'],
    default: 'pending'
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  likes: {
    type: Number,
    default: 0
  },
  dislikes: {
    type: Number,
    default: 0
  },
  reportCount: {
    type: Number,
    default: 0
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
commentSchema.index({ post: 1, status: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ status: 1, createdAt: -1 });

// Virtual for formatted date
commentSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Virtual for relative time
commentSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return this.createdAt.toLocaleDateString('pt-BR');
});

// Virtual for avatar
commentSchema.virtual('avatarUrl').get(function() {
  return `https://www.gravatar.com/avatar/${require('crypto').createHash('md5').update(this.author.email.toLowerCase()).digest('hex')}?s=50&d=identicon`;
});

// Static methods
commentSchema.statics.getApproved = function(postId) {
  return this.find({ 
    post: postId, 
    status: 'approved',
    parentComment: null 
  })
    .populate('replies')
    .sort({ createdAt: -1 });
};

commentSchema.statics.getPending = function() {
  return this.find({ status: 'pending' })
    .populate('post', 'title slug')
    .sort({ createdAt: -1 });
};

commentSchema.statics.getByStatus = function(status) {
  return this.find({ status })
    .populate('post', 'title slug')
    .sort({ createdAt: -1 });
};

// Instance methods
commentSchema.methods.approve = function() {
  this.status = 'approved';
  return this.save();
};

commentSchema.methods.reject = function() {
  this.status = 'rejected';
  return this.save();
};

commentSchema.methods.markAsSpam = function() {
  this.status = 'spam';
  return this.save();
};

commentSchema.methods.addReply = function(replyId) {
  this.replies.push(replyId);
  return this.save();
};

commentSchema.methods.isApproved = function() {
  return this.status === 'approved';
};

commentSchema.methods.canReply = function() {
  return this.status === 'approved' && !this.parentComment;
};

// Pre-save middleware
commentSchema.pre('save', function(next) {
  // Clean content (basic XSS protection)
  if (this.isModified('content')) {
    this.content = this.content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }
  
  // Mark as edited if content changed
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  
  next();
});

module.exports = mongoose.model('Comment', commentSchema);