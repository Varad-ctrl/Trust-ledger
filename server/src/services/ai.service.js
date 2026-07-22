'use strict';

/**
 * FinCore AI Service — Phase 5 (Groq Edition)
 *
 * Architecture: Intent Detection + Data Injection
 *
 * How it works:
 *   1. Parse the user's message to detect intent (balance, transactions, etc.)
 *   2. Fetch REAL data from PostgreSQL using Prisma (based on detected intent)
 *   3. Inject that real data into a structured prompt
 *   4. Send prompt + data to Groq (Llama 3.3 70B)
 *   5. Groq formats a natural, grounded response
 *
 * The AI NEVER invents numbers — every figure comes from the database.
 * Groq never touches the database directly; it only receives pre-fetched data.
 *
 * Why Groq instead of OpenAI?
 *   - Free tier available at console.groq.com
 *   - Llama 3.3-70B is extremely fast (tokens/sec is 3-5x faster than GPT-4o)
 *   - Near-identical API surface to OpenAI — easy to migrate
 *   - No vendor lock-in: one provider abstraction supports Groq, OpenAI, Gemini
 *
 * Modules:
 *   M1 — AI Chat Assistant    → chat()
 *   M2 — Spending Insights    → getSpendingInsights()
 *   M3 — Fraud Detection      → getFraudAnalysis()
 *   M4 — NL Search            → handled inside chat() via intent detection
 *   M5 — Financial Advisor    → handled inside chat() via intent detection
 *   M6 — Smart Dashboard      → getSmartDashboard()
 */

const Groq   = require('groq-sdk');
const prisma = require('../config/prisma');
const logger = require('../config/logger');

// ── Provider abstraction ───────────────────────────────────────────────────────
// Single client creation. If no API key → graceful fallback (no crash).
const groq  = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const MODEL = process.env.GROQ_MODEL   || 'llama-3.3-70b-versatile';

const NO_KEY_MSG = 'AI features require a Groq API key. Add GROQ_API_KEY=gsk_... to server/.env. Get a free key at console.groq.com — no credit card required.';

// ── LLM call wrapper ───────────────────────────────────────────────────────────
// All Groq calls go through here. Single place to swap provider.
const llm = async (messages, options = {}) => {
  if (!groq) return null;
  const res = await groq.chat.completions.create({
    model:       MODEL,
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens:  options.max_tokens  ?? 1024,
  });
  return res.choices[0].message.content.trim();
};

// ── System prompt factory ──────────────────────────────────────────────────────
const systemPrompt = (userName) =>
  `You are FinCore AI, a banking assistant for ${userName}.

STRICT RULES:
- NEVER invent, guess, or assume any financial figures.
- ONLY use numbers from the "DATA" section provided to you.
- If the data section says "no data", say so clearly.
- Be concise, friendly, and use ₹ for Indian Rupees.
- Format amounts as ₹X,XX,XXX (Indian number format).
- Current date: ${new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}.`;

// ═════════════════════════════════════════════════════════════════════════════
// DATABASE FETCHERS — all Prisma queries live here, not in the LLM layer
// ═════════════════════════════════════════════════════════════════════════════

const periodToRange = (period) => {
  const now = new Date(), s = new Date();
  if (period === 'today')      { s.setHours(0,0,0,0); }
  else if (period === 'week')  { s.setDate(now.getDate() - 7); }
  else if (period === 'month') { s.setDate(1); s.setHours(0,0,0,0); }
  else if (period === 'year')  { s.setMonth(0,1); s.setHours(0,0,0,0); }
  return { gte: s, lte: now };
};

