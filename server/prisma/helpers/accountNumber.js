/**
 * Generate a unique FinCore account number.
 *
 * Format: FC + 8 digits  →  e.g. FC47291830
 *
 * Why this format?
 *   - The "FC" prefix makes it instantly recognisable as a FinCore account
 *     in logs, support tickets, and UI (versus a card number or reference).
 *   - 8 digits gives 100,000,000 possible numbers — more than enough for a
 *     demo, and trivially extendable to 10 digits for scale.
 *
 * The seed script passes a Set of already-used numbers so each call
 * guarantees uniqueness within the seeding run without needing a DB query.
 */
const generateAccountNumber = (usedNumbers = new Set()) => {
  let number;
  do {
    const digits = Math.floor(10000000 + Math.random() * 90000000);
    number = `FC${digits}`;
  } while (usedNumbers.has(number));

  usedNumbers.add(number);
  return number;
};

module.exports = { generateAccountNumber };
