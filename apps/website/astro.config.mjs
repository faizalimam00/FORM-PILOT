import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
try {
  process.loadEnvFile('../../.env');
} catch {
  /* Optional deployment configuration. */
}
const site = process.env.PUBLIC_SITE_URL?.trim();
if (site && (!/^https:\/\//.test(site) || new URL(site).origin !== site.replace(/\/$/, '')))
  throw new Error('PUBLIC_SITE_URL must be the real HTTPS origin without a path.');
export default defineConfig({
  site: site || undefined,
  output: 'static',
  integrations: [react(), ...(site ? [sitemap()] : [])],
  vite: { plugins: [tailwindcss()], envDir: '../..' },
  devToolbar: { enabled: false },
});
