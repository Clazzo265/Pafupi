import { Component, useEffect, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCheck,
  Download,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Wallet,
  WifiOff,
  X,
} from 'lucide-react';
import type { Bootstrap } from '../shared/types';
import { money } from './ui';
interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
export function AppExperience() {
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const onInstall = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallEvent);
    };
    const installed = () => setInstall(null);
    window.addEventListener('beforeinstallprompt', onInstall);
    window.addEventListener('appinstalled', installed);
    let disposed = false;
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      void navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          if (disposed) return;
          if (reg.waiting) setWaiting(reg.waiting);
          reg.addEventListener('updatefound', () => {
            const next = reg.installing;
            next?.addEventListener('statechange', () => {
              if (!disposed && next.state === 'installed' && navigator.serviceWorker.controller)
                setWaiting(next);
            });
          });
        })
        .catch(() => {
          /* App remains usable when the browser blocks installation. */
        });
    }
    return () => {
      disposed = true;
      window.removeEventListener('beforeinstallprompt', onInstall);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);
  if (waiting)
    return (
      <div className="experience-banner" role="status">
        <RefreshCw size={18} />
        <div>
          <b>A fresh PAFUPI is ready.</b>
          <span>Save your current form before reloading.</span>
        </div>
        <button
          className="button primary compact"
          onClick={() => {
            navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), {
              once: true,
            });
            waiting.postMessage({ type: 'ACTIVATE_UPDATE' });
          }}
        >
          Update app
          <ArrowRight size={14} />
        </button>
      </div>
    );
  if (!install || dismissed) return null;
  return (
    <div className="experience-banner">
      <span className="experience-icon">
        <Download size={20} />
      </span>
      <div>
        <b>Your neighbourhood, one tap away.</b>
        <span>Install PAFUPI. Lightweight, with an offline-ready app shell.</span>
      </div>
      <button
        className="text-link"
        onClick={async () => {
          await install.prompt();
          const result = await install.userChoice;
          if (result.outcome === 'accepted') setInstall(null);
        }}
      >
        Install app
        <ArrowUpRight size={15} />
      </button>
      <button
        className="icon-button"
        aria-label="Dismiss install suggestion"
        onClick={() => setDismissed(true)}
      >
        <X size={16} />
      </button>
    </div>
  );
}
export function TaskOverview({
  data,
  onTasks,
  onOffers,
}: {
  data: Bootstrap;
  onTasks: () => void;
  onOffers: () => void;
}) {
  const tasks = data.tasks.filter(
    (t) => t.ownerId === data.user.id || t.providerId === data.user.id,
  );
  const active = tasks.filter((t) => !['COMPLETED', 'CANCELLED'].includes(t.status));
  const offers = data.offers.filter(
    (o) =>
      tasks.some(
        (t) => t.id === o.taskId && t.ownerId === data.user.id && t.status === 'OFFERS_RECEIVED',
      ) && Date.now() - Date.parse(o.createdAt) <= 86400000,
  );
  return (
    <section className="overview-grid" aria-label="Your task summary">
      <button className="overview-card" onClick={onTasks}>
        <span className="overview-icon">
          <ShoppingBag size={18} />
        </span>
        <div>
          <span>Active tasks</span>
          <strong>{active.length.toString().padStart(2, '0')}</strong>
          <small>{data.demo ? 'In this sample workspace' : 'In your workspace'}</small>
        </div>
        <ArrowUpRight size={16} />
      </button>
      <button className="overview-card" onClick={onOffers}>
        <span className="overview-icon warm">
          <CheckCheck size={19} />
        </span>
        <div>
          <span>Offers to review</span>
          <strong>{offers.length.toString().padStart(2, '0')}</strong>
          <small>{offers.length ? 'A helping hand is ready' : 'All caught up for now'}</small>
        </div>
        <ArrowUpRight size={16} />
      </button>
      <div className="overview-card budget">
        <span className="overview-icon">
          <Wallet size={18} />
        </span>
        <div>
          <span>Planned task {data.user.role === 'provider' ? 'compensation' : 'total'}</span>
          <strong>
            {money(
              active.reduce(
                (sum, t) =>
                  sum + (data.user.role === 'provider' ? t.quote.compensation : t.quote.total),
                0,
              ),
            )}
          </strong>
          <small>Quotes only · not a balance or payment</small>
        </div>
      </div>
    </section>
  );
}
export function OfflineWelcome({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="recovery-screen">
      <div className="recovery-mark">
        <WifiOff size={35} />
      </div>
      <span className="eyebrow">A LITTLE PAUSE, NOT A LOST TASK</span>
      <h1>Your neighbourhood will be right here.</h1>
      <p>
        You’re offline. The app is available, but your private workspace needs a connection. Any
        saved draft stays on this device; no task has been published automatically.
      </p>
      <button className="button primary" onClick={onRetry}>
        Try connecting again
        <RefreshCw size={16} />
      </button>
      <div className="recovery-privacy">
        <ShieldCheck size={17} />
        Task, payment and conversation responses are never cached for offline viewing.
      </div>
    </div>
  );
}
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="recovery-screen">
        <div className="recovery-mark">
          <RefreshCw size={35} />
        </div>
        <h1>Let’s get you back on track.</h1>
        <p>
          Something interrupted the app. Any saved task draft is unchanged. Reload to try again; do
          not repeat a payment outside the platform.
        </p>
        <button className="button primary" onClick={() => location.reload()}>
          Reload PAFUPI
          <ArrowRight size={16} />
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
