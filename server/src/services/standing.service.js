'use strict';
const { v4: uuidv4 } = require('uuid');
const { Decimal } = require('@prisma/client/runtime/library');
const prisma = require('../config/prisma');
const { generateReferenceNumber } = require('../utils/accountNumber');
const emailService = require('./email.service');
const { MESSAGES } = require('../constants');
const logger = require('../config/logger');

const calcNext = (freq, day) => {
  const d = new Date();
  if (freq === 'DAILY')   { d.setDate(d.getDate() + 1); d.setHours(9,0,0,0); }
  else if (freq === 'WEEKLY') { d.setDate(d.getDate() + 7); d.setHours(9,0,0,0); }
  else {
    const n = Math.min(Math.max(day || 1, 1), 28);
    d.setDate(n); d.setHours(9,0,0,0);
    if (d <= new Date()) d.setMonth(d.getMonth() + 1);
  }
  return d;
};

const standingService = {
  create: async (userId, { senderAccountId, receiverAccountId, amount, description, frequency, dayOfMonth }) => {
    const sender = await prisma.account.findFirst({ where: { id: senderAccountId, userId, status: 'ACTIVE' }, include: { user: true } });
    if (!sender) throw Object.assign(new Error(MESSAGES.ACCOUNT_NOT_FOUND), { status: 404 });
    const receiver = await prisma.account.findUnique({ where: { id: receiverAccountId } });
    if (!receiver) throw Object.assign(new Error(MESSAGES.ACCOUNT_NOT_FOUND), { status: 404 });

    const si = await prisma.standingInstruction.create({
      data: { id: uuidv4(), userId, senderAccountId, receiverAccountId, amount: new Decimal(amount), description: description || 'Standing instruction', frequency, dayOfMonth: frequency === 'MONTHLY' ? (dayOfMonth || 1) : null, nextRunAt: calcNext(frequency, dayOfMonth), status: 'ACTIVE' },
      include: { senderAccount: true, receiverAccount: true },
    });
    emailService.sendStandingCreated({ to: sender.user.email, firstName: sender.user.firstName, amount, frequency, dayOfMonth, receiverAccount: receiver.accountNumber }).catch(() => {});
    return si;
  },

  getAll: (userId) => prisma.standingInstruction.findMany({
    where: { userId }, include: { senderAccount: true, receiverAccount: { include: { user: { select: { firstName: true, lastName: true } } } } }, orderBy: { createdAt: 'desc' },
  }),

  pause:  async (id, userId) => { const si = await prisma.standingInstruction.findFirst({ where: { id, userId } }); if (!si) throw Object.assign(new Error('Not found'), { status: 404 }); return prisma.standingInstruction.update({ where: { id }, data: { status: 'PAUSED' } }); },
  resume: async (id, userId) => { const si = await prisma.standingInstruction.findFirst({ where: { id, userId } }); if (!si) throw Object.assign(new Error('Not found'), { status: 404 }); return prisma.standingInstruction.update({ where: { id }, data: { status: 'ACTIVE', nextRunAt: calcNext(si.frequency, si.dayOfMonth) } }); },
  cancel: async (id, userId) => { const si = await prisma.standingInstruction.findFirst({ where: { id, userId } }); if (!si) throw Object.assign(new Error('Not found'), { status: 404 }); return prisma.standingInstruction.update({ where: { id }, data: { status: 'CANCELLED' } }); },

  executeDue: async () => {
    const due = await prisma.standingInstruction.findMany({ where: { status: 'ACTIVE', nextRunAt: { lte: new Date() } }, include: { senderAccount: { include: { user: true } }, receiverAccount: true } });
    if (!due.length) return;
    logger.info(`[CRON] Executing ${due.length} standing instruction(s)`);
    for (const si of due) {
      try {
        const txnAmt = new Decimal(si.amount), bal = new Decimal(si.senderAccount.balance);
        if (bal.lessThan(txnAmt)) { await prisma.standingInstruction.update({ where: { id: si.id }, data: { nextRunAt: calcNext(si.frequency, si.dayOfMonth) } }); continue; }
        await prisma.$transaction(async tx => {
          await tx.account.update({ where: { id: si.senderAccountId },   data: { balance: bal.minus(txnAmt) } });
          await tx.account.update({ where: { id: si.receiverAccountId }, data: { balance: new Decimal(si.receiverAccount.balance).plus(txnAmt) } });
          await tx.transaction.create({ data: { id: uuidv4(), senderAccountId: si.senderAccountId, receiverAccountId: si.receiverAccountId, amount: txnAmt, transactionType: 'TRANSFER', description: si.description, status: 'COMPLETED', referenceNumber: generateReferenceNumber() } });
          await tx.standingInstruction.update({ where: { id: si.id }, data: { nextRunAt: calcNext(si.frequency, si.dayOfMonth), executionCount: { increment: 1 } } });
        });
        logger.info(`[CRON] Standing ${si.id} executed (count: ${si.executionCount + 1})`);
      } catch (e) { logger.error(`[CRON] Standing ${si.id} error: ${e.message}`); }
    }
  },
};
module.exports = standingService;
