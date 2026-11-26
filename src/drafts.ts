import { categories, type TaskInput } from '../shared/types';
export interface SavedDraft {
  input: TaskInput;
  key: string;
  updatedAt: number;
}
/** Device storage is untrusted and may contain an older app version's draft. */
export function restoreDraft(
  value: unknown,
  fallback: TaskInput,
  now = Date.now(),
): SavedDraft | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  if (
    typeof raw.key !== 'string' ||
    raw.key.length < 10 ||
    raw.key.length > 100 ||
    !raw.input ||
    typeof raw.input !== 'object'
  )
    return null;
  if (
    typeof raw.updatedAt === 'number' &&
    (raw.updatedAt > now || now - raw.updatedAt > 7 * 86400000)
  )
    return null;
  const candidate = raw.input as Record<string, unknown>;
  const input = { ...fallback };
  for (const key of ['title', 'description', 'pickup', 'destination'] as const)
    if (typeof candidate[key] === 'string')
      input[key] = candidate[key].slice(
        0,
        key === 'description' ? 2000 : key === 'title' ? 100 : 200,
      );
  for (const key of ['duration', 'travel', 'goods', 'waitingMinutes', 'tip'] as const)
    if (
      typeof candidate[key] === 'number' &&
      Number.isSafeInteger(candidate[key]) &&
      candidate[key] >= 0
    )
      input[key] = candidate[key];
  if (categories.some((c) => c.id === candidate.category))
    input.category = candidate.category as TaskInput['category'];
  if (['walking', 'cycling', 'driving'].includes(candidate.transport as string))
    input.transport = candidate.transport as TaskInput['transport'];
  if (['Today', 'Tomorrow', 'This week'].includes(candidate.deadline as string))
    input.deadline = candidate.deadline as string;
  input.safetyAccepted = false;
  return { input, key: raw.key, updatedAt: now };
}
