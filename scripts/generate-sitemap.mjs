// Generates public/sitemap.xml so Google can discover every product and farmer
// page, not just the static routes. Runs automatically via "prebuild" (see
// package.json), and can also be run manually with `npm run generate-sitemap`.
//
// Reads Supabase credentials straight out of .env (no extra dependency needed) —
// these are the same VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY values the
// client app already ships with in the browser bundle, so nothing sensitive is
// being read here.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// TODO: update once a custom domain is connected in Vercel (see src/components/Seo.tsx too).
const SITE_URL = 'https://agro-trust.vercel.app';

function loadEnv() {
  const envPath = join(ROOT, '.env');
  const env = {};
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  }
  return env;
}

const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/products', changefreq: 'daily', priority: '0.9' },
  { path: '/trust-and-safety', changefreq: 'monthly', priority: '0.5' },
  { path: '/how-it-works', changefreq: 'monthly', priority: '0.5' },
];

async function fetchDynamicUrls(env) {
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const urls = [];

  if (!url || !key) {
    console.warn('[sitemap] Supabase env vars not found — generating static-only sitemap.');
    return urls;
  }

  const headers = { apikey: key, Authorization: `Bearer ${key}` };

  try {
    const productsRes = await fetch(
      `${url}/rest/v1/products?select=id,created_at&is_active=eq.true`,
      { headers }
    );
    if (productsRes.ok) {
      const products = await productsRes.json();
      for (const p of products) {
        urls.push({
          path: `/products/id/${p.id}`,
          changefreq: 'weekly',
          priority: '0.8',
          lastmod: p.created_at,
        });
      }
    } else {
      console.warn('[sitemap] Failed to fetch products:', productsRes.status, await productsRes.text());
    }
  } catch (err) {
    console.warn('[sitemap] Error fetching products for sitemap:', err.message);
  }

  try {
    const farmersRes = await fetch(
      `${url}/rest/v1/farmer_profiles_public?select=id,created_at&verification_status=eq.approved`,
      { headers }
    );
    if (farmersRes.ok) {
      const farmers = await farmersRes.json();
      for (const f of farmers) {
        urls.push({
          path: `/farmers/${f.id}`,
          changefreq: 'weekly',
          priority: '0.7',
          lastmod: f.created_at,
        });
      }
    } else {
      console.warn('[sitemap] Failed to fetch farmers:', farmersRes.status, await farmersRes.text());
    }
  } catch (err) {
    console.warn('[sitemap] Error fetching farmers for sitemap:', err.message);
  }

  return urls;
}

function buildXml(entries) {
  const urlTags = entries
    .map((e) => {
      const lastmod = e.lastmod ? `\n    <lastmod>${new Date(e.lastmod).toISOString().split('T')[0]}</lastmod>` : '';
      return `  <url>
    <loc>${SITE_URL}${e.path}</loc>${lastmod}
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlTags}
</urlset>
`;
}

async function main() {
  const env = loadEnv();
  const dynamicUrls = await fetchDynamicUrls(env);
  const allUrls = [...STATIC_ROUTES, ...dynamicUrls];
  const xml = buildXml(allUrls);

  const outPath = join(ROOT, 'public', 'sitemap.xml');
  writeFileSync(outPath, xml, 'utf-8');
  console.log(`[sitemap] Wrote ${allUrls.length} URLs to public/sitemap.xml`);
}

main();
