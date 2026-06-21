import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INPUT_DIR = join(__dirname, '../onestopmedia');
const QUALITY = 80;
const SOURCE_EXTS = new Set(['.jpg', '.jpeg', '.png']);

async function collectImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectImages(fullPath)));
      continue;
    }
    if (SOURCE_EXTS.has(extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function convertImage(sourcePath) {
  const outPath = sourcePath.replace(/\.(jpe?g|png)$/i, '.webp');
  const [sourceStat, existingOut] = await Promise.all([
    stat(sourcePath),
    stat(outPath).catch(() => null),
  ]);

  if (existingOut && existingOut.mtimeMs >= sourceStat.mtimeMs) {
    return { sourcePath, outPath, skipped: true, before: sourceStat.size, after: existingOut.size };
  }

  await sharp(sourcePath)
    .rotate()
    .webp({ quality: QUALITY, effort: 4 })
    .toFile(outPath);

  const afterStat = await stat(outPath);
  return { sourcePath, outPath, skipped: false, before: sourceStat.size, after: afterStat.size };
}

async function main() {
  const images = await collectImages(INPUT_DIR);

  if (images.length === 0) {
    console.log('No images found in onestopmedia.');
    return;
  }

  console.log(`Converting ${images.length} images to WebP (quality ${QUALITY})...\n`);

  let totalBefore = 0;
  let totalAfter = 0;
  let converted = 0;
  let skipped = 0;

  for (const imagePath of images) {
    const result = await convertImage(imagePath);
    totalBefore += result.before;
    totalAfter += result.after;

    if (result.skipped) {
      skipped += 1;
      console.log(`↷ skip  ${result.outPath.split('onestopmedia/')[1]}`);
    } else {
      converted += 1;
      const saved = ((1 - result.after / result.before) * 100).toFixed(1);
      console.log(
        `✓ ${formatBytes(result.before)} → ${formatBytes(result.after)} (${saved}% smaller)  ${result.outPath.split('onestopmedia/')[1]}`
      );
    }
  }

  const totalSaved = ((1 - totalAfter / totalBefore) * 100).toFixed(1);
  console.log('\n---');
  console.log(`Converted: ${converted} | Skipped: ${skipped}`);
  console.log(`Total: ${formatBytes(totalBefore)} → ${formatBytes(totalAfter)} (${totalSaved}% smaller)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
