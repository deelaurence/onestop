import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(__dirname, '../src/assets');
const MAX_WIDTH = 2400;
const QUALITY = 80;
const SIZE_THRESHOLD = 1_500_000; // 1.5 MB

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function optimizeFile(filePath) {
  const before = (await stat(filePath)).size;
  if (before < SIZE_THRESHOLD) return null;

  const image = sharp(filePath);
  const meta = await image.metadata();
  if (!meta.width || meta.width <= MAX_WIDTH) {
    await image.webp({ quality: QUALITY, effort: 4 }).toFile(`${filePath}.tmp`);
  } else {
    await image
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 4 })
      .toFile(`${filePath}.tmp`);
  }

  const { rename, unlink } = await import('fs/promises');
  await unlink(filePath);
  await rename(`${filePath}.tmp`, filePath);

  const after = (await stat(filePath)).size;
  return { filePath, before, after };
}

async function main() {
  const files = await readdir(ASSETS);
  let totalBefore = 0;
  let totalAfter = 0;
  let count = 0;

  for (const file of files) {
    if (!file.endsWith('.webp')) continue;
    const result = await optimizeFile(join(ASSETS, file));
    if (!result) continue;
    count += 1;
    totalBefore += result.before;
    totalAfter += result.after;
    const name = file;
    console.log(
      `✓ ${name}: ${formatBytes(result.before)} → ${formatBytes(result.after)}`
    );
  }

  if (count === 0) {
    console.log('No files over 1.5 MB needed optimization.');
    return;
  }

  console.log(
    `\nOptimized ${count} files: ${formatBytes(totalBefore)} → ${formatBytes(totalAfter)}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
