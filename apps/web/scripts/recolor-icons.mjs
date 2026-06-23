#!/usr/bin/env node
// Recolor the four app icons to forest green (#1B4332) while preserving
// the existing transparent background. Every pixel with alpha > 0 has its
// RGB replaced by the target color; alpha is kept verbatim so anti-aliased
// edges stay soft.
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '..', 'public');

const FOREST = { r: 0x1b, g: 0x43, b: 0x32 };
const FILES = ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon.png'];

for (const file of FILES) {
  const inputPath = resolve(publicDir, file);
  const img = sharp(inputPath).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  let changed = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      data[i] = FOREST.r;
      data[i + 1] = FOREST.g;
      data[i + 2] = FOREST.b;
      changed++;
    }
  }
  const out = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
  writeFileSync(inputPath, out);
  console.log(`${file}: recolored ${changed}/${(data.length / 4) | 0} opaque pixels`);
}
