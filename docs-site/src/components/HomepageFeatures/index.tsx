import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import Link from '@docusaurus/Link';
import CodeBlock from '@theme/CodeBlock';

/* ── Scroll-triggered fade-up ── */
function useScrollAnimation(selector: string) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('animate-in');
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.15 },
    );
    document.querySelectorAll(selector).forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ── Inline SVG icons ── */
function IconOpenSource() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="9" x2="9" y2="21" />
    </svg>
  );
}

function IconPrivacy() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      <circle cx="12" cy="16" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconFork() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4" r="2" />
      <circle cx="6" cy="20" r="2" />
      <circle cx="18" cy="20" r="2" />
      <line x1="12" y1="6" x2="12" y2="13" />
      <line x1="12" y1="13" x2="6" y2="18" />
      <line x1="12" y1="13" x2="18" y2="18" />
    </svg>
  );
}

function IconChain() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="8" width="9" height="8" rx="2" />
      <rect x="14" y="8" width="9" height="8" rx="2" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  );
}

function IconAnomaly() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,18 7,12 11,15 15,6 20,10" />
      <line x1="15" y1="6" x2="15" y2="2" />
      <polyline points="15,2 19,4 15,6" />
    </svg>
  );
}

function IconAudit() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="5" width="13" height="16" rx="1" />
      <line x1="8" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="16" y2="14" />
      <line x1="8" y1="18" x2="12" y2="18" />
    </svg>
  );
}

/* ── Data ── */
const stats = [
  {
    number: '₹7–10L Cr',
    label: 'Annual Estimated Loss',
    desc: 'Combined tax evasion, benami assets, and welfare fraud diverted from India\'s public economy each year.',
    variant: 'loss',
  },
  {
    number: '₹4–6L Cr',
    label: 'Tax Evasion Gap',
    desc: 'Undisclosed income and offshore routing detectable through cross-org ledger comparison.',
    variant: 'loss',
  },
  {
    number: '₹1.3L Cr',
    label: 'Benami Property',
    desc: 'Registered under proxy identities — now traceable via SHA-256 hashed ownership chains.',
    variant: 'loss',
  },
  {
    number: '4',
    label: 'Smart Contracts',
    desc: 'anomaly · property · access · zkp — each enforcing org-specific endorsement policies.',
    variant: 'detection',
  },
  {
    number: '8',
    label: 'Role-Based Access Tiers',
    desc: 'From CITIZEN to CBI — each role sees only what endorsement policy permits.',
    variant: 'capability',
  },
  {
    number: '22',
    label: 'REST API Endpoints',
    desc: 'Full transaction lifecycle coverage — submission, query, audit, and ZKP verification.',
    variant: 'capability',
  },
];

const features = [
  {
    Icon: IconOpenSource,
    title: 'Fully Open Source',
    description:
      'Every line of code, every smart contract rule, every ZKP circuit is MIT-licensed and publicly auditable. A transparency system that is itself opaque would be a contradiction.',
  },
  {
    Icon: IconPrivacy,
    title: 'Privacy First',
    description:
      'Citizen identifiers are SHA-256 hashes — never raw Aadhaar or PAN. Net worth is shown as a ₹10L–₹1Cr range, never exact. Zero Knowledge Proofs let agencies verify facts without seeing underlying data.',
  },
  {
    Icon: IconFork,
    title: 'Fork & Deploy',
    description:
      'BSC is jurisdiction-neutral. The Adaptation Guide walks through replacing Indian-specific data sources with those of any country. Deploy on your own Hyperledger Fabric network.',
  },
  {
    Icon: IconChain,
    title: 'Blockchain Immutability',
    description:
      'All records, access logs, and anomaly flags are written to a permissioned Hyperledger Fabric ledger. No single ministry can alter history. MAJORITY endorsement requires 2 of 3 orgs to agree.',
  },
  {
    Icon: IconAnomaly,
    title: 'Automatic Anomaly Detection',
    description:
      'Smart contracts evaluate income-asset gaps, unexplained wealth surges, and benami ownership patterns — automatically, without human discretion or political interference.',
  },
  {
    Icon: IconAudit,
    title: 'Complete Audit Trail',
    description:
      'Every time any agency reads a citizen\'s data, an immutable access log is written to the chain with officer ID, purpose, and investigation reference. Citizens can see this log.',
  },
];

