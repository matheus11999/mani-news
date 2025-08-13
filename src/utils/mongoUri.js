const logger = require('./logger');

/**
 * Validates and fixes common MongoDB URI issues
 * @param {string} uri - MongoDB connection string
 * @returns {string} - Fixed MongoDB URI
 */
function validateAndFixMongoUri(uri) {
  if (!uri || typeof uri !== 'string') {
    throw new Error('MongoDB URI is required and must be a string');
  }

  let fixedUri = uri.trim();
  
  // Fix double @ symbols
  if (fixedUri.includes('@@')) {
    logger.warn('MongoDB URI: Fixing double @ symbol');
    fixedUri = fixedUri.replace(/@@/g, '@');
  }
  
  // Validate basic MongoDB URI format
  if (!fixedUri.startsWith('mongodb://') && !fixedUri.startsWith('mongodb+srv://')) {
    throw new Error('Invalid MongoDB URI: Must start with mongodb:// or mongodb+srv://');
  }
  
  // Check for basic required components
  const uriParts = fixedUri.split('@');
  if (uriParts.length < 2 && !fixedUri.includes('localhost')) {
    throw new Error('Invalid MongoDB URI: Missing host information');
  }
  
  // Log sanitized URI (without credentials) for debugging
  const sanitizedUri = fixedUri.replace(/mongodb:\/\/([^:]+):([^@]+)@/, 'mongodb://***:***@');
  logger.info(`MongoDB URI validated: ${sanitizedUri}`);
  
  return fixedUri;
}

/**
 * Extracts database name from MongoDB URI
 * @param {string} uri - MongoDB connection string
 * @returns {string} - Database name
 */
function extractDbName(uri) {
  try {
    const url = new URL(uri);
    const dbName = url.pathname.substring(1).split('?')[0];
    return dbName || 'maninews';
  } catch (error) {
    logger.warn('Could not extract database name from URI, using default');
    return 'maninews';
  }
}

/**
 * Creates a fallback MongoDB URI for development
 * @returns {string} - Development MongoDB URI
 */
function createFallbackUri() {
  return 'mongodb://localhost:27017/maninews';
}

module.exports = {
  validateAndFixMongoUri,
  extractDbName,
  createFallbackUri
};