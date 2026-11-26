import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowUpRight,
  Compass,
  Leaf,
  MapPin,
  ShoppingBag,
  GraduationCap,
  Package,
  ShieldCheck,
  X,
} from 'lucide-react';
import '@fontsource-variable/manrope';
import './pages.css';

const services = [
  {
    id: 'shopping',
    icon: ShoppingBag,
    name: 'Shopping & essentials',
    tag: 'Everyday made easier',
    description:
      'Explore how a neighbour could help with a grocery list or a few everyday essentials.',
    example: 'Collect bread, eggs and cooking oil',
    detail:
      'In the planned marketplace, customers would agree item prices and a pickup point before a helper shops. This example does not create a request or purchase goods.',
  },
  {
    id: 'campus',
    icon: GraduationCap,
    name: 'Campus errands',
    tag: 'A little campus support',
    description: 'See the idea behind help with printing, collections and small campus errands.',
    example: 'Collect a set of printed course notes',
    detail:
      'A future request would separate printing costs, labour and travel. No campus business, opening time or available provider has been verified in this demo.',
  },
  {
    id: 'delivery',
    icon: Package,
    name: 'Local pickups',
    tag: 'Close to home',
    description:
      'Discover the concept of short-distance pickups with clearly agreed handover details.',
    example: 'Pick up a small parcel at an agreed point',
    detail:
      'Real pickups would need safe meeting arrangements, provider eligibility checks and customer consent. No delivery can be booked here.',
  },
];
const repo = 'https://github.com/Clazzo265/Pafupi';
function PagesDemo() {
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <div className="pages-demo">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="demo-banner">
        <ShieldCheck size={18} />
        <span>
          <strong>Read-only concept demo · GitHub Pages</strong>
          <span className="banner-detail">
            {' '}
            No accounts, bookings, saved requests, messaging or payments.
          </span>
        </span>
      </div>
      <header className="site-header">
        <a className="brand" href="#home" aria-label="Pafupi home">
          <span className="brand-icon">
            <Leaf size={25} />
          </span>
          pafupi<span className="brand-dot">.</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#explore">Explore services</a>
          <a href="#about">How it works</a>
          <a className="repo-link" href={repo}>
            View on GitHub <ArrowUpRight size={16} />
          </a>
        </nav>
      </header>
      <main id="main">
        <section className="hero" id="home">
          <div className="hero-copy">
            <p className="eyebrow">
              <span /> A LITTLE HELP GOES A LONG WAY
            </p>
            <h1>
              Your neighbourhood.
              <br />
              Your people.
              <br />
              <em>A helping hand.</em>
            </h1>
            <p className="intro">
              Everyday tasks, thoughtful support, and a little more time for what matters. Meet
              Pafupi—a local task marketplace in the making.
            </p>
            <a className="primary" href="#explore">
              Explore the idea <ArrowUpRight size={19} />
            </a>
            <p className="location">
              <MapPin size={16} /> Planned pilot: Laws Campus, Rumphi, Malawi
            </p>
          </div>
          <div className="hero-art" aria-label="Illustrative task preview, not a real request">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <span className="art-leaf">
              <Leaf size={49} />
            </span>
            <div className="sample-card">
              <span className="sample-tag">ILLUSTRATIVE EXAMPLE</span>
              <div className="sample-icon">
                <ShoppingBag size={28} />
              </div>
              <h2>
                A few essentials
                <br />
                for the week.
              </h2>
              <p>
                A small errand.
                <br />A little more breathing room.
              </p>
              <div className="sample-footer">
                <span>Shopping & essentials</span>
                <ArrowUpRight size={18} />
              </div>
            </div>
            <div className="art-note">
              <span>✳</span> Good things start nearby.
            </div>
          </div>
        </section>
        <section className="explore-section" id="explore">
          <div className="section-heading">
            <div>
              <p className="eyebrow">SMALL TASKS. MEANINGFUL HELP.</p>
              <h2>What could you use a hand with?</h2>
            </div>
            <p>
              Browse sample service ideas.
              <br />
              Nothing here is a live listing.
            </p>
          </div>
          <div className="filters" role="group" aria-label="Filter service examples">
            {[{ id: 'all', name: 'All services' }, ...services].map((item) => (
              <button
                key={item.id}
                aria-pressed={filter === item.id}
                onClick={() => {
                  setFilter(item.id);
                  setExpanded(null);
                }}
              >
                {item.name}
              </button>
            ))}
          </div>
          <div className="service-grid">
            {services
              .filter((s) => filter === 'all' || s.id === filter)
              .map(({ id, icon: Icon, name, tag, description, example, detail }) => (
                <article className={`service-card service-${id}`} key={id}>
                  <span className="service-icon">
                    <Icon size={25} />
                  </span>
                  <p className="card-tag">{tag}</p>
                  <h3>{name}</h3>
                  <p>{description}</p>
                  <div className="example">
                    <span>EXAMPLE ONLY</span>
                    <p>{example}</p>
                  </div>
                  <button
                    className="detail-button"
                    aria-expanded={expanded === id}
                    aria-controls={`detail-${id}`}
                    onClick={() => setExpanded(expanded === id ? null : id)}
                  >
                    {expanded === id ? 'Close example' : 'Explore example'}
                    {expanded === id ? <X size={17} /> : <ArrowUpRight size={17} />}
                  </button>
                  {expanded === id && (
                    <p className="expanded-detail" id={`detail-${id}`}>
                      {detail}
                    </p>
                  )}
                </article>
              ))}
          </div>
        </section>
        <section className="about-section" id="about">
          <div>
            <p className="eyebrow">DESIGNED WITH TRUST IN MIND</p>
            <h2>
              Local help.
              <br />
              Clear expectations.
            </h2>
            <p>
              The planned experience puts transparent costs and safe handovers first. These are
              design goals—not currently available services.
            </p>
          </div>
          <ol>
            <li>
              <span>01</span>
              <div>
                <h3>Describe the task</h3>
                <p>A future customer could explain what help they need and agree the details.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Understand the full cost</h3>
                <p>
                  Labour, travel, waiting, goods and platform charges would be shown separately in
                  MWK.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Agree before anything starts</h3>
                <p>
                  Real accounts, provider checks and payment integration must be ready before
                  launch.
                </p>
              </div>
            </li>
          </ol>
        </section>
        <aside className="honesty-note">
          <Compass size={24} />
          <div>
            <h2>A preview, not a live marketplace.</h2>
            <p>
              This GitHub-only site has no application backend or database. It cannot accept tasks,
              sign you in, contact a helper, send a message or collect payment. All examples are
              fictional. Do not share personal information here.
            </p>
            <a href={`${repo}/blob/arena/c01f6663-pafupi/docs/GITHUB_PAGES.md`}>
              Read deployment & launch limitations <ArrowUpRight size={15} />
            </a>
          </div>
        </aside>
      </main>
      <footer>
        <a className="brand" href="#home">
          pafupi<span className="brand-dot">.</span>
        </a>
        <p>A little help, close to home.</p>
        <span>Built in the open · Read-only demo</span>
      </footer>
    </div>
  );
}
createRoot(document.getElementById('root')!).render(<PagesDemo />);
