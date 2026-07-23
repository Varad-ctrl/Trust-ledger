'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./config/logger');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const accountRoutes = require('./routes/account.routes');
const transactionRoutes = require('./routes/transaction.routes');
const beneficiaryRoutes = require('./routes/beneficiary.routes');
const adminRoutes = require('./routes/admin.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const scheduledRoutes = require('./routes/scheduled.routes');
const standingRoutes = require('./routes/standing.routes');
const upiRoutes = require('./routes/upi.routes');
const aiRoutes = require('./routes/ai.routes');
const { register } = require('./monitoring/metrics');

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev', { stream: { write: m => logger.http(m.trim()) } }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many requests.' } });
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many requests.' } });
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'AI rate limit — 30 requests per minute.' } });

app.get('/api/health', (req, res) => res.json({ success: true, message: 'FinCore AI v2.0 running', timestamp: new Date().toISOString() }));

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/dashboard', apiLimiter, dashboardRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/accounts', apiLimiter, accountRoutes);
app.use('/api/transactions', apiLimiter, transactionRoutes);
app.use('/api/beneficiaries', apiLimiter, beneficiaryRoutes);
app.use('/api/scheduled', apiLimiter, scheduledRoutes);
app.use('/api/standing', apiLimiter, standingRoutes);
app.use('/api/upi', apiLimiter, upiRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.path}` }));
app.use(errorHandler);
module.exports = app;
