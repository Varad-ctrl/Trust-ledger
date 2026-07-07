'use strict';

const prisma = require('../config/prisma');

const sessionRepository = {

  create: (data) =>
    prisma.session.create({ data }),

  // Called on every token refresh — needs the user relation
  // to rebuild the JWT payload without a second DB query.
  findByToken: (refreshToken) =>
    prisma.session.findUnique({
      where:   { refreshToken },
      include: { user: true },
    }),

  // Returns all active sessions for a user (used by GET /auth/sessions)
  findAllByUser: (userId) =>
    prisma.session.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
      select:  { id: true, createdAt: true, expiresAt: true },
    }),

  countByUser: (userId) =>
    prisma.session.count({ where: { userId } }),

  deleteByToken: (refreshToken) =>
    prisma.session.delete({ where: { refreshToken } }),

  // Logout all devices
  deleteAllByUser: (userId) =>
    prisma.session.deleteMany({ where: { userId } }),

  // Cleanup job — call periodically to trim stale rows
  deleteExpired: () =>
    prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
};

module.exports = sessionRepository;
