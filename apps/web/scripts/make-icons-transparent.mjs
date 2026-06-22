#!/usr/bin/env node
/**
 * One-shot: rewrite the brand PNGs in apps/web/public so the white canvas
 * around the house silhouette becomes transparent. Run after a brand icon
 * change, or any time the source PNG was exported without alpha.
 *
 *   node apps/web/scripts/make-icons-transparent.mjs
 *
 * Reads each file, makes near-white pixels transparent, writes back in place.
 * Idempotent — running it twice produces the same output.
 */

import sharp from 'sharp';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

const FILES = [
  'icon-192.png',
  'icon-512.png',
  'favicon.png',
  'apple-touch-icon.png',
];

// Pixel values where all three channels are above this threshold get alpha 0.
// 240 is conservative enough to catch off-white anti-aliasing while leaving
// genuinely light parts of the silhouette alone (the logo is solid dark).
const WHITE_THRESHOLD = 240;

for (const file of FILES) {
  const path = join(PUBLIC_DIR, file);
  try {
    const { data, info } = await sharp(path)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;
    if (channels !== 4) {
      console.warn(`⚠ ${file}: expected 4 channels, got ${channels} — skipping`);
      continue;
    }

    let madeTransparent = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD) {
        data[i + 3] = 0;
        madeTransparent++;
      }
    }

    await sharp(data, { raw: { width, height, channels } }).png().toFile(path);

    const totalPixels = width * height;
    const pct = ((madeTransparent / totalPixels) * 100).toFixed(1);
    console.log(`✓ ${file} — ${width}×${height} — ${madeTransparent.toLocaleString()} px (${pct}%) made transparent`);
  } catch (err) {
    console.error(`✗ ${file}:`, err.message);
    process.exitCode = 1;
  }
}
