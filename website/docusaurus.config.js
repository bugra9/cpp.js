// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Cpp.js',
  tagline: 'Bind c++ libraries to js on web and mobile.',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://cpp.js.org',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'bugra9', // Usually your GitHub org/user name.
  projectName: 'cpp.js', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          remarkPlugins: [
            [require('@docusaurus/remark-plugin-npm2yarn'), {sync: true}],
          ],
          sidebarPath: require.resolve('./sidebars.js'),
        },
        pages: {
          remarkPlugins: [require('@docusaurus/remark-plugin-npm2yarn')],
        },
        blog: {
          remarkPlugins: [
            [
              require('@docusaurus/remark-plugin-npm2yarn'),
              {converters: ['pnpm']},
            ],
          ],
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/cppjs-social-card.png',
      navbar: {
        title: 'Cpp.js',
        logo: {
          alt: 'Cpp.js Logo',
          src: 'img/logo.png',
        },
        items: [
          {to: '/how-it-works', label: 'How It Works?', position: 'left'},
          {to: '/integrations', label: 'Integrations', position: 'left'},
          {to: '/showcase', label: 'Showcase', position: 'left'},
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Docs',
          },
          {to: '/changelogs', label: 'Changelogs', position: 'right'},
          {
            href: 'https://github.com/bugra9/cpp.js',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'light',
        links: [],
        copyright: `Released under the <a href="https://github.com/bugra9/cpp.js/blob/main/LICENSE" target="_blank">MIT License</a>.<br />Copyright © ${new Date().getFullYear()} <a href="https://github.com/bugra9" target="_blank">Buğra Sarı</a>.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
    plugins: [
        async function myPlugin(context, options) {
          return {
            name: "docusaurus-tailwindcss",
            configurePostCss(postcssOptions) {
              // Appends TailwindCSS and AutoPrefixer.
              postcssOptions.plugins.push(require("tailwindcss"));
              postcssOptions.plugins.push(require("autoprefixer"));
              return postcssOptions;
            },
          };
        },
      ],
    markdown: {
        mermaid: true,
    },
    themes: ['@docusaurus/theme-mermaid'],
};

module.exports = config;
