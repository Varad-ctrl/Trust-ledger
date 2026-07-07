'use strict';

/**
 * authorize(...roles) — Role-Based Access Control middleware
 *
 * Must be used AFTER authenticate, which populates req.user.
 *
 * Supports single or multiple allowed roles:
 *   authorize('ADMIN')              → only ADMINs
 *   authorize('ADMIN', 'AUDITOR')   → ADMINs or AUDITORs (extensible)
 *
 * Flow:
 *   JWT verified (authenticate)
 *        │
 *        ▼
 *   req.user.role === one of ...roles ?
 *        │                   │
 *       YES                  NO
 *        │                   │
 *        ▼                   ▼
 *   next()            403 Forbidden
 *
 * Why a factory function (not a single middleware)?
 *   Different routes need different role combinations. A factory lets the
 *   route definition declare its own access policy inline:
 *
 *     router.get('/users',    authenticate, authorize('ADMIN'),           ctrl.listUsers);
 *     router.get('/reports',  authenticate, authorize('ADMIN','AUDITOR'), ctrl.getReports);
 *     router.get('/profile',  authenticate,                               ctrl.getProfile);
 *
 *   This keeps authorization rules co-located with route definitions,
 *   where they are easy to read during a security review.
 */

const { error }           = require('../utils/response');
const { HTTP, MESSAGES }  = require('../constants');

const authorize = (...roles) => (req, res, next) => {
  // authenticate must run first — guard against middleware ordering mistakes
  if (!req.user) {
    return error(res, { status: HTTP.UNAUTHORIZED, message: MESSAGES.UNAUTHORIZED });
  }

  if (!roles.includes(req.user.role)) {
    return error(res, { status: HTTP.FORBIDDEN, message: MESSAGES.FORBIDDEN });
  }

  next();
};

module.exports = authorize;
