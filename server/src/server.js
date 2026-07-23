'use strict';
require('dotenv').config();
const app = require('./app');
const prisma = require('./config/prisma');
const logger = require('./config/logger');
const { startCronJobs } = require('./config/cron');
const { register } = require("./monitoring/metrics");
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await prisma.$connect();
    logger.info('✅ Connected to PostgreSQL');
    app.listen(PORT, () => logger.info(`🚀 FinCore v1.1 running on http://localhost:${PORT}`));
    startCronJobs();
  } catch (err) {
    logger.error('❌ Startup failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
};
process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0); });
start();
