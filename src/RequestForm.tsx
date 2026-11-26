import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleHelp,
  LoaderCircle,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { api } from './api';
import { restoreDraft } from './drafts';
import { Modal, QuoteView } from './ui';
import { categories, type Category, type Quote, type Task, type TaskInput } from '../shared/types';
const emptyInput: TaskInput = {
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
export default function RequestForm({
  category,
  ownerKey,
  publicDemo = false,
  onClose,
  onCreated,
}: {
  category?: Category;
  ownerKey: string;
  publicDemo?: boolean;
  onClose: () => void;
  onCreated: (task: Task) => void;
}) {
  const storageKey = `pafupi-draft:${ownerKey}`;
  const initial = useRef<{ input: TaskInput; key: string } | null>(null);
  if (!initial.current) {
    try {
      const raw = JSON.parse(
        localStorage.getItem(storageKey) ||
          (ownerKey === 'customer-1' ? localStorage.getItem('pafupi-draft') : null) ||
          'null',
      );
      const restored = restoreDraft(raw, { ...emptyInput, category: category || 'shopping' });
      if (restored) {
        initial.current = restored;
        if (ownerKey === 'customer-1') localStorage.removeItem('pafupi-draft');
      }
    } catch {
      /* recover a corrupt or unavailable draft */
    }
    initial.current ||= {
      input: { ...emptyInput, category: category || 'shopping' },
      key: crypto.randomUUID(),
    };
  }
  const [input, setInput] = useState<TaskInput>(initial.current.input);
  const [step, setStep] = useState(1);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(true);
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ input, key: initial.current!.key, updatedAt: Date.now() }),
      );
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [input, storageKey]);
  const update = (key: keyof TaskInput, value: string | number | boolean) =>
    setInput((i) => ({ ...i, [key]: value }));
  async function next(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (step === 1) return setStep(2);
    setBusy(true);
    try {
      const q = await api<Quote>('/quote', { ...input, safetyAccepted: true });
      setQuote(q);
      setInput((i) => ({ ...i, safetyAccepted: false }));
      setStep(3);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function publish() {
    setBusy(true);
    setError('');
    try {
      const task = await api<Task>('/tasks', input, { 'Idempotency-Key': initial.current!.key });
      try {
        localStorage.removeItem(storageKey);
        if (ownerKey === 'customer-1') localStorage.removeItem('pafupi-draft');
      } catch {
        /* no local storage */
      }
      onCreated(task);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="A little help starts here."
      subtitle="Tell your neighbourhood what you need a hand with."
      onClose={onClose}
      wide
    >
      {publicDemo && (
        <div className="info-note warm public-demo-warning">
          <CircleHelp size={19} />
          <span>
            Public shared demo: all visitors use the same sample accounts. Requests and messages can
            be seen by other visitors. Use synthetic information only. Everything resets on restart.
          </span>
        </div>
      )}
      <div className="stepper">
        {['The task', 'The details', 'Review & publish'].map((s, i) => (
          <div key={s} className={step >= i + 1 ? 'current' : ''}>
            <span>{step > i + 1 ? <Check size={13} /> : i + 1}</span>
            {s}
          </div>
        ))}
      </div>
      <form onSubmit={next} className="request-form">
        {step === 1 && (
          <>
            <label>
              What do you need help with?
              <input
                autoFocus
                required
                minLength={5}
                maxLength={100}
                value={input.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="e.g. Pick up a few groceries"
              />
            </label>
            <label>
              Choose a category
              <select value={input.category} onChange={(e) => update('category', e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              A few more details
              <textarea
                required
                minLength={10}
                maxLength={2000}
                rows={4}
                value={input.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="What should your helper know? Include quantities and any special instructions."
              />
              <small>
                Visible to eligible providers. Don’t include phone numbers, identity documents or
                private addresses here.
              </small>
            </label>
            <div className="info-note">
              <ShieldCheck size={20} />
              <span>
                Only safe, lawful tasks. No controlled substances, weapons, fraud or dangerous
                assignments.
              </span>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div className="form-grid">
              <label>
                Pickup / task location
                <input
                  autoFocus
                  required
                  minLength={3}
                  maxLength={200}
                  value={input.pickup}
                  onChange={(e) => update('pickup', e.target.value)}
                  placeholder="A meeting point or landmark"
                />
              </label>
              <label>
                Destination
                <input
                  required
                  minLength={3}
                  maxLength={200}
                  value={input.destination}
                  onChange={(e) => update('destination', e.target.value)}
                  placeholder="Where should your helper finish?"
                />
              </label>
            </div>
            <div className="info-note">
              <MapPin size={18} />
              <span>
                Manual locations only. Confirm the meeting point with your chosen provider. No
                routing or distance estimate is available yet.
              </span>
            </div>
            <div className="form-grid">
              <label>
                Estimated labour time
                <select
                  value={input.duration}
                  onChange={(e) => update('duration', Number(e.target.value))}
                >
                  {[15, 30, 45, 60, 90, 120, 180, 240].map((n) => (
                    <option key={n} value={n}>
                      {n} minutes
                    </option>
                  ))}
                </select>
              </label>
              <label>
                When do you need it?
                <select value={input.deadline} onChange={(e) => update('deadline', e.target.value)}>
                  <option>Today</option>
                  <option>Tomorrow</option>
                  <option>This week</option>
                </select>
              </label>
              <label>
                Preferred transport
                <select
                  value={input.transport}
                  onChange={(e) => update('transport', e.target.value)}
                >
                  <option value="walking">Walking</option>
                  <option value="cycling">Cycling</option>
                  <option value="driving">Driving</option>
                </select>
              </label>
              <label>
                Travel allowance (MK)
                <input
                  type="number"
                  min={0}
                  max={20000}
                  required
                  value={input.travel}
                  onChange={(e) => update('travel', Number(e.target.value))}
                />
              </label>
              <label>
                Budget for goods (MK)
                <input
                  type="number"
                  min={0}
                  max={500000}
                  required
                  value={input.goods}
                  onChange={(e) => update('goods', Number(e.target.value))}
                />
              </label>
              <label>
                Extra waiting time (minutes)
                <input
                  type="number"
                  min={0}
                  max={120}
                  required
                  value={input.waitingMinutes}
                  onChange={(e) => update('waitingMinutes', Number(e.target.value))}
                />
              </label>
            </div>
            <p className="fine-print">
              Labour excludes travel and separate waiting. The travel allowance covers the entire
              agreed trip, including any return. Do not count the same time twice. All rates are
              illustrative pilot rates.
            </p>
          </>
        )}
        {step === 3 && quote && (
          <>
            <div className="review-summary">
              <span className="eyebrow">YOUR REQUEST</span>
              <h3>{input.title}</h3>
              <p>
                {input.pickup} <ArrowRight size={13} /> {input.destination}
              </p>
              <div className="tags">
                <span>{input.duration} min labour</span>
                <span>{input.deadline}</span>
                <span>{input.transport}</span>
              </div>
            </div>
            <QuoteView quote={quote} />
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={input.safetyAccepted}
                onChange={(e) => update('safetyAccepted', e.target.checked)}
              />
              <span>
                This is a safe, lawful task. I have reviewed the scope and proposed total. I
                understand that publishing does not charge me.
              </span>
            </label>
            <div className="info-note warm">
              <CircleHelp size={19} />
              <span>
                Pre-launch workspace. Providers, payments, identity checks and fulfilment are not
                enabled for live use. Publishing does not guarantee a match.
              </span>
            </div>
          </>
        )}
        {error && (
          <div role="alert" className="error-box">
            {error}
          </div>
        )}
        <div className="form-footer">
          <span className="draft-note">
            <span className="tiny-dot" />
            {saved ? 'Draft saved on this device' : 'Draft cannot be saved in this browser'}
          </span>
          <div>
            {step > 1 && (
              <button
                type="button"
                className="button ghost"
                disabled={busy}
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button className="button primary" disabled={busy}>
                {busy ? (
                  <LoaderCircle className="spin" size={17} />
                ) : (
                  <>
                    Continue <ArrowRight size={16} />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                className="button primary"
                disabled={busy || !input.safetyAccepted}
                onClick={publish}
              >
                {busy ? (
                  <LoaderCircle className="spin" size={17} />
                ) : (
                  <>
                    Publish request <ArrowUpRight size={16} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
