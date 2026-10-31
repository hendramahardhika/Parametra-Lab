// Execute against an isolated, in-memory IndexedDB. Never reads the user's browser data.
// Setup: npm install --prefix .sites-runtime/storage-test --no-package-lock --ignore-scripts fake-indexeddb@6.2.6
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
const requireTest = createRequire(new URL('../.sites-runtime/storage-test/package.json', import.meta.url));
const { indexedDB } = requireTest('fake-indexeddb');
const values = new Map();
globalThis.localStorage = { getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,String(v)), removeItem: k => values.delete(k) };
globalThis.location = { pathname: '/isolated-student-test/index.html' };
globalThis.indexedDB = indexedDB;
globalThis.window = { indexedDB, location, dispatchEvent() {} };

const result = await build({ stdin: { contents: "export * from './local/storage'; export * from './lib/student-identity'; export { lessons, progressFor } from './lib/curriculum';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const source = result.outputFiles[0].text;
const load = extra => import('data:text/javascript;base64,' + Buffer.from(source + '\n//' + extra).toString('base64'));
const api = await load('first-load');
const { studentAccountId: id, studentIdentityKey: identityKey, lessons, progressFor } = api;
const key = identityKey(location.pathname);
const A = { fullName: 'Siswa A', className: 'XI TP 1', attendance: 1 };
const B = { fullName: 'Siswa B', className: 'XI TP 1', attendance: 2 };
// This suite tests partitioning after successful PIN verification. PIN verification has its own suite.
function login(who) { if (who) localStorage.setItem(key, JSON.stringify({...who,pinSessionVersion:1})); else localStorage.removeItem(key); }
async function data() { const response = await api.localFetch('/api/study'); assert.equal(response.status,200); return response.json(); }
async function send(payload, expected) {
    const who = JSON.parse(localStorage.getItem(key) || 'null');
    return api.localFetch('/api/study', { method:'POST', headers:{ 'X-Parametra-Student':expected ?? (who ? id(who) : '') }, body:JSON.stringify(payload) });
}
async function ok(payload) { const response = await send(payload); assert.equal(response.status,200,JSON.stringify(await response.json())); }
const request = r => new Promise((resolve,reject) => { r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error); });
let hash=2166136261;
for(const c of location.pathname.toLowerCase()) hash=Math.imul(hash^c.charCodeAt(0),16777619);
const opening=indexedDB.open('parametra-lab-lokal-'+(hash>>>0).toString(16),1);
opening.onupgradeneeded=()=>{opening.result.createObjectStore('state');opening.result.createObjectStore('files',{keyPath:'id'});};
const db=await request(opening);
const legacy={version:1,profile:{id:'pengguna-lokal',name:'Nama Lama',class_name:'XI Teknik Pemesinan'},events:[{id:'legacy-event',uid:'pengguna-lokal',kind:'checkpoint',module:8,payload:'{"step":0,"checked":true}',created:'2026-01-01'}],submissions:[],settings:{}};
await request(db.transaction('state','readwrite').objectStore('state').put(legacy,'main'));
assert.equal(await api.legacyDataAvailable(),true);
const initialRoster=await api.readLocalTeacherProgress();
assert.equal(initialRoster.length,48,'Both 24-name class lists appear before any pupil logs in');
assert.equal(new Set(initialRoster.map(s=>s.id)).size,48,'Identical names/numbers in different classes must have different IDs');
for(const className of ['XI TP 1','XI TP 2']) {
    const classList=initialRoster.filter(s=>s.className===className);
    assert.equal(classList.length,24);
    assert.deepEqual(classList.map(s=>s.attendance),Array.from({length:24},(_,i)=>i+1));
    assert.equal(classList[0].name,'AJI BAYU SAPUTRA');
    assert.equal(classList[3].name,'ANANDA OCTAVIAN');
    assert.equal(classList[23].name,'ZIDAN ZAKI HAMIZAN');
}
assert.ok(initialRoster.every(s=>s.lastActivity===null&&s.modules.every(m=>m.percent===0&&m.quizScore===null)));
assert.equal((await request(db.transaction('state','readonly').objectStore('state').getAll())).length,1,'Displaying roster must not create fictitious activity records');
assert.equal(values.size,0,'Displaying roster must not create PINs or sign anyone in');

// Signed-out visitors can read materials but cannot save to a shared fallback account.
login(null);
assert.equal((await data()).user,null);
assert.equal((await send({kind:'checkpoint',module:8,step:0,checked:true})).status,400);

login(A);
assert.equal((await data()).events.length,0,'Legacy activity must not be claimed by first pupil');
for(const lesson of lessons) for(let step=0;step<lesson.steps.length;step++) await ok({kind:'checkpoint',module:lesson.id,step:lesson.id===10?step+2:step,checked:true});
await ok({kind:'quiz',module:lessons[0].id,answers:lessons[0].quiz.map(q=>q.answer)});
await ok({kind:'reflection',module:lessons[0].id,note:'Refleksi khusus siswa A.'});
await ok({kind:'hint',module:lessons[0].id,step:0,level:1});
await ok({action:'settings',drive:'',cycle:'Siklus I'});
const form=new FormData();form.set('module',String(lessons[0].id));form.set('reflection','Karya khusus siswa A.');form.set('file',new File(['private CAD A'],'latihan-A.f3d'));
const upload=await api.localFetch('/api/portfolio',{method:'POST',headers:{'X-Parametra-Student':id(A)},body:form});
assert.equal(upload.status,200);const work=(await upload.json()).id;
const aData=await data();
assert.ok(lessons.every(m=>progressFor(aData.events,m.id)===100));
assert.ok(aData.events.every(e=>e.uid===id(A)));
assert.equal(aData.submissions.length,1);
assert.equal(await (await api.readLocalWork(work)).blob.text(),'private CAD A');

login(null);assert.equal((await data()).events.length,0);await assert.rejects(()=>api.readLocalWork(work));
login(B);
const cleanB=await data();assert.equal(cleanB.events.length,0);assert.equal(cleanB.submissions.length,0);assert.deepEqual(cleanB.settings,{});
await assert.rejects(()=>api.readLocalWork(work),/bukan milik/);
assert.equal((await send({action:'review',id:work,score:90,feedback:'Tidak boleh mengubah A'})).status,400);
for(const lesson of lessons) for(let step=0;step<Math.floor(lesson.steps.length*0.6);step++) await ok({kind:'checkpoint',module:lesson.id,step:lesson.id===10?step+2:step,checked:true});
const bData=await data();
assert.ok(bData.events.every(e=>e.uid===id(B)));
assert.ok(lessons.every(m=>progressFor(bData.events,m.id)<100));
for (const m of lessons) assert.equal(progressFor(bData.events,m.id), Math.round(Math.floor(m.steps.length*0.6)/m.steps.length*100));
assert.equal((await send({kind:'reflection',module:8,note:'Stale form from A'},id(A))).status,400);
assert.equal((await data()).events.length,bData.events.length);

// Same number in a different class is another profile; name edits are not another profile.
login({...A,className:'XI TP 2'});assert.equal((await data()).events.length,0);
login({...A,fullName:'Nama A diperbaiki'});
assert.equal((await data()).events.length,aData.events.length);
assert.equal((await data()).profiles[0].name,'Nama A diperbaiki');
assert.equal((await data()).profiles[0].attendance,1);
assert.equal((await data()).submissions.length,1);
assert.equal((await data()).settings.cycle,'Siklus I');

// A request started under A must not save into B after a mid-flight switch.
login(A);
const pending=send({kind:'reflection',module:8,note:'Jangan terbawa ke B.'});
login(B);assert.equal((await pending).status,400);
assert.equal((await data()).events.length,bData.events.length);
const parallel=await Promise.all([0,1,2].map(n=>send({kind:'reflection',module:8,note:'Catatan siswa B nomor '+n})));
assert.ok(parallel.every(r=>r.status===200));
assert.equal((await data()).events.length,bData.events.length+3);

// Fresh module/DB connection simulates reloading the app with its saved identity.
login(A);const reloaded=await load('simulated-reload');
const restored=await (await reloaded.localFetch('/api/study')).json();
assert.ok(lessons.every(m=>progressFor(restored.events,m.id)===100));
assert.deepEqual(await request(db.transaction('state','readonly').objectStore('state').get('main')),legacy);
// Teacher overview aggregates every registered pupil without switching the current student.
const C={fullName:'Siswa C belum mulai',className:'XI TP 2',attendance:25};
login(C);await data();
login(null);
const sessionBefore=localStorage.getItem(key);
const report=await api.readLocalTeacherProgress();
assert.equal(localStorage.getItem(key),sessionBefore);
assert.equal(report.length,49,'48 preloaded names merge with existing students plus extra pupil 25; no duplicates or legacy');
assert.deepEqual(report.map(s=>[s.className,s.attendance]),[...Array.from({length:24},(_,i)=>['XI TP 1',i+1]),...Array.from({length:25},(_,i)=>['XI TP 2',i+1])]);
assert.equal(report.find(s=>s.className==='XI TP 1'&&s.attendance===1).name,'AJI BAYU SAPUTRA');
assert.ok(report.filter(s=>s.className==='XI TP 1'&&s.attendance>2).every(s=>s.lastActivity===null&&s.modules.every(m=>m.percent===0)));
assert.equal(report.find(s=>s.className==='XI TP 2'&&s.attendance===1).name,'AJI BAYU SAPUTRA');
assert.equal(report.find(s=>s.className==='XI TP 2'&&s.attendance===4).name,'ANANDA OCTAVIAN');
assert.ok(report.filter(s=>s.className==='XI TP 2').every(s=>s.modules.every(m=>m.percent===0)));
const teacherA=report.find(s=>s.id===id(A)),teacherB=report.find(s=>s.id===id(B)),teacherC=report.find(s=>s.id===id(C));
assert.equal(teacherA.completedModules,4);
assert.ok(teacherA.modules.every(m=>m.percent===100&&m.steps.every(s=>s.checked)));
assert.equal(teacherA.modules[0].quizScore,100);
assert.equal(teacherA.modules[0].quizAttempts,1);
assert.equal(teacherA.modules[0].works,1);
for(const m of teacherB.modules) assert.equal(m.percent,progressFor(bData.events,m.id));
assert.ok(teacherC.modules.every(m=>m.percent===0&&m.quizScore===null));
assert.equal(teacherC.lastActivity,null);
assert.ok(!JSON.stringify(report).includes('Refleksi khusus siswa A.'));
assert.ok(!JSON.stringify(report).includes('private CAD A'));
assert.ok(!JSON.stringify(report).includes('legacy-event'));
login(A);await ok({kind:'checkpoint',module:lessons[0].id,step:0,checked:false});
const updatedA=(await api.readLocalTeacherProgress()).find(s=>s.id===id(A));
assert.equal(updatedA.modules[0].steps[0].checked,false);
assert.equal(updatedA.modules[0].checked,lessons[0].steps.length-1);
assert.equal(updatedA.completedModules,3);
login({...C,fullName:'Nama C diperbaiki'});await data();
assert.equal((await api.readLocalTeacherProgress()).find(s=>s.id===id(C)).name,'Nama C diperbaiki');
login({...A,className:'XI TP 2'});await ok({kind:'checkpoint',module:lessons[0].id,step:0,checked:true});
const merged=await api.readLocalTeacherProgress();
assert.equal(merged.filter(s=>s.className==='XI TP 2'&&s.attendance===1).length,1);
const actualRosterStudent=merged.find(s=>s.className==='XI TP 2'&&s.attendance===1);
assert.equal(actualRosterStudent.name,'AJI BAYU SAPUTRA');
assert.equal(actualRosterStudent.modules[0].checked,1,'Real progress merges into the matching roster entry');
assert.ok(merged.find(s=>s.className==='XI TP 2'&&s.attendance===2).modules.every(m=>m.percent===0));
console.log('PASS: teacher class roster, attendance order, four-module detail, latest checkbox state, quiz and work summaries, zero-progress pupil registration, name updates, no session switch and no credential/private-text/file exposure.');
console.log('PASS: A 100%, B separate partial progress; quiz/reflection/hints/files/settings isolated; logout, relogin, rename, different class, reload, concurrent saves, stale request rejection and legacy preservation. Tested with in-memory IndexedDB, not the user browser.');
