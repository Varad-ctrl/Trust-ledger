'use strict';

/**
 * Admin Controller
 *
 * HTTP boundary only — extract from req, call service, send response.
 * Every handler here is already protected by:
 *   authenticate  → valid JWT required
 *   authorize('ADMIN')  → role must be ADMIN
 *
 * If either middleware fails, execution never reaches these handlers.
 */

const adminService = require('../services/admin.service');
const { success }  = require('../utils/response');
const { MESSAGES } = require('../constants');

// ─── Shared meta extractor ───────────────────────────────────────────────────
const getMeta = (req) => ({
  ip:        req.ip || req.headers['x-forwarded-for'] || null,
  userAgent: req.headers['user-agent'] || null,
});

// =============================================================================
// GET /api/admin/dashboard
// =============================================================================
const getDashboard = async (req, res, next) => {
  try {
    const data = await adminService.getDashboard();
    success(res, { data });
  } catch (err) { next(err); }
};

// =============================================================================
// GET /api/admin/users
// Query: ?page=1&limit=20&role=USER&isVerified=true
// =============================================================================
const listUsers = async (req, res, next) => {
  try {
    const { page, limit, role, isVerified } = req.query;
    const data = await adminService.listUsers({ page, limit, role, isVerified });
    success(res, { data });
  } catch (err) { next(err); }
};

// =============================================================================
// GET /api/admin/users/:id
// =============================================================================
const getUserById = async (req, res, next) => {
  try {
    const data = await adminService.getUserById(req.params.id);
    success(res, { data });
  } catch (err) { next(err); }
};

// =============================================================================
// GET /api/admin/accounts
// Query: ?page=1&limit=20&status=FROZEN&accountType=SAVINGS
// =============================================================================
const listAccounts = async (req, res, next) => {
  try {
    const { page, limit, status, accountType } = req.query;
    const data = await adminService.listAccounts({ page, limit, status, accountType });
    success(res, { data });
  } catch (err) { next(err); }
};

// =============================================================================
// PATCH /api/admin/accounts/:id/freeze
// =============================================================================
const freezeAccount = async (req, res, next) => {
  try {
    const data = await adminService.freezeAccount(
      req.params.id,
      req.user.id,
      getMeta(req)
    );
    success(res, { message: MESSAGES.ACCOUNT_FROZEN_SUCCESS, data });
  } catch (err) { next(err); }
};

// =============================================================================
// PATCH /api/admin/accounts/:id/unfreeze
// =============================================================================
const unfreezeAccount = async (req, res, next) => {
  try {
    const data = await adminService.unfreezeAccount(
      req.params.id,
      req.user.id,
      getMeta(req)
    );
    success(res, { message: MESSAGES.ACCOUNT_UNFROZEN_SUCCESS, data });
  } catch (err) { next(err); }
};

// =============================================================================
// GET /api/admin/audit-logs
// Query: ?page=1&limit=20&userId=<uuid>&action=LOGIN
// =============================================================================
const listAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, userId, action } = req.query;
    const data = await adminService.listAuditLogs({ page, limit, userId, action });
    success(res, { data });
  } catch (err) { next(err); }
};

module.exports = {
  getDashboard,
  listUsers,
  getUserById,
  listAccounts,
  freezeAccount,
  unfreezeAccount,
  listAuditLogs,
};
