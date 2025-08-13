const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Título é obrigatório'],
    maxlength: [200, 'Título deve ter no máximo 200 caracteres'],
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  content: {
    type: String,
    required: [true, 'Conteúdo é obrigatório']
  },
  excerpt: {
    type: String,
    maxlength: [300, 'Resumo deve ter no máximo 300 caracteres'],
    trim: true
  },
  featuredImage: {
    type: String,
    default: null
  },
  imageAlt: {
    type: String,
    default: ''
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Categoria é obrigatória']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Author',
    required: [true, 'Autor é obrigatório']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date,
    default: null
  },
  scheduledFor: {
    type: Date,
    default: null
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  metaTitle: {
    type: String,
    maxlength: [60, 'Meta título deve ter no máximo 60 caracteres']
  },
  metaDescription: {
    type: String,
    maxlength: [160, 'Meta descrição deve ter no máximo 160 caracteres']
  },
  readingTime: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
postSchema.index({ title: 'text', content: 'text', excerpt: 'text' });
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ category: 1, status: 1 });
postSchema.index({ author: 1, status: 1 });
postSchema.index({ featured: 1, status: 1 });
postSchema.index({ createdAt: -1 });

// Virtual for URL
postSchema.virtual('url').get(function() {
  return `/noticia/${this.slug}`;
});

// Virtual for formatted date
postSchema.virtual('formattedDate').get(function() {
  const date = this.publishedAt || this.createdAt;
  return date.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Virtual for short date
postSchema.virtual('shortDate').get(function() {
  const date = this.publishedAt || this.createdAt;
  return date.toLocaleDateString('pt-BR');
});

// Pre-save middleware
postSchema.pre('save', function(next) {
  // Generate slug if not provided
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  
  // Generate excerpt if not provided
  if (!this.excerpt && this.content) {
    this.excerpt = this.content
      .replace(/<[^>]*>/g, '')
      .substring(0, 200) + '...';
  }
  
  // Calculate reading time (average 200 words per minute)
  if (this.content) {
    const wordCount = this.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / 200);
  }
  
  // Set publishedAt when status changes to published
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Generate meta fields if not provided
  if (!this.metaTitle) {
    this.metaTitle = this.title.substring(0, 60);
  }
  
  if (!this.metaDescription) {
    this.metaDescription = this.excerpt ? this.excerpt.substring(0, 160) : '';
  }
  
  next();
});

// Static methods
postSchema.statics.getPublished = function() {
  return this.find({ status: 'published' })
    .populate('category', 'name slug color')
    .populate('author', 'name avatar')
    .sort({ publishedAt: -1 });
};

postSchema.statics.getFeatured = function(limit = 5) {
  return this.find({ status: 'published', featured: true })
    .populate('category', 'name slug color')
    .populate('author', 'name avatar')
    .sort({ publishedAt: -1 })
    .limit(limit);
};

postSchema.statics.getByCategory = function(categoryId) {
  return this.find({ status: 'published', category: categoryId })
    .populate('category', 'name slug color')
    .populate('author', 'name avatar')
    .sort({ publishedAt: -1 });
};

postSchema.statics.search = function(query) {
  return this.find({
    $text: { $search: query },
    status: 'published'
  })
    .populate('category', 'name slug color')
    .populate('author', 'name avatar')
    .sort({ score: { $meta: 'textScore' } });
};

// Instance methods
postSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

postSchema.methods.isPublished = function() {
  return this.status === 'published';
};

module.exports = mongoose.model('Post', postSchema);