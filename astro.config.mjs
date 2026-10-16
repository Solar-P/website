import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
const site = process.env.SITE_URL;
export default defineConfig({ site, base: process.env.BASE_PATH || '/', trailingSlash: 'always', integrations: [mdx(), ...(site ? [sitemap()] : [])], devToolbar: { enabled: false } });
