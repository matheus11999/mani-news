const mongoose = require('mongoose');
const winston = require('winston');
const { validateAndFixMongoUri, createFallbackUri } = require('./mongoUri');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

class Database {
  constructor() {
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxAttempts = 5;
  }

  async connect() {
    let mongoUri;
    
    try {
      mongoUri = validateAndFixMongoUri(
        process.env.MONGODB_URI || createFallbackUri()
      );
    } catch (error) {
      logger.error('MongoDB URI validation failed:', error.message);
      logger.warn('Using fallback URI for development');
      mongoUri = createFallbackUri();
    }
    
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      retryWrites: true,
      writeConcern: {
        w: 'majority'
      }
    };

    try {
      await mongoose.connect(mongoUri, options);
      this.isConnected = true;
      this.connectionAttempts = 0;
      logger.info('Connected to MongoDB successfully');
      
      // Setup connection event handlers
      this.setupEventHandlers();
      
      return true;
    } catch (error) {
      this.connectionAttempts++;
      logger.error('MongoDB connection error:', error.message);
      
      if (this.connectionAttempts < this.maxAttempts) {
        logger.info(`Retrying connection... Attempt ${this.connectionAttempts}/${this.maxAttempts}`);
        await this.delay(5000);
        return this.connect();
      } else {
        logger.error('Max connection attempts reached. Please check your MongoDB configuration.');
        process.exit(1);
      }
    }
  }

  setupEventHandlers() {
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
      this.isConnected = true;
    });

    mongoose.connection.on('error', (err) => {
      logger.error('Mongoose connection error:', err);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  async disconnect() {
    if (this.isConnected) {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed.');
        this.isConnected = false;
      } catch (error) {
        logger.error('Error closing MongoDB connection:', error);
      }
    }
  }

  async seedData() {
    const { Category, Author } = require('../models');
    
    try {
      // Check if data already exists
      const categoryCount = await Category.countDocuments();
      const authorCount = await Author.countDocuments();
      
      if (categoryCount === 0) {
        await this.seedCategories();
      }
      
      if (authorCount === 0) {
        await this.seedAuthors();
      }
      
      logger.info('Database seeding completed');
    } catch (error) {
      logger.error('Error seeding database:', error);
    }
  }

  async seedCategories() {
    const { Category } = require('../models');
    
    const categories = [
      {
        name: 'Política',
        description: 'Notícias sobre política nacional e internacional',
        color: '#dc2626',
        icon: 'government',
        order: 1
      },
      {
        name: 'Economia',
        description: 'Economia, negócios e mercado financeiro',
        color: '#059669',
        icon: 'chart-trending-up',
        order: 2
      },
      {
        name: 'Esportes',
        description: 'Futebol, olimpíadas e esportes em geral',
        color: '#dc2626',
        icon: 'trophy',
        order: 3
      },
      {
        name: 'Tecnologia',
        description: 'Inovação, gadgets e mundo tech',
        color: '#7c3aed',
        icon: 'cpu-chip',
        order: 4
      },
      {
        name: 'Cultura',
        description: 'Arte, música, cinema e entretenimento',
        color: '#f59e0b',
        icon: 'musical-note',
        order: 5
      },
      {
        name: 'Saúde',
        description: 'Medicina, bem-estar e qualidade de vida',
        color: '#10b981',
        icon: 'heart',
        order: 6
      },
      {
        name: 'Educação',
        description: 'Ensino, universidades e educação',
        color: '#3b82f6',
        icon: 'academic-cap',
        order: 7
      },
      {
        name: 'Mundo',
        description: 'Notícias internacionais',
        color: '#6366f1',
        icon: 'globe-americas',
        order: 8
      }
    ];

    await Category.insertMany(categories);
    logger.info('Categories seeded successfully');
  }

  async seedAuthors() {
    const { Author } = require('../models');
    
    const authors = [
      {
        name: 'Administrador',
        email: 'admin@maninews.com',
        password: 'admin123',
        bio: 'Administrador do sistema Mani News',
        role: 'admin'
      },
      {
        name: 'Editor Chefe',
        email: 'editor@maninews.com',
        password: 'editor123',
        bio: 'Editor responsável pelo conteúdo editorial',
        role: 'editor'
      },
      {
        name: 'Repórter Principal',
        email: 'reporter@maninews.com',
        password: 'reporter123',
        bio: 'Jornalista especializado em política e economia',
        role: 'author'
      }
    ];

    await Author.insertMany(authors);
    logger.info('Authors seeded successfully');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }
}

module.exports = new Database();