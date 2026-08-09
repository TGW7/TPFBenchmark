#!/usr/bin/env node
/**
 * IndexNow ping helper — mirrors tpf-app's scripts/indexnow_ping.mjs.
 *
 * Reads the production sitemap for both benchmark hosts, then POSTs every
 * URL to https://api.indexnow.org/indexnow with the configured key. Run
 * this after a deploy that changed content (new standard, new pathway,
 * recalibrated tiers) so Bing + Yandex pick up the changes within minutes
 * instead of days.
 *
 * Unlike tpf-app/tpf-marketing (dynamic /api/indexnow/key route), this is a
 * static build — the key file is written by scripts/build-seo.mjs at build
 * time, named after the key itself ({key}.txt), so keyLocation below points
 * there instead of a fixed path.
 *
 * Usage:
 *   INDEXNOW_KEY=<your-key> node scripts/indexnow_ping.mjs
 *
 *   # Or with a host -> sitemap override:
 *   INDEXNOW_KEY=<key> HOSTS=benchmark.takepointfitness.com node scripts/indexnow_ping.mjs
 *
 * Exit codes:
 *   0 — all host pings succeeded (or returned a non-error status code)
 *   1 — a network / parse error occurred
 *   2 — the IndexNow API rejected one or more keys (check key + key-file URL)
 */

const DEFAULT_HOSTS = {
  'benchmark.takepointfitness.com': 'sitemap-lift.xml',
  'operatorbenchmark.takepointfitness.com': 'sitemap-operator.xml',
};

const ENGINE_ENDPOINT = 'https://api.indexnow.org/indexnow';

async function fetchSitemapUrls(host, sitemapFile) {
  const sitemapUrl = `https://${host}/${sitemapFile}`;
  const res = await fetch(sitemapUrl, {
    headers: { 'user-agent': 'TPF-IndexNow-Ping/1.0' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${sitemapUrl}: HTTP ${res.status}`);
  }
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  return urls;
}

async function pingIndexNow({ host, key, urls }) {
  const body = {
    host,
    key,
    keyLocation: `https://${host}/${key}.txt`,
    urlList: urls,
  };
  const res = await fetch(ENGINE_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  return {
    status: res.status,
    statusText: res.statusText,
    body: await res.text().catch(() => ''),
  };
}

async function main() {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    console.error('ERROR: set INDEXNOW_KEY before running.');
    process.exit(1);
  }
  const hostList = process.env.HOSTS
    ? process.env.HOSTS.split(',').map((s) => s.trim()).filter(Boolean)
    : Object.keys(DEFAULT_HOSTS);

  let anyFailed = false;
  for (const host of hostList) {
    const sitemapFile = DEFAULT_HOSTS[host] ?? 'sitemap.xml';
    process.stdout.write(`▸ ${host}: fetching ${sitemapFile}… `);
    let urls;
    try {
      urls = await fetchSitemapUrls(host, sitemapFile);
      console.log(`${urls.length} URLs`);
    } catch (err) {
      console.error(`FAILED — ${err.message}`);
      anyFailed = true;
      continue;
    }
    if (urls.length === 0) {
      console.warn(`  (empty sitemap, skipping)`);
      continue;
    }
    process.stdout.write(`  pinging IndexNow… `);
    try {
      const res = await pingIndexNow({ host, key, urls });
      if (res.status >= 200 && res.status < 300) {
        console.log(`OK (${res.status})`);
      } else if (res.status === 202) {
        console.log(`ACCEPTED (202) — engine will verify the key file shortly`);
      } else if (res.status === 422) {
        console.error(`REJECTED — key/keyLocation invalid (HTTP 422). Verify INDEXNOW_KEY matches the deployed /${key}.txt file in production.`);
        anyFailed = true;
      } else {
        console.error(`HTTP ${res.status} ${res.statusText} — ${res.body.slice(0, 200)}`);
        anyFailed = true;
      }
    } catch (err) {
      console.error(`FAILED — ${err.message}`);
      anyFailed = true;
    }
  }
  process.exit(anyFailed ? 2 : 0);
}

main().catch((err) => {
  console.error('Uncaught:', err);
  process.exit(1);
});
