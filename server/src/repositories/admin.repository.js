'use strict';

/**
 * Admin Repository
 *
 * Contains all database queries that require elevated access.
 * These methods are ONLY called from admin.service.js, which is ONLY
 * called from admin.controller.js, which is ONLY reachable via routes
 * protected by both authenticate + authorize('ADMIN').
 *
 * Keeping admin queries in their own repository:
 *   - Makes them easy to find during a security audit
 *   - Prevents accidental use in user-facing services
 *   - Clearly documents which operations are admin-only at the data layer
 */

const prisma = require('../config/prisma');

// Fields returned for every user in admin listings.
// Includes more than the user-facing safeUser — admins need isVerified,
// phone, and account counts — but never passwordHash.
const ADMIN_USER_SELECT = {
  id:         true,
  firstName:  true,
  lastName:   true,
  email:      true,
  phone:      true,
  role:       true,
  isVerified: true,
  createdAt:  true,
  updatedAt:  true,
  _count: {
    select: { accounts: true, sessions: true },
  },
};

const adminRepository = {

  // ── Users ────────────────────────────────────────────────────────────────

  findAllUsers: ({ skip = 0, take = 20, role, isVerified } = {}) => {
    const where = {};
    if (role !== undefined)       where.role       = role;
    if (isVerified !== undefined) where.isVerified = isVerified;

    return prisma.user.findMany({
      where,
      select:  ADMIN_USER_SELECT,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  },

  countUsers: ({ role, isVerified } = {}) => {
    const where = {};
    if (role !== undefined)       where.role       = role;
    if (isVerified !== undefined) where.isVerified = isVerified;
    return prisma.user.count({ where });
  },

  findUserById: (id) =>
    prisma.user.findUnique({
      where:  { id },
      select: {
        ...ADMIN_USER_SELECT,
        accounts: {
          select: {
            id:            true,
            accountNumber: true,
            accountType:   true,
            balance:       true,
            currency:      true,
            status:        true,
            createdAt:     true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    }),

  // ── Accounts ─────────────────────────────────────────────────────────────

  findAllAccounts: ({ skip = 0, take = 20, status, accountType } = {}) => {
    const where = {};
    if (status)      where.status      = status;
    if (accountType) where.accountType = accountType;

    return prisma.account.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  },

  countAccounts: ({ status, accountType } = {}) => {
    const where = {};
    if (status)      where.status      = status;
    if (accountType) where.accountType = accountType;
    return prisma.account.count({ where });
  },

  findAccountById: (id) =>
    prisma.account.findUnique({
      where:   { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    }),

  // Used by freeze/unfreeze — returns the updated row
  updateAccountStatus: (id, status) =>
    prisma.account.update({
      where: { id },
      data:  { status, updatedAt: new Date() },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    }),

  // ── Audit Logs ───────────────────────────────────────────────────────────

  findAllAuditLogs: ({ skip = 0, take = 20, userId, action } = {}) => {
    const where = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;

    return prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  },

  countAuditLogs: ({ userId, action } = {}) => {
    const where = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    return prisma.auditLog.count({ where });
  },

  // ── Dashboard stats ──────────────────────────────────────────────────────
  // Fetched in parallel — a single admin dashboard call

  getDashboardStats: () =>
    Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.account.count(),
      prisma.account.count({ where: { status: 'FROZEN' } }),
      prisma.transaction.count(),
      prisma.transaction.count({ where: { status: 'COMPLETED' } }),
      prisma.transaction.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED' } }),
    ]).then(([
      totalUsers,
      totalAdmins,
      totalAccounts,
      frozenAccounts,
      totalTransactions,
      completedTransactions,
      amountAgg,
    ]) => ({
      users: {
        total:  totalUsers,
        admins: totalAdmins,
        users:  totalUsers - totalAdmins,
      },
      accounts: {
        total:  totalAccounts,
        frozen: frozenAccounts,
        active: totalAccounts - frozenAccounts,
      },
      transactions: {
        total:     totalTransactions,
        completed: completedTransactions,
        totalVolume: amountAgg._sum.amount || 0,
      },
    })),
};

module.exports = adminRepository;
