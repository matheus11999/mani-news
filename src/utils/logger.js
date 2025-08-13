const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'mani-news' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}]: ${message}`;
        })
      )
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log')
    })
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log')
    })
  ]
});

// Create a stream object for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Add request logging helper
logger.logRequest = (req, res, responseTime) => {
  const { method, url, ip } = req;
  const { statusCode } = res;
  const userAgent = req.get('User-Agent') || '';
  
  logger.info(`${method} ${url} ${statusCode} ${responseTime}ms - ${ip} - ${userAgent}`);
};

// Add error logging helper
logger.logError = (error, req = null) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  };
  
  if (req) {
    errorInfo.request = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query,
      ip: req.ip
    };
  }
  
  logger.error('Application Error', errorInfo);
};

// Add authentication logging
logger.logAuth = (action, user, req, success = true) => {
  const logData = {
    action,
    user: user ? { id: user._id, email: user.email } : null,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    success,
    timestamp: new Date().toISOString()
  };
  
  if (success) {
    logger.info(`Auth Success: ${action}`, logData);
  } else {
    logger.warn(`Auth Failed: ${action}`, logData);
  }
};

// Add database logging
logger.logDatabase = (operation, collection, query = null, error = null) => {
  const logData = {
    operation,
    collection,
    query,
    timestamp: new Date().toISOString()
  };
  
  if (error) {
    logger.error(`Database Error: ${operation} on ${collection}`, { ...logData, error: error.message });
  } else {
    logger.debug(`Database Operation: ${operation} on ${collection}`, logData);
  }
};

// Add performance logging
logger.logPerformance = (operation, duration, details = {}) => {
  const logData = {
    operation,
    duration: `${duration}ms`,
    ...details,
    timestamp: new Date().toISOString()
  };
  
  if (duration > 1000) {
    logger.warn(`Slow Operation: ${operation}`, logData);
  } else {
    logger.debug(`Performance: ${operation}`, logData);
  }
};

// Add security logging
logger.logSecurity = (event, severity, details, req = null) => {
  const logData = {
    event,
    severity,
    details,
    timestamp: new Date().toISOString()
  };
  
  if (req) {
    logData.request = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method
    };
  }
  
  if (severity === 'high') {
    logger.error(`Security Alert: ${event}`, logData);
  } else if (severity === 'medium') {
    logger.warn(`Security Warning: ${event}`, logData);
  } else {
    logger.info(`Security Event: ${event}`, logData);
  }
};

module.exports = logger;