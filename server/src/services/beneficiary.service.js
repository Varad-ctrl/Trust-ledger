const { v4: uuidv4 } = require('uuid');
const beneficiaryRepository = require('../repositories/beneficiary.repository');
const { MESSAGES } = require('../constants');

const beneficiaryService = {
  getAll: (userId) => beneficiaryRepository.findAllByUser(userId),

  create: async (userId, data) => {
    return beneficiaryRepository.create({ id: uuidv4(), userId, ...data });
  },

  delete: async (id, userId) => {
    const bene = await beneficiaryRepository.findByIdAndUser(id, userId);
    if (!bene) throw Object.assign(new Error(MESSAGES.BENEFICIARY_NOT_FOUND), { status: 404 });
    await beneficiaryRepository.delete(id);
  },
};

module.exports = beneficiaryService;
