import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const distAssetsDir = path.resolve(process.cwd(), 'dist', 'assets');

const parseBudget = (name, fallback) => {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value) || value <= 0) {
    throw new Error(`Invalid ${name}: ${raw}`);
  }
  return value;
};

const budgets = {
  index: parseBudget('BUNDLE_BUDGET_INDEX_BYTES', 620_000),
  markdown: parseBudget('BUNDLE_BUDGET_MARKDOWN_BYTES', 1_150_000),
};

const formatBytes = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;

const files = readdirSync(distAssetsDir)
  .filter((name) => name.endsWith('.js'))
  .map((name) => ({
    name,
    bytes: statSync(path.join(distAssetsDir, name)).size,
  }));

const findChunk = (matcher) => files.find((file) => matcher(file.name));

const indexChunk = findChunk((name) => /^index-[a-z0-9_-]+\.js$/i.test(name));
const markdownChunk = findChunk((name) => /^MarkdownArea-[a-z0-9_-]+\.js$/i.test(name));

if (!indexChunk) {
  throw new Error('Could not find index chunk in dist/assets.');
}

if (!markdownChunk) {
  throw new Error('Could not find MarkdownArea chunk in dist/assets.');
}

const failures = [];

if (indexChunk.bytes > budgets.index) {
  failures.push(
    `index chunk ${indexChunk.name} is ${formatBytes(indexChunk.bytes)} (budget ${formatBytes(
      budgets.index,
    )})`,
  );
}

if (markdownChunk.bytes > budgets.markdown) {
  failures.push(
    `MarkdownArea chunk ${markdownChunk.name} is ${formatBytes(
      markdownChunk.bytes,
    )} (budget ${formatBytes(budgets.markdown)})`,
  );
}

if (failures.length > 0) {
  console.error('Bundle budget check failed:');
  failures.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log(
  `Bundle budget check passed: ${indexChunk.name}=${formatBytes(
    indexChunk.bytes,
  )}, ${markdownChunk.name}=${formatBytes(markdownChunk.bytes)}`,
);
