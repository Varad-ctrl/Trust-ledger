const accountService = require('../services/account.service');
const { success } = require('../utils/response');
const { HTTP, MESSAGES } = require('../constants');

const accountController = {
  getAll: async (req, res, next) => {
    try {
      const accounts = await accountService.getAll(req.user.id);
      success(res, { data: accounts });
    } catch (err) { next(err); }
  },

  getById: async (req, res, next) => {
    try {
      const account = await accountService.getById(req.params.id, req.user.id);
      success(res, { data: account });
    } catch (err) { next(err); }
  },

  create: async (req, res, next) => {
    try {
      const account = await accountService.create(req.user.id, req.body);
      success(res, { status: HTTP.CREATED, message: MESSAGES.ACCOUNT_CREATED, data: account });
    } catch (err) { next(err); }
  },
};

module.exports = accountController;
