/**
 * BAMF Navi Scraper
 * -----------------
 * For each row in the CSV:
 *   1. Search the Stadt on bamf-navi.bamf.de
 *   2. Click the first autocomplete suggestion
 *   3. In the results table find the row whose "Name" column best matches
 *      the CSV "Name" column (the ABH organisation name)
 *   4. Click its detail button
 *   5. Extract the mailto: email and write it to the "Kontaktdaten" column
 *
 * Usage:
 *   cd scraper
 *   npm install
 *   npm run install-browsers
 *   node scrape.js
 *
 * Options (env vars):
 *   HEADLESS=true   run without visible browser (default: false so you can watch)
 *   START=0         row index to start from (0-based, skips header)
 *   DELAY=2000      ms to wait between rows
 */

const { chromium } = require('playwright');
const fs   = require('fs');
const path = require('path');

const CSV_PATH  = path.resolve(__dirname, '../frontend/public/data/abs_bundesland.csv');
const BAMF_URL  = 'https://bamf-navi.bamf.de/de/Themen/Behoerden/';
const HEADLESS  = process.env.HEADLESS === 'true';
const START_ROW = parseInt(process.env.START ?? '0', 10);
const DELAY_MS  = parseInt(process.env.DELAY ?? '2000', 10);

// ── CSV ───────────────────────────────────────────────────────────────────────
function readCSV(filepath) {
  let text = fs.readFileSync(filepath, 'utf8');
  // Strip UTF-8 BOM if present
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const lines = text.split(/\r?\n/);
  const headers = splitLine(lines[0]);
  const rows = lines.slice(1).map(splitLine);
  return { headers, rows };
}

function splitLine(line) {
  // Naive split — the CSV doesn't use quoted fields with embedded commas
  return line.split(',');
}

function writeCSV(filepath, headers, rows) {
  const content = '﻿' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const tmp = filepath + '.tmp';
  fs.writeFileSync(tmp, content, 'utf8');
  // Atomic replace — avoids EBUSY from the Next.js dev server holding the file open
  fs.renameSync(tmp, filepath);
}

// ── Name matching ─────────────────────────────────────────────────────────────
// Strip common German org-type prefixes so we compare the place/entity name only.
const PREFIX_RE = /^(abh|ausländerbehörde|stv|stadtverwaltung|lra|landratsamt|lhs|landeshauptstadt|bgm|bürgermeister|rp|regierungspräsidium|lhh|krv|lr|lea|rea|zab|zsv|kva|lh|stadt)\s+/gi;

