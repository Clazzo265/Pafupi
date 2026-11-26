import React, { useEffect, useRef, useId } from 'react';
import {
  GraduationCap,
  Heart,
  Package,
  ShoppingBag,
  Sprout,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { Category, Provider, Quote } from '../shared/types';
export const money = (n: number) => `MK ${n.toLocaleString('en-MW')}`;
export const catIcons: Record<Category, LucideIcon> = {
  shopping: ShoppingBag,
  delivery: Package,
  campus: GraduationCap,
  assistance: Heart,
  home: Sprout,
};
export const labels: Record<string, string> = {
  PUBLISHED: 'Finding a helping hand',
  OFFERS_RECEIVED: 'Offer received',
  PAYMENT_PENDING: 'Awaiting payment setup',
  PAYMENT_CONFIRMED: 'Payment confirmed',
  ACCEPTED: 'Accepted',
  PROVIDER_EN_ROUTE: 'On the way',
  ARRIVED: 'Arrived',
  IN_PROGRESS: 'In progress',
  AWAITING_CONFIRMATION: 'Ready for your review',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DISPUTED: 'Under dispute',
};
export function Avatar({ provider, small = false }: { provider: Provider; small?: boolean }) {
  return (
    <div className={`avatar ${provider.color} ${small ? 'small' : ''}`}>
      {provider.initials}
      <span className={provider.available ? 'online-dot' : 'offline-dot'} />
    </div>
  );
}
export function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current!;
    d.showModal();
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = before;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={`modal ${wide ? 'wide' : ''}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-header">
        <div>
          <h2 id={titleId}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button aria-label="Close dialog" className="icon-button" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function QuoteView({ quote }: { quote: Quote }) {
  return (
    <div className="quote">
      <div>
        <span>
          Labour <small>at MK 5,000 / hour</small>
        </span>
        <b>{money(quote.labour)}</b>
      </div>
      <div>
        <span>Agreed travel allowance</span>
        <b>{money(quote.travel)}</b>
      </div>
      {quote.waiting > 0 && (
        <div>
          <span>Separate waiting time</span>
          <b>{money(quote.waiting)}</b>
        </div>
      )}
      <div>
        <span>
          Goods budget <small>not provider earnings</small>
        </span>
        <b>{money(quote.goods)}</b>
      </div>
      <div>
        <span>Platform fee</span>
        <b>{money(quote.fee)}</b>
      </div>
      {quote.tip > 0 && (
        <div>
          <span>Provider tip</span>
          <b>{money(quote.tip)}</b>
        </div>
      )}
      <div className="quote-total">
        <span>Estimated total</span>
        <strong>{money(quote.total)}</strong>
      </div>
      <p>
        Provider receives {money(quote.compensation)}. No payment processing fee is included:
        payments are not connected.
      </p>
    </div>
  );
}
