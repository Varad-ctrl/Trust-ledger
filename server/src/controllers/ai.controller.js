'use strict';

const aiService  = require('../services/ai.service');
const { success } = require('../utils/response');

const aiController = {

  // Module 1: Chat
  chat: async (req, res, next) => {
    try {
      const { message, history = [] } = req.body;
      if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message is required' });
      const data = await aiService.chat(req.user.id, message.trim(), history);
      success(res, { data });
    } catch (err) { next(err); }
  },

  // Module 2: Spending Insights
  insights: async (req, res, next) => {
    try {
      const data = await aiService.getSpendingInsights(req.user.id);
      success(res, { data });
    } catch (err) { next(err); }
  },

  // Module 3: Fraud Detection
  fraud: async (req, res, next) => {
    try {
      const data = await aiService.getFraudAnalysis(req.user.id);
      success(res, { data });
    } catch (err) { next(err); }
  },

  // Module 6: Smart Dashboard
  smartDashboard: async (req, res, next) => {
    try {
      const data = await aiService.getSmartDashboard(req.user.id);
      success(res, { data });
    } catch (err) { next(err); }
  },
};

module.exports = aiController;
