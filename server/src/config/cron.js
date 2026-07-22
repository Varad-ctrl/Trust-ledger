'use strict';
const cron = require('node-cron');
const scheduledService = require('../services/scheduled.service');
const standingService  = require('../services/standing.service');
const logger = require('./logger');

const startCronJobs = () => {
  cron.schedule('* * * * *', async () => {
    try { await scheduledService.executePending(); } catch (e) { logger.error('[CRON] scheduled:', e.message); }
  });
  cron.schedule('0 * * * *', async () => {
    try { await standingService.executeDue(); } catch (e) { logger.error('[CRON] standing:', e.message); }
  });
  logger.info('⏰ Cron jobs started (scheduled: 1min, standing: 1hr)');
};
module.exports = { startCronJobs };
