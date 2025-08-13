require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const logger = require('./src/utils/logger');
const { validateAndFixMongoUri, createFallbackUri } = require('./src/utils/mongoUri');
const { generalLimiter, generateCSRFToken, xssProtection } = require('./src/middleware/security');

const database = require('./src/utils/database');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Compression
app.use(compression());

// Rate limiting
app.use(generalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
let sessionMongoUri;
try {
  sessionMongoUri = validateAndFixMongoUri(
    process.env.MONGODB_URI || createFallbackUri()
  );
} catch (error) {
  logger.error('Session MongoDB URI validation failed:', error.message);
  sessionMongoUri = createFallbackUri();
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: sessionMongoUri,
    touchAfter: 24 * 3600 // lazy session update
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Security middleware
app.use(xssProtection);
app.use(generateCSRFToken);

// Global middleware for template variables
app.use((req, res, next) => {
  res.locals.APP_NAME = process.env.APP_NAME || 'Mani News';
  res.locals.currentUrl = req.url;
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  res.locals.req = req; // Make request available in templates
  next();
});

// Routes
app.get('/', async (req, res) => {
  try {
    const { Post, Category } = require('./src/models');
    
    // Get featured posts
    const featuredPosts = await Post.getFeatured(5);
    
    // Get latest posts
    const latestPosts = await Post.getPublished().limit(10);
    
    // Get categories for menu
    const categories = await Category.getMenuCategories();
    
    res.render('layouts/main', {
      page: 'home',
      title: 'Início',
      featuredPosts,
      latestPosts,
      categories,
      metaDescription: 'Mani News - Seu portal de notícias atualizado com as principais informações do Brasil e do mundo.'
    });
  } catch (error) {
    logger.error('Error loading homepage:', error);
    res.status(500).render('pages/error', {
      title: 'Erro',
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

app.get('/noticia/:slug', async (req, res) => {
  try {
    const { Post } = require('./src/models');
    
    const post = await Post.findOne({ 
      slug: req.params.slug, 
      status: 'published' 
    })
      .populate('category', 'name slug color')
      .populate('author', 'name bio avatar social');
    
    if (!post) {
      return res.status(404).render('pages/error', {
        title: 'Página não encontrada',
        message: 'A notícia que você procura não foi encontrada.',
        error: {}
      });
    }
    
    // Increment views
    await post.incrementViews();
    
    // Get related posts
    const relatedPosts = await Post.find({
      category: post.category._id,
      _id: { $ne: post._id },
      status: 'published'
    })
      .populate('category', 'name slug color')
      .populate('author', 'name avatar')
      .limit(4)
      .sort({ publishedAt: -1 });
    
    res.render('layouts/main', {
      page: 'post',
      title: post.title,
      post,
      relatedPosts,
      metaTitle: post.metaTitle || post.title,
      metaDescription: post.metaDescription || post.excerpt
    });
  } catch (error) {
    logger.error('Error loading post:', error);
    res.status(500).render('pages/error', {
      title: 'Erro',
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

app.get('/categoria/:slug', async (req, res) => {
  try {
    const { Category, Post } = require('./src/models');
    
    const category = await Category.findOne({ 
      slug: req.params.slug, 
      isActive: true 
    });
    
    if (!category) {
      return res.status(404).render('pages/error', {
        title: 'Categoria não encontrada',
        message: 'A categoria que você procura não foi encontrada.',
        error: {}
      });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;
    
    const posts = await Post.find({ 
      category: category._id, 
      status: 'published' 
    })
      .populate('category', 'name slug color')
      .populate('author', 'name avatar')
      .sort({ publishedAt: -1 })
      .limit(limit)
      .skip(skip);
    
    const totalPosts = await Post.countDocuments({ 
      category: category._id, 
      status: 'published' 
    });
    
    const totalPages = Math.ceil(totalPosts / limit);
    
    res.render('layouts/main', {
      page: 'category',
      title: category.name,
      category,
      posts,
      pagination: {
        current: page,
        total: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      metaDescription: category.description || `Notícias de ${category.name}`
    });
  } catch (error) {
    logger.error('Error loading category:', error);
    res.status(500).render('pages/error', {
      title: 'Erro',
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

app.get('/buscar', async (req, res) => {
  try {
    const { Post } = require('./src/models');
    const query = req.query.q || '';
    
    if (!query.trim()) {
      return res.render('layouts/main', {
        page: 'search',
        title: 'Buscar',
        query: '',
        posts: [],
        totalResults: 0
      });
    }
    
    const posts = await Post.search(query)
      .populate('category', 'name slug color')
      .populate('author', 'name avatar')
      .limit(20);
    
    res.render('layouts/main', {
      page: 'search',
      title: `Buscar: ${query}`,
      query,
      posts,
      totalResults: posts.length,
      metaDescription: `Resultados da busca para: ${query}`
    });
  } catch (error) {
    logger.error('Error in search:', error);
    res.status(500).render('pages/error', {
      title: 'Erro',
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    const dbStatus = database.getConnectionStatus();
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      env: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Service temporarily unavailable'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('pages/error', {
    title: 'Página não encontrada',
    message: 'A página que você procura não existe.',
    error: {}
  });
});

// Error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(error.status || 500).render('pages/error', {
    title: 'Erro',
    message: error.message || 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? error : {}
  });
});

// Start server
async function startServer() {
  try {
    // Start server first (for health checks)
    const server = app.listen(PORT, () => {
      logger.info(`Mani News server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Access: http://localhost:${PORT}`);
    });

    // Connect to database (non-blocking)
    try {
      await database.connect();
      
      // Seed initial data
      await database.seedData();
      
      logger.info('Database connected and seeded successfully');
    } catch (dbError) {
      logger.error('Database connection failed, but server is running:', dbError);
      // Continue running without database for health checks
    }

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();