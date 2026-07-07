const { v4: uuidv4 } = require('uuid');
const accountRepository = require('../repositories/account.repository');
const { generateAccountNumber } = require('../utils/accountNumber');
const { MESSAGES } = require('../constants');

const accountService = {
  getAll: (userId) => accountRepository.findAllByUser(userId),

  getById: async (id, userId) => {
    const account = await accountRepository.findByIdAndUser(id, userId);
    if (!account) throw Object.assign(new Error(MESSAGES.ACCOUNT_NOT_FOUND), { status: 404 });
    return account;
  },

  create: async (userId, { accountType, currency = 'USD' }) => {
    const accountNumber = await generateAccountNumber();
    return accountRepository.create({
      id: uuidv4(), userId, accountNumber, accountType, balance: 0, currency, status: 'ACTIVE',
    });
  },
};

module.exports = accountService;
