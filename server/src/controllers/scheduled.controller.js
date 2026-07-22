'use strict';
const scheduledService = require('../services/scheduled.service');
const { success } = require('../utils/response');
const { HTTP } = require('../constants');
module.exports = {
  create: async (req, res, next) => { try { success(res, { status: HTTP.CREATED, message: 'Transfer scheduled', data: await scheduledService.create(req.user.id, req.body) }); } catch (e) { next(e); } },
  getAll: async (req, res, next) => { try { success(res, { data: await scheduledService.getAll(req.user.id) }); } catch (e) { next(e); } },
  cancel: async (req, res, next) => { try { success(res, { message: 'Cancelled', data: await scheduledService.cancel(req.params.id, req.user.id) }); } catch (e) { next(e); } },
};
