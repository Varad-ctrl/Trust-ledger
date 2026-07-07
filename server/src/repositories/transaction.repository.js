const prisma = require('../config/prisma');

const transactionRepository = {
  findById: (id) =>
    prisma.transaction.findUnique({
      where: { id },
      include: { senderAccount: true, receiverAccount: true },
    }),

  // All transactions for a user (across all their accounts)
  findAllByUser: (userId, { skip = 0, take = 20 } = {}) =>
    prisma.transaction.findMany({
      where: {
        OR: [
          { senderAccount: { userId } },
          { receiverAccount: { userId } },
        ],
      },
      include: { senderAccount: true, receiverAccount: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),

  countByUser: (userId) =>
    prisma.transaction.count({
      where: {
        OR: [
          { senderAccount: { userId } },
          { receiverAccount: { userId } },
        ],
      },
    }),

  create: (data, tx) =>
    (tx || prisma).transaction.create({ data }),

  update: (id, data, tx) =>
    (tx || prisma).transaction.update({ where: { id }, data }),
};

module.exports = transactionRepository;
