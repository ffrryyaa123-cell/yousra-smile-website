import assert from 'node:assert/strict';
import {build} from 'esbuild';
const events=[];
let isAdmin=false, authChanged;
globalThis.__activityMock={
  adminAccount:{onSessionChange(fn){authChanged=fn;return ()=>{};},async loadProfile(){return isAdmin?{active:true}:null;}},
  supabase:{functions:{async invoke(name,{body}){assert.equal(name,'site-engagement');events.push(body);return {data:{recorded:true}};}},async rpc(){return {data:null,error:new Error('denied')};}}
};
const storage=()=>{const map=new Map();return {getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value)};};
globalThis.localStorage=storage();globalThis.sessionStorage=storage();
globalThis.document={visibilityState:'visible'};
Object.defineProperty(globalThis,'navigator',{value:{doNotTrack:'0'},configurable:true});
const bundle=await build({entryPoints:['src/services/siteActivity.ts'],bundle:true,write:false,format:'esm',platform:'node',plugins:[{name:'mock',setup(b){
 b.onResolve({filter:/^(\.\/adminAccount|firebase\/app|firebase\/auth)$/},args=>({path:args.path,namespace:'mock'}));
 b.onLoad({filter:/.*/,namespace:'mock'},({path})=>({contents:path.includes('adminAccount')?'export const {adminAccount,supabase}=globalThis.__activityMock;':path.endsWith('/app')?'export const getApps=()=>[];':'export const getAuth=()=>({currentUser:null});'}));
}}]});
const api=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
await api.recordSiteActivity('page_view','home');
await api.recordSiteActivity('affiliate_click','products','p1','amazon');
assert.equal(events.length,2);assert.equal(events[0].visitorId,events[1].visitorId);assert.equal(events[0].sessionId,events[1].sessionId);assert.notEqual(events[0].eventId,events[1].eventId);assert.equal(events[1].productId,'p1');
await api.recordSiteActivity('page_view','admin');assert.equal(events.length,2);
isAdmin=true;authChanged();await api.recordSiteActivity('page_view','home');assert.equal(events.length,2);
isAdmin=false;authChanged();navigator.doNotTrack='1';await api.recordSiteActivity('page_view','home');assert.equal(events.length,2);
await assert.rejects(api.loadActivityReport(7));
console.log('PASS: event identity/product/store; admin and DNT excluded; report failure is not zero');