const db = {
  getUser: (userId) =>
    prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true, email: true } }),

  getAccounts: async (userId) => {
    const accounts = await prisma.account.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
    const total = accounts.filter(a => a.status === 'ACTIVE').reduce((s, a) => s + parseFloat(a.balance), 0);
    return { accounts: accounts.map(a => ({ type: a.accountType, number: a.accountNumber, balance: parseFloat(a.balance).toFixed(2), currency: a.currency, status: a.status })), totalBalance: total.toFixed(2) };
  },

  getRecentTransactions: async (userId, limit = 10, filter = {}) => {
    const userAccounts = await prisma.account.findMany({ where: { userId }, select: { id: true } });
    const accountIds   = userAccounts.map(a => a.id);
    const where = { OR: [{ senderAccountId: { in: accountIds } }, { receiverAccountId: { in: accountIds } }] };
    if (filter.type && filter.type !== 'ALL') where.transactionType = filter.type;
    if (filter.minAmount) where.amount = { ...where.amount, gte: filter.minAmount };
    if (filter.maxAmount) where.amount = { ...where.amount, lte: filter.maxAmount };
    if (filter.keyword)   where.description = { contains: filter.keyword, mode: 'insensitive' };
    if (filter.days)      where.createdAt = { gte: new Date(Date.now() - filter.days * 86400000) };
    const txns = await prisma.transaction.findMany({
      where, take: Math.min(limit, 50),
      include: { senderAccount: { include: { user: { select: { firstName: true, lastName: true } } } }, receiverAccount: { include: { user: { select: { firstName: true, lastName: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return txns.map(t => ({
      type: t.transactionType, amount: parseFloat(t.amount).toFixed(2),
      description: t.description, status: t.status,
      date: new Date(t.createdAt).toLocaleDateString('en-IN'),
      direction: accountIds.includes(t.senderAccountId) ? 'SENT' : 'RECEIVED',
      counterparty: accountIds.includes(t.senderAccountId)
        ? (t.receiverAccount?.user ? `${t.receiverAccount.user.firstName} ${t.receiverAccount.user.lastName}` : 'External')
        : (t.senderAccount?.user  ? `${t.senderAccount.user.firstName} ${t.senderAccount.user.lastName}`   : 'External'),
    }));
  },

  getSpending: async (userId, period = 'month') => {
    const userAccounts = await prisma.account.findMany({ where: { userId }, select: { id: true } });
    const accountIds   = userAccounts.map(a => a.id);
    const range = periodToRange(period);
    const txns  = await prisma.transaction.findMany({ where: { createdAt: range, OR: [{ senderAccountId: { in: accountIds } }, { receiverAccountId: { in: accountIds } }], status: 'COMPLETED' } });
    let spent = 0, received = 0;
    txns.forEach(t => { if (accountIds.includes(t.senderAccountId)) spent += parseFloat(t.amount); if (accountIds.includes(t.receiverAccountId)) received += parseFloat(t.amount); });
    return { period, totalSpent: spent.toFixed(2), totalReceived: received.toFixed(2), transactionCount: txns.length };
  },

  getMonthlyComparison: async (userId) => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth()-1, 1);
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const userAccounts = await prisma.account.findMany({ where: { userId }, select: { id: true } });
    const accountIds   = userAccounts.map(a => a.id);
    const calc = async (from, to) => {
      const txns = await prisma.transaction.findMany({ where: { createdAt: { gte: from, lte: to }, OR: [{ senderAccountId: { in: accountIds } }, { receiverAccountId: { in: accountIds } }], status: 'COMPLETED' } });
      return txns.reduce((s, t) => { if (accountIds.includes(t.senderAccountId)) s.spent += parseFloat(t.amount); if (accountIds.includes(t.receiverAccountId)) s.received += parseFloat(t.amount); return s; }, { spent: 0, received: 0 });
    };
    const [tm, lm] = await Promise.all([calc(thisMonthStart, now), calc(lastMonthStart, lastMonthEnd)]);
    const change = lm.spent > 0 ? ((tm.spent - lm.spent) / lm.spent * 100).toFixed(1) : null;
    return { thisMonth: { spent: tm.spent.toFixed(2), received: tm.received.toFixed(2) }, lastMonth: { spent: lm.spent.toFixed(2), received: lm.received.toFixed(2) }, spendingChangePercent: change };
  },

  getTopRecipients: async (userId, limit = 5) => {
    const userAccounts = await prisma.account.findMany({ where: { userId }, select: { id: true } });
    const accountIds   = userAccounts.map(a => a.id);
    const txns = await prisma.transaction.findMany({ where: { senderAccountId: { in: accountIds }, transactionType: 'TRANSFER', status: 'COMPLETED' }, include: { receiverAccount: { include: { user: { select: { firstName: true, lastName: true } } } } } });
    const map = {};
    txns.forEach(t => { const n = t.receiverAccount?.user ? `${t.receiverAccount.user.firstName} ${t.receiverAccount.user.lastName}` : t.receiverAccount?.accountNumber || 'Unknown'; if (!map[n]) map[n] = { name: n, count: 0, total: 0 }; map[n].count++; map[n].total += parseFloat(t.amount); });
    return Object.values(map).sort((a,b) => b.count - a.count).slice(0, limit).map(r => ({ ...r, total: r.total.toFixed(2) }));
  },

  getScheduled: async (userId, status) => {
    const where = { userId };
    if (status && status !== 'ALL') where.status = status;
    const items = await prisma.scheduledTransfer.findMany({ where, include: { senderAccount: true, receiverAccount: { include: { user: { select: { firstName: true, lastName: true } } } } }, orderBy: { executeAt: 'asc' } });
    return items.map(s => ({ amount: parseFloat(s.amount).toFixed(2), description: s.description, executeAt: new Date(s.executeAt).toLocaleDateString('en-IN'), status: s.status, to: s.receiverAccount?.user ? `${s.receiverAccount.user.firstName} ${s.receiverAccount.user.lastName}` : s.receiverAccount?.accountNumber }));
  },

  getStanding: async (userId, status) => {
    const where = { userId };
    if (status && status !== 'ALL') where.status = status;
    const items = await prisma.standingInstruction.findMany({ where, include: { receiverAccount: { include: { user: { select: { firstName: true, lastName: true } } } } }, orderBy: { createdAt: 'desc' } });
    return items.map(s => ({ amount: parseFloat(s.amount).toFixed(2), description: s.description, frequency: s.frequency, dayOfMonth: s.dayOfMonth, nextRunAt: new Date(s.nextRunAt).toLocaleDateString('en-IN'), status: s.status, executionCount: s.executionCount, to: s.receiverAccount?.user ? `${s.receiverAccount.user.firstName} ${s.receiverAccount.user.lastName}` : s.receiverAccount?.accountNumber }));
  },

  getBeneficiaries: async (userId) => {
    const b = await prisma.beneficiary.findMany({ where: { userId }, orderBy: [{ isFavourite: 'desc' }, { createdAt: 'desc' }] });
    return b.map(x => ({ name: x.beneficiaryName, accountNumber: x.accountNumber, bank: x.bankName, favourite: x.isFavourite }));
  },

  getFraudSignals: async (userId) => {
    const userAccounts = await prisma.account.findMany({ where: { userId }, select: { id: true } });
    const accountIds   = userAccounts.map(a => a.id);
    const txns = await prisma.transaction.findMany({ where: { senderAccountId: { in: accountIds }, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } }, orderBy: { createdAt: 'desc' } });
    const signals = [];
    const amounts = txns.map(t => parseFloat(t.amount));
    const avg = amounts.length ? amounts.reduce((a,b)=>a+b,0)/amounts.length : 0;
    txns.forEach(t => { if (parseFloat(t.amount) > avg * 3 && parseFloat(t.amount) > 5000) signals.push({ type: 'LARGE_TRANSFER', severity: 'HIGH', amount: parseFloat(t.amount), description: `Transfer of ₹${parseFloat(t.amount).toLocaleString('en-IN')} is unusually large (${Math.round(parseFloat(t.amount)/avg)}× your average)` }); });
    const byMinute = {};
    txns.forEach(t => { const k = Math.floor(new Date(t.createdAt).getTime()/60000); byMinute[k] = (byMinute[k]||0)+1; });
    Object.entries(byMinute).forEach(([,c]) => { if (c >= 3) signals.push({ type: 'RAPID_TRANSFERS', severity: 'MEDIUM', description: `${c} transfers detected within the same minute` }); });
    txns.forEach(t => { const h = new Date(t.createdAt).getHours(); if (h >= 0 && h <= 5) signals.push({ type: 'OFF_HOURS', severity: 'LOW', description: `Transfer at ${h}:00 — outside normal banking hours` }); });
    const risk = signals.some(s=>s.severity==='HIGH') ? 'HIGH' : signals.some(s=>s.severity==='MEDIUM') ? 'MEDIUM' : signals.length > 0 ? 'LOW' : 'NONE';
    return { riskLevel: risk, signalCount: signals.length, signals: signals.slice(0, 10), analysedTransactions: txns.length };
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// INTENT DETECTION — keyword-based routing (fast, no AI cost)
// ═════════════════════════════════════════════════════════════════════════════

const detectIntent = (msg) => {
  const m = msg.toLowerCase();
  if (/balance|how much (do i|have i) (have|got)|total balance/.test(m))                    return 'BALANCE';
  if (/last \d+ (transaction|transfer|payment)|recent (transaction|transfer|payment)/.test(m)) return 'RECENT_TXN';
  if (/spend|spent|expense|debit|this month|last month|this week|today/.test(m))             return 'SPENDING';
  if (/who (do i|did i)|top recipient|most (transfer|send)|frequently/.test(m))             return 'TOP_RECIPIENTS';
  if (/schedul/.test(m))                                                                      return 'SCHEDULED';
  if (/standing|recurring|repeat|automatic/.test(m))                                         return 'STANDING';
  if (/beneficiar|payee|saved/.test(m))                                                      return 'BENEFICIARIES';
  if (/above|below|more than|less than|over|under|₹/.test(m) && /transfer|payment|transact/.test(m)) return 'SEARCH';
  if (/fraud|suspicious|unusual|safe|secure/.test(m))                                        return 'FRAUD';
  if (/afford|can i buy|save more|advice|suggest|recommend|budget|goal/.test(m))            return 'ADVISOR';
  if (/upi/.test(m))                                                                          return 'UPI';
  return 'GENERAL';
};

// Extract numeric filters from natural language
const extractFilters = (msg) => {
  const filters = {};
  const above = msg.match(/(?:above|more than|over|greater than)\s*[₹]?(\d+[\d,]*)/i);
  const below = msg.match(/(?:below|less than|under)\s*[₹]?(\d+[\d,]*)/i);
  const last  = msg.match(/last\s+(\d+)\s+(day|week)/i);
  const kw    = msg.match(/for\s+"?([a-zA-Z]+)"?|description.*?"([^"]+)"/i);
  if (above)  filters.minAmount = parseFloat(above[above.length-1].replace(/,/g,''));
  if (below)  filters.maxAmount = parseFloat(below[below.length-1].replace(/,/g,''));
  if (last)   filters.days      = parseInt(last[1]) * (last[2].startsWith('week') ? 7 : 1);
  if (kw)     filters.keyword   = kw[1] || kw[2];
  const limit = msg.match(/last\s+(\d+)\s+transaction/i);
  if (limit)  filters.limit     = parseInt(limit[1]);
  return filters;
};

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 1+4+5 — CHAT
// ═════════════════════════════════════════════════════════════════════════════

const chat = async (userId, userMessage, conversationHistory = []) => {
  if (!groq) return { message: NO_KEY_MSG, toolsUsed: [] };

  const [user, intent] = await Promise.all([
    db.getUser(userId),
    Promise.resolve(detectIntent(userMessage)),
  ]);
  if (!user) throw new Error('User not found');

  const filters  = extractFilters(userMessage);
  const dataUsed = [];
  let   dataSection = '';

  // Fetch only what's needed based on intent
  switch (intent) {
    case 'BALANCE': {
      const d = await db.getAccounts(userId);
      dataUsed.push('accounts');
      dataSection = `ACCOUNTS & BALANCE:\n${JSON.stringify(d, null, 2)}`;
      break;
    }
    case 'RECENT_TXN': {
      const limit = filters.limit || 10;
      const d = await db.getRecentTransactions(userId, limit);
      dataUsed.push('transactions');
      dataSection = `RECENT ${limit} TRANSACTIONS:\n${JSON.stringify(d, null, 2)}`;
      break;
    }
    case 'SEARCH': {
      const d = await db.getRecentTransactions(userId, 20, filters);
      dataUsed.push('transaction_search');
      dataSection = `MATCHING TRANSACTIONS (filters: ${JSON.stringify(filters)}):\n${JSON.stringify(d, null, 2)}`;
      break;
    }
    case 'SPENDING': {
      const period = /today/.test(userMessage) ? 'today' : /week/.test(userMessage) ? 'week' : /year/.test(userMessage) ? 'year' : 'month';
      const [spending, monthly] = await Promise.all([db.getSpending(userId, period), db.getMonthlyComparison(userId)]);
      dataUsed.push('spending', 'monthly_comparison');
      dataSection = `SPENDING (${period}):\n${JSON.stringify(spending, null, 2)}\n\nMONTHLY COMPARISON:\n${JSON.stringify(monthly, null, 2)}`;
      break;
    }
    case 'TOP_RECIPIENTS': {
      const d = await db.getTopRecipients(userId, 5);
      dataUsed.push('top_recipients');
      dataSection = `TOP TRANSFER RECIPIENTS:\n${JSON.stringify(d, null, 2)}`;
      break;
    }
    case 'SCHEDULED': {
      const d = await db.getScheduled(userId, 'ALL');
      dataUsed.push('scheduled_transfers');
      dataSection = `SCHEDULED TRANSFERS:\n${JSON.stringify(d, null, 2)}`;
      break;
    }
    case 'STANDING': {
      const d = await db.getStanding(userId, 'ALL');
      dataUsed.push('standing_instructions');
      dataSection = `STANDING INSTRUCTIONS:\n${JSON.stringify(d, null, 2)}`;
      break;
    }
    case 'BENEFICIARIES': {
      const d = await db.getBeneficiaries(userId);
      dataUsed.push('beneficiaries');
      dataSection = `BENEFICIARIES:\n${JSON.stringify(d, null, 2)}`;
      break;
    }
    case 'FRAUD': {
      const d = await db.getFraudSignals(userId);
      dataUsed.push('fraud_signals');
      dataSection = `FRAUD ANALYSIS:\n${JSON.stringify(d, null, 2)}`;
      break;
    }
    case 'ADVISOR': {
      const [accs, spending, monthly, topR] = await Promise.all([
        db.getAccounts(userId), db.getSpending(userId, 'month'),
        db.getMonthlyComparison(userId), db.getTopRecipients(userId, 3),
      ]);
      dataUsed.push('accounts', 'spending', 'comparison', 'recipients');
      dataSection = `FINANCIAL OVERVIEW:\nBalance: ${JSON.stringify(accs)}\nThis Month: ${JSON.stringify(spending)}\nComparison: ${JSON.stringify(monthly)}\nTop Recipients: ${JSON.stringify(topR)}`;
      break;
    }
    case 'UPI': {
      const upiData = await prisma.user.findUnique({ where: { id: userId }, select: { upiId: true, firstName: true } });
      dataUsed.push('upi');
      dataSection = `UPI DATA:\n${JSON.stringify(upiData, null, 2)}`;
      break;
    }
    default: {
      // General question — fetch a compact overview
      const [accs, recent] = await Promise.all([db.getAccounts(userId), db.getRecentTransactions(userId, 5)]);
      dataUsed.push('overview');
      dataSection = `OVERVIEW:\nBalance: ${JSON.stringify(accs)}\nLast 5 Transactions: ${JSON.stringify(recent)}`;
      break;
    }
  }

  logger.info(`[AI] Intent: ${intent}, data: ${dataUsed.join(', ')}`, { userId });

  // Build structured prompt — data is injected, AI cannot make up numbers
  const messages = [
    { role: 'system', content: systemPrompt(`${user.firstName} ${user.lastName}`) },
    // Include last 6 conversation turns for context
    ...conversationHistory.slice(-6),
    {
      role:    'user',
      content: `DATA (from database — do not invent any other numbers):\n${dataSection}\n\nUSER QUESTION: ${userMessage}`,
    },
  ];

  const response = await llm(messages, { temperature: 0.3 });
  return { message: response || 'I could not generate a response. Please try again.', toolsUsed: dataUsed };
};

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 2 — SPENDING INSIGHTS
// ═════════════════════════════════════════════════════════════════════════════

const getSpendingInsights = async (userId) => {
  const [monthly, topRecipients, accounts] = await Promise.all([
    db.getMonthlyComparison(userId),
    db.getTopRecipients(userId, 3),
    db.getAccounts(userId),
  ]);

  // Static insights always available (no AI needed)
  const staticInsights = [
    { type: 'balance',  title: 'Total Balance',    value: `₹${parseFloat(accounts.totalBalance).toLocaleString('en-IN')}`, detail: 'Across all active accounts' },
    { type: 'spending', title: 'This Month Spent',  value: `₹${parseFloat(monthly.thisMonth.spent).toLocaleString('en-IN')}`, detail: monthly.spendingChangePercent ? `${monthly.spendingChangePercent > 0 ? '↑' : '↓'} ${Math.abs(monthly.spendingChangePercent)}% vs last month` : 'No comparison data yet' },
    { type: 'income',   title: 'This Month Income', value: `₹${parseFloat(monthly.thisMonth.received).toLocaleString('en-IN')}`, detail: 'Total credits received' },
    ...(topRecipients[0] ? [{ type: 'transfer', title: 'Top Recipient', value: topRecipients[0].name, detail: `${topRecipients[0].count} transfers · ₹${parseFloat(topRecipients[0].total).toLocaleString('en-IN')} total` }] : []),
  ];

  if (!groq) {
    return { insights: staticInsights, summary: 'Add GROQ_API_KEY to enable AI-generated insights (free at console.groq.com).', rawData: { monthly, topRecipients } };
  }

  const prompt = `You are a financial analyst. Based on the data below, generate exactly 4 concise spending insights. 
Respond ONLY with a valid JSON array. No markdown, no explanation, just the array.
Each object must have: type (balance|spending|income|transfer|savings|change), title (max 20 chars), value (formatted ₹ or % or count, max 20 chars), detail (max 80 chars).

DATA:
Balance: ₹${accounts.totalBalance}
This month spent: ₹${monthly.thisMonth.spent}
This month received: ₹${monthly.thisMonth.received}
Last month spent: ₹${monthly.lastMonth.spent}
Spending change: ${monthly.spendingChangePercent || 'N/A'}%
Top recipients: ${JSON.stringify(topRecipients)}`;

  let insights = staticInsights;
  try {
    const raw = await llm([{ role: 'user', content: prompt }], { temperature: 0.2, max_tokens: 512 });
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    if (Array.isArray(parsed) && parsed.length > 0) insights = parsed;
  } catch (e) {
    logger.warn('[AI] Insights parse failed, using static fallback', { error: e.message });
  }

  const summary = monthly.spendingChangePercent
    ? `Spending is ${monthly.spendingChangePercent > 0 ? 'up' : 'down'} ${Math.abs(monthly.spendingChangePercent)}% compared to last month.`
    : 'This is your first month of data — keep tracking to see trends.';

  return { insights, summary, rawData: { monthly, topRecipients } };
};

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 3 — FRAUD DETECTION
// ═════════════════════════════════════════════════════════════════════════════

const getFraudAnalysis = async (userId) => db.getFraudSignals(userId);

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 6 — SMART DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════

const getSmartDashboard = async (userId) => {
  const [accounts, spending, scheduled, standing, topR, user] = await Promise.all([
    db.getAccounts(userId),
    db.getSpending(userId, 'month'),
    db.getScheduled(userId, 'PENDING'),
    db.getStanding(userId, 'ACTIVE'),
    db.getTopRecipients(userId, 1),
    db.getUser(userId),
  ]);

  const hour = new Date().getHours();
  const greeting = `${hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'}, ${user?.firstName || 'there'} 👋`;

  let recommendation = null;
  if (groq) {
    const prompt = `Give ONE practical financial recommendation (max 100 characters, no quotes) based on:
- Balance: ₹${accounts.totalBalance}
- Spent this month: ₹${spending.totalSpent}
- Received this month: ₹${spending.totalReceived}
- Upcoming scheduled transfers: ${scheduled.length}
- Active standing instructions: ${standing.length}
- Top recipient: ${topR[0] ? `${topR[0].name} (${topR[0].count} transfers)` : 'none'}
Be specific and actionable. Just the text, nothing else.`;
    try {
      recommendation = await llm([{ role: 'user', content: prompt }], { temperature: 0.4, max_tokens: 80 });
    } catch (e) {
      logger.warn('[AI] Smart dashboard recommendation failed', { error: e.message });
    }
  }

  return {
    greeting,
    balance:           accounts.totalBalance,
    currency:          'INR',
    thisMonth:         { spent: spending.totalSpent, received: spending.totalReceived },
    upcomingScheduled: scheduled.length,
    activeStanding:    standing.length,
    topRecipient:      topR[0] || null,
    nextScheduled:     scheduled[0] || null,
    recommendation,
  };
};

module.exports = { chat, getSpendingInsights, getFraudAnalysis, getSmartDashboard };
