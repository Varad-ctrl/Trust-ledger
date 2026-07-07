'use strict';

/**
 * Admin Routes  →  /api/admin/*
 *
 * Every route in this file is protected by TWO middleware layers:
 *
 *   1. authenticate  — verifies the JWT access token (401 if missing/invalid)
 *   2. authorize('ADMIN')  — checks role === 'ADMIN'  (403 if USER)
 *
 * Applied via router.use() so they run for every route without repetition.
 * A developer adding a new admin route cannot accidentally skip auth.
 *
 * Endpoints:
 *
 *   GET   /api/admin/dashboard             — platform stats
 *
 *   GET   /api/admin/users                 — paginated user list
 *   GET   /api/admin/users/:id             — single user + their accounts
 *
 *   GET   /api/admin/accounts              — paginated account list (filterable)
 *   PATCH /api/admin/accounts/:id/freeze   — freeze an account
 *   PATCH /api/admin/accounts/:id/unfreeze — unfreeze an account
 *
 *   GET   /api/admin/audit-logs            — paginated audit log (filterable)
 */

const express      = require('express');
const router       = express.Router();
const ctrl         = require('../controllers/admin.controller');
const authenticate = require('../middleware/authenticate');
const authorize    = require('../middleware/authorize');
const { ROLES }    = require('../constants');

// ── Double-lock every admin route ─────────────────────────────────────────────
// Using router.use() means these two middleware run first, before any handler.
// A USER token hitting any /api/admin/* route gets 403 at this line — the
// controller is never invoked.
router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', ctrl.getDashboard);

// ── Users ─────────────────────────────────────────────────────────────────────
router.get('/users',     ctrl.listUsers);
router.get('/users/:id', ctrl.getUserById);

// ── Accounts ─────────────────────────────────────────────────────────────────
// PATCH used (not PUT) because we're changing a single field (status),
// not replacing the entire resource.
router.get  ('/accounts',              ctrl.listAccounts);
router.patch('/accounts/:id/freeze',   ctrl.freezeAccount);
router.patch('/accounts/:id/unfreeze', ctrl.unfreezeAccount);

// ── Audit Logs ────────────────────────────────────────────────────────────────
router.get('/audit-logs', ctrl.listAuditLogs);

module.exports = router;
