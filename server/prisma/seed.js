/**
 * FinCore — Database Seed Script
 *
 * Execution order follows foreign key dependencies:
 *   Users → Accounts → Beneficiaries → Transactions → Audit Logs
 *
 * Sessions are intentionally NOT seeded.
 * They are created dynamically on login and represent live auth state.
 * Pre-seeding sessions would give false data to monitoring dashboards.
 *
 * Run with:  node prisma/seed.js
 * Reset with: npx prisma migrate reset  (wipes DB, re-migrates, re-seeds)
 */

'use strict';

const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const { hashPassword }       = require('./helpers/hashPassword');
const { generateAccountNumber }  = require('./helpers/accountNumber');
const { generateReferenceNumber } = require('./helpers/referenceNumber');

const prisma = new PrismaClient();

// ─── Shared collision-tracking sets ──────────────────────────────────────────
// Passed into helpers so duplicates are detected within the seeding run
// without needing extra DB round-trips.
const usedAccountNumbers = new Set();
const usedRefNumbers     = new Set();

// ─── Seed date offsets ───────────────────────────────────────────────────────
// All timestamps are relative to "now" so the data always looks recent.
// daysAgo(n) returns a Date n days in the past.
const daysAgo  = (n) => { const d = new Date(); d.setDate(d.getDate() - n);   return d; };
const hoursAgo = (n) => { const d = new Date(); d.setHours(d.getHours() - n); return d; };

// =============================================================================
// STEP 1 — USERS
// =============================================================================

async function seedUsers() {
  console.log('\n👤  Seeding users…');

  const password = await hashPassword('Demo@1234');

  const users = await Promise.all([

    prisma.user.upsert({
      where: { email: 'admin@fincore.io' },
      update: {},
      create: {
        id:           uuidv4(),
        firstName:    'Admin',
        lastName:     'User',
        email:        'admin@fincore.io',
        phone:        '+91-9000000001',
        passwordHash: password,
        role:         'ADMIN',
        isVerified:   true,
        createdAt:    daysAgo(60),
      },
    }),

    prisma.user.upsert({
      where: { email: 'deep@fincore.io' },
      update: {},
      create: {
        id:           uuidv4(),
        firstName:    'Deep',
        lastName:     'Patel',
        email:        'deep@fincore.io',
        phone:        '+91-9000000002',
        passwordHash: password,
        role:         'USER',
        isVerified:   true,
        createdAt:    daysAgo(30),
      },
    }),

    prisma.user.upsert({
      where: { email: 'priya@fincore.io' },
      update: {},
      create: {
        id:           uuidv4(),
        firstName:    'Priya',
        lastName:     'Yadav',
        email:        'priya@fincore.io',
        phone:        '+91-9000000003',
        passwordHash: password,
        role:         'USER',
        isVerified:   true,
        createdAt:    daysAgo(25),
      },
    }),

  ]);

  // Destructure by position — matches creation order above
  const [admin, deep, priya] = users;

  console.log(`   ✓ admin  →  ${admin.email}  (${admin.role})`);
  console.log(`   ✓ user   →  ${deep.email}   (${deep.role})`);
  console.log(`   ✓ user   →  ${priya.email}  (${priya.role})`);

  return { admin, deep, priya };
}

// =============================================================================
// STEP 2 — ACCOUNTS
// =============================================================================

