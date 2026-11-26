import { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCheck,
  MapPin,
  MessageCircle,
  Send,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { api } from './api';
import { Modal, QuoteView, Avatar, labels, money } from './ui';
import {
  categories,
  type Bootstrap,
  type Task,
  type TaskEvent,
  type Message,
  type Status,
} from '../shared/types';
export default function TaskDetail({
  task,
  data,
  onClose,
  onRefresh,
  notify,
}: {
  task: Task;
  data: Bootstrap;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  notify: (s: string) => void;
}) {
  const [activity, setActivity] = useState<{ events: TaskEvent[]; messages: Message[] }>({
    events: [],
    messages: [],
  });
  const [note, setNote] = useState('');
  const [chat, setChat] = useState('');
  const [reason, setReason] = useState('');
  const [tab, setTab] = useState('Overview');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const owner = data.user.id === task.ownerId;
  const participant = owner || task.providerId === data.user.id;
  const offers = data.offers.filter((o) => o.taskId === task.id);
  const provider = data.providers.find((p) => p.id === task.providerId);
  const loadActivity = () =>
    participant
      ? api<typeof activity>(`/tasks/${task.id}/activity`)
          .then(setActivity)
          .catch((e) => setError(e.message))
      : Promise.resolve();
  useEffect(() => {
    void loadActivity();
  }, [task.id, task.status, participant]);
  async function action(path: string, body: unknown, success: string) {
    setBusy(true);
    setError('');
    try {
      await api(`/tasks/${task.id}/${path}`, body);
      await onRefresh();
      await loadActivity();
      if (success) notify(success);
      setChat('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const next: Partial<Record<Status, Status>> = {
    PAYMENT_CONFIRMED: 'ACCEPTED',
    ACCEPTED: 'PROVIDER_EN_ROUTE',
    PROVIDER_EN_ROUTE: 'ARRIVED',
    ARRIVED: 'IN_PROGRESS',
    IN_PROGRESS: 'AWAITING_CONFIRMATION',
  };
  return (
    <Modal
      title={task.title}
      subtitle={`${task.sample ? 'Sample task · ' : ''}${categories.find((c) => c.id === task.category)?.name}`}
      onClose={onClose}
      wide
    >
      <div className="detail-body">
        <div className="detail-status">
          <span className={`status ${task.status === 'COMPLETED' ? 'complete' : ''}`}>
            <span className="tiny-dot" />
            {labels[task.status]}
          </span>
          <span className="muted">
            {task.deadline} · {task.duration} min labour
          </span>
        </div>
        <div className="detail-tabs">
          {['Overview', ...(participant ? ['Activity', 'Conversation'] : [])].map((t) => (
            <button className={tab === t ? 'active' : ''} onClick={() => setTab(t)} key={t}>
              {t}
            </button>
          ))}
        </div>
        {tab === 'Overview' && (
          <>
            <p className="task-description">{task.description}</p>
            <div className="location-pair">
              <MapPin size={19} />
              <div>
                <small>PICKUP / TASK LOCATION</small>
                <p>{task.pickup}</p>
                <small>DESTINATION</small>
                <p>{task.destination}</p>
              </div>
            </div>
            <p className="fine-print">
              Manual locations. Distance and route time are not yet available. Travel allowance
              covers the complete agreed journey.
            </p>
            <QuoteView quote={task.quote} />
            {task.status === 'OFFERS_RECEIVED' && owner && (
              <section className="offers-section">
                <h3>
                  A helping hand is ready <span>{offers.length}</span>
                </h3>
                {offers.map((o) => {
                  const p = data.providers.find((p) => p.id === o.providerId)!;
                  return (
                    <div className="offer" key={o.id}>
                      <Avatar provider={p} small />
                      <div>
                        <b>
                          {p.name} <span className="sample-tag">Sample profile</span>
                        </b>
                        <p>{o.note}</p>
                        <small>
                          Agrees to {money(task.quote.compensation)} compensation ·{' '}
                          {Date.now() - Date.parse(o.createdAt) > 86400000
                            ? 'Expired — provider must renew'
                            : 'expires after 24 hours'}
                        </small>
                        <button
                          disabled={busy || Date.now() - Date.parse(o.createdAt) > 86400000}
                          className="button primary compact"
                          onClick={() =>
                            void action(
                              'select',
                              { offerId: o.id },
                              'Provider selected. No payment has been made.',
                            )
                          }
                        >
                          Accept quote & choose provider <ArrowRight size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </section>
            )}
            {provider && (
              <div className="selected-provider">
                <Avatar provider={provider} small />
                <div>
                  <b>Your selected helper · {provider.name}</b>
                  <p>Sample profile · identity not verified</p>
                </div>
                <MessageCircle
                  size={20}
                  onClick={() => setTab('Conversation')}
                  role="button"
                  tabIndex={0}
                  aria-label="Open conversation"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setTab('Conversation');
                  }}
                />
              </div>
            )}
            {task.status === 'PAYMENT_PENDING' && (
              <div className="payment-block">
                <Wallet size={22} />
                <div>
                  <h3>Payments aren’t connected yet.</h3>
                  <p>
                    No money has been charged. Work cannot start until a verified payment provider
                    confirms payment. Do not send money outside the platform.
                  </p>
                </div>
              </div>
            )}
            {!owner &&
              !task.providerId &&
              ['PUBLISHED', 'OFFERS_RECEIVED'].includes(task.status) &&
              (offers.some(
                (o) =>
                  o.providerId === data.user.id && Date.now() - Date.parse(o.createdAt) <= 86400000,
              ) ? (
                <div className="info-note">
                  <CheckCheck size={20} />
                  Your offer is with the customer. We’ll show updates here.
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void action('offers', { note }, 'Your offer has been sent.');
                  }}
                >
                  <label>
                    Your offer note
                    <textarea
                      required
                      minLength={10}
                      maxLength={500}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Confirm availability and ask any scope questions."
                    />
                  </label>
                  <p className="fine-print">
                    By offering, you agree to the displayed compensation. Confirm private meeting
                    points after selection. You are using a sample provider identity.
                  </p>
                  <button className="button primary" disabled={busy}>
                    Offer to help <ArrowUpRight size={16} />
                  </button>
                </form>
              ))}
            {owner && ['PUBLISHED', 'OFFERS_RECEIVED', 'PAYMENT_PENDING'].includes(task.status) && (
              <button
                className="text-danger"
                disabled={busy}
                onClick={() => {
                  if (confirm('Cancel this task? This cannot be undone.'))
                    void action('transition', { status: 'CANCELLED' }, 'Task cancelled.');
                }}
              >
                Cancel task
              </button>
            )}
            {!owner && next[task.status] && (
              <>
                <label>
                  Completion evidence / handover details
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Required before requesting completion confirmation"
                  />
                </label>
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={() =>
                    void action(
                      'transition',
                      { status: next[task.status], detail: reason },
                      'Milestone updated.',
                    )
                  }
                >
                  {labels[next[task.status]!]}
                </button>
              </>
            )}
            {owner && task.status === 'AWAITING_CONFIRMATION' && (
              <button
                className="button primary"
                disabled={busy}
                onClick={() =>
                  void action('transition', { status: 'COMPLETED' }, 'Task completion confirmed.')
                }
              >
                Confirm task completed
              </button>
            )}
            {participant &&
              !['PUBLISHED', 'OFFERS_RECEIVED', 'CANCELLED', 'COMPLETED', 'DISPUTED'].includes(
                task.status,
              ) && (
                <details className="dispute">
                  <summary>Something wrong? Open a dispute</summary>
                  <label>
                    What happened?
                    <textarea
                      minLength={10}
                      maxLength={2000}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </label>
                  <button
                    className="button secondary"
                    disabled={busy || reason.trim().length < 10}
                    onClick={() =>
                      void action(
                        'transition',
                        { status: 'DISPUTED', detail: reason },
                        'Dispute recorded in the task history. No live support team is connected in this preview.',
                      )
                    }
                  >
                    Record dispute
                  </button>
                </details>
              )}
          </>
        )}
        {tab === 'Activity' && (
          <div className="timeline">
            {activity.events.map((e) => (
              <div key={e.id}>
                <span />
                <section>
                  <b>{labels[e.type] || e.type.toLowerCase().replaceAll('_', ' ')}</b>
                  <p>{e.detail}</p>
                  <small>{new Date(e.createdAt).toLocaleString('en-GB')}</small>
                </section>
              </div>
            ))}
            {!activity.events.length && <p className="muted">No activity yet.</p>}
          </div>
        )}
        {tab === 'Conversation' && (
          <>
            <div className="conversation-notice">
              <ShieldCheck size={16} />
              Keep your conversation here. Never share payment PINs or passwords.
            </div>
            <div className="chat-log">
              {activity.messages.length ? (
                activity.messages.map((m) => (
                  <div
                    className={`chat-bubble ${m.senderId === data.user.id ? 'mine' : ''}`}
                    key={m.id}
                  >
                    <small>{m.senderId === data.user.id ? 'You' : 'Your task partner'}</small>
                    <p>{m.body}</p>
                    <time>
                      {new Date(m.createdAt).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <MessageCircle size={32} />
                  <h3>A good task starts with a hello.</h3>
                  <p>
                    {task.providerId
                      ? 'Agree on your meeting point and any final details.'
                      : 'Choose a provider to open a private task conversation.'}
                  </p>
                </div>
              )}
            </div>
            {task.providerId && (
              <form
                className="chat-compose"
                onSubmit={(e) => {
                  e.preventDefault();
                  void action('messages', { body: chat }, '');
                }}
              >
                <input
                  aria-label="Message"
                  placeholder="Write a message…"
                  value={chat}
                  maxLength={2000}
                  onChange={(e) => setChat(e.target.value)}
                />
                <button
                  className="button primary"
                  aria-label="Send message"
                  disabled={busy || !chat.trim()}
                >
                  <Send size={18} />
                </button>
              </form>
            )}
            <button className="text-link" onClick={() => void loadActivity()}>
              Refresh conversation
            </button>
          </>
        )}
        {error && (
          <div className="error-box" role="alert">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
