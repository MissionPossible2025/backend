import Counter from '../models/counterModel.js';

/** Fixed store prefix (e.g. ORD1218). Suffix: AA01–AA99, AB01–AB99, … BA01, … */
const PREFIX = (process.env.ORDER_ID_PREFIX || 'ORD1218').trim();

/**
 * Maps 1-based sequence n to a 4-char suffix: letter pair + 2 digits (01–99 per pair).
 * AA01…AA99 → AB01…AB99 → … → AZ99 → BA01…
 */
function encodeSuffix(n) {
  if (n < 1 || !Number.isInteger(n)) {
    throw new Error('Invalid order sequence');
  }
  const idx = n - 1;
  const block = Math.floor(idx / 99);
  const posInBlock = (idx % 99) + 1;
  const firstIdx = Math.floor(block / 26);
  const secondIdx = block % 26;
  if (firstIdx > 25 || secondIdx > 25) {
    throw new Error('Order ID sequence exhausted for current scheme');
  }
  const letters =
    String.fromCharCode(65 + firstIdx) + String.fromCharCode(65 + secondIdx);
  const num = String(posInBlock).padStart(2, '0');
  return `${letters}${num}`;
}

/**
 * Next human-readable order id, e.g. ORD1218AA01 (atomic, safe under concurrency).
 */
export async function generateNextOrderId() {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'orderDisplayId' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const n = counter.seq;
  return `${PREFIX}${encodeSuffix(n)}`;
}
