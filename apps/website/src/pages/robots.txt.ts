import type { APIRoute } from 'astro';
import { site } from '../site';
export const GET: APIRoute = () =>
  new Response(
    site.origin
      ? `User-agent: *\nAllow: /\nSitemap: ${new URL('/sitemap-index.xml', site.origin).href}\n`
      : 'User-agent: *\nDisallow: /\n',
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
