export const categories = [
  {
    id: 'shopping',
    name: 'Shopping & groceries',
    short: 'Shopping',
    description: 'Your market list, taken care of',
    color: 'peach',
  },
  {
    id: 'delivery',
    name: 'Pickups & delivery',
    short: 'Delivery',
    description: 'From here to there, with care',
    color: 'blue',
  },
  {
    id: 'campus',
    name: 'Campus errands',
    short: 'Campus',
    description: 'Make campus life a little easier',
    color: 'purple',
  },
  {
    id: 'assistance',
    name: 'Everyday assistance',
    short: 'Assistance',
    description: 'An extra pair of helping hands',
    color: 'yellow',
  },
  {
    id: 'home',
    name: 'Home & garden',
    short: 'Home & garden',
    description: 'A helping hand around home',
    color: 'mint',
  },
] as const;
export type Category = (typeof categories)[number]['id'];
export type Status =
  | 'PUBLISHED'
  | 'OFFERS_RECEIVED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_CONFIRMED'
  | 'ACCEPTED'
  | 'PROVIDER_EN_ROUTE'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'AWAITING_CONFIRMATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';
export interface Quote {
  labour: number;
  travel: number;
  goods: number;
  waiting: number;
  fee: number;
  tip: number;
  compensation: number;
  total: number;
  rate: number;
  version: string;
}
export interface TaskInput {
  title: string;
  description: string;
  category: Category;
  pickup: string;
  destination: string;
  duration: number;
  travel: number;
  goods: number;
  waitingMinutes: number;
  tip: number;
  transport: 'walking' | 'cycling' | 'driving';
  deadline: string;
  safetyAccepted: boolean;
}
export interface Task extends TaskInput {
  id: string;
  ownerId: string;
  providerId: string | null;
  status: Status;
  quote: Quote;
  createdAt: string;
  sample: boolean;
}
export interface Provider {
  id: string;
  name: string;
  initials: string;
  color: string;
  bio: string;
  categories: Category[];
  transport: string;
  available: boolean;
  sample: boolean;
}
export interface Offer {
  id: string;
  taskId: string;
  providerId: string;
  note: string;
  createdAt: string;
}
export interface TaskEvent {
  id: string;
  taskId: string;
  actorId: string;
  type: string;
  detail: string;
  createdAt: string;
}
export interface Message {
  id: string;
  taskId: string;
  senderId: string;
  body: string;
  createdAt: string;
}
export interface User {
  id: string;
  name: string;
  role: 'customer' | 'provider';
  emailVerified?: boolean;
}
export interface Bootstrap {
  user: User;
  tasks: Task[];
  providers: Provider[];
  offers: Offer[];
  demo: boolean;
  publicDemo?: boolean;
}
