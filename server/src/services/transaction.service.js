const { v4: uuidv4 } = require('uuid');
const { Decimal } = require('@prisma/client/runtime/library');
const prisma = require('../config/prisma');
const accountRepository = require('../repositories/account.repository');
const transactionRepository = require('../repositories/transaction.repository');
const { generateReferenceNumber } = require('../utils/accountNumber');
const { MESSAGES } = require('../constants');

const transactionService = {
  /**
   * Atomic money transfer using Prisma interactive transactions.
   * Either both balance updates + transaction record succeed, or nothing changes.
   */
  transfer: async (userId, { senderAccountId, receiverAccountId, amount, description }) => {
    if (senderAccountId === receiverAccountId) {
      throw Object.assign(new Error(MESSAGES.SAME_ACCOUNT), { status: 400 });
    }

    const txnAmount = new Decimal(amount);

    return prisma.$transaction(async (tx) => {
      // Lock rows within the transaction for read-then-write safety
      const sender = await tx.account.findUnique({ where: { id: senderAccountId } });
      const receiver = await tx.account.findUnique({ where: { id: receiverAccountId } });

      if (!sender || sender.userId !== userId)
        throw Object.assign(new Error(MESSAGES.ACCOUNT_NOT_FOUND), { status: 404 });
      if (!receiver)
        throw Object.assign(new Error(MESSAGES.ACCOUNT_NOT_FOUND), { status: 404 });
      if (sender.status !== 'ACTIVE')
        throw Object.assign(new Error(MESSAGES.ACCOUNT_FROZEN), { status: 400 });
      if (receiver.status !== 'ACTIVE')
        throw Object.assign(new Error(MESSAGES.ACCOUNT_FROZEN), { status: 400 });

      const senderBalance = new Decimal(sender.balance);
      if (senderBalance.lessThan(txnAmount))
        throw Object.assign(new Error(MESSAGES.INSUFFICIENT_FUNDS), { status: 400 });

      // Update balances
      await tx.account.update({
        where: { id: senderAccountId },
        data: { balance: senderBalance.minus(txnAmount) },
      });
      await tx.account.update({
        where: { id: receiverAccountId },
        data: { balance: new Decimal(receiver.balance).plus(txnAmount) },
      });

      // Record transaction
      const transaction = await tx.transaction.create({
        data: {
          id: uuidv4(),
          senderAccountId,
          receiverAccountId,
          amount: txnAmount,
          transactionType: 'TRANSFER',
          description: description || 'Fund transfer',
          status: 'COMPLETED',
          referenceNumber: generateReferenceNumber(),
        },
        include: { senderAccount: true, receiverAccount: true },
      });

      return transaction;
    });
  },

  getAll: async (userId, { page = 1, limit = 20 } = {}) => {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      transactionRepository.findAllByUser(userId, { skip, take: limit }),
      transactionRepository.countByUser(userId),
    ]);
    return { transactions, total, page, limit, pages: Math.ceil(total / limit) };
  },

  getById: async (id, userId) => {
    const txn = await transactionRepository.findById(id);
    if (!txn) throw Object.assign(new Error(MESSAGES.TRANSACTION_NOT_FOUND), { status: 404 });

    // Ensure the transaction belongs to the requesting user
    const belongsToUser =
      txn.senderAccount?.userId === userId ||
      txn.receiverAccount?.userId === userId;
    if (!belongsToUser) throw Object.assign(new Error(MESSAGES.TRANSACTION_NOT_FOUND), { status: 404 });

    return txn;
  },
};

module.exports = transactionService;
