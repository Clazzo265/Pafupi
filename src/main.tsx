import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bike,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Compass,
  Footprints,
  GraduationCap,
  House,
  Leaf,
  LoaderCircle,
  MapPin,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Star,
  Trash2,
  UserRound,
  UsersRound,
  Wallet,
  WifiOff,
  X,
  type LucideIcon,
} from 'lucide-react';
import { api } from './api';
import { Neighborhood } from './Neighborhood';
import {
  categories,
  type Bootstrap,
  type Category,
  type Provider,
  type Task,
} from '../shared/types';
import './styles.css';
import './premium.css';
import { configureAuth, authClient, type PublicConfig } from './auth';
import { AppExperience, TaskOverview, OfflineWelcome, ErrorBoundary } from './Experience';
import { Avatar, Modal, catIcons, labels, money } from './ui';
const AuthScreen = React.lazy(() => import('./AuthScreen'));
const RequestForm = React.lazy(() => import('./RequestForm'));
const TaskDetail = React.lazy(() => import('./TaskDetail'));
type Page = 'Home' | 'Explore' | 'My Tasks' | 'Messages' | 'Profile';
const pageHashes: Record<string, Page> = {
  '#home': 'Home',
  '#explore': 'Explore',
  '#tasks': 'My Tasks',
  '#messages': 'Messages',
  '#profile': 'Profile',
};
function App() {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [data, setData] = useState<Bootstrap | null>(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState<Page>(pageHashes[location.hash] || 'Home');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [available, setAvailable] = useState(false);
  const [transport, setTransport] = useState('all');
  const [filters, setFilters] = useState(false);
  const [request, setRequest] = useState(false);
  const [requestCategory, setRequestCategory] = useState<Category | undefined>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Provider | null>(null);
  const [info, setInfo] = useState<'preview' | 'location' | 'help' | 'notifications' | null>(null);
  const [toast, setToast] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [compactNav, setCompactNav] = useState(
    () => window.matchMedia('(max-width: 800px)').matches,
  );
  const [taskFilter, setTaskFilter] = useState('All');
  const [online, setOnline] = useState(navigator.onLine);
  const [area, setArea] = useState(() => {
    try {
      return localStorage.getItem('pafupi-area') || 'Laws Campus, Rumphi';
    } catch {
      return 'Laws Campus, Rumphi';
    }
  });
  const [areaDraft, setAreaDraft] = useState(area);
  async function refresh() {
    try {
      setData(await api<Bootstrap>('/bootstrap'));
    } catch (e) {
      if ((e as { status?: number }).status === 401 && config?.authMode === 'supabase') {
        setData(null);
        setNeedsAuth(true);
      }
      throw e;
    }
  }
  async function init() {
    setError('');
    try {
      const activeConfig = await configureAuth();
      setConfig(activeConfig);
      if (activeConfig.authMode === 'supabase') {
        const session = (await authClient().auth.getSession()).data.session;
        if (!session || new URLSearchParams(location.search).get('flow') === 'recovery') {
          setNeedsAuth(true);
          return;
        }
      }
      try {
        await refresh();
      } catch (e) {
        if ((e as { status?: number }).status !== 401) throw e;
        if (activeConfig.authMode === 'supabase') {
          setNeedsAuth(true);
          return;
        }
        await api('/demo/session', { role: 'customer' });
        await refresh();
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void init();
    const on = () => {
        setOnline(true);
        void init();
      },
      off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 800px)');
    const change = () => setCompactNav(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    if (!mobileNav || !compactNav) return;
    const aside = document.getElementById('workspace-nav')!;
    const controls = () =>
      Array.from(aside.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
    controls()[0]?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setMobileNav(false);
      }
      if (e.key === 'Tab') {
        const items = controls();
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    aside.addEventListener('keydown', trap);
    return () => {
      aside.removeEventListener('keydown', trap);
      document.querySelector<HTMLButtonElement>('.mobile-menu')?.focus();
    };
  }, [mobileNav, compactNav]);
  useEffect(() => {
    const changed = () => setPage(pageHashes[location.hash] || 'Home');
    window.addEventListener('hashchange', changed);
    return () => window.removeEventListener('hashchange', changed);
  }, []);
  useEffect(() => {
    if (config?.authMode !== 'supabase') return;
    const { data: listener } = authClient().auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'PASSWORD_RECOVERY') {
        setData(null);
        setNeedsAuth(true);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [config?.authMode]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 6500);
    return () => clearTimeout(t);
  }, [toast]);
  function nav(p: Page) {
    setPage(p);
    const hash = Object.entries(pageHashes).find(([, value]) => value === p)?.[0];
    if (hash && location.hash !== hash) location.hash = hash;
    setMobileNav(false);
    setSearch('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function openRequest(c?: Category) {
    if (data?.user.role === 'provider')
      return setToast('Switch to customer mode to publish a request.');
    setRequestCategory(c);
    setRequest(true);
  }
  async function switchRole() {
    if (!data?.demo) {
      setToast('Provider onboarding is not open yet. Account roles cannot be self-assigned.');
      return;
    }
    try {
      await api('/demo/session', {
        role: data?.user.role === 'provider' ? 'customer' : 'provider',
      });
      await refresh();
      setSelectedId(null);
      nav('Home');
      setToast('Development persona switched. These are sample accounts, not real authentication.');
    } catch (e) {
      setToast((e as Error).message);
    }
  }
  async function signOut() {
    try {
      const result = await authClient().auth.signOut({ scope: 'local' });
      if (result.error) throw result.error;
      if (data) localStorage.removeItem(`pafupi-draft:${data.user.id}`);
      setData(null);
      setNeedsAuth(true);
      setSelectedId(null);
      setRequest(false);
    } catch (e) {
      setToast((e as Error).message);
    }
  }
  if (!data && error && !online) return <OfflineWelcome onRetry={() => void init()} />;
  if (needsAuth && config?.authMode === 'supabase')
    return (
      <React.Suspense
        fallback={
          <div className="loading-screen">
            <LoaderCircle size={24} className="spin" />
          </div>
        }
      >
        <AuthScreen
          onSignedIn={async () => {
            await refresh();
            setNeedsAuth(false);
            setError('');
          }}
        />
      </React.Suspense>
    );
  if (!data)
    return (
      <div className="loading-screen">
        <div className="brand">
          <span className="brand-mark">
            p<span />
          </span>
          pafupi<span className="brand-period">.</span>
        </div>
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button className="button primary" onClick={() => void init()}>
              Try again
            </button>
          </>
        ) : (
          <>
            <LoaderCircle className="spin" size={26} />
            <p>Bringing your neighbourhood closer…</p>
          </>
        )}
      </div>
    );
  const isProvider = data.user.role === 'provider';
  const ownTasks = data.tasks.filter(
    (t) => t.ownerId === data.user.id || t.providerId === data.user.id,
  );
  const activeTasks = ownTasks.filter((t) => !['COMPLETED', 'CANCELLED'].includes(t.status));
  const visibleProviders = data.providers.filter(
    (p) =>
      (category === 'all' || p.categories.includes(category)) &&
      (!available || p.available) &&
      (transport === 'all' || p.transport === transport) &&
      `${p.name} ${p.bio} ${p.categories.map((c) => categories.find((cat) => cat.id === c)?.name).join(' ')}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const visibleTasks = (
    isProvider && (page === 'Explore' || page === 'Home') ? data.tasks : ownTasks
  ).filter(
    (t) =>
      `${t.title} ${t.description}`.toLowerCase().includes(search.toLowerCase()) &&
      (taskFilter === 'All' ||
        (taskFilter === 'Active'
          ? !['COMPLETED', 'CANCELLED'].includes(t.status)
          : t.status === taskFilter.toUpperCase())) &&
      (category === 'all' || t.category === category),
  );
  const navItems: { name: Page; label: string; icon: LucideIcon }[] = [
    { name: 'Home', label: isProvider ? 'Overview' : 'Home', icon: House },
    { name: 'Explore', label: isProvider ? 'Opportunities' : 'Explore', icon: Compass },
    { name: 'My Tasks', label: isProvider ? 'Active tasks' : 'My tasks', icon: ShoppingBag },
    { name: 'Messages', label: 'Messages', icon: MessageCircle },
    { name: 'Profile', label: 'My profile', icon: UserRound },
  ];
  function ProviderCard({ p }: { p: Provider }) {
    return (
      <article className="provider-card">
        <div className="provider-card-top">
          <Avatar provider={p} />
          <span className={`availability ${!p.available ? 'away' : ''}`}>
            <span />
            {p.available ? 'Available' : 'Away'}
          </span>
        </div>
        <button className="provider-name" onClick={() => setProfile(p)}>
          {p.name}
          <ArrowUpRight size={15} />
        </button>
        <p className="provider-meta">
          Sample profile <span>·</span> New to the pilot
        </p>
        <p className="provider-bio">{p.bio}</p>
        <div className="tags">
          {p.categories.slice(0, 2).map((c) => (
            <span key={c}>{categories.find((cat) => cat.id === c)?.short}</span>
          ))}
        </div>
        <div className="provider-footer">
          <span>
            {p.transport === 'cycling' ? <Bike size={15} /> : <Footprints size={15} />}{' '}
            {p.transport === 'cycling' ? 'Cycling' : 'Walking'}
          </span>
          <button onClick={() => setProfile(p)}>
            View profile <ArrowRight size={14} />
          </button>
        </div>
      </article>
    );
  }
  function TaskCard({ t }: { t: Task }) {
    const Icon = catIcons[t.category];
    return (
      <button className="task-row" onClick={() => setSelectedId(t.id)}>
        <div className={`category-symbol ${categories.find((c) => c.id === t.category)?.color}`}>
          <Icon size={22} />
        </div>
        <div className="task-row-main">
          <h3>{t.title}</h3>
          <p>
            {t.sample ? 'Sample task · ' : ''}
            {t.duration} min · {t.deadline}
          </p>
        </div>
        <div className="task-row-price">
          <strong>{money(isProvider ? t.quote.compensation : t.quote.total)}</strong>
          <span className="status">{labels[t.status]}</span>
        </div>
        <ChevronRight size={17} />
      </button>
    );
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {mobileNav && (
        <button
          className="nav-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside
        id="workspace-nav"
        className={`sidebar ${mobileNav ? 'open' : ''}`}
        inert={compactNav && !mobileNav}
      >
        <button className="brand" onClick={() => nav('Home')} aria-label="Pafupi home">
          <span className="brand-mark">
            p<span />
          </span>
          pafupi<span className="brand-period">.</span>
        </button>
        <div className="workspace-label">YOUR NEIGHBOURHOOD, CONNECTED</div>
        <div className="role-label">{isProvider ? 'PROVIDER WORKSPACE' : 'CUSTOMER WORKSPACE'}</div>
        <nav>
          {navItems.map(({ name, label, icon: Icon }) => (
            <button
              key={name}
              aria-label={label}
              className={page === name ? 'nav-item active' : 'nav-item'}
              onClick={() => nav(name)}
              aria-current={page === name ? 'page' : undefined}
            >
              <Icon size={19} strokeWidth={1.7} />
              {label}
              {name === 'My Tasks' && activeTasks.length > 0 && (
                <span className="nav-count">{activeTasks.length}</span>
              )}
              {name === 'Home' && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="provider-invite">
            <div className="invite-icon">
              <Sprout size={22} />
              <Sparkles size={13} />
            </div>
            <h3>{isProvider ? 'Need a helping hand?' : 'Your time. Your opportunity.'}</h3>
            <p>
              {isProvider
                ? 'Get things done with help from your community.'
                : 'Lend a hand nearby. Make a little extra, on your terms.'}
            </p>
            <button onClick={() => void switchRole()}>
              {isProvider ? 'Try customer mode' : 'Try provider mode'} <ArrowUpRight size={15} />
            </button>
            <small>{data.demo ? 'Development personas' : 'Provider onboarding not yet open'}</small>
          </div>
          <button className="sidebar-help" onClick={() => setInfo('help')}>
            <CircleHelp size={18} />
            Help & safety
            <ArrowUpRight size={14} />
          </button>
          <button className="sidebar-user" onClick={() => nav('Profile')}>
            <div className="user-avatar">
              {data.demo ? (isProvider ? 'TM' : 'N') : data.user.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <b>{data.user.name}</b>
              <small>
                {isProvider ? 'Provider' : 'Customer'} ·{' '}
                {data.demo ? 'sample account' : 'your account'}
              </small>
            </div>
            <ChevronDown size={15} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button
            aria-label="Open navigation"
            aria-controls="workspace-nav"
            aria-expanded={mobileNav}
            className="icon-button mobile-menu"
            onClick={() => setMobileNav(true)}
          >
            <Menu size={22} />
          </button>
          <button
            className="location-button"
            onClick={() => {
              setAreaDraft(area);
              setInfo('location');
            }}
          >
            <div className="location-icon">
              <MapPin size={20} />
            </div>
            <span>
              <small>YOUR NEIGHBOURHOOD</small>
              <b>
                {area} <ChevronDown size={13} />
              </b>
            </span>
          </button>
          <div className="topbar-right">
            <button className="pilot-chip" onClick={() => setInfo('preview')}>
              <span />
              Campus pilot <span className="chip-divider">/</span> Preview
            </button>
            <span className="header-divider" />
            <button
              className="notification-button icon-button"
              aria-label="View task updates"
              onClick={() => setInfo('notifications')}
            >
              <Bell size={20} />
              {data.offers.some((o) =>
                ownTasks.some((t) => t.id === o.taskId && t.status === 'OFFERS_RECEIVED'),
              ) && <span />}
            </button>
            <button className="top-avatar" aria-label="Open profile" onClick={() => nav('Profile')}>
              {data.demo ? (isProvider ? 'TM' : 'N') : data.user.name.slice(0, 2).toUpperCase()}
            </button>
          </div>
        </header>
        {!online && (
          <div className="offline-banner" role="status">
            <WifiOff size={16} />
            You’re offline. Your request draft stays on this device. Reconnect to publish or
            refresh.
          </div>
        )}
        <main id="main">
          <div className="workspace-notice">
            <span>
              <ShieldCheck size={15} />
              {data.demo ? 'Sample workspace' : 'Email-confirmed account'}
            </span>
            <p>
              {data.demo
                ? 'Explore safely. Sample people and tasks; no real payments.'
                : 'Your private workspace. Payments and provider onboarding are not yet available.'}
            </p>
            <button onClick={() => setInfo('preview')}>
              What’s available
              <ArrowUpRight size={13} />
            </button>
          </div>

          <div className="page-heading">
            <div>
              <div className="greeting-label">
                A LITTLE HELP GOES A LONG WAY <span>✳</span>
              </div>
              <h1>
                {page === 'Home' ? (
                  isProvider ? (
                    'Good things start with you.'
                  ) : (
                    <>
                      Hello, neighbour <span className="wave">☀</span>
                    </>
                  )
                ) : page === 'Explore' ? (
                  isProvider ? (
                    'A little help. A new opportunity.'
                  ) : (
                    'Find your helping hand.'
                  )
                ) : page === 'My Tasks' ? (
                  'One less thing on your list.'
                ) : page === 'Messages' ? (
                  'Keep the conversation going.'
                ) : (
                  'Your place in the neighbourhood.'
                )}
              </h1>
              <p>
                {page === 'Home'
                  ? 'Everyday tasks, trusted connections. All a little closer to home.'
                  : page === 'Explore'
                    ? 'Connect with people and services in your pilot community.'
                    : page === 'My Tasks'
                      ? 'From the first request to the final thank you. All your tasks, here.'
                      : page === 'Messages'
                        ? 'Private, task-specific conversations with your selected helper.'
                        : 'A little about you, and how you use PAFUPI.'}
              </p>
            </div>
            {page !== 'Profile' && (
              <button
                className="button primary request-button"
                onClick={() => (isProvider ? nav('Explore') : openRequest())}
              >
                <Plus size={18} />
                {isProvider ? 'Find an opportunity' : 'Request a task'}
              </button>
            )}
          </div>
          {page === 'Home' && (
            <TaskOverview
              data={data}
              onTasks={() => {
                setCategory('all');
                setTaskFilter('Active');
                nav('My Tasks');
              }}
              onOffers={() => {
                setCategory('all');
                setTaskFilter('Active');
                nav('My Tasks');
              }}
            />
          )}
          {(page === 'Home' || page === 'Explore') && (
            <div className="search-bar">
              <Search size={20} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  isProvider ? 'Search task opportunities…' : 'What could you use a hand with?'
                }
                aria-label="Search services, providers and tasks"
              />
              <span className="search-hint">A task, a service, a helping hand</span>
              <button
                aria-label="Filters"
                className={filters ? 'filter-toggle selected' : 'filter-toggle'}
                onClick={() => setFilters((f) => !f)}
                aria-expanded={filters}
              >
                <SlidersHorizontal size={17} />
                <span>Filters</span>
              </button>
            </div>
          )}
          {filters && (page === 'Home' || page === 'Explore') && (
            <div className="filter-panel">
              <label>
                <input
                  type="checkbox"
                  checked={available}
                  onChange={(e) => setAvailable(e.target.checked)}
                />{' '}
                Available sample providers
              </label>
              <label>
                Transport
                <select value={transport} onChange={(e) => setTransport(e.target.value)}>
                  <option value="all">Any transport</option>
                  <option value="walking">Walking</option>
                  <option value="cycling">Cycling</option>
                </select>
              </label>
              <button
                className="text-link"
                onClick={() => {
                  setAvailable(false);
                  setTransport('all');
                  setCategory('all');
                  setSearch('');
                }}
              >
                Reset filters
              </button>
              <small>
                Geographic matching is not connected. No nearby-distance claims are made.
              </small>
            </div>
          )}
          {page === 'Home' && (
            <div className="dashboard-grid">
              <div className="dashboard-main">
                <section className="hero">
                  <div className="hero-copy">
                    <span className="hero-eyebrow">
                      <span />
                      BIG ON COMMUNITY. CLOSE TO YOU.
                    </span>
                    <h2>
                      Your to-do list.
                      <br />
                      Someone’s <em>can-do.</em>
                    </h2>
                    <p>
                      From market runs to campus errands,
                      <br />
                      find a helping hand in your neighbourhood.
                    </p>
                    <button
                      className="button cream"
                      onClick={() => (isProvider ? nav('Explore') : openRequest())}
                    >
                      {isProvider ? 'Explore opportunities' : 'Let’s get it done'}
                      <ArrowUpRight size={17} />
                    </button>
                    <div className="hero-footnote">
                      <ShieldCheck size={14} />
                      Built around people. Designed for trust.
                    </div>
                  </div>
                  <Neighborhood />
                  <span className="hero-page">
                    01 <span>/ 01</span>
                  </span>
                </section>
                <section className="categories-section">
                  <div className="section-heading">
                    <div>
                      <h2>What’s on your list?</h2>
                      <p>Small tasks. A big difference to your day.</p>
                    </div>
                    <button
                      className="text-link"
                      onClick={() => {
                        setCategory('all');
                        nav('Explore');
                      }}
                    >
                      Explore all
                      <ArrowRight size={15} />
                    </button>
                  </div>
                  <div className="category-grid">
                    {categories.map((c) => {
                      const Icon = catIcons[c.id];
                      return (
                        <button
                          key={c.id}
                          className={`category-card ${category === c.id ? 'selected' : ''}`}
                          onClick={() => {
                            setCategory(category === c.id ? 'all' : c.id);
                          }}
                        >
                          <span className={`category-symbol ${c.color}`}>
                            <Icon size={25} strokeWidth={1.65} />
                          </span>
                          <b>
                            {c.id === 'shopping'
                              ? 'Shopping &'
                              : c.id === 'delivery'
                                ? 'Pickups &'
                                : c.id === 'campus'
                                  ? 'Campus'
                                  : c.id === 'assistance'
                                    ? 'Everyday'
                                    : 'Home &'}
                            <br />
                            {c.id === 'shopping'
                              ? 'groceries'
                              : c.id === 'delivery'
                                ? 'delivery'
                                : c.id === 'campus'
                                  ? 'errands'
                                  : c.id === 'assistance'
                                    ? 'assistance'
                                    : 'garden'}
                          </b>
                          <ArrowUpRight className="category-arrow" size={14} />
                        </button>
                      );
                    })}
                  </div>
                </section>
                <section>
                  <div className="section-heading">
                    <div>
                      <h2>
                        {isProvider ? 'Open opportunities' : 'Good people. A helping hand.'}{' '}
                        <span className="subtle-pill">Preview</span>
                      </h2>
                      <p>
                        {isProvider
                          ? 'Browse requests that match your sample service categories.'
                          : 'Explore the people and services in this workspace.'}
                      </p>
                    </div>
                    <button className="text-link" onClick={() => nav('Explore')}>
                      View all
                      <ArrowRight size={15} />
                    </button>
                  </div>
                  {isProvider ? (
                    <div className="task-list">
                      {visibleTasks.length ? (
                        visibleTasks.map((t) => <TaskCard t={t} key={t.id} />)
                      ) : (
                        <Empty
                          title="No matching tasks just yet."
                          text="Try a different category, or check back for new requests."
                          icon={ShoppingBag}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="provider-grid">
                      {visibleProviders.map((p) => (
                        <ProviderCard p={p} key={p.id} />
                      ))}
                      {!visibleProviders.length && (
                        <Empty
                          title={
                            data.demo
                              ? 'No matching helping hands.'
                              : 'Your community is just getting started.'
                          }
                          text={
                            data.demo
                              ? 'Try a different search or clear your filters.'
                              : 'Provider onboarding is not open yet. No unverified or fabricated listings are shown.'
                          }
                          icon={Search}
                        />
                      )}
                    </div>
                  )}
                  <p className="sample-disclaimer">
                    <CircleHelp size={13} />
                    Illustrative profiles only. Identity, availability and service coverage have not
                    been verified.
                  </p>
                </section>
                <section className="community-strip">
                  <span className="community-icon">
                    <UsersRound size={25} />
                  </span>
                  <div>
                    <h3>A neighbourhood is better, together.</h3>
                    <p>Starting small at Laws Campus. Growing with our community.</p>
                  </div>
                  <button className="text-link" onClick={() => setInfo('preview')}>
                    Our pilot
                    <ArrowUpRight size={16} />
                  </button>
                </section>
              </div>
              <aside className="dashboard-aside">
                <section className="activity-panel">
                  <div className="aside-heading">
                    <h2>Your active tasks</h2>
                    <span className="count-circle">{activeTasks.length}</span>
                  </div>
                  {activeTasks[0] ? (
                    <>
                      <div className="active-task-label">
                        <span className="tiny-dot" />
                        {labels[activeTasks[0].status]}
                      </div>
                      <div className="active-task-summary">
                        <span
                          className={`category-symbol ${categories.find((c) => c.id === activeTasks[0].category)?.color}`}
                        >
                          {React.createElement(catIcons[activeTasks[0].category], { size: 23 })}
                        </span>
                        <div>
                          <h3>{activeTasks[0].title}</h3>
                          <p>
                            {activeTasks[0].sample ? 'Sample request' : 'Your request'} ·{' '}
                            {activeTasks[0].deadline}
                          </p>
                        </div>
                      </div>
                      <div className="task-path">
                        <div>
                          <span />
                          <p>
                            Request published<small>Your task is on the board</small>
                          </p>
                          <Check size={14} />
                        </div>
                        <div className="current">
                          <span />
                          <p>
                            {activeTasks[0].providerId
                              ? 'Provider selected'
                              : 'Choose your helping hand'}
                            <small>
                              {activeTasks[0].providerId
                                ? 'Payment integration required'
                                : `${data.offers.filter((o) => o.taskId === activeTasks[0].id).length} offers to review`}
                            </small>
                          </p>
                        </div>
                        <div className="future">
                          <span />
                          <p>Get it done, together</p>
                        </div>
                      </div>
                      <button
                        className="button secondary full"
                        onClick={() => setSelectedId(activeTasks[0].id)}
                      >
                        View task
                        <ArrowRight size={16} />
                      </button>
                      {activeTasks.length > 1 && (
                        <button className="text-link more-tasks" onClick={() => nav('My Tasks')}>
                          View all {activeTasks.length} active tasks
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="compact-empty">
                      <ShoppingBag size={29} />
                      <h3>A little breathing room.</h3>
                      <p>No active tasks. Your next helping hand is a request away.</p>
                      <button
                        className="text-link"
                        onClick={() => (isProvider ? nav('Explore') : openRequest())}
                      >
                        {isProvider ? 'Browse tasks' : 'Request a task'}
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                </section>
                <section className="how-it-works">
                  <span className="eyebrow">LESS HASSLE. MORE LIVING.</span>
                  <h2>A little help, in 3 steps.</h2>
                  {[
                    {
                      title: 'Tell us what you need',
                      text: 'A market run, a pickup, an extra hand.',
                    },
                    {
                      title: 'Find your helping hand',
                      text: 'Review offers and agree on a clear price.',
                    },
                    {
                      title: 'Get on with your day',
                      text: 'Follow progress. Confirm a job well done.',
                    },
                  ].map((s, i) => (
                    <div className="how-step" key={s.title}>
                      <span>{i + 1}</span>
                      <div>
                        <h3>{s.title}</h3>
                        <p>{s.text}</p>
                      </div>
                    </div>
                  ))}
                  <button className="text-link" onClick={() => setInfo('help')}>
                    How we’re building trust
                    <ArrowUpRight size={14} />
                  </button>
                </section>
                <section className="safety-card">
                  <div>
                    <ShieldCheck size={23} />
                    <span>PEOPLE FIRST. ALWAYS.</span>
                  </div>
                  <h3>A safer way to lend a hand.</h3>
                  <p>
                    Clear prices. Private conversations.
                    <br />A record of every important step.
                  </p>
                  <button onClick={() => setInfo('help')}>
                    Explore safety & support
                    <ArrowRight size={14} />
                  </button>
                </section>
                <p className="local-signoff">
                  <Leaf size={14} />
                  Made for Malawi. Built around you.
                </p>
              </aside>
            </div>
          )}
          {page === 'Explore' && (
            <>
              <div className="explore-pills">
                <button
                  className={category === 'all' ? 'active' : ''}
                  onClick={() => setCategory('all')}
                >
                  All services
                </button>
                {categories.map((c) => (
                  <button
                    className={category === c.id ? 'active' : ''}
                    onClick={() => setCategory(c.id)}
                    key={c.id}
                  >
                    {React.createElement(catIcons[c.id], { size: 16 })}
                    {c.name}
                  </button>
                ))}
              </div>
              <div className="discovery-note">
                <MapPin size={19} />
                <div>
                  <b>A community-first pilot, not a live nearby map.</b>
                  <p>
                    Manual service area: {area}. Routes, geographic radius matching and real
                    provider verification are not connected.
                  </p>
                </div>
                <span className="sample-tag">Development preview</span>
              </div>
              <div className="section-heading">
                <div>
                  <h2>{isProvider ? 'Task opportunities' : 'Meet your sample helping hands'}</h2>
                  <p>
                    {isProvider
                      ? 'Category-compatible sample requests. Confirm the scope before committing.'
                      : `${visibleProviders.length} illustrative profiles · No verified-distance or reputation claims`}
                  </p>
                </div>
              </div>
              {isProvider ? (
                <div className="task-list">
                  {visibleTasks.map((t) => (
                    <TaskCard t={t} key={t.id} />
                  ))}
                  {!visibleTasks.length && (
                    <Empty
                      icon={Compass}
                      title="Nothing here just yet."
                      text="Try another category or clear your search."
                    />
                  )}
                </div>
              ) : (
                <div className="provider-grid explore-grid">
                  {visibleProviders.map((p) => (
                    <ProviderCard p={p} key={p.id} />
                  ))}
                  {!visibleProviders.length && (
                    <Empty
                      icon={Search}
                      title="No matching profiles."
                      text="Try another category or clear your filters."
                    />
                  )}
                </div>
              )}
            </>
          )}
          {page === 'My Tasks' && (
            <>
              <div className="task-toolbar">
                <div className="tab-pills">
                  {['All', 'Active', 'Completed', 'Cancelled'].map((f) => (
                    <button
                      className={taskFilter === f ? 'active' : ''}
                      onClick={() => setTaskFilter(f)}
                      key={f}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <button
                  className="text-link"
                  onClick={() => {
                    setCategory('all');
                    void refresh().catch((e) => setToast(e.message));
                  }}
                >
                  Refresh tasks
                </button>
              </div>
              {category !== 'all' && (
                <button className="filter-chip" onClick={() => setCategory('all')}>
                  {categories.find((c) => c.id === category)?.name}
                  <X size={14} />
                </button>
              )}
              <div className="task-list">
                {visibleTasks.map((t) => (
                  <TaskCard t={t} key={t.id} />
                ))}
                {!visibleTasks.length && (
                  <Empty
                    icon={ShoppingBag}
                    title="Your next little win starts here."
                    text="No tasks in this view. Create a request or change your filters."
                  />
                )}
              </div>
            </>
          )}
          {page === 'Messages' && (
            <section className="messages-page">
              <div className="section-heading">
                <div>
                  <h2>Your task conversations</h2>
                  <p>Select a task to view messages and the full activity history.</p>
                </div>
                <button
                  className="text-link"
                  onClick={() => void refresh().catch((e) => setToast(e.message))}
                >
                  Refresh
                </button>
              </div>
              {ownTasks.filter((t) => t.providerId).length ? (
                ownTasks
                  .filter((t) => t.providerId)
                  .map((t) => (
                    <button
                      className="conversation-row"
                      key={t.id}
                      onClick={() => setSelectedId(t.id)}
                    >
                      <div className="category-symbol mint">
                        <MessageCircle size={23} />
                      </div>
                      <div>
                        <h3>{t.title}</h3>
                        <p>{labels[t.status]} · Private task conversation</p>
                      </div>
                      <ChevronRight size={18} />
                    </button>
                  ))
              ) : (
                <Empty
                  icon={MessageCircle}
                  title="Say hello to a helping hand."
                  text="Once you select a provider, your private task conversation will appear here."
                />
              )}
            </section>
          )}
          {page === 'Profile' && (
            <div className="profile-layout">
              <section className="profile-account">
                <div className="large-user-avatar">
                  {data.demo ? (isProvider ? 'TM' : 'N') : data.user.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="sample-tag">
                  {data.demo ? 'Development account' : 'Personal account'}
                </span>
                <h2>{data.user.name}</h2>
                <p>
                  {data.demo
                    ? isProvider
                      ? 'Sample task provider'
                      : 'Sample customer'
                    : 'Customer'}{' '}
                  · Laws Campus pilot
                </p>
                <div className="info-note warm">
                  <CircleHelp size={20} />
                  <span>
                    {data.demo
                      ? 'No email, phone or identity verification has taken place. This account is for development testing only.'
                      : 'Your email was confirmed by the sign-in provider. Phone, identity and university affiliation have not been verified.'}
                  </span>
                </div>
                <button className="button secondary full" onClick={() => void switchRole()}>
                  {data.demo
                    ? `Switch to ${isProvider ? 'customer' : 'provider'} mode`
                    : 'Provider onboarding status'}
                  <ArrowRight size={16} />
                </button>
                {!data.demo && (
                  <button className="button ghost full" onClick={() => void signOut()}>
                    Sign out of this device
                    <ArrowRight size={16} />
                  </button>
                )}
              </section>
              <section className="profile-settings">
                <h2>Your preferences & privacy</h2>
                <button
                  onClick={() => {
                    setAreaDraft(area);
                    setInfo('location');
                  }}
                >
                  <MapPin size={20} />
                  <div>
                    <b>Service area</b>
                    <p>{area} · manually selected</p>
                  </div>
                  <ChevronRight size={16} />
                </button>
                <div className="setting-row">
                  <ShieldCheck size={20} />
                  <div>
                    <b>Location privacy</b>
                    <p>No GPS collected. No background location tracking.</p>
                  </div>
                  <span className="status">Protected</span>
                </div>
                <div className="setting-row">
                  <Wallet size={20} />
                  <div>
                    <b>Payment methods</b>
                    <p>Not connected. Never share a mobile money PIN.</p>
                  </div>
                </div>
                <div className="setting-row">
                  <Settings2 size={20} />
                  <div>
                    <b>Language & currency</b>
                    <p>English · Malawi Kwacha (MWK)</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    try {
                      localStorage.removeItem(`pafupi-draft:${data.user.id}`);
                      if (data.demo && data.user.id === 'customer-1')
                        localStorage.removeItem('pafupi-draft');
                      setToast('Local task draft removed from this device.');
                    } catch {
                      setToast('Your browser does not allow access to local storage.');
                    }
                  }}
                >
                  <Trash2 size={20} />
                  <div>
                    <b>Clear saved draft</b>
                    <p>Removes your unpublished request from this device.</p>
                  </div>
                  <ChevronRight size={16} />
                </button>
                <p className="fine-print">
                  Data export and account deletion are production launch requirements, not yet
                  enabled. Hosted sign-in is available only when configured by the operator. Use no
                  sensitive information in this pre-launch workspace.
                </p>
              </section>
            </div>
          )}
          <footer className="page-footer">
            <span>
              PAFUPI <span>·</span> Your neighbourhood. Your people. Your tasks.
            </span>
            <div>
              <button onClick={() => setInfo('help')}>Trust & safety</button>
              <span>·</span>
              <button onClick={() => setInfo('preview')}>About this preview</button>
            </div>
          </footer>
        </main>
      </div>
      <React.Suspense
        fallback={
          <div className="toast" role="status">
            <LoaderCircle className="spin" size={18} />
            Loading task workspace…
          </div>
        }
      >
        {request && (
          <RequestForm
            ownerKey={data.user.id}
            category={requestCategory}
            onClose={() => setRequest(false)}
            onCreated={(t) => {
              setRequest(false);
              void refresh()
                .then(() => {
                  setSelectedId(t.id);
                  setToast('Your task is published in the development marketplace.');
                })
                .catch((e) => setToast(e.message));
            }}
          />
        )}
        {selectedId && data.tasks.find((t) => t.id === selectedId) && (
          <TaskDetail
            task={data.tasks.find((t) => t.id === selectedId)!}
            data={data}
            onClose={() => setSelectedId(null)}
            onRefresh={refresh}
            notify={setToast}
          />
        )}
      </React.Suspense>
      {profile && (
        <Modal
          title="Meet a helping hand."
          subtitle="Illustrative provider profile — not a real service listing"
          onClose={() => setProfile(null)}
        >
          <div className="provider-profile">
            <Avatar provider={profile} />
            <h2>{profile.name}</h2>
            <p>{profile.bio}</p>
            <div className="tags">
              {profile.categories.map((c) => (
                <span key={c}>{categories.find((cat) => cat.id === c)?.name}</span>
              ))}
            </div>
            <div className="profile-facts">
              <div>
                <Footprints size={18} />
                {profile.transport === 'cycling' ? 'Cycling' : 'Walking'}
              </div>
              <div>
                <MapPin size={18} />
                Pilot area only · distance unknown
              </div>
              <div>
                <Star size={18} />
                No verified reviews or completed tasks
              </div>
            </div>
            <div className="info-note warm">
              <ShieldCheck size={20} />
              <span>
                Sample identity. No phone, identity or university verification has been performed.
                Availability is illustrative.
              </span>
            </div>
            <button
              className="button primary full"
              onClick={() => {
                const c = profile.categories[0];
                setProfile(null);
                openRequest(c);
              }}
            >
              Request a task in this category
              <ArrowUpRight size={16} />
            </button>
            <p className="fine-print">
              Publishing does not assign this person. Compare actual offers before selecting a
              provider.
            </p>
          </div>
        </Modal>
      )}
      {info && (
        <Modal
          title={
            info === 'location'
              ? 'Your neighbourhood.'
              : info === 'preview'
                ? 'Starting small. Building thoughtfully.'
                : info === 'notifications'
                  ? 'Your latest task updates.'
                  : 'People first. Always.'
          }
          subtitle={
            info === 'location'
              ? 'A familiar landmark is a good place to start.'
              : info === 'help'
                ? 'Safety is a process, not a badge.'
                : 'PAFUPI · Laws Campus pilot'
          }
          onClose={() => setInfo(null)}
        >
          <div className="info-modal-body">
            {info === 'location' ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setArea(areaDraft.trim());
                  try {
                    localStorage.setItem('pafupi-area', areaDraft.trim());
                  } catch {
                    /* optional preference */
                  }
                  setInfo(null);
                  setToast('Display area saved. Geographic matching is not connected.');
                }}
              >
                <label>
                  Your selected service area
                  <input
                    autoFocus
                    required
                    minLength={3}
                    maxLength={100}
                    value={areaDraft}
                    onChange={(e) => setAreaDraft(e.target.value)}
                  />
                </label>
                <div className="info-note">
                  <MapPin size={20} />
                  <span>
                    Initial pilot: University of Livingstonia, Laws Campus, Rumphi. This label does
                    not verify service coverage. No GPS, map pins, route calculations or real-time
                    provider positions are collected.
                  </span>
                </div>
                <button
                  type="button"
                  className="location-choice"
                  onClick={() => setAreaDraft('Laws Campus, Rumphi')}
                >
                  <GraduationCap size={22} />
                  <div>
                    <b>Laws Campus, Rumphi</b>
                    <p>University of Livingstonia · initial pilot area</p>
                  </div>
                  <Check size={18} />
                </button>
                <button className="button primary full">
                  Save selected area
                  <Check size={16} />
                </button>
              </form>
            ) : info === 'preview' ? (
              <>
                <div className="preview-icon">
                  <Sprout size={32} />
                </div>
                <h3>Your neighbourhood. Your people. Your tasks.</h3>
                <div className="info-note">
                  <ShieldCheck size={19} />
                  <span>
                    {data.demo
                      ? 'You are using sample accounts. Hosted sign-in can be enabled by the operator.'
                      : 'Hosted sign-in is connected and your email is confirmed. Payments, provider onboarding and production launch approval remain unavailable.'}
                  </span>
                </div>
                <p>
                  PAFUPI connects everyday requests with people who can help, starting with the
                  University of Livingstonia, Laws Campus community in Rumphi, Malawi.
                </p>
                <h4>What works in this foundation</h4>
                <p>
                  Persistent task creation, server-calculated prices, sample provider offers, quote
                  acceptance, private task messages, cancellation, disputes and event history.
                </p>
                <h4>What is not connected</h4>
                <p>
                  {data.demo ? 'Hosted sign-in is not configured in this workspace. ' : ''}Identity
                  verification, payments, GPS / routing, file evidence, notifications and live
                  support are unavailable. Sample profiles exist only in demo mode. No task
                  fulfilment is promised.
                </p>
                <div className="info-note warm">
                  <CircleHelp size={20} />
                  <span>
                    Not a production marketplace. Use sample information only. Payment-dependent
                    work is intentionally blocked.
                  </span>
                </div>
              </>
            ) : info === 'notifications' ? (
              <>
                {ownTasks.length ? (
                  ownTasks.map((t) => (
                    <button
                      className="update-row"
                      key={t.id}
                      onClick={() => {
                        setInfo(null);
                        setSelectedId(t.id);
                      }}
                    >
                      <div className="category-symbol mint">
                        <Bell size={19} />
                      </div>
                      <div>
                        <b>{labels[t.status]}</b>
                        <p>
                          {t.title}
                          {t.sample ? ' · Sample task' : ''}
                        </p>
                      </div>
                      <ChevronRight size={16} />
                    </button>
                  ))
                ) : (
                  <Empty
                    icon={Bell}
                    title="All quiet in the neighbourhood."
                    text="Your task updates will appear here."
                  />
                )}
                <p className="fine-print">
                  These are current task statuses, not push notifications. Refresh to retrieve the
                  latest changes.
                </p>
                <button
                  className="text-link"
                  onClick={() => void refresh().catch((e) => setToast(e.message))}
                >
                  Refresh updates
                </button>
              </>
            ) : (
              <>
                <div className="info-note">
                  <ShieldCheck size={22} />
                  <span>
                    Never share a mobile money PIN, password or identity document in a task or
                    message. Don’t pay outside the platform.
                  </span>
                </div>
                <h4>Agree before you begin</h4>
                <p>
                  Review the task scope, goods budget, compensation and meeting point. Any extra
                  expense needs explicit customer approval. No arbitrary price increases.
                </p>
                <h4>Keep an accountable record</h4>
                <p>
                  Use task conversations. Review completion evidence before confirming delivery. Use
                  the task’s dispute action to record a problem; events are retained in its history.
                </p>
                <h4>Choose safety over speed</h4>
                <p>
                  No illegal goods, weapons, controlled substances, fraud or dangerous assignments.
                  A verified phone or identity would not guarantee honesty.
                </p>
                <div className="info-note warm">
                  <CircleHelp size={20} />
                  <span>
                    No emergency response or live support is available in this development preview.
                    For immediate danger, contact trusted local emergency services or campus
                    security directly.
                  </span>
                </div>
                <p className="fine-print">
                  Real verification, escalation procedures, upload controls, privacy reviews and
                  operational readiness checks are required before a public pilot.
                </p>
              </>
            )}
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <span className="toast-icon">
            <Check size={16} />
          </span>
          <p>{toast}</p>
          <button
            className="icon-button"
            onClick={() => setToast('')}
            aria-label="Dismiss notification"
          >
            <X size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
function Empty({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="empty-state">
      <Icon size={35} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <AppExperience />
    </ErrorBoundary>
  </React.StrictMode>,
);