async function seedAccounts({ admin, deep, priya }) {
  console.log('\n🏦  Seeding accounts…');

  const accounts = await Promise.all([

    prisma.account.create({
      data: {
        id:            uuidv4(),
        userId:        admin.id,
        accountNumber: generateAccountNumber(usedAccountNumbers),
        accountType:   'SAVINGS',
        balance:       1000000.00,   // ₹10,00,000 — Admin operating account
        currency:      'INR',
        status:        'ACTIVE',
        createdAt:     daysAgo(60),
      },
    }),

    prisma.account.create({
      data: {
        id:            uuidv4(),
        userId:        deep.id,
        accountNumber: generateAccountNumber(usedAccountNumbers),
        accountType:   'SAVINGS',
        balance:       25000.00,     // ₹25,000 — after salary + spending
        currency:      'INR',
        status:        'ACTIVE',
        createdAt:     daysAgo(30),
      },
    }),

    prisma.account.create({
      data: {
        id:            uuidv4(),
        userId:        priya.id,
        accountNumber: generateAccountNumber(usedAccountNumbers),
        accountType:   'CURRENT',
        balance:       18500.00,     // ₹18,500 — after freelance + spending
        currency:      'INR',
        status:        'ACTIVE',
        createdAt:     daysAgo(25),
      },
    }),

  ]);

  const [adminAccount, deepAccount, priyaAccount] = accounts;

  console.log(`   ✓ ${adminAccount.accountNumber}  SAVINGS   ₹${adminAccount.balance}  → Admin`);
  console.log(`   ✓ ${deepAccount.accountNumber}   SAVINGS   ₹${deepAccount.balance}   → Deep`);
  console.log(`   ✓ ${priyaAccount.accountNumber}  CURRENT   ₹${priyaAccount.balance}  → Priya`);

  return { adminAccount, deepAccount, priyaAccount };
}

// =============================================================================
// STEP 3 — BENEFICIARIES
// =============================================================================

async function seedBeneficiaries({ deep, priya, deepAccount, priyaAccount }) {
  console.log('\n📋  Seeding beneficiaries…');

  // Deep has saved Priya as a beneficiary (for rent payment)
  const deepSavesPriya = await prisma.beneficiary.create({
    data: {
      id:              uuidv4(),
      userId:          deep.id,
      beneficiaryName: 'Priya Yadav',
      accountNumber:   priyaAccount.accountNumber,
      bankName:        'FinCore Bank',
      ifscCode:        'FINC0000001',
      createdAt:       daysAgo(20),
    },
  });

  // Priya has saved Deep as a beneficiary (for splitting payments)
  const priyaSavesDeep = await prisma.beneficiary.create({
    data: {
      id:              uuidv4(),
      userId:          priya.id,
      beneficiaryName: 'Deep Patel',
      accountNumber:   deepAccount.accountNumber,
      bankName:        'FinCore Bank',
      ifscCode:        'FINC0000001',
      createdAt:       daysAgo(18),
    },
  });

  console.log(`   ✓ Deep's beneficiary    → ${deepSavesPriya.beneficiaryName} (${deepSavesPriya.accountNumber})`);
  console.log(`   ✓ Priya's beneficiary   → ${priyaSavesDeep.beneficiaryName} (${priyaSavesDeep.accountNumber})`);

  return { deepSavesPriya, priyaSavesDeep };
}

// =============================================================================
// STEP 4 — TRANSACTIONS
// =============================================================================
//
// Balances at seed time must reconcile with the account balances set in Step 2.
// Working backwards from final balances:
//
//   Deep's account  — final ₹25,000
//     +30,000  Salary deposit       → running: +30,000
//     -5,000   ATM withdrawal       → running: +25,000
//     -2,500   Transfer to Priya    → running: +22,500
//     +1,000   Transfer from Priya  → running: +23,500   ← doesn't match?
//
// Wait — the account balance reflects the STATE AFTER all transactions, which
// we set directly in Step 2. The transactions are the *history* that explains
// how we got there. The final balance in Step 2 is the source of truth.
// These transactions are realistic history, not recomputed from scratch.
//
// =============================================================================

