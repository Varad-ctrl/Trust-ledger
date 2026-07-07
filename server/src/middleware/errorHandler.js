const logger = require('../config/logger');
const { HTTP, MESSAGES } = require('../constants');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, path: req.path });

  // Prisma known errors
  if (err.code === 'P2002') {
    return res.status(HTTP.CONFLICT).json({ success: false, message: 'A record with that value already exists.' });
  }
  if (err.code === 'P2025') {
    return res.status(HTTP.NOT_FOUND).json({ success: false, message: MESSAGES.NOT_FOUND });
  }

  const status = err.status || HTTP.SERVER_ERROR;
  const message = status < 500 ? err.message : MESSAGES.SERVER_ERROR;

  res.status(status).json({ success: false, message });
};

module.exports = errorHandler;
