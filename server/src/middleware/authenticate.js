const { verifyAccessToken } = require('../utils/token');
const { error } = require('../utils/response');
const { HTTP, MESSAGES } = require('../constants');

/**
 * Verifies the JWT access token from the Authorization header.
 * Attaches { id, email, role } to req.user on success.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return error(res, { status: HTTP.UNAUTHORIZED, message: MESSAGES.UNAUTHORIZED });
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? MESSAGES.TOKEN_EXPIRED : MESSAGES.TOKEN_INVALID;
    return error(res, { status: HTTP.UNAUTHORIZED, message });
  }
};

module.exports = authenticate;
