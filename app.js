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

// Session configuration with memory store (no MongoDB dependency)
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
  // Using default memory store for now - will upgrade to MongoDB store once DB is connected
};

app.use(session(sessionConfig));
logger.info('Using memory session store (will upgrade to MongoDB when available)');

// Remove EJS view engine setup - now using React

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

// API Routes
app.get('/api/posts', async (req, res) => {
  try {
    if (!database.isConnected) {
      return res.json([]);
    }

    const { Post } = require('./src/models');
    const posts = await Post.getPublished()
      .populate('category', 'name slug')
      .populate('author', 'name avatar')
      .limit(20)
      .sort({ publishedAt: -1 });
    
    res.json(posts);
  } catch (error) {
    logger.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/posts/:slug', async (req, res) => {
  try {
    if (!database.isConnected) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const { Post } = require('./src/models');
    const post = await Post.findOne({ 
      slug: req.params.slug, 
      status: 'published' 
    })
      .populate('category', 'name slug')
      .populate('author', 'name bio avatar');
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Increment views
    await post.incrementViews();
    
    res.json(post);
  } catch (error) {
    logger.error('Error fetching post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    if (!database.isConnected) {
      // Return default categories for demo
      return res.json([
        { name: 'Política', slug: 'politica' },
        { name: 'Economia', slug: 'economia' },
        { name: 'Esportes', slug: 'esportes' },
        { name: 'Tecnologia', slug: 'tecnologia' },
        { name: 'Mundo', slug: 'mundo' },
        { name: 'Cultura', slug: 'cultura' },
        { name: 'Saúde', slug: 'saude' },
        { name: 'Educação', slug: 'educacao' }
      ]);
    }

    const { Category } = require('./src/models');
    const categories = await Category.getMenuCategories();
    res.json(categories);
  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/categoria/:slug', async (req, res) => {
  try {
    if (!database.isConnected) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const { Category, Post } = require('./src/models');
    
    const category = await Category.findOne({ 
      slug: req.params.slug, 
      isActive: true 
    });
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;
    
    const posts = await Post.find({ 
      category: category._id, 
      status: 'published' 
    })
      .populate('category', 'name slug')
      .populate('author', 'name avatar')
      .sort({ publishedAt: -1 })
      .limit(limit)
      .skip(skip);
    
    const totalPosts = await Post.countDocuments({ 
      category: category._id, 
      status: 'published' 
    });
    
    const totalPages = Math.ceil(totalPosts / limit);
    
    res.json({
      category,
      posts,
      pagination: {
        current: page,
        total: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    logger.error('Error fetching category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    
    if (!query.trim()) {
      return res.json([]);
    }

    if (!database.isConnected) {
      return res.json([]);
    }
    
    const { Post } = require('./src/models');
    const posts = await Post.search(query)
      .populate('category', 'name slug')
      .populate('author', 'name avatar')
      .limit(20);
    
    res.json(posts);
  } catch (error) {
    logger.error('Error in search:', error);
    res.status(500).json({ error: 'Internal server error' });
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
  res.status(404).render('layouts/main', {
    page: 'error',
    title: 'Página não encontrada',
    message: 'A página que você procura não existe.',
    error: {}
  });
});

// Error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(error.status || 500).render('layouts/main', {
    page: 'error',
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