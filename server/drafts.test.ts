import { test } from 'node:test';
import assert from 'node:assert/strict';
import { restoreDraft } from '../src/drafts.js';
import type { TaskInput } from '../shared/types.js';
const fallback: TaskInput = {
  title: '',
  description: '',
  category: 'shopping',
  pickup: '',
  destination: '',
  duration: 30,
  travel: 500,
  goods: 0,
  waitingMinutes: 0,
  tip: 0,
  transport: 'walking',
  deadline: 'Today',
  safetyAccepted: false,
};
test('corrupt or expired local drafts are not trusted and consent is never restored', () => {
  assert.equal(restoreDraft(null, fallback), null);
  assert.equal(restoreDraft({ key: 123, input: {} }, fallback), null);
  assert.equal(
    restoreDraft({ key: 'valid-draft-key', input: {}, updatedAt: 1 }, fallback, 8 * 86400000),
    null,
  );
  const restored = restoreDraft(
    {
      key: 'valid-draft-key',
      input: {
        title: 'A saved task',
        category: 'dangerous',
        duration: 'forged',
        description: { unsafe: true },
        safetyAccepted: true,
      },
    },
    fallback,
  )!;
  assert.equal(restored.input.title, 'A saved task');
  assert.equal(restored.input.category, 'shopping');
  assert.equal(restored.input.duration, 30);
  assert.equal(restored.input.description, '');
  assert.equal(restored.input.safetyAccepted, false);
});
