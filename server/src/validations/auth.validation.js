'use strict';

const { z } = require('zod');

// ─── Reusable field definitions ───────────────────────────────────────────────
// Defined once so register and updateProfile share the same rules.

const nameField = z.string()
  .min(2,  'Must be at least 2 characters')
  .max(50, 'Must be 50 characters or fewer')
  .regex(/^[a-zA-Z\s'-]+$/, 'Only letters, spaces, hyphens and apostrophes allowed');

// E.164-style phone: optional + prefix, 7–15 digits
// Accepts: +91-9000000002 | +919000000002 | 9000000002
const phoneField = z.string()
  .regex(/^\+?[0-9\s\-]{7,15}$/, 'Enter a valid phone number (7–15 digits)')
  .optional();

// Password rules match the seed helper (bcrypt 12 rounds, same policy)
const passwordField = z.string()
  .min(8,  'Password must be at least 8 characters')
  .max(72, 'Password must be 72 characters or fewer') // bcrypt silently truncates at 72
  .regex(/[A-Z]/,       'Must contain at least one uppercase letter')
  .regex(/[a-z]/,       'Must contain at least one lowercase letter')
  .regex(/[0-9]/,       'Must contain at least one number')
  .regex(/[@$!%*?&#^]/, 'Must contain at least one special character (@$!%*?&#^)');

// ─── Register ────────────────────────────────────────────────────────────────
const registerSchema = z.object({
  firstName: nameField,
  lastName:  nameField,
  email:     z.string().email('Enter a valid email address').toLowerCase(),
  phone:     phoneField,
  password:  passwordField,
});

// ─── Login ───────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email:    z.string().email('Enter a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

// ─── Refresh token ───────────────────────────────────────────────────────────
const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ─── Logout (optionally carries the refresh token to invalidate) ─────────────
const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ─── Update profile ──────────────────────────────────────────────────────────
const updateProfileSchema = z.object({
  firstName: nameField.optional(),
  lastName:  nameField.optional(),
  phone:     phoneField,
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Provide at least one field to update' }
);

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  updateProfileSchema,
};
