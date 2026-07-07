'use strict';

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');
const logger       = require('./config/logger');

// ── Route modules ─────────────────────────────────────────────────────────────
const authRoutes        = require('./routes/auth.routes');
const userRoutes        = require('./routes/user.routes');
const accountRoutes     = require('./routes/account.routes');
const transactionRoutes = require('./routes/transaction.routes');
const beneficiaryRoutes = require('./routes/beneficiary.routes');
const adminRoutes       = require('./routes/admin.routes');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── HTTP request logging ──────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }));
}

// ── Rate limiters ─────────────────────────────────────────────────────────────
//
// Auth limiter  — stricter: 20 req / 15 min per IP
//   Applies to register, login, refresh. Slows down brute-force and
//   credential-stuffing attacks without impacting normal usage.
//
// API limiter   — lenient: 200 req / 15 min per IP
//   Covers accounts, transactions, profile. Generous enough for normal
//   frontend polling but still caps scrapers.

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests — please try again in 15 minutes.' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      200,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests — please try again in 15 minutes.' },
});

// ── Health check ──────────────────────────────────────────────────────────────
// Used by Docker health checks, load balancers, and Kubernetes probes.
// Returns 200 as long as the process is running — DB connectivity is
// checked separately in server.js at startup.
app.get('/api/health', (req, res) => {
  res.json({
    success:   true,
    message:   'FinCore API is running',
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV || 'development',
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          authLimiter, authRoutes);
app.use('/api/users',         apiLimiter,  userRoutes);
app.use('/api/accounts',      apiLimiter,  accountRoutes);
app.use('/api/transactions',  apiLimiter,  transactionRoutes);
app.use('/api/beneficiaries', apiLimiter,  beneficiaryRoutes);
// Admin routes — double-locked internally (authenticate + authorize('ADMIN'))
// The apiLimiter still applies at the Express layer as an extra safeguard.
app.use('/api/admin',         apiLimiter,  adminRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.path}` });
});

// ── Global error handler ──────────────────────────────────────────────────────
// Must be last — Express identifies error handlers by their 4-argument signature.
app.use(errorHandler);

module.exports = app;
