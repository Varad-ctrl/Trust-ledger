'use strict';
const standingService = require('../services/standing.service');
const { success } = require('../utils/response');
const { HTTP } = require('../constants');
module.exports = {
  create: async (req, res, next) => { try { success(res, { status: HTTP.CREATED, message: 'Standing instruction created', data: await standingService.create(req.user.id, req.body) }); } catch (e) { next(e); } },
  getAll: async (req, res, next) => { try { success(res, { data: await standingService.getAll(req.user.id) }); } catch (e) { next(e); } },
  pause:  async (req, res, next) => { try { success(res, { message: 'Paused',   data: await standingService.pause(req.params.id,  req.user.id) }); } catch (e) { next(e); } },
  resume: async (req, res, next) => { try { success(res, { message: 'Resumed',  data: await standingService.resume(req.params.id, req.user.id) }); } catch (e) { next(e); } },
  cancel: async (req, res, next) => { try { success(res, { message: 'Cancelled', data: await standingService.cancel(req.params.id, req.user.id) }); } catch (e) { next(e); } },
};
