const { error } = require('../utils/response');
const { HTTP, MESSAGES } = require('../constants');

/**
 * Returns Express middleware that validates req.body against a Zod schema.
 * On failure, responds with 422 + formatted field errors.
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return error(res, { status: HTTP.UNPROCESSABLE, message: MESSAGES.VALIDATION_ERROR, errors });
  }
  req.body = result.data; // use parsed/coerced data
  next();
};

module.exports = validate;
