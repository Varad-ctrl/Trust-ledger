'use strict';

const HTTP = {
  OK:            200,
  CREATED:       201,
  NO_CONTENT:    204,
  BAD_REQUEST:   400,
  UNAUTHORIZED:  401,
  FORBIDDEN:     403,
  NOT_FOUND:     404,
  CONFLICT:      409,
  UNPROCESSABLE: 422,
  SERVER_ERROR:  500,
};

const MESSAGES = {
  // ── Auth ──────────────────────────────────────────────────────────
  REGISTER_SUCCESS:    'Account created successfully',
  LOGIN_SUCCESS:       'Login successful',
  LOGOUT_SUCCESS:      'Logged out successfully',
  LOGOUT_ALL_SUCCESS:  'Logged out from all devices',
  TOKEN_REFRESHED:     'Token refreshed',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_EXISTS:        'An account with this email already exists',
  PHONE_EXISTS:        'An account with this phone number already exists',
  UNAUTHORIZED:        'Authentication required',
  FORBIDDEN:           'You do not have permission to perform this action',
  TOKEN_EXPIRED:       'Session expired, please log in again',
  TOKEN_INVALID:       'Invalid or malformed token',
  REFRESH_TOKEN_MISSING: 'Refresh token is required',

  // ── Accounts ──────────────────────────────────────────────────────
  ACCOUNT_CREATED:    'Account created successfully',
  ACCOUNT_NOT_FOUND:  'Account not found',
  ACCOUNT_FROZEN:     'This account is frozen',
  INSUFFICIENT_FUNDS: 'Insufficient funds',

  // ── Transactions ──────────────────────────────────────────────────
  TRANSFER_SUCCESS:       'Transfer completed successfully',
  TRANSFER_FAILED:        'Transfer failed',
  TRANSACTION_NOT_FOUND:  'Transaction not found',
  SAME_ACCOUNT:           'Sender and receiver account cannot be the same',

  // ── Beneficiaries ─────────────────────────────────────────────────
  BENEFICIARY_ADDED:    'Beneficiary added successfully',
  BENEFICIARY_NOT_FOUND: 'Beneficiary not found',
  BENEFICIARY_DELETED:  'Beneficiary removed',

  // ── Profile ───────────────────────────────────────────────────────
  PROFILE_UPDATED: 'Profile updated successfully',
  USER_NOT_FOUND:  'User not found',

  // ── Admin ─────────────────────────────────────────────────────────
  ACCOUNT_FROZEN_SUCCESS:   'Account has been frozen',
  ACCOUNT_UNFROZEN_SUCCESS: 'Account has been unfrozen',
  ACCOUNT_ALREADY_FROZEN:   'Account is already frozen',
  ACCOUNT_ALREADY_ACTIVE:   'Account is already active',
  ACCOUNT_CLOSED:           'Cannot change status of a closed account',

  // ── Generic ───────────────────────────────────────────────────────
  NOT_FOUND:        'Resource not found',
  SERVER_ERROR:     'An unexpected error occurred',
  VALIDATION_ERROR: 'Validation failed',
};

// Mirrors the Prisma Role enum — single source of truth for role strings
const ROLES = {
  USER:  'USER',
  ADMIN: 'ADMIN',
};

// Audit action constants — keeps action strings consistent across
// service layer and seed script
const AUDIT_ACTIONS = {
  REGISTER:       'REGISTER',
  LOGIN:          'LOGIN',
  LOGOUT:         'LOGOUT',
  LOGOUT_ALL:     'LOGOUT_ALL',
  TRANSFER:       'TRANSFER',
  PROFILE_UPDATE: 'PROFILE_UPDATE',
  // Admin actions
  ADMIN_FREEZE_ACCOUNT:   'ADMIN_FREEZE_ACCOUNT',
  ADMIN_UNFREEZE_ACCOUNT: 'ADMIN_UNFREEZE_ACCOUNT',
};

module.exports = { HTTP, MESSAGES, ROLES, AUDIT_ACTIONS };
