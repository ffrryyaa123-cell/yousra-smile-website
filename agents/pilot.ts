import 'dotenv/config';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';
import { ProductReviewInputSchema, ReviewPackageSchema } from './contracts.js';
import { prepareOwnerReviewPackage } from './team.js';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required in the server or GitHub Actions secret store.');
}

const argumentIndex = process.argv.indexOf('--input');
const requestedPath =
  process.env.AGENT_INPUT_PATH ||
  (argumentIndex >= 0 ? process.argv[argumentIndex + 1] : undefined) ||
  'agents/sample-product.json';

const repositoryRoot = resolve(process.cwd());
const agentsRoot = resolve(repositoryRoot, 'agents');
const inputPath = resolve(repositoryRoot, requestedPath);

if (
  !(inputPath === agentsRoot || inputPath.startsWith(`${agentsRoot}${sep}`)) ||
  extname(inputPath).toLowerCase() !== '.json'
) {
  throw new Error('Input must be a JSON file inside the agents directory.');
}

const rawInput = JSON.parse(await readFile(inputPath, 'utf8'));
const input = ProductReviewInputSchema.parse(rawInput);
const reviewPackage = ReviewPackageSchema.parse(
  await prepareOwnerReviewPackage(input)
);

if (
  reviewPackage.publicationStatus !== 'NOT_PUBLISHED' ||
  reviewPackage.catalogWriteStatus !== 'NOT_ATTEMPTED'
) {
  throw new Error('Review-only safety assertion failed.');
}

const artifactDirectory = resolve(repositoryRoot, 'artifacts', 'agent-review');
await mkdir(artifactDirectory, { recursive: true });

const safeId = input.productId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80);
const jsonPath = resolve(artifactDirectory, `${safeId}.review.json`);
const csvPath = resolve(artifactDirectory, `${safeId}.review.csv`);

const csvCell = (value: unknown) =>
  `"${String(value ?? '').replaceAll('"', '""')}"`;
const csv = [
  [
    'productId',
    'productName',
    'sourceUrl',
    'affiliateUrl',
    'workflowStatus',
    'publicationStatus',
    'catalogWriteStatus'
  ].map(csvCell).join(','),
  [
    input.productId,
    input.productName,
    input.sourceUrl,
    input.affiliateUrl || '',
    reviewPackage.status,
    reviewPackage.publicationStatus,
    reviewPackage.catalogWriteStatus
  ].map(csvCell).join(',')
].join('\n');

await Promise.all([
  writeFile(jsonPath, `${JSON.stringify(reviewPackage, null, 2)}\n`, 'utf8'),
  writeFile(csvPath, `${csv}\n`, 'utf8')
]);

console.log(JSON.stringify({
  status: reviewPackage.status,
  publicationStatus: reviewPackage.publicationStatus,
  catalogWriteStatus: reviewPackage.catalogWriteStatus,
  input: relative(repositoryRoot, inputPath),
  artifacts: [
    relative(repositoryRoot, jsonPath),
    relative(repositoryRoot, csvPath)
  ]
}, null, 2));
