const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Rate limiting configurations
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.logSecurity('rate_limit_exceeded', 'medium', {
        ip: req.ip,
        url: req.url,
        limit: max,
        window: windowMs
      }, req);
      
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// General rate limiter
const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Muitas tentativas de acesso. Tente novamente em 15 minutos.'
);

// Strict rate limiter for sensitive endpoints
const strictLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  10, // limit each IP to 10 requests per windowMs
  'Muitas tentativas. Tente novamente em 15 minutos.'
);

// Login rate limiter
const loginLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 login attempts per 15 minutes
  'Muitas tentativas de login. Tente novamente em 15 minutos.'
);

// Comment rate limiter
const commentLimiter = createRateLimiter(
  5 * 60 * 1000, // 5 minutes
  3, // limit each IP to 3 comments per 5 minutes
  'Muitos comentários. Aguarde 5 minutos antes de comentar novamente.'
);

// Search rate limiter
const searchLimiter = createRateLimiter(
  1 * 60 * 1000, // 1 minute
  30, // limit each IP to 30 searches per minute
  'Muitas buscas. Aguarde um momento antes de buscar novamente.'
);

// Input validation schemas
const validationSchemas = {
  // Post validation
  createPost: [
    body('title')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Título deve ter entre 5 e 200 caracteres')
      .escape(),
    body('content')
      .trim()
      .isLength({ min: 100 })
      .withMessage('Conteúdo deve ter pelo menos 100 caracteres'),
    body('excerpt')
      .optional()
      .trim()
      .isLength({ max: 300 })
      .withMessage('Resumo deve ter no máximo 300 caracteres')
      .escape(),
    body('category')
      .isMongoId()
      .withMessage('Categoria inválida'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags devem ser um array'),
    body('tags.*')
      .optional()
      .trim()
      .isLength({ min: 2, max: 30 })
      .withMessage('Cada tag deve ter entre 2 e 30 caracteres')
      .escape()
  ],

  // Comment validation
  createComment: [
    body('author.name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Nome deve ter entre 2 e 100 caracteres')
      .escape(),
    body('author.email')
      .trim()
      .isEmail()
      .withMessage('Email inválido')
      .normalizeEmail(),
    body('author.website')
      .optional()
      .trim()
      .isURL()
      .withMessage('URL do website inválida'),
    body('content')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Comentário deve ter entre 10 e 1000 caracteres')
      .escape()
  ],

  // User registration validation
  registerUser: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Nome deve ter entre 2 e 100 caracteres')
      .escape(),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Email inválido')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6, max: 128 })
      .withMessage('Senha deve ter entre 6 e 128 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio deve ter no máximo 500 caracteres')
      .escape()
  ],

  // Login validation
  loginUser: [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Email inválido')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 1 })
      .withMessage('Senha é obrigatória')
  ],

  // Search validation
  search: [
    body('q')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Busca deve ter entre 2 e 100 caracteres')
      .escape()
  ],

  // Category validation
  createCategory: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Nome deve ter entre 2 e 50 caracteres')
      .escape(),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Descrição deve ter no máximo 200 caracteres')
      .escape(),
    body('color')
      .optional()
      .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .withMessage('Cor deve ser um código hexadecimal válido')
  ]
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    logger.logSecurity('validation_error', 'low', {
      errors: errors.array(),
      body: req.body,
      url: req.url
    }, req);
    
    return res.status(400).json({
      error: 'Dados inválidos',
      details: errors.array()
    });
  }
  
  next();
};

