'use strict';
const upiService = require('../services/upi.service');
const { success } = require('../utils/response');
module.exports = {
  activate:   async (req, res, next) => { try { const d = await upiService.activate(req.user.id);    success(res, { message: d.alreadyExists ? 'UPI already active' : 'UPI ID activated', data: d }); } catch (e) { next(e); } },
  getMyUpiId: async (req, res, next) => { try { success(res, { data: await upiService.getMyUpiId(req.user.id) }); } catch (e) { next(e); } },
  resolve:    async (req, res, next) => { try { success(res, { data: await upiService.resolve(req.params.upiId) }); } catch (e) { next(e); } },
};
