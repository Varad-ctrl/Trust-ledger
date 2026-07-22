'use strict';
const prisma = require('../config/prisma');
const emailService = require('./email.service');
const { MESSAGES } = require('../constants');
const logger = require('../config/logger');
const DOMAIN = '@fincore';

const upiService = {
  activate: async (userId) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw Object.assign(new Error(MESSAGES.USER_NOT_FOUND), { status: 404 });
    if (user.upiId) return { upiId: user.upiId, alreadyExists: true };

    let handle = `${user.firstName.toLowerCase()}.${user.lastName.toLowerCase()}`.replace(/[^a-z0-9.]/g, '');
    let candidate = handle + DOMAIN, suffix = 1;
    while (await prisma.user.findUnique({ where: { upiId: candidate } })) { candidate = `${handle}${suffix}${DOMAIN}`; suffix++; }

    const updated = await prisma.user.update({ where: { id: userId }, data: { upiId: candidate } });
    emailService.sendUpiActivated({ to: user.email, firstName: user.firstName, upiId: candidate }).catch(() => {});
    logger.info(`UPI activated: ${candidate}`);
    return { upiId: updated.upiId, alreadyExists: false };
  },

  getMyUpiId: async (userId) => {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { upiId: true, firstName: true, lastName: true } });
    if (!user) throw Object.assign(new Error(MESSAGES.USER_NOT_FOUND), { status: 404 });
    return { upiId: user.upiId, name: `${user.firstName} ${user.lastName}` };
  },

  resolve: async (upiId) => {
    const user = await prisma.user.findUnique({
      where: { upiId: upiId.toLowerCase().trim() },
      include: { accounts: { where: { status: 'ACTIVE' }, orderBy: { createdAt: 'asc' }, take: 1 } },
    });
    if (!user || !user.accounts.length) throw Object.assign(new Error(`UPI ID "${upiId}" not found`), { status: 404 });
    return { upiId: user.upiId, name: `${user.firstName} ${user.lastName}`, accountId: user.accounts[0].id, accountNumber: user.accounts[0].accountNumber, accountType: user.accounts[0].accountType };
  },
};
module.exports = upiService;
