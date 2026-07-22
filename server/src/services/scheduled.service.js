'use strict';
const { v4: uuidv4 } = require('uuid');
const { Decimal } = require('@prisma/client/runtime/library');
const prisma = require('../config/prisma');
const { generateReferenceNumber } = require('../utils/accountNumber');
const emailService = require('./email.service');
const { MESSAGES } = require('../constants');
const logger = require('../config/logger');

const scheduledService = {
  create: async (userId, { senderAccountId, receiverAccountId, amount, description, executeAt }) => {
    const sender = await prisma.account.findFirst({ where: { id: senderAccountId, userId, status: 'ACTIVE' }, include: { user: true } });
    if (!sender) throw Object.assign(new Error(MESSAGES.ACCOUNT_NOT_FOUND), { status: 404 });
    const receiver = await prisma.account.findUnique({ where: { id: receiverAccountId } });
    if (!receiver) throw Object.assign(new Error(MESSAGES.ACCOUNT_NOT_FOUND), { status: 404 });
    if (new Date(executeAt) <= new Date()) throw Object.assign(new Error('Execute date must be in the future'), { status: 400 });

    const st = await prisma.scheduledTransfer.create({
      data: { id: uuidv4(), userId, senderAccountId, receiverAccountId, amount: new Decimal(amount), description: description || 'Scheduled transfer', executeAt: new Date(executeAt), status: 'PENDING' },
      include: { senderAccount: true, receiverAccount: true },
    });
    emailService.sendScheduledCreated({ to: sender.user.email, firstName: sender.user.firstName, amount, executeAt: st.executeAt, receiverAccount: receiver.accountNumber }).catch(() => {});
    return st;
  },

  getAll: (userId) => prisma.scheduledTransfer.findMany({
    where: { userId }, include: { senderAccount: true, receiverAccount: { include: { user: { select: { firstName: true, lastName: true } } } } }, orderBy: { executeAt: 'asc' },
  }),

  cancel: async (id, userId) => {
    const st = await prisma.scheduledTransfer.findFirst({ where: { id, userId } });
    if (!st) throw Object.assign(new Error('Scheduled transfer not found'), { status: 404 });
    if (st.status !== 'PENDING') throw Object.assign(new Error('Only PENDING transfers can be cancelled'), { status: 400 });
    return prisma.scheduledTransfer.update({ where: { id }, data: { status: 'CANCELLED' } });
  },

  executePending: async () => {
    const due = await prisma.scheduledTransfer.findMany({
      where: { status: 'PENDING', executeAt: { lte: new Date() } },
      include: { senderAccount: { include: { user: true } }, receiverAccount: true },
    });
    if (!due.length) return;
    logger.info(`[CRON] Executing ${due.length} scheduled transfer(s)`);
    for (const st of due) {
      try {
        const txnAmt = new Decimal(st.amount), bal = new Decimal(st.senderAccount.balance);
        if (bal.lessThan(txnAmt)) {
          await prisma.scheduledTransfer.update({ where: { id: st.id }, data: { status: 'FAILED', executedAt: new Date() } });
          continue;
        }
        await prisma.$transaction(async tx => {
          await tx.account.update({ where: { id: st.senderAccountId },   data: { balance: bal.minus(txnAmt) } });
          await tx.account.update({ where: { id: st.receiverAccountId }, data: { balance: new Decimal(st.receiverAccount.balance).plus(txnAmt) } });
          const txn = await tx.transaction.create({ data: { id: uuidv4(), senderAccountId: st.senderAccountId, receiverAccountId: st.receiverAccountId, amount: txnAmt, transactionType: 'TRANSFER', description: st.description || 'Scheduled transfer', status: 'COMPLETED', referenceNumber: generateReferenceNumber() } });
          await tx.scheduledTransfer.update({ where: { id: st.id }, data: { status: 'EXECUTED', executedAt: new Date(), transactionId: txn.id } });
        });
        emailService.sendTransferSuccess({ to: st.senderAccount.user.email, firstName: st.senderAccount.user.firstName, amount: st.amount, receiverName: 'Scheduled Payee', referenceNumber: 'SCHED-' + st.id.slice(0, 8).toUpperCase(), senderAccount: st.senderAccount.accountNumber, date: new Date() }).catch(() => {});
        logger.info(`[CRON] Scheduled ${st.id} executed`);
      } catch (e) {
        await prisma.scheduledTransfer.update({ where: { id: st.id }, data: { status: 'FAILED', executedAt: new Date() } });
        logger.error(`[CRON] Scheduled ${st.id} failed: ${e.message}`);
      }
    }
  },
};
module.exports = scheduledService;
