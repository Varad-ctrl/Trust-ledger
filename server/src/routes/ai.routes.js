'use strict';

const express      = require('express');
const router       = express.Router();
const ctrl         = require('../controllers/ai.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

// POST /api/ai/chat            — Module 1: conversational assistant
// GET  /api/ai/insights        — Module 2: spending insights
// GET  /api/ai/fraud           — Module 3: fraud detection
// GET  /api/ai/smart-dashboard — Module 6: AI smart dashboard

router.post('/chat',             ctrl.chat);
router.get('/insights',          ctrl.insights);
router.get('/fraud',             ctrl.fraud);
router.get('/smart-dashboard',   ctrl.smartDashboard);

module.exports = router;
