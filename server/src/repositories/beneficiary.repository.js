'use strict';
const prisma = require('../config/prisma');
const INCLUDE = { receiverAccount: { select: { id: true, accountNumber: true, accountType: true, status: true, balance: true } } };

const beneficiaryRepository = {
  findAllByUser: (userId, { search } = {}) => {
    const where = { userId };
    if (search) where.OR = [{ beneficiaryName: { contains: search, mode: 'insensitive' } }, { accountNumber: { contains: search, mode: 'insensitive' } }];
    return prisma.beneficiary.findMany({ where, include: INCLUDE, orderBy: [{ isFavourite: 'desc' }, { createdAt: 'desc' }] });
  },
  findByIdAndUser: (id, userId) => prisma.beneficiary.findFirst({ where: { id, userId }, include: INCLUDE }),
  create:  (data)      => prisma.beneficiary.create({ data, include: INCLUDE }),
  update:  (id, data)  => prisma.beneficiary.update({ where: { id }, data, include: INCLUDE }),
  delete:  (id)        => prisma.beneficiary.delete({ where: { id } }),
};
module.exports = beneficiaryRepository;
