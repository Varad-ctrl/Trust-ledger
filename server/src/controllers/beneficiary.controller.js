'use strict';
const beneficiaryService = require('../services/beneficiary.service');
const { success } = require('../utils/response');
const { HTTP, MESSAGES } = require('../constants');

const beneficiaryController = {
  getAll: async (req, res, next) => {
    try { const data = await beneficiaryService.getAll(req.user.id, { search: req.query.search }); success(res, { data }); }
    catch (err) { next(err); }
  },
  create: async (req, res, next) => {
    try { const data = await beneficiaryService.create(req.user.id, req.body); success(res, { status: HTTP.CREATED, message: MESSAGES.BENEFICIARY_ADDED, data }); }
    catch (err) { next(err); }
  },
  toggleFavourite: async (req, res, next) => {
    try { const data = await beneficiaryService.toggleFavourite(req.params.id, req.user.id, req.body.isFavourite); success(res, { message: req.body.isFavourite ? 'Added to favourites' : 'Removed from favourites', data }); }
    catch (err) { next(err); }
  },
  delete: async (req, res, next) => {
    try { await beneficiaryService.delete(req.params.id, req.user.id); success(res, { message: MESSAGES.BENEFICIARY_DELETED }); }
    catch (err) { next(err); }
  },
};
module.exports = beneficiaryController;
