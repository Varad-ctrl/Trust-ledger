'use strict';

/**
 * Auth Routes
 *
 * Public routes (no token required):
 *   POST /api/auth/register
 *   POST /api/auth/login
 *   POST /api/auth/refresh
 *
 * Protected routes (valid access token required):
 *   POST /api/auth/logout
 *   POST /api/auth/logout-all
 *   GET  /api/auth/sessions
 *
 * Rate limiting is applied at the app.js level:
 *   authLimiter → 20 requests per 15 minutes per IP
 */

const express      = require('express');
const router       = express.Router();
const ctrl         = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');
const validate     = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} = require('../validations/auth.validation');

// ── Public ────────────────────────────────────────────────────────────────────
router.post('/register', validate(registerSchema), ctrl.register);
router.post('/login',    validate(loginSchema),    ctrl.login);
router.post('/refresh',  validate(refreshSchema),  ctrl.refresh);

// ── Protected ─────────────────────────────────────────────────────────────────
// authenticate verifies the Bearer token and attaches req.user
// logoutSchema ensures a refreshToken is in the body so we can revoke it
router.post('/logout',     authenticate, validate(logoutSchema), ctrl.logout);
router.post('/logout-all', authenticate,                         ctrl.logoutAll);
router.get('/sessions',    authenticate,                         ctrl.getSessions);

module.exports = router;
