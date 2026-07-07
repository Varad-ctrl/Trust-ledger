/**
 * Standardised API response helpers.
 * All responses follow the shape: { success, message, data?, errors? }
 */

const success = (res, { status = 200, message = 'Success', data = null } = {}) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  return res.status(status).json(body);
};

const error = (res, { status = 500, message = 'Internal server error', errors = null } = {}) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(status).json(body);
};

module.exports = { success, error };
