'use strict';

/**
 * Dashboard Repository
 *
 * Single responsibility: fetch raw data from PostgreSQL via Prisma.
 * No calculations, no business logic — that belongs in the service layer.
 *
 * Design decision — parallel queries:
 *   Every piece of dashboard data is independent. Running them sequentially
 *   would mean the response time = sum of all query times. Running them with
 *   Promise.all() means response time = slowest single query.
 *
 *   Sequential (bad):   50ms + 30ms + 40ms + 20ms + 35ms = 175ms
 *   Parallel  (good):   max(50, 30, 40, 20, 35)           =  50ms
 */

const prisma = require('../config/prisma');

// ─── Field selects ────────────────────────────────────────────────────────────
// Defined at module level so they're reusable and easy to review in one place.

const ACCOUNT_FIELDS = {
  id:            true,
  accountNumber: true,
  accountType:   true,
  balance:       true,
  currency:      true,
  status:        true,
  createdAt:     true,
};

// For recent transactions we include both accounts so the service layer
// can label each entry as "sent" or "received" from this user's perspective.
const RECENT_TX_INCLUDE = {
  senderAccount: {
    select: {
      id:            true,
      accountNumber: true,
      accountType:   true,
      user: { select: { firstName: true, lastName: true } },
    },
  },
  receiverAccount: {
    select: {
      id:            true,
      accountNumber: true,
      accountType:   true,
      user: { select: { firstName: true, lastName: true } },
    },
  },
};

// ─── User-scoped filter ───────────────────────────────────────────────────────
// Transactions belong to a user if their account is either the sender OR receiver.
// This single filter is used for both the count and the recent-list queries.
const txUserFilter = (userId) => ({
  OR: [
    { senderAccount:   { userId } },
    { receiverAccount: { userId } },
  ],
});

// =============================================================================
// Repository
// =============================================================================
const dashboardRepository = {

  /**
   * getDashboardData(userId)
   *
   * Fires all five queries simultaneously with Promise.all().
   * Returns a plain object that the service layer uses directly.
   *
   * Queries:
   *   1. Active accounts (with balances)         — for total balance calculation
   *   2. Count of ALL accounts                   — displayed as "Accounts"
   *   3. Count of beneficiaries                  — displayed as "Beneficiaries"
   *   4. Count of ALL transactions               — displayed as "Transactions"
   *   5. Five most recent transactions           — displayed in "Recent Activity"
   */
  getDashboardData: async (userId) => {
    const [accounts, accountCount, beneficiaryCount, transactionCount, recentTransactions] =
      await Promise.all([

        // 1. Active accounts with balance — used to compute totalBalance
        //    We only sum ACTIVE accounts. FROZEN/CLOSED balances are excluded
        //    because those funds are not accessible to the user right now.
        prisma.account.findMany({
          where:  { userId, status: 'ACTIVE' },
          select: ACCOUNT_FIELDS,
          orderBy: { createdAt: 'desc' },
        }),

        // 2. Total account count (ALL statuses) — shown as the "Accounts" stat
        prisma.account.count({
          where: { userId },
        }),

        // 3. Beneficiary count
        prisma.beneficiary.count({
          where: { userId },
        }),

        // 4. Transaction count — every transaction involving this user's accounts
        prisma.transaction.count({
          where: txUserFilter(userId),
        }),

        // 5. Five most recent transactions — the activity feed
        //    Ordered newest-first so the UI shows the latest activity at top.
        prisma.transaction.findMany({
          where:   txUserFilter(userId),
          include: RECENT_TX_INCLUDE,
          orderBy: { createdAt: 'desc' },
          take:    5,
        }),

      ]);

    return { accounts, accountCount, beneficiaryCount, transactionCount, recentTransactions };
  },
};

module.exports = dashboardRepository;
