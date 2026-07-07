'use strict';

const userService = require('../services/user.service');
const { success } = require('../utils/response');
const { HTTP, MESSAGES } = require('../constants');

const getProfile = async (req, res, next) => {
  try {
    const data = await userService.getProfile(req.user.id);
    success(res, { data });
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    const data = await userService.updateProfile(req.user.id, req.body);
    success(res, { message: MESSAGES.PROFILE_UPDATED, data });
  } catch (err) { next(err); }
};

// ADMIN only
const getAllUsers = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page,  10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const data  = await userService.getAllUsers({ page, limit });
    success(res, { data });
  } catch (err) { next(err); }
};

module.exports = { getProfile, updateProfile, getAllUsers };
