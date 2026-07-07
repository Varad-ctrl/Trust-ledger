const prisma = require('../config/prisma');

/**
 * Generate a unique FinCore account number (FC + 8 digits).
 * Retries if there's a collision (extremely unlikely).
 */
const generateAccountNumber = async () => {
  let number, exists;
  do {
    number = 'FC' + Math.floor(10000000 + Math.random() * 90000000);
    exists = await prisma.account.findUnique({ where: { accountNumber: number } });
  } while (exists);
  return number;
};

const generateReferenceNumber = () =>
  'TXN' + Date.now() + Math.floor(Math.random() * 10000).toString().padStart(4, '0');

module.exports = { generateAccountNumber, generateReferenceNumber };