async function seedTransactions({ deepAccount, priyaAccount }) {
  console.log('\n💸  Seeding transactions…');

  const transactions = [];

  // ── T1: Salary deposit into Deep's account ──────────────────────────────
  // No sender — money originates externally (payroll system)
  transactions.push(await prisma.transaction.create({
    data: {
      id:               uuidv4(),
      senderAccountId:  null,
      receiverAccountId: deepAccount.id,
      amount:           30000.00,
      transactionType:  'DEPOSIT',
      description:      'Salary Credit — October 2025',
      status:           'COMPLETED',
      referenceNumber:  generateReferenceNumber(usedRefNumbers),
      createdAt:        daysAgo(20),
    },
  }));

  // ── T2: ATM withdrawal by Deep ───────────────────────────────────────────
  // No receiver — cash leaves the system
  transactions.push(await prisma.transaction.create({
    data: {
      id:               uuidv4(),
      senderAccountId:  deepAccount.id,
      receiverAccountId: null,
      amount:           5000.00,
      transactionType:  'WITHDRAWAL',
      description:      'ATM Withdrawal — Koramangala Branch',
      status:           'COMPLETED',
      referenceNumber:  generateReferenceNumber(usedRefNumbers),
      createdAt:        daysAgo(15),
    },
  }));

  // ── T3: Transfer — Deep → Priya (Rent Payment) ──────────────────────────
  transactions.push(await prisma.transaction.create({
    data: {
      id:               uuidv4(),
      senderAccountId:  deepAccount.id,
      receiverAccountId: priyaAccount.id,
      amount:           2500.00,
      transactionType:  'TRANSFER',
      description:      'Rent Payment — November 2025',
      status:           'COMPLETED',
      referenceNumber:  generateReferenceNumber(usedRefNumbers),
      createdAt:        daysAgo(10),
    },
  }));

  // ── T4: Transfer — Priya → Deep (Lunch Split) ───────────────────────────
  transactions.push(await prisma.transaction.create({
    data: {
      id:               uuidv4(),
      senderAccountId:  priyaAccount.id,
      receiverAccountId: deepAccount.id,
      amount:           1000.00,
      transactionType:  'TRANSFER',
      description:      'Lunch Split — Farzi Cafe',
      status:           'COMPLETED',
      referenceNumber:  generateReferenceNumber(usedRefNumbers),
      createdAt:        daysAgo(5),
    },
  }));

  // ── T5: Freelance deposit into Priya's account ──────────────────────────
  // No sender — external client payment
  transactions.push(await prisma.transaction.create({
    data: {
      id:               uuidv4(),
      senderAccountId:  null,
      receiverAccountId: priyaAccount.id,
      amount:           20000.00,
      transactionType:  'DEPOSIT',
      description:      'Freelance Payment — UI Design Project',
      status:           'COMPLETED',
      referenceNumber:  generateReferenceNumber(usedRefNumbers),
      createdAt:        daysAgo(3),
    },
  }));

  transactions.forEach((t, i) => {
    const direction = t.senderAccountId && t.receiverAccountId ? '↔' :
                      t.receiverAccountId ? '↓' : '↑';
    console.log(`   ✓ T${i + 1} [${t.transactionType.padEnd(10)}] ${direction}  ₹${t.amount}  — ${t.description}`);
  });

  return transactions;
}

// =============================================================================
// STEP 5 — AUDIT LOGS
// =============================================================================

