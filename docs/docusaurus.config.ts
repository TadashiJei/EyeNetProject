import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'EyeNet Documentation',
  tagline: 'Network Monitoring and Management System',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://docs.eyenet.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  organizationName: 'TadashiJei',
  projectName: 'EyeNetProject',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/TadashiJei/EyeNetProject/tree/main/docs/',
        },
        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/TadashiJei/EyeNetProject/tree/main/docs/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'EyeNet Docs',
      logo: {
        alt: 'EyeNet Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          to: '/docs/api/api-reference',
          label: 'API',
          position: 'left'
        },
        {
          to: '/docs/architecture/system-overview',
          label: 'Architecture',
          position: 'left'
        },
        {
          to: '/docs/ml/machine-learning',
          label: 'Machine Learning',
          position: 'left'
        },
        {
          href: 'https://github.com/TadashiJei/EyeNetProject',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/intro',
            },
            {
              label: 'API Reference',
              to: '/docs/api/api-reference',
            },
            {
              label: 'Architecture',
              to: '/docs/architecture/system-overview',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/eyenet',
            },
            {
              label: 'Discord',
              href: 'https://discord.gg/eyenet',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/TadashiJei/EyeNetProject',
            },
          ],
        },
      ],
      copyright: `Copyright ${new Date().getFullYear()} EyeNet Project. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
