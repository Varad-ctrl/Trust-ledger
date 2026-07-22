'use strict';
const { v4: uuidv4 } = require('uuid');
const { Decimal } = require('@prisma/client/runtime/library');
const prisma = require('../config/prisma');
const transactionRepository = require('../repositories/transaction.repository');
const { generateReferenceNumber } = require('../utils/accountNumber');
const emailService = require('./email.service');
const { MESSAGES } = require('../constants');
const logger = require('../config/logger');

const transactionService = {
  transfer: async (userId, { senderAccountId, receiverAccountId, amount, description }) => {
    if (senderAccountId === receiverAccountId)
      throw Object.assign(new Error(MESSAGES.SAME_ACCOUNT), { status: 400 });
    const txnAmount = new Decimal(amount);
    const transaction = await prisma.$transaction(async (tx) => {
      const sender   = await tx.account.findUnique({ where: { id: senderAccountId },   include: { user: true } });
      const receiver = await tx.account.findUnique({ where: { id: receiverAccountId }, include: { user: true } });
      if (!sender || sender.userId !== userId) throw Object.assign(new Error(MESSAGES.ACCOUNT_NOT_FOUND), { status: 404 });
      if (!receiver)                           throw Object.assign(new Error(MESSAGES.ACCOUNT_NOT_FOUND), { status: 404 });
      if (sender.status !== 'ACTIVE')          throw Object.assign(new Error(MESSAGES.ACCOUNT_FROZEN), { status: 400 });
      if (receiver.status !== 'ACTIVE')        throw Object.assign(new Error(MESSAGES.ACCOUNT_FROZEN), { status: 400 });
      const bal = new Decimal(sender.balance);
      if (bal.lessThan(txnAmount))             throw Object.assign(new Error(MESSAGES.INSUFFICIENT_FUNDS), { status: 400 });
      await tx.account.update({ where: { id: senderAccountId },   data: { balance: bal.minus(txnAmount) } });
      await tx.account.update({ where: { id: receiverAccountId }, data: { balance: new Decimal(receiver.balance).plus(txnAmount) } });
      return tx.transaction.create({
        data: { id: uuidv4(), senderAccountId, receiverAccountId, amount: txnAmount, transactionType: 'TRANSFER', description: description || 'Fund transfer', status: 'COMPLETED', referenceNumber: generateReferenceNumber() },
        include: { senderAccount: { include: { user: true } }, receiverAccount: { include: { user: true } } },
      });
    });
    // Enhancement 7 — non-blocking email
    emailService.sendTransferSuccess({
      to: transaction.senderAccount.user.email, firstName: transaction.senderAccount.user.firstName,
      amount: transaction.amount,
      receiverName: transaction.receiverAccount?.user ? `${transaction.receiverAccount.user.firstName} ${transaction.receiverAccount.user.lastName}` : 'Account Holder',
      referenceNumber: transaction.referenceNumber, senderAccount: transaction.senderAccount.accountNumber, date: transaction.createdAt,
    }).catch(e => logger.error('Transfer email failed', { error: e.message }));
    return transaction;
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
    const belongs = txn.senderAccount?.userId === userId || txn.receiverAccount?.userId === userId;
    if (!belongs) throw Object.assign(new Error(MESSAGES.TRANSACTION_NOT_FOUND), { status: 404 });
    return txn;
  },
};
module.exports = transactionService;
