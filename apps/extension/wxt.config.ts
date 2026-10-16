import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({ plugins: [tailwindcss()] }),
  manifest: {
    name: 'FormPilot',
    description: 'Your details. Your device. Every form, reviewed by you.',
    version: '0.1.0',
    minimum_chrome_version: '120',
    permissions: ['activeTab', 'scripting', 'storage'],
    icons: { 16: 'icon-16.png', 32: 'icon-32.png', 48: 'icon-48.png', 128: 'icon-128.png' },
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'none'; base-uri 'none'",
    },
  },
});
