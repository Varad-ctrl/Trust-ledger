require('dotenv').config();
const app = require('./app');
const prisma = require('./config/prisma');
const logger = require('./config/logger');

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // Verify database connection
    await prisma.$connect();
    logger.info('✅ Connected to PostgreSQL via Prisma');

    app.listen(PORT, () => {
      logger.info(`🚀 FinCore API running on http://localhost:${PORT}`);
      logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    logger.error('❌ Failed to start server:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

start();
