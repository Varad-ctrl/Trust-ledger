'use strict';

/**
 * Dashboard Routes  →  /api/dashboard
 *
 * All routes require a valid JWT access token.
 * The authenticate middleware populates req.user before any handler runs.
 *
 * GET /api/dashboard
 *   Returns the complete dashboard payload for the logged-in user:
 *   user profile, summary stats, active accounts, and recent transactions.
 */

const express      = require('express');
const router       = express.Router();
const ctrl         = require('../controllers/dashboard.controller');
const authenticate = require('../middleware/authenticate');

router.get('/', authenticate, ctrl.getDashboard);

module.exports = router;
