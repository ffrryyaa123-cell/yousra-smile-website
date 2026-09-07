import assert from 'node:assert/strict';
import { build } from 'esbuild';

const original = { title: 'Review', videoUrl: 'keep-video', productImage: 'keep-shared-image', thumbnailUrl: 'old-cover', productId: 'p1' };
let mode = 'ok';
let written;
let filters;
globalThis.__catalogTest = {
  from(table) {
    assert.equal(table, 'videos');
    let updating = false;
    const chain = {
      select() { return chain; },
      eq(key, value) { filters.push([key, value]); return chain; },
      is(key, value) { filters.push([key, value]); return chain; },
      update(value) { updating = true; written = value; return chain; },
      async single() {
        if (!updating) return { data: { data: original, updated_at: '2026-09-06T00:00:00Z' }, error: null };
        if (mode === 'denied') return { data: null, error: new Error('permission denied') };
        if (mode === 'conflict') return { data: null, error: null };
        return { data: { id: 'v1' }, error: null };
      }
    };
    return chain;
  }
};
const bundle = await build({
  entryPoints: ['src/services/supabaseCatalog.ts'], bundle: true, write: false, platform: 'node', format: 'esm',
  plugins: [{ name: 'mock-provider', setup(builder) {
    builder.onResolve({ filter: /^\.\/(adminAccount|videoAssets)$/ }, args => ({ path: args.path, namespace: 'test' }));
    builder.onLoad({ filter: /.*/, namespace: 'test' }, args => ({ contents: args.path.endsWith('adminAccount')
      ? 'export const supabase = globalThis.__catalogTest;'
      : 'export function deleteProductVideo(){throw new Error("Storage must not be deleted")} export function uploadLocalVideo(){}', loader: 'js' }));
  } }]
});
const { catalogDatabase } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
filters = [];
await catalogDatabase.removeVideoThumbnail('v1');
assert.equal(written.data.thumbnailUrl, '');
assert.equal(written.data.hideThumbnail, true);
assert.equal(written.data.videoUrl, original.videoUrl);
assert.equal(written.data.productImage, original.productImage);
assert.equal(original.thumbnailUrl, 'old-cover');
assert.ok(filters.some(([key, value]) => key === 'updated_at' && value === '2026-09-06T00:00:00Z'));
console.log('PASS: cover detached; video/shared image preserved; concurrency guard applied');
for (mode of ['denied', 'conflict']) {
  filters = [];
  await assert.rejects(catalogDatabase.removeVideoThumbnail('v1'));
  console.log(`PASS: ${mode} does not report successful deletion`);
}
mode = 'ok';
filters = [];
const replacement = {videoUrl:'https://example.com/new.mp4',platform:'local',duration:'00:08'};
const savedReview = await catalogDatabase.replaceReviewMedia('v1','p1',replacement);
assert.equal(savedReview.id,'v1');
assert.equal(written.data.videoUrl,replacement.videoUrl);
assert.equal(written.data.thumbnailUrl,original.thumbnailUrl);
assert.equal(written.data.title,original.title);
assert.equal(written.data.productId,original.productId);
assert.ok(filters.some(([key,value]) => key==='id' && value==='v1'));
assert.ok(filters.some(([key,value]) => key==='updated_at' && value==='2026-09-06T00:00:00Z'));
for (mode of ['denied','conflict']) {
  filters=[];
  await assert.rejects(catalogDatabase.replaceReviewMedia('v1','p1',replacement));
}
mode='ok';
await assert.rejects(catalogDatabase.replaceReviewMedia('v1','wrong-product',replacement));
await catalogDatabase.replaceReviewMedia('v1','p1',{...replacement,platform:'youtube',videoUrl:'https://youtu.be/abcdefghijk'});
assert.equal(written.data.embedId,'abcdefghijk');
console.log('PASS: replacement updates exact existing identity; preserves cover/title; rejects conflict, denied access and wrong product; extracts YouTube ID');
delete globalThis.__catalogTest;
