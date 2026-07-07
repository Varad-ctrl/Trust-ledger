const transactionService = require('../services/transaction.service');
const { success } = require('../utils/response');
const { HTTP, MESSAGES } = require('../constants');

const transactionController = {
  transfer: async (req, res, next) => {
    try {
      const txn = await transactionService.transfer(req.user.id, req.body);
      success(res, { status: HTTP.CREATED, message: MESSAGES.TRANSFER_SUCCESS, data: txn });
    } catch (err) { next(err); }
  },

  getAll: async (req, res, next) => {
    try {
      const page  = parseInt(req.query.page)  || 1;
      const limit = parseInt(req.query.limit) || 20;
      const result = await transactionService.getAll(req.user.id, { page, limit });
      success(res, { data: result });
    } catch (err) { next(err); }
  },

  getById: async (req, res, next) => {
    try {
      const txn = await transactionService.getById(req.params.id, req.user.id);
      success(res, { data: txn });
    } catch (err) { next(err); }
  },
};

module.exports = transactionController;
