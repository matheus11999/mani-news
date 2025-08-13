const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome da categoria é obrigatório'],
    maxlength: [50, 'Nome deve ter no máximo 50 caracteres'],
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    maxlength: [200, 'Descrição deve ter no máximo 200 caracteres'],
    trim: true
  },
  color: {
    type: String,
    default: '#3b82f6',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor deve ser um código hexadecimal válido']
  },
  icon: {
    type: String,
    default: 'folder'
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  showInMenu: {
    type: Boolean,
    default: true
  },
  postCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
categorySchema.index({ name: 1 });
categorySchema.index({ order: 1, name: 1 });
categorySchema.index({ isActive: 1, showInMenu: 1 });

// Virtual for URL
categorySchema.virtual('url').get(function() {
  return `/categoria/${this.slug}`;
});

// Pre-save middleware
categorySchema.pre('save', function(next) {
  // Generate slug if not provided
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

// Static methods
categorySchema.statics.getActive = function() {
  return this.find({ isActive: true }).sort({ order: 1, name: 1 });
};

categorySchema.statics.getMenuCategories = function() {
  return this.find({ isActive: true, showInMenu: true })
    .sort({ order: 1, name: 1 });
};

categorySchema.statics.updatePostCount = async function(categoryId) {
  const Post = mongoose.model('Post');
  const count = await Post.countDocuments({
    category: categoryId,
    status: 'published'
  });
  
  await this.findByIdAndUpdate(categoryId, { postCount: count });
  return count;
};

// Instance methods
categorySchema.methods.getPostCount = async function() {
  const Post = mongoose.model('Post');
  const count = await Post.countDocuments({
    category: this._id,
    status: 'published'
  });
  return count;
};

module.exports = mongoose.model('Category', categorySchema);