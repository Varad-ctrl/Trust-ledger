const prisma = require('../config/prisma');
const logger = require('../config/logger');

/**
 * Factory: returns middleware that writes an audit log entry after the response.
 * Usage: router.post('/login', auditLog('USER_LOGIN'), handler)
 */
const auditLog = (action) => async (req, res, next) => {
  res.on('finish', async () => {
    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user?.id || null,
          action,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: { method: req.method, path: req.path, statusCode: res.statusCode },
        },
      });
    } catch (err) {
      logger.error('Audit log failed', { error: err.message });
    }
  });
  next();
};

module.exports = auditLog;
