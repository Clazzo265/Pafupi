import { categories, type TaskInput, type Quote, type Status } from '../shared/types.js';
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function text(value: unknown, name: string, min = 1, max = 1000): string {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max)
    throw new AppError(400, `${name} must be ${min}–${max} characters.`);
  return value.trim();
}
function amount(v: unknown, name: string, max: number) {
  if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0 || v > max)
    throw new AppError(400, `${name} must be a whole number between 0 and ${max}.`);
  return v;
}
export function validateTask(raw: Record<string, unknown>): TaskInput {
  const category = raw.category as TaskInput['category'];
  if (!categories.some((c) => c.id === category))
    throw new AppError(400, 'Choose a supported category.');
  if (!['walking', 'cycling', 'driving'].includes(raw.transport as string))
    throw new AppError(400, 'Choose a transport option.');
  if (!['Today', 'Tomorrow', 'This week'].includes(raw.deadline as string))
    throw new AppError(400, 'Choose a deadline.');
  if (raw.safetyAccepted !== true)
    throw new AppError(400, 'Accept the permitted-task policy before publishing.');
  const duration = amount(raw.duration, 'Duration', 240);
  if (duration < 15) throw new AppError(400, 'Minimum task duration is 15 minutes.');
  return {
    title: text(raw.title, 'Title', 5, 100),
    description: text(raw.description, 'Description', 10, 2000),
    category,
    pickup: text(raw.pickup, 'Pickup', 3, 200),
    destination: text(raw.destination, 'Destination', 3, 200),
    duration,
    goods: amount(raw.goods, 'Goods budget', 500000),
    travel: amount(raw.travel, 'Travel allowance', 20000),
    waitingMinutes: amount(raw.waitingMinutes, 'Waiting time', 120),
    tip: amount(raw.tip, 'Tip', 20000),
    transport: raw.transport as TaskInput['transport'],
    deadline: raw.deadline as string,
    safetyAccepted: true,
  };
}
export function price(
  input: Pick<TaskInput, 'duration' | 'travel' | 'goods' | 'waitingMinutes' | 'tip'>,
): Quote {
  const labour = Math.round((5000 * input.duration) / 60);
  const waiting = Math.round((5000 * input.waitingMinutes) / 60);
  return {
    labour,
    waiting,
    travel: input.travel,
    goods: input.goods,
    tip: input.tip,
    fee: 300,
    compensation: labour + waiting + input.travel + input.tip,
    total: labour + waiting + input.travel + input.goods + input.tip + 300,
    rate: 5000,
    version: 'pilot-v1',
  };
}
export function transition(current: Status, next: Status, role: 'customer' | 'provider') {
  const allowed: Partial<Record<Status, Partial<Record<typeof role, Status[]>>>> = {
    PUBLISHED: { customer: ['CANCELLED'] },
    OFFERS_RECEIVED: { customer: ['CANCELLED'] },
    PAYMENT_PENDING: { customer: ['CANCELLED', 'DISPUTED'] },
    PAYMENT_CONFIRMED: { provider: ['ACCEPTED'], customer: ['DISPUTED'] },
    ACCEPTED: { provider: ['PROVIDER_EN_ROUTE'], customer: ['DISPUTED'] },
    PROVIDER_EN_ROUTE: { provider: ['ARRIVED'], customer: ['DISPUTED'] },
    ARRIVED: { provider: ['IN_PROGRESS'], customer: ['DISPUTED'] },
    IN_PROGRESS: { provider: ['AWAITING_CONFIRMATION', 'DISPUTED'], customer: ['DISPUTED'] },
    AWAITING_CONFIRMATION: { customer: ['COMPLETED', 'DISPUTED'], provider: ['DISPUTED'] },
  };
  if (!allowed[current]?.[role]?.includes(next))
    throw new AppError(409, `Cannot change ${current} to ${next} as ${role}.`);
}
