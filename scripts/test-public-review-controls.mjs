import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

// Render the actual components with controlled application state. No accounts,
// network requests, database writes, or media generation are involved.
const result = await build({
  stdin: { contents: "import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server'; import {VideosPage} from './src/pages/VideosPage'; import {VideoModal} from './src/components/VideoModal'; export const render = () => [renderToStaticMarkup(React.createElement(VideosPage)), renderToStaticMarkup(React.createElement(VideoModal,{video:globalThis.reviewFixture,onClose:()=>{}}))];",
    resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
  plugins: [{name:'isolated-app-state', setup(b) {
    b.onResolve({filter:/context\/AppContext$/}, () => ({path:'app',namespace:'fixture'}));
    b.onResolve({filter:/ReviewOpenCount$/}, () => ({path:'counter',namespace:'fixture'}));
    b.onResolve({filter:/SocialVideoExportModal$/}, () => ({path:'export',namespace:'fixture'}));
    b.onLoad({filter:/.*/,namespace:'fixture'}, ({path}) => ({ contents:
      path === 'app' ? 'export const useApp=()=>globalThis.reviewAppFixture;' :
      path === 'counter' ? 'export const ReviewOpenCount=()=>null;' :
      'export const SocialVideoExportModal=()=>null;' }));
  }}],
});
const video = {id:'review-test',title:'Review',productId:'product-test',productTitle:'Product',thumbnailUrl:'',videoUrl:'https://example.com/video.mp4',platform:'local',duration:'00:08'};
const product = {id:'product-test',name:'Product',title:'Product',discountPrice:10,price:10,images:[],imageUrl:'',affiliateUrl:'https://example.com'};
globalThis.reviewFixture = video;
globalThis.reviewAppFixture = {activePage:'videos',videos:[video],products:[product],visibleProducts:[product],formatPrice:String,getAffiliateUrl:()=> 'https://example.com',language:'ar'};
const module = {exports:{}};
new Function('require','module','exports',result.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
for (const page of ['videos','home']) {
  globalThis.reviewAppFixture.activePage = page;
  const [gallery,modal] = module.exports.render();
  for (const html of [gallery,modal]) {
    for (const forbidden of ['استبدال من جهازي','استيراد رابط','رفع فيديو من جهازي','حذف المراجعة','أدوات المالكة','تصدير']) assert.ok(!html.includes(forbidden), page+': '+forbidden);
  }
  assert.ok(modal.includes('<video'));
  assert.ok(modal.includes('تفاصيل المنتج'));
}
globalThis.reviewAppFixture.activePage = 'admin';
const [,adminModal] = module.exports.render();
assert.ok(adminModal.includes('استبدال من جهازي'));
assert.ok(adminModal.includes('تصدير'));
console.log('PASS: public gallery/modal hide management; dashboard player retains controls.');