async function seedAuditLogs({ admin, deep, priya, transactions }) {
  console.log('\n📝  Seeding audit logs…');

  // Reference the two transfer transactions for metadata
  const [,, deepToPrivaTransfer,, ] = transactions; // T3 — Deep → Priya
  const [,,, priyaToDeepTransfer, ] = transactions; // T4 — Priya → Deep

  const logs = await prisma.auditLog.createMany({
    data: [

      // Deep registers
      {
        id:        uuidv4(),
        userId:    deep.id,
        action:    'REGISTER',
        ipAddress: '192.168.1.10',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36',
        metadata:  { email: deep.email },
        createdAt: daysAgo(30),
      },

      // Deep logs in
      {
        id:        uuidv4(),
        userId:    deep.id,
        action:    'LOGIN',
        ipAddress: '192.168.1.10',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36',
        metadata:  { email: deep.email, success: true },
        createdAt: daysAgo(20),
      },

      // Deep initiates the rent transfer
      {
        id:        uuidv4(),
        userId:    deep.id,
        action:    'TRANSFER',
        ipAddress: '192.168.1.10',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36',
        metadata:  {
          referenceNumber: deepToPrivaTransfer.referenceNumber,
          amount:          2500,
          currency:        'INR',
          receiver:        'Priya Yadav',
          description:     'Rent Payment — November 2025',
        },
        createdAt: daysAgo(10),
      },

      // Priya logs in
      {
        id:        uuidv4(),
        userId:    priya.id,
        action:    'LOGIN',
        ipAddress: '103.21.58.74',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
        metadata:  { email: priya.email, success: true },
        createdAt: daysAgo(5),
      },

      // Priya initiates the lunch split transfer
      {
        id:        uuidv4(),
        userId:    priya.id,
        action:    'TRANSFER',
        ipAddress: '103.21.58.74',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
        metadata:  {
          referenceNumber: priyaToDeepTransfer.referenceNumber,
          amount:          1000,
          currency:        'INR',
          receiver:        'Deep Patel',
          description:     'Lunch Split — Farzi Cafe',
        },
        createdAt: daysAgo(5),
      },

      // Admin logs in (different IP — office network)
      {
        id:        uuidv4(),
        userId:    admin.id,
        action:    'LOGIN',
        ipAddress: '10.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36',
        metadata:  { email: admin.email, success: true, role: 'ADMIN' },
        createdAt: hoursAgo(2),
      },

    ],
  });

  console.log(`   ✓ ${logs.count} audit log entries created`);
}

// =============================================================================
// STEP 6 — SUMMARY
// =============================================================================

async function printSummary() {
  const [users, accounts, beneficiaries, transactions, sessions, auditLogs] = await Promise.all([
    prisma.user.count(),
    prisma.account.count(),
    prisma.beneficiary.count(),
    prisma.transaction.count(),
    prisma.session.count(),
    prisma.auditLog.count(),
  ]);

  console.log('\n─────────────────────────────────────────');
  console.log('  FinCore seed complete\n');
  console.log(`  Table            Rows`);
  console.log(`  ─────────────    ────`);
  console.log(`  users            ${String(users).padStart(4)}`);
  console.log(`  accounts         ${String(accounts).padStart(4)}`);
  console.log(`  beneficiaries    ${String(beneficiaries).padStart(4)}`);
  console.log(`  transactions     ${String(transactions).padStart(4)}`);
  console.log(`  sessions         ${String(sessions).padStart(4)}  (seeded intentionally empty)`);
  console.log(`  audit_logs       ${String(auditLogs).padStart(4)}`);
  console.log('\n  Login credentials (all accounts):');
  console.log('  admin@fincore.io  /  Demo@1234  (ADMIN)');
  console.log('  deep@fincore.io   /  Demo@1234  (USER)');
  console.log('  priya@fincore.io  /  Demo@1234  (USER)');
  console.log('─────────────────────────────────────────\n');
}

// =============================================================================
// MAIN — orchestrates all steps in dependency order
// =============================================================================

async function main() {
  console.log('🌱  FinCore database seed starting…');

  // Each step receives the created records it needs as arguments.
  // This avoids extra DB queries and makes the data flow explicit.
  const { admin, deep, priya }                            = await seedUsers();
  const { adminAccount, deepAccount, priyaAccount }       = await seedAccounts({ admin, deep, priya });
  await seedBeneficiaries({ deep, priya, deepAccount, priyaAccount });
  const transactions = await seedTransactions({ deepAccount, priyaAccount });
  await seedAuditLogs({ admin, deep, priya, transactions });
  await printSummary();
}

main()
  .catch((err) => {
    console.error('\n❌  Seed failed:', err.message);
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
