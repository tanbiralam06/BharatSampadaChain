import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

const ledgerRows = [
  { hash: 'a3f9...c21e', severity: 'RED',    label: 'Benami Pattern', time: '09:14:32' },
  { hash: '7b2d...f8a1', severity: 'YELLOW', label: 'Asset Mismatch', time: '09:13:18' },
  { hash: 'c8e1...3d94', severity: 'ORANGE', label: 'Income Gap',     time: '09:12:05' },
  { hash: '2f7a...b5c3', severity: 'RED',    label: 'Shell Entity',   time: '09:11:47' },
  { hash: '9e4b...a7f2', severity: 'YELLOW', label: 'Rapid Growth',   time: '09:10:33' },
  { hash: '1d6c...e9b8', severity: 'ORANGE', label: 'Property Flag',  time: '09:09:21' },
];

function LedgerPanel(): ReactNode {
  return (
    <div className="ledger-panel">
      <div className="ledger-panel__header">
        <span className="ledger-panel__title">BSC Ledger — Block #18,402</span>
        <span className="ledger-panel__cursor">|</span>
      </div>
      <div className="ledger-panel__scroll-wrapper">
        <div className="ledger-rows">
          {[...ledgerRows, ...ledgerRows].map((row, i) => (
            <div key={i} className="ledger-row">
              <span className="ledger-row__hash">{row.hash}</span>
              <span className={`severity-badge severity-badge--${row.severity.toLowerCase()}`}>
                {row.severity}
              </span>
              <span className="ledger-row__label">{row.label}</span>
              <span className="ledger-row__time">{row.time}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="ledger-panel__footer">
        <span className="ledger-org--verified">ITDeptMSP ✓</span>
        <span className="ledger-org--verified">RegistrarMSP ✓</span>
        <span className="ledger-org--verified">MCAMSP ✓</span>
      </div>
      <div className="ledger-panel__endorsement">MAJORITY ENDORSEMENT</div>
    </div>
  );
}

function HomepageHero(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className="hero--bsc">
      <div className="container">
        <div className="hero-grid">
          <div className="hero-content">
            <div className="hero-overline">India's Open-Source Financial Integrity Layer</div>
            <h1 className="hero__title">{siteConfig.title}</h1>
            <p className="hero__subtitle">{siteConfig.tagline}</p>
            <div className="hero-stakes">
              <span className="stakes-badge">Tax Evasion ₹4–6L Cr</span>
              <span className="stakes-badge">Benami Property ₹1.3L Cr</span>
              <span className="stakes-badge">Welfare Fraud ₹3L Cr</span>
            </div>
            <div className="hero-buttons">
              <Link className="button button--primary button--lg" to="/docs/intro">
                Get Started
              </Link>
              <Link
                className="button button--outline button--lg"
                style={{ color: '#fff', borderColor: '#fff' }}
                href="https://bharatsampadachain.vercel.app"
              >
                Live Demo
              </Link>
              <Link
                className="button button--outline button--lg"
                style={{ color: '#ccc', borderColor: '#555' }}
                to="/docs/whitepaper"
              >
                Read Whitepaper
              </Link>
            </div>
            <div className="hero-micro-label">
              MIT License · Hyperledger Fabric 2.x · Open Source
            </div>
          </div>
          <div className="hero-panel-col">
            <LedgerPanel />
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="India's Open Source Blockchain for Wealth Transparency"
      description="Bharat Sampada Chain links property records, income filings, and asset ownership to a single cryptographic identity. Automatic anomaly detection. Privacy-preserving ZKP. Fully open source."
    >
      <HomepageHero />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
