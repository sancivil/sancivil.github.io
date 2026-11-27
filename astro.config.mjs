// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import preact from '@astrojs/preact';
import contentHtaccess from './src/integrations/content-htaccess.ts';

export default defineConfig({
  site: 'https://faradayiq.com',
  trailingSlash: 'always',
  integrations: [
    preact(),
    sitemap({
      filter: (page) => !page.includes('/dev/'),
      i18n: { defaultLocale: 'en', locales: { en: 'en', ar: 'ar', ku: 'ku' } },
    }),
    contentHtaccess(),
  ],
  server: { host: '127.0.0.1' },
  build: { format: 'directory' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
