'use strict';

const prisma = require('../config/prisma');

const accountRepository = {

  findById: (id) =>
    prisma.account.findUnique({ where: { id } }),

  findByIdAndUser: (id, userId) =>
    prisma.account.findFirst({ where: { id, userId } }),

  findByAccountNumber: (accountNumber) =>
    prisma.account.findUnique({
      where: { accountNumber },
    }),

  findAllByUser: (userId) =>
    prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),

  // `tx` is a Prisma interactive transaction client.
  // When provided (e.g. during registration), the create runs inside the
  // caller's transaction. When omitted, it runs as a standalone operation.
  create: (data, tx) =>
    (tx || prisma).account.create({ data }),

  // Balance updates always come from the transaction service which supplies
  // its own `tx`, so this always receives one in practice.
  updateBalance: (id, balance, tx) =>
    (tx || prisma).account.update({ where: { id }, data: { balance } }),
};

module.exports = accountRepository;
