import { lessonById, safeLink, validStepKey } from '@/lib/curriculum';
import type { StudyData, Submission } from '@/app/components/learning';
import { readStudentIdentity, studentAccountId, type StudentIdentity } from '@/lib/student-identity';
import { buildStudentProgressReport, type StudentProgressReport } from '@/lib/student-progress-report';
import { studentRoster } from '@/lib/student-roster';
import { queueDriveSnapshot, queueDriveWork, reportDriveSyncError } from '@/lib/drive-sync';
type LocalState={version:1|2;profile:{id:string;name:string;class_name:string;attendance?:number};events:StudyData['events'];submissions:Submission[];settings:Record<string,string>};
type StoredFile={id:string;name:string;blob:Blob;owner?:string};
let connection:Promise<IDBDatabase>|undefined;
const fresh=(identity:StudentIdentity):LocalState=>({version:2,profile:{id:studentAccountId(identity),name:identity.fullName,class_name:identity.className,attendance:identity.attendance},events:[],submissions:[],settings:{}});
function requireStudent(expected?:string|null){const identity=readStudentIdentity();if(!identity)throw new Error('Klik Sign in dan isi identitas sebelum menyimpan progres.');if(expected!=null&&expected!==studentAccountId(identity))throw new Error('Siswa aktif sudah berubah. Periksa identitas lalu coba lagi.');return identity}
function assertStudent(identity:StudentIdentity){requireStudent(studentAccountId(identity))}
function database(){if(!connection){connection=new Promise((resolve,reject)=>{if(!window.indexedDB){reject(new Error('Browser tidak menyediakan penyimpanan lokal. Gunakan Chrome atau Edge biasa, bukan mode privat.'));return}let hash=2166136261;for(const char of location.pathname.toLowerCase())hash=Math.imul(hash^char.charCodeAt(0),16777619);const request=indexedDB.open('parametra-lab-lokal-'+(hash>>>0).toString(16),1);request.onupgradeneeded=()=>{request.result.createObjectStore('state');request.result.createObjectStore('files',{keyPath:'id'})};request.onerror=()=>{connection=undefined;reject(new Error('Penyimpanan browser tidak dapat dibuka. Materi tetap dapat dibaca, tetapi data belum tersimpan.'))};request.onblocked=()=>{connection=undefined;reject(new Error('Tutup tab Parametra Lab lain lalu coba kembali.'))};request.onsuccess=()=>resolve(request.result)})}return connection}
function requestValue<T>(request:IDBRequest<T>){return new Promise<T>((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
async function readState(identity:StudentIdentity){const db=await database();const state=await requestValue<LocalState|undefined>(db.transaction('state','readonly').objectStore('state').get(studentAccountId(identity)));assertStudent(identity);if(!state||state.profile.name!==identity.fullName)return change(identity,s=>s);return {...state,profile:fresh(identity).profile}}
// Keep the original database and legacy 'main' record untouched. New state keys are per class/presensi.
// Capture identity before asynchronous work; switching students aborts pending writes.
async function change<T>(identity:StudentIdentity,update:(state:LocalState,files:IDBObjectStore)=>T):Promise<T>{const db=await database();assertStudent(identity);return new Promise((resolve,reject)=>{const tx=db.transaction(['state','files'],'readwrite');let result:T,committed:LocalState|undefined;const key=studentAccountId(identity);const req=tx.objectStore('state').get(key);req.onsuccess=()=>{try{assertStudent(identity);const state=(req.result as LocalState|undefined)||fresh(identity);state.profile=fresh(identity).profile;result=update(state,tx.objectStore('files'));tx.objectStore('state').put(state,key);committed=state}catch(error){tx.abort();reject(error)}};tx.oncomplete=()=>{if(committed)void queueDriveSnapshot(committed).catch(reportDriveSyncError);resolve(result)};tx.onerror=()=>reject(new Error('Data belum tersimpan. Ruang penyimpanan browser mungkin penuh; ekspor data dan coba kembali.'));tx.onabort=()=>reject(new Error('Penyimpanan dibatalkan; isian belum tersimpan.'))})}
function text(value:unknown,max=2000){return typeof value==='string'?value.trim().slice(0,max):''}
function lessonNumber(value:unknown){const module=Number(value);if(!Number.isInteger(module)||!lessonById(module))throw new Error('Modul tidak valid.');return module}
function publicState(s:LocalState):StudyData{return {user:{name:s.profile.name,email:s.profile.class_name+' · Presensi '+s.profile.attendance},teacher:true,profiles:[s.profile],events:s.events,submissions:[...s.submissions].reverse().map(work=>({...work,name:s.profile.name,class_name:s.profile.class_name})),settings:s.settings,limitNote:'Hanya data siswa aktif pada browser ini. Tidak tersinkron antarperangkat; PIN lokal bukan autentikasi aman di server.'}}
async function saveActivity(identity:StudentIdentity,p:Record<string,unknown>){const uid=studentAccountId(identity);return change(identity,(s)=>{if(p.action==='profile')throw new Error('Ubah identitas melalui avatar di kanan atas. Kelas dan presensi menentukan profil progres.');
 if(p.action==='settings'){const drive=text(p.drive,1500),cycle=text(p.cycle,60);if(drive&&!safeLink(drive,'drive'))throw new Error('Gunakan tautan HTTPS drive.google.com.');if(!['Pra-tindakan','Siklus I','Siklus II'].includes(cycle))throw new Error('Tahap PTK tidak valid.');s.settings={drive,cycle};return {ok:true}}
 if(p.action==='review'){const score=Number(p.score);if(!Number.isInteger(score)||score<0||score>100)throw new Error('Nilai harus bilangan bulat 0–100.');const work=s.submissions.find(w=>w.id===p.id&&w.uid===uid);if(!work)throw new Error('Karya tidak ditemukan.');work.score=score;work.feedback=text(p.feedback);return {ok:true}}
 const module=lessonNumber(p.module),lesson=lessonById(module)!;let payload:Record<string,unknown>;const kind=text(p.kind,30);
 if(kind==='checkpoint'||kind==='hint'){const step=Number(p.step);if(!validStepKey(lesson, step))throw new Error('Langkah tidak valid.');if(kind==='checkpoint'){if(typeof p.checked!=='boolean')throw new Error('Checklist tidak valid.');payload={step,checked:p.checked}}else{const level=Number(p.level);if(!Number.isInteger(level)||level<1||level>3)throw new Error('Tingkat bantuan tidak valid.');payload={step,level}}}
 else if(kind==='quiz'){const answers=p.answers;if(!Array.isArray(answers)||answers.length!==lesson.quiz.length||answers.some(a=>!Number.isInteger(a)||a<0||a>2))throw new Error('Jawab semua pertanyaan dahulu.');payload={answers,score:Math.round(100*lesson.quiz.filter((q,i)=>q.answer===answers[i]).length/lesson.quiz.length)}}
 else if(kind==='reflection'){const note=text(p.note);if(note.length<10)throw new Error('Refleksi minimal 10 karakter.');payload={note}}
 else throw new Error('Aktivitas tidak valid.');payload.cycle=s.settings.cycle||'Pra-tindakan';s.events.push({id:crypto.randomUUID(),uid,kind,module,payload:JSON.stringify(payload),created:new Date().toISOString()});return {ok:true,...payload}})}
async function storeWork(identity:StudentIdentity,form:FormData){
 const module=lessonNumber(form.get('module')),reflection=text(form.get('reflection')),drive=text(form.get('drive'),1500),fusion=text(form.get('fusion'),1500);
 if(reflection.length<10)throw new Error('Refleksi minimal 10 karakter.');
 if(drive&&!safeLink(drive,'drive')||fusion&&!safeLink(fusion,'fusion'))throw new Error('Tautan harus HTTPS Google Drive atau Autodesk sesuai kolomnya.');
 const file=form.get('file'),hasFile=file instanceof File&&file.size>0;
 if(!hasFile&&!drive&&!fusion)throw new Error('Pilih berkas atau tambahkan tautan karya.');
 if(hasFile&&(file.size>20*1024*1024||!/^.+\.(f3d|f3z|stl|obj|step|stp|pdf|png|jpe?g)$/i.test(file.name)))throw new Error('Pilih berkas yang didukung, maksimal 20 MB.');
 const id=crypto.randomUUID(),uid=studentAccountId(identity);
 let work:Submission;
 const result=await change(identity,(s,files)=>{
  if(hasFile)files.put({id,name:file.name,blob:file,owner:uid});
  work={id,uid,module,filename:hasFile?file.name:'Karya melalui tautan',object_key:hasFile?id:null,drive_url:drive,fusion_url:fusion,reflection,cycle:s.settings.cycle||'Pra-tindakan',created:new Date().toISOString(),score:null,feedback:null};
  s.submissions.push(work);return {ok:true,id};
 });
 void queueDriveWork(fresh(identity).profile,work!,hasFile?file:undefined).catch(reportDriveSyncError);
 return result;
}
export async function localFetch(input:RequestInfo|URL,options:RequestInit={}):Promise<Response>{
 try{
  const path=String(input).split('?')[0],identity=readStudentIdentity();
  if(path==='/api/study'&&options.method!=='POST'){
   if(!identity)return Response.json({user:null,teacher:false,profiles:[],events:[],submissions:[],settings:{}});
   return Response.json(publicState(await readState(identity)));
  }
  // This header rejects stale form submissions; it is NOT an authentication credential.
  const student=requireStudent(new Headers(options.headers).get('X-Parametra-Student'));
  if(path==='/api/study'&&options.method==='POST'){
   const body=JSON.parse(String(options.body));if(!body||typeof body!=='object')throw new Error('Isian tidak valid.');
   return Response.json(await saveActivity(student,body));
  }
  if(path==='/api/portfolio'&&options.method==='POST'&&options.body instanceof FormData)return Response.json(await storeWork(student,options.body));
  throw new Error('Layanan ini tidak tersedia dalam versi lokal.');
 }catch(error){return Response.json({error:error instanceof Error?error.message:'Data belum tersimpan.'},{status:400})}
}
function download(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
export async function readLocalWork(id:string){
 const identity=requireStudent(),state=await readState(identity);
 if(!state.submissions.some(s=>s.id===id&&s.uid===studentAccountId(identity)))throw new Error('Berkas bukan milik siswa aktif.');
 const db=await database();const file=await requestValue<StoredFile|undefined>(db.transaction('files','readonly').objectStore('files').get(id));
 assertStudent(identity);if(!file||file.owner!==studentAccountId(identity))throw new Error('Berkas lokal siswa ini tidak tersedia.');
 return file;
}
export async function downloadLocalWork(id:string){const file=await readLocalWork(id);download(file.blob,file.name)}
export async function queueActiveDriveBackup(){
 const identity=readStudentIdentity();if(!identity)return;
 const state=await readState(identity);await queueDriveSnapshot(state);
 for(const work of state.submissions){
  assertStudent(identity);
  const file=work.object_key?await readLocalWork(work.id):undefined;
  await queueDriveWork(state.profile,work,file?.blob);
 }
}
// Read-only aggregate for the explicitly labelled LOCAL teacher panel, not a protected server API.
// Never returns credentials, file blobs, private reflection text, or the old unassigned "main" record.
export async function readLocalTeacherProgress():Promise<StudentProgressReport[]>{
 const db=await database();
 const states=await requestValue<LocalState[]>(db.transaction('state','readonly').objectStore('state').getAll());
 // Preloaded names are virtual empty reports, not fake accounts or completed work.
 const reports=new Map<string,StudentProgressReport>(studentRoster.map(identity=>{
  const profile=fresh(identity).profile;
  return [profile.id,buildStudentProgressReport({...profile,attendance:identity.attendance},[],[])];
 }));
 for(const state of states){
  try{
   if(state.version!==2||!Array.isArray(state.events)||!Array.isArray(state.submissions))continue;
   const p=state.profile;
   const identity={fullName:p.name,className:p.class_name,attendance:p.attendance} as StudentIdentity;
   if(studentAccountId(identity)!==p.id)continue;
   const rosterEntry=studentRoster.find(s=>studentAccountId(s)===p.id);
   reports.set(p.id,buildStudentProgressReport({...p,name:rosterEntry?.fullName||p.name,attendance:p.attendance!},state.events,state.submissions));
  }catch{ /* Skip records which are not valid named student profiles. */ }
 }
 return [...reports.values()].sort((a,b)=>a.className.localeCompare(b.className)||a.attendance-b.attendance||a.name.localeCompare(b.name,'id'));
}
export async function exportLocalData(){const state=await readState(requireStudent());download(new Blob([JSON.stringify({format:'parametra-lab-student-data',exportedAt:new Date().toISOString(),...state},null,2)],{type:'application/json'}),'Parametra-progres-siswa.json')}
export async function legacyDataAvailable(){const db=await database();const state=await requestValue<LocalState|undefined>(db.transaction('state','readonly').objectStore('state').get('main'));return !!(state&&(state.events.length||state.submissions.length))}
export async function exportLegacyData(){const db=await database();const state=await requestValue<LocalState|undefined>(db.transaction('state','readonly').objectStore('state').get('main'));if(!state)throw new Error('Tidak ada arsip lama.');download(new Blob([JSON.stringify({format:'parametra-legacy-unassigned',note:'Arsip bersama sebelum pemisahan siswa, bukan milik siswa aktif. Berkas CAD tidak disertakan dalam JSON.',...state},null,2)],{type:'application/json'}),'Parametra-arsip-lama-belum-dipisahkan.json')}
