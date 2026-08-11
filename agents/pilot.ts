import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { prepareProductPackage } from './yousraAgent.js';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required. Keep it in environment secrets; never commit it.');
}

const instantPotPilotFacts = `
Product: Instant Pot 4QT Vortex Plus 6-in-1 Mini Air Fryer
Brand: Instant Pot
Capacity: 4 quarts
Functions stated by the supplied product listing: air fry/crisp, broil, roast, dehydrate, bake, reheat
Other supplied fact: 100+ in-app recipes
Finish: stainless steel
Pilot purpose: prepare content for owner review only. Do not publish.
Affiliate URL: intentionally omitted from the pilot fixture; it must be supplied/verified before publication.
`;

const output = await prepareProductPackage(instantPotPilotFacts);
const reviewOutput = {
  pilot: 'instant-pot',
  generatedAt: new Date().toISOString(),
  publicationStatus: 'NOT_PUBLISHED',
  approvalStatus: output.approvalStatus,
  verifiedProductFacts: instantPotPilotFacts.trim(),
  content: output,
};

const csvValue = (value: unknown) => {
  const text = Array.isArray(value) ? value.join(' ') : String(value);
  return `"${text.replaceAll('"', '""')}"`;
};

const csvFields = Object.keys(output) as Array<keyof typeof output>;
const csv = [
  csvFields.map(csvValue).join(','),
  csvFields.map((field) => csvValue(output[field])).join(','),
].join('\n');

const outputDirectory = resolve(process.cwd(), 'pilot-results');
const jsonPath = resolve(outputDirectory, 'instant-pot-pilot.json');
const csvPath = resolve(outputDirectory, 'instant-pot-pilot.csv');

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(jsonPath, `${JSON.stringify(reviewOutput, null, 2)}\n`, 'utf8'),
  writeFile(csvPath, `${csv}\n`, 'utf8'),
]);

console.log(JSON.stringify({
  status: 'completed',
  publicationStatus: reviewOutput.publicationStatus,
  approvalStatus: reviewOutput.approvalStatus,
  outputFiles: [relative(process.cwd(), jsonPath), relative(process.cwd(), csvPath)],
}, null, 2));

