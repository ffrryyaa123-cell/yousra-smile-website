import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertReviewOnlySafety,
  createWorkflow,
  transition
} from './workflow.js';

let workflow = createWorkflow('safety-validation');
for (const status of [
  'facts_audited',
  'affiliate_checked',
  'content_ready',
  'media_plan_ready',
  'media_qa_complete',
  'waiting_owner_review'
] as const) {
  workflow = transition(workflow, status);
}
assertReviewOnlySafety(workflow);

let transitionBlocked = false;
try {
  transition(workflow, 'candidate');
} catch {
  transitionBlocked = true;
}
if (!transitionBlocked) {
  throw new Error('Terminal owner-review gate allowed a transition.');
}

const repositoryRoot = resolve(process.cwd());
const filesToScan = [
  '.github/workflows/yousra-agent-pilot.yml',
  '.env.example',
  'server.ts',
  'src/components/AgentAutomationHub.tsx',
  'src/services/productVideoService.ts'
];

const bannedPatterns = [
  /ys_agent_secret_key_2026/,
  /x-agent-key/i,
  /defaultDevKey/,
  /\b(?:sk|sk-proj)-[A-Za-z0-9_-]{12,}\b/,
  /publicationStatus:\s*['"]PUBLISHED['"]/,
  /catalogWriteStatus:\s*['"](?:WRITTEN|IMPORTED)['"]/
];

for (const file of filesToScan) {
  const content = await readFile(resolve(repositoryRoot, file), 'utf8');
  for (const pattern of bannedPatterns) {
    if (pattern.test(content)) {
      throw new Error(`Unsafe pattern ${pattern} found in ${file}`);
    }
  }
}

const workflowYaml = await readFile(
  resolve(repositoryRoot, '.github/workflows/yousra-agent-pilot.yml'),
  'utf8'
);
for (const required of [
  'workflow_dispatch:',
  'permissions:',
  'contents: read',
  'OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}',
  'Upload owner review artifacts'
]) {
  if (!workflowYaml.includes(required)) {
    throw new Error(`Agent workflow is missing: ${required}`);
  }
}
for (const disallowed of [
  'git push',
  'firebase deploy',
  'gh-pages',
  'contents: write',
  'pull-requests: write',
  'deploy-pages'
]) {
  if (workflowYaml.includes(disallowed)) {
    throw new Error(`Agent workflow contains a publication capability: ${disallowed}`);
  }
}

console.log(JSON.stringify({
  workflowStatus: workflow.status,
  ownerReviewGate: 'BLOCKING_AS_DESIGNED',
  publicationStatus: workflow.publicationStatus,
  catalogWriteStatus: workflow.catalogWriteStatus,
  outboundConnectors: workflow.outboundConnectors,
  sharedBrowserSecrets: 'REJECTED'
}, null, 2));
