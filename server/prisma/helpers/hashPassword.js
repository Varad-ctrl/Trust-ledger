const bcrypt = require('bcryptjs');

const ROUNDS = 12;

/**
 * Hash a plaintext password using bcrypt.
 * 12 rounds matches the production config in .env (BCRYPT_ROUNDS=12).
 * Keeping this consistent means seeded passwords behave identically
 * to passwords created through the registration endpoint.
 */
const hashPassword = async (plaintext) => {
  return bcrypt.hash(plaintext, ROUNDS);
};

module.exports = { hashPassword };
