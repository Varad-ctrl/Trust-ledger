'use strict';

/**
 * Auth Service — business logic for all authentication flows.
 *
 * This layer knows about the domain (users, sessions, accounts, audit logs)
 * but knows nothing about HTTP. No req/res objects ever enter here.
 *
 * All database writes during registration run inside a Prisma interactive
 * transaction so the operation is fully atomic:
 *   user row + account row + audit log row
 *   → all succeed, or none do.
 */

const bcrypt  = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma             = require('../config/prisma');
const userRepository     = require('../repositories/user.repository');
const sessionRepository  = require('../repositories/session.repository');
const accountRepository  = require('../repositories/account.repository');
const { generateAccountNumber } = require('../utils/accountNumber');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  refreshTokenExpiry,
} = require('../utils/token');
const { MESSAGES, AUDIT_ACTIONS } = require('../constants');
const logger = require('../config/logger');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;

// ─── Helper: build the safe user object returned to clients ──────────────────
// Never include passwordHash in any response.
const safeUser = (user) => ({
  id:         user.id,
  firstName:  user.firstName,
  lastName:   user.lastName,
  email:      user.email,
  phone:      user.phone   || null,
  role:       user.role,
  isVerified: user.isVerified,
});

// ─── Helper: build JWT payload ───────────────────────────────────────────────
// Kept minimal — only what middleware needs to authorise a request.
// Additional fields (name, phone) are fetched from DB when needed.
const jwtPayload = (user) => ({
  id:    user.id,
  email: user.email,
  role:  user.role,
});

// =============================================================================
// MODULE 1 — REGISTER
// =============================================================================
const register = async ({ firstName, lastName, email, phone, password }, meta = {}) => {

  // 1. Duplicate email check (fast — indexed column)
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw Object.assign(new Error(MESSAGES.EMAIL_EXISTS), { status: 409 });
  }

  // 2. Hash password before any DB write
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const userId       = uuidv4();
  const accountId    = uuidv4();

  // 3. Atomic transaction: user + default savings account + audit log
  //    If the account insert fails (e.g. duplicate account number collision),
  //    the user row is also rolled back — no orphaned users.
  const accountNumber = await generateAccountNumber();

  const { user, account } = await prisma.$transaction(async (tx) => {

    const user = await userRepository.create({
      id:           userId,
      firstName,
      lastName,
      email,
      phone:        phone || null,
      passwordHash,
      role:         'USER',
      isVerified:   false,
    }, tx);

    // Every new user receives a default INR Savings account at zero balance.
    // Currency defaults to INR to match the seeded data and project scope.
    const account = await accountRepository.create({
      id:            accountId,
      userId:        user.id,
      accountNumber,
      accountType:   'SAVINGS',
      balance:       0,
      currency:      'INR',
      status:        'ACTIVE',
    }, tx);

    // Audit log inside the same transaction so it only exists if everything succeeds
    await tx.auditLog.create({
      data: {
        id:        uuidv4(),
        userId:    user.id,
        action:    AUDIT_ACTIONS.REGISTER,
        ipAddress: meta.ip        || null,
        userAgent: meta.userAgent || null,
        metadata:  { email: user.email, accountNumber: account.accountNumber },
      },
    });

    return { user, account };
  });

  // 4. Issue tokens — happens outside the transaction intentionally.
  //    Token generation cannot roll back DB writes, so we only issue tokens
  //    after we know the DB commit succeeded.
  const accessToken  = generateAccessToken(jwtPayload(user));
  const refreshToken = generateRefreshToken(jwtPayload(user));

  await sessionRepository.create({
    id:           uuidv4(),
    userId:       user.id,
    refreshToken,
    expiresAt:    refreshTokenExpiry(),
  });

  logger.info('User registered', { userId: user.id, email: user.email });

  return {
    accessToken,
    refreshToken,
    user:    safeUser(user),
    account: {
      id:            account.id,
      accountNumber: account.accountNumber,
      accountType:   account.accountType,
      balance:       account.balance,
      currency:      account.currency,
    },
  };
};

