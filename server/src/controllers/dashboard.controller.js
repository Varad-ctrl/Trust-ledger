'use strict';

/**
 * Dashboard Controller
 *
 * Single responsibility: HTTP boundary.
 *   - Reads the authenticated user's ID from req.user (set by authenticate middleware)
 *   - Calls the dashboard service
 *   - Sends the shaped response
 *
 * No business logic here. No Prisma. No calculations.
 * If this controller grows beyond ~20 lines, something belongs in the service.
 */

const dashboardService = require('../services/dashboard.service');
const { success }      = require('../utils/response');

const dashboardController = {

  // GET /api/dashboard
  getDashboard: async (req, res, next) => {
    try {
      const data = await dashboardService.getDashboard(req.user.id);
      success(res, { data });
    } catch (err) {
      next(err);
    }
  },

};

module.exports = dashboardController;
