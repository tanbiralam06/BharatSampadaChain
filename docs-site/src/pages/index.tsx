import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

function HomepageHero(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className="hero--bsc">
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <p className="hero__tagline">
          India loses ₹7–10 lakh crore every year to tax evasion, benami property, and welfare fraud.
          Not because the data does not exist — but because nobody connects it. BSC connects it.
        </p>
        <div className="hero-buttons">
          <Link className="button button--primary button--lg" to="/docs/intro">
            Get Started
          </Link>
          <Link
            className="button button--outline button--lg"
            style={{ color: '#fff', borderColor: '#fff' }}
            href="https://bharat-sampada-chain.vercel.app"
          >
            Live Demo
          </Link>
          <Link
            className="button button--outline button--lg"
            style={{ color: '#ccc', borderColor: '#555' }}
            to="/docs/whitepaper/index"
          >
            Read Whitepaper
          </Link>
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
