import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';

const features = [
  {
    icon: '🔓',
    title: 'Fully Open Source',
    description:
      'Every line of code, every smart contract rule, every ZKP circuit is MIT-licensed and publicly auditable. A transparency system that is itself opaque would be a contradiction.',
  },
  {
    icon: '🔒',
    title: 'Privacy First',
    description:
      'Citizen identifiers are SHA-256 hashes — never raw Aadhaar or PAN. Net worth is shown as a ₹10L–₹1Cr range, never exact. Zero Knowledge Proofs let agencies verify facts without seeing underlying data.',
  },
  {
    icon: '🏛️',
    title: 'Fork & Deploy',
    description:
      'BSC is jurisdiction-neutral. The Adaptation Guide walks through replacing Indian-specific data sources with those of any country. Deploy on your own Hyperledger Fabric network.',
  },
  {
    icon: '⛓️',
    title: 'Blockchain Immutability',
    description:
      'All records, access logs, and anomaly flags are written to a permissioned Hyperledger Fabric ledger. No single ministry can alter history. MAJORITY endorsement requires 2 of 3 orgs to agree.',
  },
  {
    icon: '🤖',
    title: 'Automatic Anomaly Detection',
    description:
      'Smart contracts evaluate income-asset gaps, unexplained wealth surges, and benami ownership patterns — automatically, without human discretion or political interference.',
  },
  {
    icon: '🔍',
    title: 'Complete Audit Trail',
    description:
      'Every time any agency reads a citizen\'s data, an immutable access log is written to the chain with officer ID, purpose, and investigation reference. Citizens can see this log.',
  },
];

const stats = [
  { number: '₹7–10L Cr', label: 'Lost annually to tax evasion & benami' },
  { number: '4', label: 'Smart contracts on bsc-channel' },
  { number: '22', label: 'REST API endpoints' },
  { number: '8', label: 'Role-based access levels' },
];

export default function HomepageFeatures(): ReactNode {
  return (
    <>
      {/* Stats strip */}
      <div className="stats-strip">
        <div className="stats-grid">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="stat-item__number">{s.number}</div>
              <div className="stat-item__label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature grid */}
      <section className="features-section">
        <div className="feature-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-card__icon">{f.icon}</div>
              <div className="feature-card__title">{f.title}</div>
              <div className="feature-card__desc">{f.description}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech strip */}
      <div className="tech-strip">
        <div className="tech-strip__label">Built with</div>
        <div className="tech-strip__items">
          {[
            'Hyperledger Fabric 2.5',
            'Node.js + TypeScript',
            'React 19 + Vite',
            'PostgreSQL 15',
            'circom + snarkjs',
            'Docker Compose',
            'MIT License',
          ].map((t) => (
            <span key={t} className="tech-strip__item">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* CTA strip */}
      <section style={{ padding: '4rem 0', textAlign: 'center', background: 'var(--ifm-background-color)' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Ready to integrate BSC?
        </h2>
        <p style={{ color: 'var(--ifm-color-emphasis-600)', marginBottom: '2rem', fontSize: '1rem' }}>
          Read the Adaptation Guide to deploy BSC for your own jurisdiction.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link className="button button--primary button--lg" to="/docs/adaptation/index">
            Adaptation Guide
          </Link>
          <Link className="button button--outline button--secondary button--lg" to="/docs/getting-started/prototype">
            Try Locally
          </Link>
        </div>
      </section>
    </>
  );
}
