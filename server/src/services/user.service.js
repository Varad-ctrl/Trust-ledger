'use strict';

const userRepository = require('../repositories/user.repository');
const { MESSAGES } = require('../constants');

const userService = {

  getProfile: async (userId) => {
    const user = await userRepository.findById(userId);
    if (!user) throw Object.assign(new Error(MESSAGES.USER_NOT_FOUND), { status: 404 });
    return user;
  },

  updateProfile: async (userId, fields) => {
    // Only allow firstName, lastName, phone — never role or email via this endpoint
    const { firstName, lastName, phone } = fields;
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName  !== undefined) updateData.lastName  = lastName;
    if (phone     !== undefined) updateData.phone     = phone;

    return userRepository.update(userId, updateData);
  },

  // Admin only
  getAllUsers: async ({ page = 1, limit = 20 } = {}) => {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      userRepository.findAll({ skip, take: limit }),
      userRepository.count(),
    ]);
    return { users, total, page, limit, pages: Math.ceil(total / limit) };
  },
};

module.exports = userService;
