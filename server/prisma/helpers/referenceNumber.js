/**
 * Generate a unique transaction reference number.
 *
 * Format: TXN + 13-digit epoch ms + 4-digit random  →  e.g. TXN17204819283001
 *
 * Why this format?
 *   - "TXN" prefix makes it immediately clear this is a transaction ID
 *     in support conversations, receipts, and dispute forms.
 *   - Epoch ms ensures the numbers are time-ordered when sorted as strings,
 *     which matches the natural expectation customers have.
 *   - The 4-digit random suffix prevents collisions when two transactions
 *     are created within the same millisecond (e.g. bulk seeding).
 *
 * The seed script passes a Set of already-used references so each call
 * guarantees uniqueness within the seeding run without a DB query.
 */
const generateReferenceNumber = (usedRefs = new Set()) => {
  let ref;
  do {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    ref = `TXN${Date.now()}${suffix}`;
  } while (usedRefs.has(ref));

  usedRefs.add(ref);
  return ref;
};

module.exports = { generateReferenceNumber };
