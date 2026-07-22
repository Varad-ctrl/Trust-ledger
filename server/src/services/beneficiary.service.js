'use strict';
const { v4: uuidv4 } = require('uuid');
const beneficiaryRepository = require('../repositories/beneficiary.repository');
const userRepository = require('../repositories/user.repository');
const accountRepository = require('../repositories/account.repository');
const emailService = require('./email.service');
const { MESSAGES } = require('../constants');
const logger = require('../config/logger');

const beneficiaryService = {
  getAll: (userId, { search } = {}) => beneficiaryRepository.findAllByUser(userId, { search }),

  create: async (userId, data) => {
    // Find internal account by account number
    const account = await accountRepository.findByAccountNumber(data.accountNumber);

    const bene = await beneficiaryRepository.create({
      id: uuidv4(),
      userId,
      beneficiaryName: data.beneficiaryName,
      accountNumber: data.accountNumber,
      bankName: data.bankName || 'FinCore Bank',
      ifscCode: data.ifscCode || null,
      receiverAccountId: account ? account.id : null,
      isFavourite: false,
    });

    userRepository.findById(userId).then(user => {
      if (user) {
        emailService
          .sendBeneficiaryAdded({
            to: user.email,
            firstName: user.firstName,
            beneficiaryName: bene.beneficiaryName,
            accountNumber: bene.accountNumber,
            bankName: bene.bankName,
          })
          .catch(e => logger.error('Beneficiary email failed', { error: e.message }));
      }
    });

    return bene;
  },
  toggleFavourite: async (id, userId, isFavourite) => {
    const bene = await beneficiaryRepository.findByIdAndUser(id, userId);
    if (!bene) throw Object.assign(new Error(MESSAGES.BENEFICIARY_NOT_FOUND), { status: 404 });
    return beneficiaryRepository.update(id, { isFavourite });
  },
  delete: async (id, userId) => {
    const bene = await beneficiaryRepository.findByIdAndUser(id, userId);
    if (!bene) throw Object.assign(new Error(MESSAGES.BENEFICIARY_NOT_FOUND), { status: 404 });
    await beneficiaryRepository.delete(id);
  },
};
module.exports = beneficiaryService;
