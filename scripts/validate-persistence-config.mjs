import { readFile } from 'node:fs/promises';

const EXPECTED_DATABASE = 'ai-studio-yousrasmile-a5551c6d-57e2-46b9-bc5e-1d53b9d471f1';

const fail = (message) => {
  throw new Error(`Persistence configuration check failed: ${message}`);
};

const firebaseConfig = JSON.parse(await readFile('firebase.json', 'utf8'));
if (!Array.isArray(firebaseConfig.firestore)) {
  fail('firebase.json must target the named Firestore database explicitly.');
}

const databaseConfig = firebaseConfig.firestore.find(
  entry => entry.database === EXPECTED_DATABASE
);
if (!databaseConfig || databaseConfig.rules !== 'firestore.rules') {
  fail(`firestore.rules is not mapped to ${EXPECTED_DATABASE}.`);
}

const firestoreRules = await readFile('firestore.rules', 'utf8');
if (/allow\s+write\s*:\s*if\s+true/.test(firestoreRules)) {
  fail('Firestore contains a public write rule.');
}
if (!firestoreRules.includes('email_verified')) {
  fail('Owner writes must require a verified Google email.');
}
if (!firestoreRules.includes('catalog_delete_archive')) {
  fail('Catalog deletion archive rules are missing.');
}
if (!firestoreRules.includes('allow update, delete: if false')) {
  fail('Catalog deletion archive must be append-only from the website client.');
}

const catalogDatabase = await readFile('src/services/catalogDatabase.ts', 'utf8');
if (!catalogDatabase.includes("await archiveDocument('products', productId)")) {
  fail('Product deletion must archive the product before deletion.');
}
if (!catalogDatabase.includes("await archiveDocument('videos', videoId)")) {
  fail('Video deletion must archive the video before deletion.');
}
if (!catalogDatabase.includes('If archiving fails, deletion does not proceed')) {
  fail('Destructive catalog actions are missing the archive-first safety invariant.');
}

const storageRules = await readFile('storage.rules', 'utf8');
if (!storageRules.includes("contentType.matches('video/.*')")) {
  fail('video uploads are missing a MIME-type restriction.');
}
if (!storageRules.includes("contentType.matches('image/.*')")) {
  fail('image uploads are missing a MIME-type restriction.');
}

console.log(JSON.stringify({
  firestoreDatabase: EXPECTED_DATABASE,
  firestoreRules: 'OWNER_OR_STAFF_WRITES_ONLY',
  catalogDeletion: 'ARCHIVE_FIRST_AND_APPEND_ONLY',
  storageUploads: 'OWNER_OR_STAFF_WITH_SIZE_AND_MIME_LIMITS',
  productPublishing: 'NOT_PERFORMED_BY_THIS_CHECK'
}, null, 2));
