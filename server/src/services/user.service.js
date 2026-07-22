'use strict';
const userRepository = require('../repositories/user.repository');
const emailService   = require('./email.service');
const { MESSAGES }   = require('../constants');
const logger         = require('../config/logger');

const userService = {
  getProfile: async (userId) => {
    const user = await userRepository.findById(userId);
    if (!user) throw Object.assign(new Error(MESSAGES.USER_NOT_FOUND), { status: 404 });
    return user;
  },
  updateProfile: async (userId, fields) => {
    const data = {};
    if (fields.firstName !== undefined) data.firstName = fields.firstName;
    if (fields.lastName  !== undefined) data.lastName  = fields.lastName;
    if (fields.phone     !== undefined) data.phone     = fields.phone;
    const updated = await userRepository.update(userId, data);
    emailService.sendProfileUpdated({ to: updated.email, firstName: updated.firstName })
      .catch(e => logger.error('Profile email failed', { error: e.message }));
    return updated;
  },
  getAllUsers: async ({ page = 1, limit = 20 } = {}) => {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([userRepository.findAll({ skip, take: limit }), userRepository.count()]);
    return { users, total, page, limit, pages: Math.ceil(total / limit) };
  },
};
module.exports = userService;
