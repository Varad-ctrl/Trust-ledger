'use strict';

/**
 * Dashboard Service
 *
 * Single responsibility: transform raw DB data into a meaningful response.
 *
 * This layer:
 *   - Calculates total balance across active accounts (using Decimal arithmetic)
 *   - Labels each recent transaction as SENT or RECEIVED from the user's POV
 *   - Shapes the final response object
 *
 * It does NOT touch req/res (controller's job) or write SQL (repository's job).
 */

const { Decimal } = require('@prisma/client/runtime/library');
const userRepository      = require('../repositories/user.repository');
const dashboardRepository = require('../repositories/dashboard.repository');

// =============================================================================
// Helpers
// =============================================================================

/**
 * sumBalances(accounts) → string
 *
 * Sums Prisma Decimal balance fields without ever converting to JavaScript
 * floats. Prisma returns Decimal objects; we accumulate with Decimal.add()
 * and return a fixed-point string ("24000.00") suitable for JSON.
 *
 * Why not Number()?
 *   Number("18999.99") + Number("5000.01") can produce 23999.999999999996
 *   in IEEE 754. Banking data must never be rounded by float arithmetic.
 */
const sumBalances = (accounts) => {
  const total = accounts.reduce(
    (sum, acc) => sum.plus(new Decimal(acc.balance)),
    new Decimal(0)
  );
  return total.toFixed(2); // always returns exactly two decimal places
};

/**
 * labelTransaction(tx, userId) → enriched transaction object
 *
 * From the user's point of view every transaction is either:
 *   SENT     — this user's account was the sender   (money left)
 *   RECEIVED — this user's account was the receiver (money arrived)
 *   DEPOSIT  / WITHDRAWAL — only one side is internal
 *
 * This label is computed once in the service so the frontend never has to
 * figure out "which side am I on?" — a common source of frontend bugs.
 */
const labelTransaction = (tx, accountIds) => {
  const isSender   = accountIds.has(tx.senderAccountId);
  const isReceiver = accountIds.has(tx.receiverAccountId);

  let direction;
  if      (isSender && isReceiver) direction = 'SELF';       // transfer between own accounts
  else if (isSender)               direction = 'SENT';
  else if (isReceiver)             direction = 'RECEIVED';
  else                             direction = 'UNKNOWN';     // should never happen

  // Counterparty: the other side of the transaction
  const counterparty = isSender
    ? tx.receiverAccount?.user ?? null
    : tx.senderAccount?.user  ?? null;

  return {
    id:              tx.id,
    referenceNumber: tx.referenceNumber,
    amount:          new Decimal(tx.amount).toFixed(2),
    transactionType: tx.transactionType,
    description:     tx.description,
    status:          tx.status,
    direction,                   // SENT | RECEIVED | SELF
    counterparty,                // { firstName, lastName } of the other party, or null
    senderAccount: tx.senderAccount
      ? { id: tx.senderAccount.id, accountNumber: tx.senderAccount.accountNumber, accountType: tx.senderAccount.accountType }
      : null,
    receiverAccount: tx.receiverAccount
      ? { id: tx.receiverAccount.id, accountNumber: tx.receiverAccount.accountNumber, accountType: tx.receiverAccount.accountType }
      : null,
    date: tx.createdAt,
  };
};

// =============================================================================
// Service
// =============================================================================
const dashboardService = {

  /**
   * getDashboard(userId)
   *
   * Fetches all data in one parallel repository call, then:
   *   1. Retrieves user profile (safe — no passwordHash)
   *   2. Computes total balance using Decimal arithmetic
   *   3. Builds a Set of the user's account IDs for O(1) direction lookup
   *   4. Labels each recent transaction with SENT/RECEIVED direction
   *   5. Returns a single shaped response object
   */
  getDashboard: async (userId) => {

    // Run user profile fetch and dashboard data fetch in parallel —
    // they are entirely independent queries.
    const [user, dashData] = await Promise.all([
      userRepository.findById(userId),          // returns safe fields only
      dashboardRepository.getDashboardData(userId),
    ]);

    const {
      accounts,
      accountCount,
      beneficiaryCount,
      transactionCount,
      recentTransactions,
    } = dashData;

    // Build a Set of this user's account IDs once — used by labelTransaction
    // for every recent transaction without re-fetching accounts.
    const accountIds = new Set(accounts.map((a) => a.id));

    return {
      // ── User ──────────────────────────────────────────────────────────────
      user: {
        firstName:  user.firstName,
        lastName:   user.lastName,
        email:      user.email,
        role:       user.role,
        isVerified: user.isVerified,
      },

      // ── Summary stats ─────────────────────────────────────────────────────
      summary: {
        totalBalance:   sumBalances(accounts),   // sum of ACTIVE account balances only
        currency:       'INR',                   // project scope: single currency display
        accounts:       accountCount,            // count includes FROZEN/CLOSED for transparency
        beneficiaries:  beneficiaryCount,
        transactions:   transactionCount,
      },

      // ── Active accounts list (for "My Accounts" panel on dashboard) ────────
      accounts: accounts.map((a) => ({
        id:            a.id,
        accountNumber: a.accountNumber,
        accountType:   a.accountType,
        balance:       new Decimal(a.balance).toFixed(2),
        currency:      a.currency,
        status:        a.status,
      })),

      // ── Recent activity ───────────────────────────────────────────────────
      recentTransactions: recentTransactions.map((tx) =>
        labelTransaction(tx, accountIds)
      ),
    };
  },
};

module.exports = dashboardService;