// =============================================================================
// MODULE 2 — LOGIN
// =============================================================================
const login = async ({ email, password }, meta = {}) => {

  // findByEmail returns the full row including passwordHash
  const user = await userRepository.findByEmail(email);

  // Deliberately use the same error message for "user not found" and
  // "wrong password" — prevents user enumeration attacks.
  if (!user) {
    throw Object.assign(new Error(MESSAGES.INVALID_CREDENTIALS), { status: 401 });
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    // Log failed attempt for fraud detection (future: rate-limit per IP)
    logger.warn('Failed login attempt', { email, ip: meta.ip });
    throw Object.assign(new Error(MESSAGES.INVALID_CREDENTIALS), { status: 401 });
  }

  const accessToken  = generateAccessToken(jwtPayload(user));
  const refreshToken = generateRefreshToken(jwtPayload(user));

  await sessionRepository.create({
    id:        uuidv4(),
    userId:    user.id,
    refreshToken,
    expiresAt: refreshTokenExpiry(),
  });

  await prisma.auditLog.create({
    data: {
      id:        uuidv4(),
      userId:    user.id,
      action:    AUDIT_ACTIONS.LOGIN,
      ipAddress: meta.ip        || null,
      userAgent: meta.userAgent || null,
      metadata:  { email: user.email, success: true },
    },
  });

  logger.info('User logged in', { userId: user.id });

  return {
    accessToken,
    refreshToken,
    user: safeUser(user),
  };
};

// =============================================================================
// MODULE 3 — REFRESH TOKEN (rotation)
// =============================================================================
const refresh = async (token) => {

  // 1. Verify the JWT signature first — cheap, no DB hit
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw Object.assign(new Error(MESSAGES.TOKEN_INVALID), { status: 401 });
  }

  // 2. Confirm the token exists in the sessions table (not yet rotated/revoked)
  const session = await sessionRepository.findByToken(token);
  if (!session) {
    // Token is valid JWT but not in DB → already rotated or explicitly revoked.
    // This can mean a stolen token was used after the real user already refreshed.
    throw Object.assign(new Error(MESSAGES.TOKEN_INVALID), { status: 401 });
  }

  // 3. Check DB-level expiry (belt-and-suspenders alongside JWT expiry)
  if (session.expiresAt < new Date()) {
    await sessionRepository.deleteByToken(token).catch(() => {});
    throw Object.assign(new Error(MESSAGES.TOKEN_EXPIRED), { status: 401 });
  }

  // 4. Rotation: delete old session, create new one atomically
  const newPayload      = jwtPayload(session.user);
  const newAccessToken  = generateAccessToken(newPayload);
  const newRefreshToken = generateRefreshToken(newPayload);

  await prisma.$transaction([
    prisma.session.delete({ where: { refreshToken: token } }),
    prisma.session.create({
      data: {
        id:           uuidv4(),
        userId:       session.user.id,
        refreshToken: newRefreshToken,
        expiresAt:    refreshTokenExpiry(),
      },
    }),
  ]);

  return {
    accessToken:  newAccessToken,
    refreshToken: newRefreshToken,
  };
};

// =============================================================================
// MODULE 4 — LOGOUT (current session)
// =============================================================================
const logout = async (refreshToken, userId, meta = {}) => {
  if (refreshToken) {
    // Silently ignore if the session no longer exists
    // (e.g. already expired and cleaned up)
    await sessionRepository.deleteByToken(refreshToken).catch(() => {});
  }

  await prisma.auditLog.create({
    data: {
      id:        uuidv4(),
      userId:    userId || null,
      action:    AUDIT_ACTIONS.LOGOUT,
      ipAddress: meta.ip        || null,
      userAgent: meta.userAgent || null,
      metadata:  { sessionCount: 1 },
    },
  }).catch(() => {}); // Non-critical — don't fail logout if audit write errors
};

// =============================================================================
// MODULE 5 — LOGOUT ALL DEVICES
// =============================================================================
const logoutAll = async (userId, meta = {}) => {

  const { count } = await sessionRepository.deleteAllByUser(userId);

  await prisma.auditLog.create({
    data: {
      id:        uuidv4(),
      userId,
      action:    AUDIT_ACTIONS.LOGOUT_ALL,
      ipAddress: meta.ip        || null,
      userAgent: meta.userAgent || null,
      metadata:  { sessionsRevoked: count },
    },
  }).catch(() => {});

  logger.info('All sessions revoked', { userId, sessionsRevoked: count });

  return { sessionsRevoked: count };
};

// =============================================================================
// MODULE 6 — GET ACTIVE SESSIONS (for "devices" screen)
// =============================================================================
const getSessions = async (userId) => {
  return sessionRepository.findAllByUser(userId);
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  getSessions,
};
