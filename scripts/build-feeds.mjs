#!/usr/bin/env node
// Generates the two Activate trip feeds (XML, one language each) plus a JSON debug
// mirror, from trips.default.js. Activate reads XML only (RSS 2.0 / ATOM 1.0 / GMC) and
// one language per feed — see travler_claude_build_prompt_v3.md, "Trip feed" section.
//
// Usage: node scripts/build-feeds.mjs [baseUrl]
//   baseUrl defaults to https://spotlerik.github.io/travler — pass your own deploy URL
//   to regenerate with different absolute links (Activate requires absolute link/image_link).
//
// Re-run this whenever trips.default.js changes; there is no admin UI wired to it (see README).
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const baseUrl = (process.argv[2] || "https://spotlerik.github.io/travler").replace(/\/+$/, "");

// Load window.TRIPS_DEFAULT without a browser — trips.default.js only assigns to `window`.
const sandbox = { window: {} };
new Function("window", readFileSync(join(root, "trips.default.js"), "utf8") + "\nreturn window;")(sandbox.window);
const TRIPS = sandbox.window.TRIPS_DEFAULT;

// Fixed reference date so the feed is reproducible across runs (matches the session's
// "today"). Regenerate with a fresh checkout date by editing this line when it goes stale.
const TODAY = new Date("2026-07-02T00:00:00Z");

function effectivePrice(p) { return p.sale_price_eur != null ? p.sale_price_eur : p.price_eur; }
function slugFor(s) { return String(s || "").toLowerCase().replace(/\s+/g, "-"); }
function iso(d) { return d.toISOString().slice(0, 10); }

// date_availability: a spread of checkin dates covering the next ~180 days (Activate
// matches these against a visitor's searched checkin/checkout to build "Recommended for
// Travel" sets). Price carries a small deterministic wobble so the feed doesn't look like
// a flat repeat of the list price — still fully derived from the catalogue, never invented.
function dateAvailability(p) {
  const base = effectivePrice(p);
  const out = [];
  for (let daysOut = 7; daysOut <= 180; daysOut += 14) {
    const checkin = new Date(TODAY.getTime() + daysOut * 86400000);
    const wobble = Math.round(base * 0.04 * Math.sin(daysOut / 21));
    out.push({ checkin: iso(checkin), nights: p.nights, price: base + wobble });
  }
  return out;
}

function buildRows(lang) {
  return TRIPS.map((p) => ({
    id: p.sku,
    title: lang === "nl-NL" ? p.name_nl : p.name_en,
    description: lang === "nl-NL" ? p.short_desc_nl : p.short_desc_en,
    link: `${baseUrl}/#/product/${p.sku}`,
    price: p.price_eur,
    sale_price: p.sale_price_eur,
    currency: "EUR",
    stock: p.stock,
    image_link: `${baseUrl}/images/${p.image}`,
    image_link_lifestyle: `${baseUrl}/images/${p.image_lifestyle}`,
    brand: p.hotel,
    language: lang,
    category_ids: [slugFor(p.category)].concat(p.lastMinute ? ["last-minute"] : []),
    category: p.category,
    date_availability: dateAvailability(p)
  }));
}

function xmlEsc(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function buildFeedXml(lang) {
  const rows = buildRows(lang);
  const label = lang === "nl-NL" ? "Dutch" : "English";
  const link = baseUrl + "/";
  let out = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n' +
    "  <channel>\n" +
    `    <title>${xmlEsc("Travler trip feed (" + lang + ")")}</title>\n` +
    `    <link>${xmlEsc(link)}</link>\n` +
    `    <description>${xmlEsc("Travler demo trip feed — " + label)}</description>\n`;
  rows.forEach((r) => {
    const avail = r.stock > 0 ? "in stock" : "out of stock";
    const e = [];
    e.push("    <item>");
    e.push(`      <id>${xmlEsc(r.id)}</id>`);
    e.push(`      <title>${xmlEsc(r.title)}</title>`);
    e.push(`      <link>${xmlEsc(r.link)}</link>`);
    e.push(`      <description>${xmlEsc(r.description)}</description>`);
    e.push(`      <language>${xmlEsc(r.language)}</language>`);
    e.push(`      <price>${Number(r.price).toFixed(2)} ${xmlEsc(r.currency)}</price>`);
    if (r.sale_price != null) e.push(`      <sale_price>${Number(r.sale_price).toFixed(2)} ${xmlEsc(r.currency)}</sale_price>`);
    e.push(`      <availability>${avail}</availability>`);
    e.push(`      <inventory>${parseInt(r.stock, 10)}</inventory>`);
    e.push(`      <image_link>${xmlEsc(r.image_link)}</image_link>`);
    e.push("      <image_links>");
    e.push(`        <image_link>${xmlEsc(r.image_link)}</image_link>`);
    e.push(`        <image_link>${xmlEsc(r.image_link_lifestyle)}</image_link>`);
    e.push("      </image_links>");
    e.push(`      <brand>${xmlEsc(r.brand)}</brand>`);
    e.push("      <category_ids>");
    r.category_ids.forEach((c) => e.push(`        <category_id>${xmlEsc(c)}</category_id>`));
    e.push("      </category_ids>");
    e.push(`      <category>${xmlEsc(r.category)}</category>`);
    e.push("      <date_availability>");
    r.date_availability.forEach((a) => {
      e.push("        <availability>");
      e.push(`          <checkin>${xmlEsc(a.checkin)}</checkin>`);
      e.push(`          <nights>${a.nights}</nights>`);
      e.push(`          <price>${Number(a.price).toFixed(2)}</price>`);
      e.push("        </availability>");
    });
    e.push("      </date_availability>");
    e.push("    </item>");
    out += e.join("\n") + "\n";
  });
  out += "  </channel>\n</rss>\n";
  return out;
}

function buildFeedJson() {
  return JSON.stringify({ note: "Debug mirror only — Activate's Source must point at the XML feeds, not this file.", "nl-NL": buildRows("nl-NL"), "en-GB": buildRows("en-GB") }, null, 2);
}

writeFileSync(join(root, "activate-feed-nl.xml"), buildFeedXml("nl-NL"));
writeFileSync(join(root, "activate-feed-en.xml"), buildFeedXml("en-GB"));
writeFileSync(join(root, "activate-feed.json"), buildFeedJson());
console.log(`Wrote activate-feed-nl.xml, activate-feed-en.xml, activate-feed.json for ${TRIPS.length} trips (baseUrl=${baseUrl}).`);
