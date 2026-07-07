'use strict';

const prisma = require('../config/prisma');

// ─── Safe select ─────────────────────────────────────────────────────────────
// Never return passwordHash to the application layer.
// This select is used wherever a "public" user object is needed.
const SAFE_SELECT = {
  id:         true,
  firstName:  true,
  lastName:   true,
  email:      true,
  phone:      true,
  role:       true,
  isVerified: true,
  createdAt:  true,
  updatedAt:  true,
};

const userRepository = {

  // Used by authenticate middleware and login — needs passwordHash
  findByEmail: (email) =>
    prisma.user.findUnique({ where: { email } }),

  // Used by profile endpoints — no passwordHash
  findById: (id) =>
    prisma.user.findUnique({ where: { id }, select: SAFE_SELECT }),

  // Used by admin endpoint
  findAll: ({ skip = 0, take = 20 } = {}) =>
    prisma.user.findMany({
      select: SAFE_SELECT,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),

  count: () => prisma.user.count(),

  // Called inside a Prisma interactive transaction during registration.
  // The caller passes `tx` (the transaction client) so the create and the
  // account creation are atomic — if either fails, both roll back.
  create: (data, tx) =>
    (tx || prisma).user.create({ data }),

  update: (id, data) =>
    prisma.user.update({
      where: { id },
      data,
      select: SAFE_SELECT,
    }),
};

module.exports = userRepository;