// XSS Protection middleware
const xssProtection = (req, res, next) => {
  // Additional XSS protection beyond helmet
  const xssPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  const checkForXSS = (obj) => {
    if (typeof obj === 'string') {
      if (xssPattern.test(obj)) {
        return true;
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (checkForXSS(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };

  if (checkForXSS(req.body) || checkForXSS(req.query)) {
    logger.logSecurity('xss_attempt', 'high', {
      body: req.body,
      query: req.query
    }, req);
    
    return res.status(400).json({
      error: 'Conteúdo suspeito detectado'
    });
  }

  next();
};

// SQL Injection protection (even though we use MongoDB)
const sqlInjectionProtection = (req, res, next) => {
  const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)|('(\s|\S)*')/i;
  
  const checkForSQL = (obj) => {
    if (typeof obj === 'string') {
      if (sqlPattern.test(obj)) {
        return true;
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (checkForSQL(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };

  if (checkForSQL(req.body) || checkForSQL(req.query)) {
    logger.logSecurity('sql_injection_attempt', 'high', {
      body: req.body,
      query: req.query
    }, req);
    
    return res.status(400).json({
      error: 'Conteúdo suspeito detectado'
    });
  }

  next();
};

// CSRF Protection for state-changing operations
const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for API endpoints that use other authentication methods
  if (req.path.startsWith('/api/')) {
    return next();
  }

  const token = req.body._csrf || req.headers['x-csrf-token'];
  const sessionToken = req.session.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    logger.logSecurity('csrf_token_invalid', 'medium', {
      providedToken: token,
      sessionToken: sessionToken,
      method: req.method,
      url: req.url
    }, req);
    
    return res.status(403).json({
      error: 'Token CSRF inválido'
    });
  }

  next();
};

// Generate CSRF token
const generateCSRFToken = (req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = require('crypto').randomBytes(32).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
};

// File upload validation
const validateFileUpload = (allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return next();
    }

    const files = req.files || [req.file];
    
    for (const file of files) {
      // Check file size
      if (file.size > maxSize) {
        logger.logSecurity('file_size_exceeded', 'low', {
          filename: file.originalname,
          size: file.size,
          maxSize
        }, req);
        
        return res.status(400).json({
          error: `Arquivo muito grande. Tamanho máximo: ${maxSize / 1024 / 1024}MB`
        });
      }

      // Check file type
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
        logger.logSecurity('invalid_file_type', 'medium', {
          filename: file.originalname,
          mimetype: file.mimetype,
          allowedTypes
        }, req);
        
        return res.status(400).json({
          error: `Tipo de arquivo não permitido. Tipos permitidos: ${allowedTypes.join(', ')}`
        });
      }

      // Check for malicious files
      const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
      const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
      
      if (suspiciousExtensions.includes(fileExtension)) {
        logger.logSecurity('malicious_file_upload', 'high', {
          filename: file.originalname,
          extension: fileExtension
        }, req);
        
        return res.status(400).json({
          error: 'Tipo de arquivo não permitido por motivos de segurança'
        });
      }
    }

    next();
  };
};

// IP whitelist/blacklist middleware
const ipFilter = (whitelist = [], blacklist = []) => {
  return (req, res, next) => {
    const clientIP = req.ip;

    // Check blacklist
    if (blacklist.includes(clientIP)) {
      logger.logSecurity('blacklisted_ip_access', 'high', {
        ip: clientIP,
        url: req.url
      }, req);
      
      return res.status(403).json({
        error: 'Acesso negado'
      });
    }

    // Check whitelist (if configured)
    if (whitelist.length > 0 && !whitelist.includes(clientIP)) {
      logger.logSecurity('non_whitelisted_ip_access', 'medium', {
        ip: clientIP,
        url: req.url
      }, req);
      
      return res.status(403).json({
        error: 'Acesso negado'
      });
    }

    next();
  };
};

module.exports = {
  // Rate limiters
  generalLimiter,
  strictLimiter,
  loginLimiter,
  commentLimiter,
  searchLimiter,
  
  // Validation schemas
  validationSchemas,
  handleValidationErrors,
  
  // Security middleware
  xssProtection,
  sqlInjectionProtection,
  csrfProtection,
  generateCSRFToken,
  validateFileUpload,
  ipFilter,
  
  // Utility functions
  createRateLimiter
};