'use strict';

/**
 * Admin Service
 *
 * Business logic for admin operations. This layer:
 *   - Validates business rules (e.g. can't freeze an already-frozen account)
 *   - Writes audit logs for every state-changing action
 *   - Calls the admin repository for all DB access
 *   - Never touches req/res (that's the controller's job)
 */

const { v4: uuidv4 }    = require('uuid');
const prisma             = require('../config/prisma');
const adminRepository    = require('../repositories/admin.repository');
const { MESSAGES, AUDIT_ACTIONS } = require('../constants');
const logger             = require('../config/logger');

// ─── Pagination helper ───────────────────────────────────────────────────────
// Shared across every list endpoint. Returns { skip, take, page, limit }.
const paginate = (page, limit) => {
  const p = Math.max(1, parseInt(page,  10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20)); // cap at 100
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
};

// ─── List response wrapper ───────────────────────────────────────────────────
// Every paginated endpoint returns the same envelope.
const listResponse = (data, total, page, limit) => ({
  data,
  pagination: {
    total,
    page,
    limit,
    pages:    Math.ceil(total / limit),
    hasNext:  page * limit < total,
    hasPrev:  page > 1,
  },
});

// =============================================================================
// DASHBOARD
// =============================================================================
const getDashboard = async () => {
  return adminRepository.getDashboardStats();
};

// =============================================================================
// USERS
// =============================================================================
const listUsers = async ({ page, limit, role, isVerified } = {}) => {
  const { skip, take, page: p, limit: l } = paginate(page, limit);

  // Parse isVerified from query string ('true'/'false') to boolean
  const isVerifiedFilter = isVerified === 'true'  ? true
                         : isVerified === 'false' ? false
                         : undefined;

  const [users, total] = await Promise.all([
    adminRepository.findAllUsers({ skip, take, role, isVerified: isVerifiedFilter }),
    adminRepository.countUsers({ role, isVerified: isVerifiedFilter }),
  ]);

  return listResponse(users, total, p, l);
};

const getUserById = async (id) => {
  const user = await adminRepository.findUserById(id);
  if (!user) throw Object.assign(new Error(MESSAGES.USER_NOT_FOUND), { status: 404 });
  return user;
};

// =============================================================================
// ACCOUNTS
// =============================================================================
const listAccounts = async ({ page, limit, status, accountType } = {}) => {
  const { skip, take, page: p, limit: l } = paginate(page, limit);

  const [accounts, total] = await Promise.all([
    adminRepository.findAllAccounts({ skip, take, status, accountType }),
    adminRepository.countAccounts({ status, accountType }),
  ]);

  return listResponse(accounts, total, p, l);
};

// ── Freeze ───────────────────────────────────────────────────────────────────
const freezeAccount = async (accountId, adminId, meta = {}) => {
  const account = await adminRepository.findAccountById(accountId);
  if (!account) {
    throw Object.assign(new Error(MESSAGES.ACCOUNT_NOT_FOUND), { status: 404 });
  }
  if (account.status === 'CLOSED') {
    throw Object.assign(new Error(MESSAGES.ACCOUNT_CLOSED), { status: 400 });
  }
  if (account.status === 'FROZEN') {
    throw Object.assign(new Error(MESSAGES.ACCOUNT_ALREADY_FROZEN), { status: 400 });
  }

  const updated = await adminRepository.updateAccountStatus(accountId, 'FROZEN');

  await prisma.auditLog.create({
    data: {
      id:        uuidv4(),
      userId:    adminId,
      action:    AUDIT_ACTIONS.ADMIN_FREEZE_ACCOUNT,
      ipAddress: meta.ip        || null,
      userAgent: meta.userAgent || null,
      metadata: {
        accountId,
        accountNumber: account.accountNumber,
        accountOwner:  account.user?.email,
        previousStatus: 'ACTIVE',
        newStatus:      'FROZEN',
      },
    },
  });

  logger.warn('Account frozen by admin', {
    adminId,
    accountId,
    accountNumber: account.accountNumber,
  });

  return updated;
};

// ── Unfreeze ─────────────────────────────────────────────────────────────────
const unfreezeAccount = async (accountId, adminId, meta = {}) => {
  const account = await adminRepository.findAccountById(accountId);
  if (!account) {
    throw Object.assign(new Error(MESSAGES.ACCOUNT_NOT_FOUND), { status: 404 });
  }
  if (account.status === 'CLOSED') {
    throw Object.assign(new Error(MESSAGES.ACCOUNT_CLOSED), { status: 400 });
  }
  if (account.status === 'ACTIVE') {
    throw Object.assign(new Error(MESSAGES.ACCOUNT_ALREADY_ACTIVE), { status: 400 });
  }

  const updated = await adminRepository.updateAccountStatus(accountId, 'ACTIVE');

  await prisma.auditLog.create({
    data: {
      id:        uuidv4(),
      userId:    adminId,
      action:    AUDIT_ACTIONS.ADMIN_UNFREEZE_ACCOUNT,
      ipAddress: meta.ip        || null,
      userAgent: meta.userAgent || null,
      metadata: {
        accountId,
        accountNumber: account.accountNumber,
        accountOwner:  account.user?.email,
        previousStatus: 'FROZEN',
        newStatus:      'ACTIVE',
      },
    },
  });

  logger.info('Account unfrozen by admin', {
    adminId,
    accountId,
    accountNumber: account.accountNumber,
  });

  return updated;
};

// =============================================================================
// AUDIT LOGS
// =============================================================================
const listAuditLogs = async ({ page, limit, userId, action } = {}) => {
  const { skip, take, page: p, limit: l } = paginate(page, limit);

  const [logs, total] = await Promise.all([
    adminRepository.findAllAuditLogs({ skip, take, userId, action }),
    adminRepository.countAuditLogs({ userId, action }),
  ]);

  return listResponse(logs, total, p, l);
};

module.exports = {
  getDashboard,
  listUsers,
  getUserById,
  listAccounts,
  freezeAccount,
  unfreezeAccount,
  listAuditLogs,
};
