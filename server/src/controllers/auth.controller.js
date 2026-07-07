'use strict';

/**
 * Auth Controller — HTTP boundary only.
 *
 * Responsibilities:
 *   1. Extract data from req (body, headers, IP)
 *   2. Call the service
 *   3. Send the response
 *
 * No business logic lives here. Error handling is delegated to next(err)
 * which is caught by the global errorHandler middleware.
 */

const authService = require('../services/auth.service');
const { success } = require('../utils/response');
const { HTTP, MESSAGES } = require('../constants');

// ─── Helper: extract request metadata for audit logs ─────────────────────────
// Pulled out so every handler gets consistent metadata without repetition.
const getMeta = (req) => ({
  ip:        req.ip || req.headers['x-forwarded-for'] || null,
  userAgent: req.headers['user-agent'] || null,
});

// =============================================================================
// POST /api/auth/register
// =============================================================================
const register = async (req, res, next) => {
  try {
    const data = await authService.register(req.body, getMeta(req));
    success(res, {
      status:  HTTP.CREATED,
      message: MESSAGES.REGISTER_SUCCESS,
      data,
    });
  } catch (err) {
    next(err);
  }
};

// =============================================================================
// POST /api/auth/login
// =============================================================================
const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body, getMeta(req));
    success(res, {
      message: MESSAGES.LOGIN_SUCCESS,
      data,
    });
  } catch (err) {
    next(err);
  }
};

// =============================================================================
// POST /api/auth/refresh
// =============================================================================
const refresh = async (req, res, next) => {
  try {
    const data = await authService.refresh(req.body.refreshToken);
    success(res, {
      message: MESSAGES.TOKEN_REFRESHED,
      data,
    });
  } catch (err) {
    next(err);
  }
};

// =============================================================================
// POST /api/auth/logout
// =============================================================================
const logout = async (req, res, next) => {
  try {
    // req.user is populated by the authenticate middleware on this route
    await authService.logout(
      req.body.refreshToken,
      req.user.id,
      getMeta(req)
    );
    success(res, { message: MESSAGES.LOGOUT_SUCCESS });
  } catch (err) {
    next(err);
  }
};

// =============================================================================
// POST /api/auth/logout-all
// =============================================================================
const logoutAll = async (req, res, next) => {
  try {
    const data = await authService.logoutAll(req.user.id, getMeta(req));
    success(res, { message: MESSAGES.LOGOUT_ALL_SUCCESS, data });
  } catch (err) {
    next(err);
  }
};

// =============================================================================
// GET /api/auth/sessions
// =============================================================================
const getSessions = async (req, res, next) => {
  try {
    const data = await authService.getSessions(req.user.id);
    success(res, { data });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refresh, logout, logoutAll, getSessions };
