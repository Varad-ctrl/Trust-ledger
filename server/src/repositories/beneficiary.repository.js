const prisma = require('../config/prisma');

const beneficiaryRepository = {
  findAllByUser: (userId) =>
    prisma.beneficiary.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),

  findByIdAndUser: (id, userId) =>
    prisma.beneficiary.findFirst({ where: { id, userId } }),

  create: (data) => prisma.beneficiary.create({ data }),

  delete: (id) => prisma.beneficiary.delete({ where: { id } }),
};

module.exports = beneficiaryRepository;