const steps = [
  {
    title: 'Submit Transaction',
    desc: 'Citizen or official submits a wealth declaration via REST API or SDK. Identity is SHA-256 hashed before it touches the ledger — never raw Aadhaar or PAN.',
  },
  {
    title: 'Endorsement Proposal',
    desc: 'Fabric Gateway broadcasts to all three peer orgs. MAJORITY policy requires ITDeptMSP, RegistrarMSP, and MCAMSP to simulate and cryptographically sign the proposal.',
  },
  {
    title: 'Anomaly Chaincode',
    desc: 'Each peer runs the anomaly smart contract. Declared income vs. total assets are compared. A ZKP range proof validates the net worth bracket without revealing the exact figure.',
  },
  {
    title: 'Flag Assignment',
    desc: 'Threshold breaches raise YELLOW → ORANGE → RED flags. Severity is determined by multi-org consensus — no single department can suppress or manufacture a flag.',
  },
  {
    title: 'Audit Trail',
    desc: 'An immutable block is committed to the ledger. CBI and COURT roles query full history. Citizens view only their own hashed summary via their role-gated endpoint.',
  },
];

const techGroups = [
  {
    label: 'Blockchain Layer',
    items: ['Hyperledger Fabric 2.5', 'Go Chaincode', 'Raft Ordering', 'LevelDB State'],
  },
  {
    label: 'Privacy & Cryptography',
    items: ['SHA-256 Identity Hashing', 'ZKP Range Proofs', 'MSP Certificate Auth', 'circom + snarkjs'],
  },
  {
    label: 'Integration Surface',
    items: ['Node.js + TypeScript API', 'REST Gateway (22 endpoints)', 'Docker Compose', 'OpenAPI Spec'],
  },
];

const sdkCode = `import { connect } from '@hyperledger/fabric-gateway';

const gateway = connect({ client, identity, signer });
const network  = gateway.getNetwork('bsc-channel');
const contract = network.getContract('anomaly');

// SHA-256 hash of citizen identity — never raw Aadhaar/PAN
// All monetary values in paisa (1 INR = 100 paisa)
const result = await contract.submitTransaction(
  'RunAnomalyCheck',
  citizenHash,
  String(declaredIncome),
  String(totalAssets),
);

const flag = JSON.parse(Buffer.from(result).toString());
// { severity: "ORANGE", score: 2, flagId: "FLAG_a3f9...c21e_18402abc" }`;

const restCode = `curl -X POST https://api.bsc.gov/v1/anomaly/check \\
  -H "Authorization: Bearer $JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "citizenHash": "a3f9c21e7b2df8a1c8e13d94...",
    "declaredIncome": 125000000,
    "totalAssets":   980000000
  }'

# Response
{
  "severity": "ORANGE",
  "score": 2,
  "flags": [{
    "flagId":      "FLAG_a3f9c21e_18402abc",
    "rule":        "ASSET_INCOME_GAP",
    "threshold":   7.84,
    "zkpProofHash":"9e4ba7f2..."
  }]
}`;

