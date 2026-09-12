import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontSiteDir = path.resolve(__dirname, '..');

// Helper to load env variables from .env.production or .env
function loadEnv() {
  const envFiles = ['.env.production', '.env.local', '.env'];
  const env = {};

  for (const file of envFiles) {
    const fullPath = path.join(frontSiteDir, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.substring(0, eqIdx).trim();
          const val = trimmed.substring(eqIdx + 1).trim();
          if (!env[key]) env[key] = val;
        }
      }
    }
  }

  return env;
}

const env = loadEnv();
const frontendUrl = (process.env.VITE_FRONTEND_URL || env.VITE_FRONTEND_URL || 'https://only-models.online').replace(/\/$/, '');
const backendUrl = (process.env.VITE_BACKEND_URL || env.VITE_BACKEND_URL || 'https://admin.only-models.online').replace(/\/$/, '');

console.log(`[Sitemap Generator] Target Frontend URL: ${frontendUrl}`);
console.log(`[Sitemap Generator] Target Backend URL: ${backendUrl}`);

async function generate() {
  let sitemapContent = '';

  // 1. Try fetching live sitemap from backend if reachable
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${backendUrl}/sitemap.xml`, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const text = await res.text();
      if (text.includes('<urlset') && text.includes('</urlset>')) {
        console.log('[Sitemap Generator] Successfully fetched live sitemap from backend.');
        // Replace base url in case backend used default local url
        sitemapContent = text.replace(/https?:\/\/[^\/]+/g, (match) => {
          // If match is frontend url or localhost:3000, swap to configured frontendUrl
          if (match.includes('3000') || match.includes('127.0.0.1') || match.includes('localhost') || match.includes('link-persons.com')) {
            return frontendUrl;
          }
          return match;
        });
      }
    }
  } catch (err) {
    console.log('[Sitemap Generator] Backend unreachable or local offline; using static route template.');
  }

  // 2. Fallback static template if backend fetch didn't yield content
  if (!sitemapContent) {
    const today = new Date().toISOString();
    const routes = [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/explorar', priority: '0.9', changefreq: 'daily' },
      { path: '/cafes', priority: '0.9', changefreq: 'daily' },
      { path: '/ranking', priority: '0.8', changefreq: 'hourly' },
      { path: '/sugerir-cafe', priority: '0.7', changefreq: 'weekly' },
      { path: '/faqs', priority: '0.7', changefreq: 'weekly' },
      { path: '/contacto', priority: '0.7', changefreq: 'monthly' },
      { path: '/privacidad-datos', priority: '0.6', changefreq: 'monthly' },
      { path: '/terminos-y-condiciones', priority: '0.5', changefreq: 'monthly' },
    ];

    sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (r) => `  <url>
    <loc>${frontendUrl}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;
  }

  // Write sitemap.xml to public/
  const sitemapPath = path.join(frontSiteDir, 'public', 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemapContent, 'utf8');
  console.log(`[Sitemap Generator] Wrote ${sitemapPath}`);

  // Update robots.txt Sitemap directive with correct domain
  const robotsPath = path.join(frontSiteDir, 'public', 'robots.txt');
  if (fs.existsSync(robotsPath)) {
    let robotsContent = fs.readFileSync(robotsPath, 'utf8');
    robotsContent = robotsContent.replace(/Sitemap:\s*https?:\/\/[^\r\n]+/g, `Sitemap: ${frontendUrl}/sitemap.xml`);
    fs.writeFileSync(robotsPath, robotsContent, 'utf8');
    console.log(`[Sitemap Generator] Updated Sitemap line in ${robotsPath}`);
  }

  // Update index.html JSON-LD domain if needed
  const indexPath = path.join(frontSiteDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    let indexHtml = fs.readFileSync(indexPath, 'utf8');
    indexHtml = indexHtml.replace(/https:\/\/link-persons\.com/g, frontendUrl);
    fs.writeFileSync(indexPath, indexHtml, 'utf8');
    console.log(`[Sitemap Generator] Synchronized canonical domain in ${indexPath}`);
  }
}

generate().catch((err) => {
  console.error('[Sitemap Generator] Error:', err);
  process.exit(1);
});
