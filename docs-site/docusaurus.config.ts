import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Bharat Sampada Chain',
  tagline: "India's Open Source Blockchain for Property and Wealth Transparency",
  favicon: 'img/favicon.ico',

  url: 'https://tanbiralam06.github.io',
  baseUrl: '/BharatSampadaChain/',

  organizationName: 'tanbiralam06',
  projectName: 'BharatSampadaChain',
  trailingSlash: false,

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/tanbiralam06/BharatSampadaChain/tree/main/docs-site/',
          docItemComponent: '@theme/ApiItem',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    function () {
      return {
        name: 'custom-webpack-fallback',
        configureWebpack() {
          return {
            resolve: {
              fallback: {
                path: require.resolve('path-browserify'),
              },
            },
          };
        },
      };
    },
    [
      'docusaurus-plugin-openapi-docs',
      {
        id: 'bsc-api',
        docsPluginId: 'classic',
        config: {
          bscApi: {
            specPath: 'static/openapi/openapi.yaml',
            outputDir: 'docs/api-reference',
            sidebarOptions: {
              groupPathsBy: 'tag',
              categoryLinkSource: 'tag',
            },
            downloadUrl:
              'https://raw.githubusercontent.com/tanbiralam06/BharatSampadaChain/main/docs/api/openapi.yaml',
            showSchemas: true,
          },
        },
      },
    ],
  ],

  themes: ['docusaurus-theme-openapi-docs', '@docusaurus/theme-mermaid'],

  themeConfig: {
    image: 'img/bsc-social-card.png',
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Bharat Sampada Chain',
      logo: {
        alt: 'BSC Logo',
        src: 'img/bsc-logo.svg',
        srcDark: 'img/bsc-logo-dark.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'mainSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/docs/api-reference/introduction',
          label: 'API Reference',
          position: 'left',
        },
        {
          to: '/docs/whitepaper/index',
          label: 'Whitepaper',
          position: 'left',
        },
        {
          href: 'https://bharat-sampada-chain.vercel.app',
          label: 'Live Demo',
          position: 'right',
          className: 'navbar-demo-button',
        },
        {
          href: 'https://github.com/tanbiralam06/BharatSampadaChain',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'BSC',
          items: [
            { label: 'What is BSC?', to: '/docs/intro' },
            { label: 'Whitepaper', to: '/docs/whitepaper/index' },
            { label: 'Roadmap', to: '/docs/contributing/roadmap' },
            { label: 'Implementation Status', to: '/docs/status' },
            {
              label: 'MIT License',
              href: 'https://github.com/tanbiralam06/BharatSampadaChain/blob/main/LICENSE',
            },
          ],
        },
        {
          title: 'Developers',
          items: [
            { label: 'Quick Start', to: '/docs/getting-started/prototype' },
            { label: 'API Reference', to: '/docs/api-reference/introduction' },
            { label: 'Adaptation Guide', to: '/docs/adaptation/index' },
            { label: 'GitHub', href: 'https://github.com/tanbiralam06/BharatSampadaChain' },
          ],
        },
        {
          title: 'Community',
          items: [
            { label: 'Contributing', to: '/docs/contributing/index' },
            { label: 'Security Policy', to: '/docs/contributing/security' },
            {
              label: 'GitHub Discussions',
              href: 'https://github.com/tanbiralam06/BharatSampadaChain/discussions',
            },
          ],
        },
      ],
      copyright: `Built by Indians, for India · MIT License · Bharat Sampada Chain ${new Date().getFullYear()}`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'yaml', 'go', 'typescript', 'json', 'docker'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
