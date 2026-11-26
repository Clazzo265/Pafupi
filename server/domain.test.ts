import { test } from 'node:test';
import assert from 'node:assert/strict';
import { price, transition, validateTask } from './domain.js';
export const validInput = {
  title: 'Collect my printed notes',
  description: 'Please collect ten pages of printed course notes. Black and white, single sided.',
  category: 'campus',
  pickup: 'Agreed print collection point',
  destination: 'Agreed campus meeting point',
  duration: 30,
  goods: 12000,
  travel: 1000,
  waitingMinutes: 0,
  tip: 0,
  transport: 'walking',
  deadline: 'Today',
  safetyAccepted: true,
};
test('illustrative quote reproduces the brief exactly', () => {
  assert.equal(price(validInput).total, 15800);
  assert.equal(price(validInput).compensation, 3500);
});
test('labour uses reproducible whole-kwacha rounding', () => {
  for (const [duration, labour] of [
    [15, 1250],
    [30, 2500],
    [45, 3750],
    [60, 5000],
    [90, 7500],
    [120, 10000],
  ])
    assert.equal(price({ ...validInput, duration }).labour, labour);
  assert.equal(price({ ...validInput, duration: 16 }).labour, 1333);
});
test('waiting and tip are separated from goods and fee', () => {
  const q = price({ ...validInput, waitingMinutes: 15, tip: 250 });
  assert.equal(q.waiting, 1250);
  assert.equal(q.compensation, 5000);
  assert.equal(q.total, 17300);
});
test('rejects invalid category, money, duration, boolean consent and lengths', () => {
  for (const change of [
    { goods: -1 },
    { travel: 0.5 },
    { tip: NaN },
    { duration: 0 },
    { goods: 500001 },
    { category: 'weapons' },
    { transport: 'teleport' },
    { title: '<>' },
    { description: 'short' },
    { safetyAccepted: 'true' },
    { deadline: 'Never' },
  ])
    assert.throws(() => validateTask({ ...validInput, ...change }));
});
test('server fields and client prices cannot enter task input', () => {
  const input = validateTask({
    ...validInput,
    quote: { total: 1 },
    ownerId: 'attacker',
    status: 'COMPLETED',
  });
  assert.equal('status' in input, false);
  assert.equal('quote' in input, false);
  assert.equal('ownerId' in input, false);
});
test('blocks skipped milestones, customer payment confirmation and provider completion', () => {
  assert.throws(() => transition('PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'customer'));
  assert.throws(() => transition('PAYMENT_PENDING', 'ACCEPTED', 'provider'));
  assert.throws(() => transition('ACCEPTED', 'COMPLETED', 'customer'));
  assert.throws(() => transition('AWAITING_CONFIRMATION', 'COMPLETED', 'provider'));
  assert.doesNotThrow(() => transition('AWAITING_CONFIRMATION', 'COMPLETED', 'customer'));
  assert.throws(() => transition('COMPLETED', 'IN_PROGRESS', 'provider'));
});
