const { z } = require('zod');

const transferSchema = z.object({
  senderAccountId:   z.string().uuid(),
  receiverAccountId: z.string().uuid(),
  amount:            z.number().positive().multipleOf(0.01),
  description:       z.string().max(255).optional(),
});

const createAccountSchema = z.object({
  accountType: z.enum(['SAVINGS', 'CHECKING', 'CURRENT']),
  currency:    z.enum(['USD', 'EUR', 'GBP', 'INR']).optional(),
});

const addBeneficiarySchema = z.object({
  beneficiaryName: z.string().min(2).max(100),
  accountNumber:   z.string().min(5).max(30),
  bankName:        z.string().min(2).max(100),
  ifscCode:        z.string().max(20).optional(),
});

module.exports = { transferSchema, createAccountSchema, addBeneficiarySchema };