/* ── Component ── */
export default function HomepageFeatures(): ReactNode {
  const [activeTab, setActiveTab] = useState(0);

  useScrollAnimation('.stats-card');
  useScrollAnimation('.flow-step');

  return (
    <>
      {/* ── Stats ── */}
      <section className="stats-section">
        <div className="container">
          <h2 className="stats-section__heading">The Scale of the Problem BSC Solves</h2>
          <div className="stats-grid-6">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`stats-card stats-card--${s.variant}`}
                style={{ '--card-index': i } as React.CSSProperties}
              >
                <div className="stats-card__number">{s.number}</div>
                <div className="stats-card__label">{s.label}</div>
                <div className="stats-card__desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="how-it-works__heading">How BSC Works</h2>
          <p className="how-it-works__sub">
            From submission to immutable flag — every state change requires multi-org cryptographic endorsement.
          </p>
          <div className="flow-steps">
            {steps.map((s, i) => (
              <>
                <div
                  key={s.title}
                  className="flow-step"
                  style={{ '--card-index': i } as React.CSSProperties}
                >
                  <div className="flow-step__number">{i + 1}</div>
                  <div className="flow-step__title">{s.title}</div>
                  <div className="flow-step__desc">{s.desc}</div>
                </div>
                {i < steps.length - 1 && <div key={`arrow-${i}`} className="flow-arrow" />}
              </>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Grid ── */}
      <section className="features-section">
        <div className="container">
          <h2 className="features-section__heading">What BSC Enforces</h2>
          <div className="feature-grid">
            {features.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-card__icon">
                  <f.Icon />
                </div>
                <div className="feature-card__title">{f.title}</div>
                <div className="feature-card__desc">{f.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Code Glimpse ── */}
      <section className="code-glimpse">
        <div className="container">
          <h2 className="code-glimpse__heading">Integrate in Minutes</h2>
          <p className="code-glimpse__sub">
            Full SDK and REST API surface — same endorsement guarantees, different integration paths.
          </p>
          <div className="code-tabs">
            <button
              className={`code-tab-btn${activeTab === 0 ? ' code-tab-btn--active' : ''}`}
              onClick={() => setActiveTab(0)}
            >
              Fabric SDK (TypeScript)
            </button>
            <button
              className={`code-tab-btn${activeTab === 1 ? ' code-tab-btn--active' : ''}`}
              onClick={() => setActiveTab(1)}
            >
              REST API (curl)
            </button>
          </div>
          <div className="code-block-wrapper">
            {activeTab === 0 ? (
              <CodeBlock language="typescript">{sdkCode}</CodeBlock>
            ) : (
              <CodeBlock language="bash">{restCode}</CodeBlock>
            )}
          </div>
          <div className="code-glimpse__links">
            <Link to="/docs/api-reference/introduction">View all 22 endpoints →</Link>
            <Link to="/docs/getting-started/dev-setup">Dev setup guide →</Link>
          </div>
        </div>
      </section>

      {/* ── Tech Strip ── */}
      <div className="tech-strip-groups">
        <div className="tech-groups">
          {techGroups.map((g) => (
            <div key={g.label} className="tech-group">
              <div className="tech-group__label">{g.label}</div>
              <div className="tech-group__items">
                {g.items.map((item) => (
                  <span key={item} className="tech-strip__item">{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA Strip ── */}
      <section className="cta-strip-section">
        <div className="cta-strip-grid">
          <div className="cta-col">
            <div className="cta-col__heading">Start Building on BSC</div>
            <div className="cta-col__body">
              Clone the repo, spin up the network with Docker Compose, and make your first
              chaincode call in under 30 minutes.
            </div>
            <Link className="button button--primary" to="/docs/getting-started/prototype">
              Developer Quickstart →
            </Link>
            <div className="cta-col__links">
              <Link
                className="cta-col__secondary-link"
                href="https://github.com/tanbiralam06/BharatSampadaChain"
              >
                View on GitHub →
              </Link>
            </div>
          </div>
          <div className="cta-col">
            <div className="cta-col__heading">Deploy for Your Department</div>
            <div className="cta-col__body">
              BSC is jurisdiction-neutral. Adapt the chaincode policies, endorsement rules,
              and role taxonomy for your government context.
            </div>
            <Link
              className="button button--outline button--secondary"
              to="/docs/adaptation"
            >
              Read Adaptation Guide →
            </Link>
            <div className="cta-col__links">
              <Link className="cta-col__secondary-link" to="/docs/architecture/system-overview">
                Architecture Overview →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