function normalise(s) {
  return (s ?? '')
    .toLowerCase()
    .replace(PREFIX_RE, '')
    .replace(/[äöüß]/g, c => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' })[c] ?? c)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function scoreMatch(csvName, bamfName) {
  const a = normalise(csvName).split(' ').filter(w => w.length > 2);
  const b = new Set(normalise(bamfName).split(' ').filter(w => w.length > 2));
  return a.filter(w => b.has(w)).length;
}

function pickBestRow(csvName, bamfNames) {
  let best = -1, bestScore = 0;
  bamfNames.forEach((n, i) => {
    const s = scoreMatch(csvName, n);
    if (s > bestScore) { bestScore = s; best = i; }
  });
  // Fall back to row 0 if nothing matched — still try to get any email
  return { idx: best >= 0 ? best : 0, matched: bestScore > 0 };
}

// ── Sleep ─────────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Core scrape for one row ───────────────────────────────────────────────────
async function scrapeEmail(page, csvName, stadtName) {
  // ── 1. Navigate ──────────────────────────────────────────────────────────
  await page.goto(BAMF_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });

  // ── 2. Fill search input ─────────────────────────────────────────────────
  const input = page.locator('#mat-input-0');
  await input.waitFor({ timeout: 15_000 });
  await input.fill(stadtName);
  await sleep(1_800); // give Angular time to trigger autocomplete

  // ── 3. Click first autocomplete suggestion ───────────────────────────────
  // Angular Material renders options in a CDK overlay portal.
  // Each option is <mat-option> / <.mat-mdc-option>; the visible text is in a <span>.
  const optionSel = '.mat-mdc-autocomplete-panel .mat-mdc-option, .cdk-overlay-container .mat-mdc-option';
  try {
    await page.waitForSelector(optionSel, { timeout: 8_000 });
  } catch {
    console.log('    ↳ No autocomplete suggestions for', stadtName);
    return null;
  }

  // The user spec says: "click on the first <span> it finds" inside the option
  const firstOptionSpan = page.locator(`${optionSel} span.mat-mdc-option-text, ${optionSel} span`).first();
  await firstOptionSpan.click();
  await sleep(1_000);

  // ── 4. Click "Tabelle öffnen" to open the results list view ────────────
  try {
    await page.waitForSelector('span.maxBreite', { timeout: 5_000 });
    await page.locator('span.maxBreite').first().click();
    await sleep(2_000);
  } catch {
    console.log('    ↳ "Tabelle öffnen" button not found, continuing without it…');
  }

  // ── 5. Wait for results table ────────────────────────────────────────────
  const tableSel = 'table.behoerden';
  try {
    await page.waitForSelector(tableSel, { timeout: 12_000 });
  } catch {
    console.log('    ↳ Results table did not appear for', stadtName);
    return null;
  }

  // ── 6. Identify "Name" column index from thead ───────────────────────────
  const thTexts = await page.$$eval(`${tableSel} thead th`, ths =>
    ths.map(th => th.textContent?.trim() ?? '')
  );
  const nameColIdx = thTexts.findIndex(t => /^name$/i.test(t));
  if (nameColIdx < 0) {
    console.log('    ↳ Could not find "Name" column in thead');
    return null;
  }

  // ── 6. Collect tbody row names + locate rows ─────────────────────────────
  const tbodyRows = await page.locator(`${tableSel} tbody tr`).all();
  if (tbodyRows.length === 0) {
    console.log('    ↳ Table is empty for', stadtName);
    return null;
  }

  const bamfNames = await Promise.all(
    tbodyRows.map(row =>
      row.locator('td').nth(nameColIdx).textContent().catch(() => '')
    )
  );

  // ── 7. Pick best matching row ────────────────────────────────────────────
  const { idx, matched } = pickBestRow(csvName, bamfNames);
  if (!matched) {
    console.log(`    ↳ No name match; using row 0 ("${bamfNames[0]?.trim()}")`);
  } else {
    console.log(`    ↳ Matched row ${idx}: "${bamfNames[idx]?.trim()}"`);
  }

  // ── 8. Click detail button in that row ───────────────────────────────────
  // The button contains a <span class="mat-mdc-button-touch-target">
  const detailBtn = tbodyRows[idx].locator('button:has(.mat-mdc-button-touch-target), button').first();
  try {
    await detailBtn.click();
    await sleep(2_000);
  } catch {
    console.log('    ↳ Could not click detail button');
    return null;
  }

  // ── 9. Extract mailto email ──────────────────────────────────────────────
  // The detail panel may expand inline or navigate to a new URL — handle both.
  try {
    await page.waitForSelector('a[href^="mailto:"]', { timeout: 8_000 });
  } catch {
    console.log('    ↳ No mailto link found after clicking detail');
    return null;
  }

  const emails = await page.$$eval('a[href^="mailto:"]', links =>
    links.map(l => l.getAttribute('href')?.replace(/^mailto:/i, '').trim()).filter(Boolean)
  );

  return emails[0] ?? null;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Reading CSV:', CSV_PATH);
  const { headers, rows } = readCSV(CSV_PATH);

  // Ensure "Kontaktdaten" column exists
  let kdIdx = headers.findIndex(h => h.trim() === 'Kontaktdaten');
  if (kdIdx < 0) {
    headers.push('Kontaktdaten');
    kdIdx = headers.length - 1;
    rows.forEach(row => { while (row.length < headers.length) row.push(''); });
    console.log('Added "Kontaktdaten" column.');
  }

  const nameIdx  = headers.findIndex(h => h.trim() === 'Name');
  const stadtIdx = headers.findIndex(h => h.trim() === 'Stadt');

  if (nameIdx < 0 || stadtIdx < 0) {
    console.error('CSV must have "Name" and "Stadt" columns.');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: HEADLESS, slowMo: 50 });
  const context = await browser.newContext({ locale: 'de-DE' });
  const page    = await context.newPage();

  let processed = 0, found = 0, skipped = 0;

  for (let i = START_ROW; i < rows.length; i++) {
    const row     = rows[i];
    const csvName = row[nameIdx]?.trim();
    const stadt   = row[stadtIdx]?.trim();

    if (!csvName || !stadt) continue;

    // Skip rows that already have an email
    if (row[kdIdx]?.trim()) {
      skipped++;
      continue;
    }

    console.log(`\n[${i + 1}/${rows.length}] ${csvName}  —  searching "${stadt}"…`);

    const email = await scrapeEmail(page, csvName, stadt);
    processed++;

    if (email) {
      row[kdIdx] = email;
      found++;
      console.log(`  ✓  ${email}`);
    } else {
      console.log('  –  No email found.');
    }

    // Save progress after every row so a crash doesn't lose work
    writeCSV(CSV_PATH, headers, rows);

    await sleep(DELAY_MS);
  }

  await browser.close();
  console.log(`\n═══════════════════════════════`);
  console.log(`Done.  Found: ${found}  /  Processed: ${processed}  /  Skipped (already filled): ${skipped}`);
}

main().catch(err => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
