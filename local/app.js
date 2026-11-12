'use strict';
const $=id=>document.getElementById(id);
const materials=JSON.parse($('materials').textContent);
const viewer=modelViewer($('mesh'));
const sections=Array.from(document.querySelectorAll('article>section'));
const steps=Array.from(document.querySelectorAll('[data-step]'));
const draft=new Map(), checks=[
 'Saya membandingkan bentuk atau tampak desain dengan gambar kerja.',
 'Saya memeriksa ukuran dan satuan sesuai jobsheet di Autodesk Fusion.',
 'Saya memeriksa bagian yang berbeda, memperbaikinya bila perlu, lalu memeriksa ulang.'
];
let current,state,pdfUrl,stlUrl,hintCount=0,issues=[];
const groupNames={sketch:'Sketsa 2D',part:'Komponen 3D',assembly:'Rakitan piston'};
const initial={plan:'',attempt:'',review:'',checks:[false,false,false]};
function read(id){
  if(draft.has(id))return draft.get(id);
  let value;try{value=JSON.parse(localStorage.getItem('parametra.ringkas.v1.'+id))}catch{}
  const s={...initial,checks:checks.map((_,i)=>value?.checks?.[i]===true)};
  for(const key of ['plan','attempt','review'])s[key]=typeof value?.[key]==='string'?value[key]:'';
  draft.set(id,s);return s;
}
function persist(){try{localStorage.setItem('parametra.ringkas.v1.'+current.id,JSON.stringify(state))}catch{$('storageNote').textContent='Browser tidak dapat menyimpan catatan. Salin catatan sebelum menutup halaman.'}}
function updateProgress(){$('progress').textContent=state.checks.filter(Boolean).length+' dari '+checks.length+' pemeriksaan selesai.'}
function updateIssue(){const row=issues[Number($('issue').value)];$('cause').textContent=row[1];$('repair').textContent=row[2]}
function activate(i){
  if(i!==0)closeViewerTools();
  sections.forEach((s,k)=>{s.hidden=k!==i;if(k===i)steps[k].setAttribute('aria-current','step');else steps[k].removeAttribute('aria-current')});
  if(i===0){viewer.refresh();if(current)sheetTiles()}
}
steps.forEach((btn,i)=>btn.onclick=()=>activate(i));
for(const [stage,label] of Object.entries(groupNames)){
  const group=document.createElement('optgroup');group.label=label;
  for(const task of materials.tasks.filter(t=>t.stage===stage))group.append(new Option(task.title,task.id));
  $('task').append(group);
}
$('guideImage').src='data:image/jpeg;base64,'+materials.interfaceImage;
for(const part of materials.guide){const li=document.createElement('li');li.textContent=part;$('guideList').append(li)}
function loadTask(id){
  current=materials.tasks.find(t=>t.id===id)||materials.tasks.find(t=>t.id==='part-4');
  $('task').value=current.id;state=read(current.id);
  const blobUrl=(b,type)=>URL.createObjectURL(new Blob([Uint8Array.from(atob(b),c=>c.charCodeAt(0))],{type}));
  if(pdfUrl)URL.revokeObjectURL(pdfUrl);
  pdfUrl=blobUrl(current.pdf,'application/pdf');$('pdf').href=$('pdfDownload').href=pdfUrl;$('pdfDownload').download=current.title+'.pdf';$('pdfFrame').src=pdfUrl+'#toolbar=1';$('pdfFrame').title='Gambar kerja: '+current.title;
  if(stlUrl)URL.revokeObjectURL(stlUrl);stlUrl=current.model?blobUrl(current.model,'model/stl'):null;
  $('stl').hidden=$('hud').hidden=!stlUrl;if(stlUrl){$('stl').href=stlUrl;$('stl').download=current.title+'.stl'}else $('stl').removeAttribute('href');
  $('meshLabel').textContent=current.title+'.stl';$('stageTitle').textContent=stages[current.stage].name;
  $('partTitle').textContent=taskLabel(current);
  $('viewPrompt').textContent=current.model?'Putar model, pilih tampak, atau buka potongan. Cocokkan bentuk yang terlihat dengan garis pada gambar kerja.':'Amati kontur dan garis acuan pada pratinjau sketsa. Gunakan PDF untuk membaca ukuran.';
  $('mesh').hidden=$('controls').hidden=!current.model;$('flat').hidden=!current.image;
  if(current.image){$('flat').src='data:image/png;base64,'+current.image;$('flat').alt='Sketsa '+current.title}else $('flat').removeAttribute('src');
  viewer.load(current.model);
  closeViewerTools();
  showPlane('none',false);
  $('instruction').textContent=current.instruction;
  for(const key of ['plan','attempt','review'])$(key).value=state[key];
  hintCount=0;$('hints').replaceChildren();$('nextHint').disabled=false;$('nextHint').textContent='Buka petunjuk 1';
  issues=materials.clinic.filter(r=>r[3]===current.stage||r[3]==='umum');
  $('issue').replaceChildren(...issues.map((r,i)=>new Option(r[0],i)));updateIssue();
  $('checks').replaceChildren(...checks.map((text,i)=>{
    const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=state.checks[i];
    input.onchange=()=>{state.checks[i]=input.checked;persist();updateProgress()};label.append(input,text);return label;
  }));updateProgress();activate(0);
}
$('issue').onchange=updateIssue;
$('nextHint').onclick=()=>{if(hintCount>=current.hints.length)return;const li=document.createElement('li');li.textContent=current.hints[hintCount++];$('hints').append(li);
  $('nextHint').disabled=hintCount>=current.hints.length;$('nextHint').textContent=$('nextHint').disabled?'Semua petunjuk terbuka':'Buka petunjuk '+(hintCount+1)};
for(const key of ['plan','attempt','review'])$(key).oninput=()=>{state[key]=$(key).value;persist()};
function setSpin(on){
  viewer.spin(on);
  const button=$('spin'),label=on?'Jeda putaran':'Putar otomatis 360°';
  button.setAttribute('aria-pressed',String(on));button.setAttribute('aria-label',label);
  button.title=label;
}
function toggleSectionMenu(open){
  $('sectionMenu').hidden=!open;$('cut').setAttribute('aria-expanded',String(open));
}
function closeViewerTools(){setSpin(false);toggleSectionMenu(false)}
function showPlane(plane,flipped){
  const active=plane!=='none';
  const label=active?'Pilih bidang potong · '+plane:'Pilih bidang potong';
  $('cut').title=label;$('cut').setAttribute('aria-label',label);
  $('cut').dataset.active=String(active);
  document.querySelectorAll('[data-plane]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.plane===plane)));
  $('flipSection').disabled=!active;$('flipSection').setAttribute('aria-pressed',String(flipped));
}
function selectPlane(plane,flipped){viewer.section(plane,flipped);showPlane(plane,flipped)}
$('spin').onclick=()=>setSpin($('spin').getAttribute('aria-pressed')!=='true');
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{
  if(!['in','out'].includes(b.dataset.view))setSpin(false);
  viewer.view(b.dataset.view);
});
$('cut').onclick=()=>toggleSectionMenu($('sectionMenu').hidden);
document.querySelectorAll('[data-plane]').forEach(b=>b.onclick=()=>selectPlane(b.dataset.plane,false));
$('flipSection').onclick=()=>selectPlane(document.querySelector('[data-plane][aria-pressed="true"]').dataset.plane,$('flipSection').getAttribute('aria-pressed')!=='true');
document.addEventListener('pointerdown',e=>{
  if(!$('sectionMenu').hidden&&!e.target.closest('#sectionMenu,#cut'))toggleSectionMenu(false);
});
$('controls').addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!$('sectionMenu').hidden){e.preventDefault();toggleSectionMenu(false);$('cut').focus()}
});
const stages={
  intro:{name:'Pengenalan Fusion',desc:'Antarmuka, navigasi, satuan & penyimpanan',url:'intro'},
  sketch:{name:'Sketch 2D',desc:'Profil, dimensi & constraint · 2 jobsheet',url:'modul/sketch-1'},
  part:{name:'Membuat part 3D',desc:'Dari sketsa menjadi benda solid · 4 jobsheet',url:'modul/part-3'},
  assembly:{name:'Assembly',desc:'5 komponen piston & 2 dokumen acuan',url:'modul/assembly-1'}
};
function taskLabel(t){const n=t.id.split('-').pop();return /^\d+$/.test(n)?'Jobsheet '+n+' · '+t.title:t.title}
const el=(tag,txt,cls)=>{const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;if(cls)e.className=cls;return e};
function stageLinks(target,tiles){
 const frag=document.createDocumentFragment();
 Object.values(stages).forEach((m,i)=>{const link=el('a');link.href='#'+m.url;const box=el('div');box.append(el('b',m.name),el(tiles?'p':'small',m.desc));
 link.append(el('span','0'+(i+1),'num'),box);frag.append(link)});target.replaceChildren(frag);
}
stageLinks($('journey'),false);
function sheetTiles(){
 $('sheetGrid').replaceChildren(...materials.tasks.filter(t=>t.stage===current.stage).map(t=>{const link=el('a',taskLabel(t));link.href='#'+(location.hash.startsWith('#lab')?'lab':'modul')+'/'+t.id;if(t.id===current.id)link.setAttribute('aria-current','true');return link}));
}

// Komponen studio mengikuti susunan versi arsip, dengan data latihan lokal yang sama.
function ico(id){
 const ns='http://www.w3.org/2000/svg',s=document.createElementNS(ns,'svg'),u=document.createElementNS(ns,'use');
 s.setAttribute('class','ico');s.setAttribute('aria-hidden','true');u.setAttribute('href','#ic-'+id);s.append(u);return s;
}
function linkTo(text,hash,cls){const a=el('a',text,cls);a.href='#'+hash;return a}
function courseCards(wrap){
 wrap.className='course-grid';wrap.replaceChildren();
 Object.entries(stages).forEach(([k,m],i)=>{
 const item=el('article',undefined,'course-card'),hero=linkTo('',m.url,'course-main'),art=el('div',undefined,'course-top tint-'+[2,0,1,2][i]),body=el('div',undefined,'course-body');
 art.append(el('span','MODUL 0'+(i+1),'eyebrow'),ico(['book','library','cube','cube'][i]),el('span','Tahap '+(i+1)+' · '+['Persiapan','Sketch','Part','Assembly'][i],'module-meeting'));
 body.append(el('h3',m.name),el('p',m.desc));
 const ts=materials.tasks.filter(t=>t.stage===k),total=ts.length*checks.length,done=ts.reduce((n,t)=>n+read(t.id).checks.filter(Boolean).length,0);
 const foot=el('div',undefined,'course-footer');if(total){const bar=el('progress');bar.max=total;bar.value=done;bar.setAttribute('aria-label','Pemeriksaan '+m.name);body.append(bar)}
 foot.append(el('span',total?Math.round(100*done/total)+'% langkah diperiksa':'Panduan antarmuka · 9 bagian'),el('span','→'));body.append(foot);hero.append(art,body);
 const opts=el('div',undefined,'module-card-options');
 const links=k==='intro'?[['Interface Autodesk Fusion','intro','cube'],['Modul pembelajaran','intro/persiapan','book'],['Jobsheet PDF','pustaka','folder'],['Bahan belajar','pustaka','library']]:
 [[k==='sketch'?'Preview Sketch 2D':'Part 3D',m.url,'cube'],['Modul pembelajaran',m.url+'/1','book'],['Jobsheet PDF',m.url+'/pdf','folder'],['Bahan belajar','pustaka/'+k,'library']];
 for(const [label,path,ic] of links){const a=linkTo('',path);a.append(ico(ic),el('span',label));opts.append(a)}
 item.append(hero,opts);wrap.append(item);
 });
}
function statRow(values){const box=el('div',undefined,'stats');for(const [n,t] of values){const cell=el('div',undefined,'stat');cell.append(el('b',String(n)),el('span',t));box.append(cell)}return box}
function shelf(wrap,stage,teacher=false){
 const hero=el('section',undefined,'resource-hero'),copy=el('div',undefined,'resource-hero-copy'),heading=el('h1',teacher?'Siapkan pembelajaran.':'Bekal praktik,');
 heading.append(el('br'),el('span',teacher?'Dampingi setiap proses.':'semua di sini.'));
 copy.append(el('span',teacher?'RUANG GURU · PERANGKAT PEMBELAJARAN':'PUSTAKA MATERI · AUTODESK FUSION','eyebrow'),heading,el('p',teacher?'Gunakan gambar kerja dan panduan tugas berikut untuk mendampingi praktik di kelas.':'Dari mengenal Fusion hingga merakit piston. Buka gambar kerja dan pilih latihan sesuai tahapmu.'));
 const art=el('div',undefined,'resource-hero-art'),book=el('div',undefined,'resource-book');art.setAttribute('aria-hidden','true');book.append(el('span','PARAMETRA / XI','eyebrow'),ico('book'),el('strong',teacher?'Perangkat ajar':'Fusion Learning'),el('span','TEKNIK PEMESINAN'),el('i'));art.append(el('div',undefined,'resource-book-back'),book);
 hero.append(copy,art);
 const filter=el('div',undefined,'filters card'),q=el('input'),sel=el('select');q.type='search';q.placeholder='Misalnya: pulley, piston…';
 const searchLabel=el('label','Cari materi'),stageLabel=el('label','Tahap belajar');searchLabel.append(q);stageLabel.append(sel);sel.append(new Option('Semua tahap',''));
 for(const k of Object.keys(groupNames))sel.append(new Option(stages[k].name,k));sel.value=groupNames[stage]?stage:'';
 filter.append(searchLabel,stageLabel);const summary=el('p',undefined,'note'),grid=el('div',undefined,'resultgrid');summary.setAttribute('aria-live','polite');
 function refresh(){grid.replaceChildren();const query=q.value.trim().toLowerCase();const ts=materials.tasks.filter(t=>(!sel.value||t.stage===sel.value)&&(taskLabel(t)+' '+stages[t.stage].name).toLowerCase().includes(query));
 summary.textContent=ts.length+' jobsheet tersedia';for(const t of ts){const item=el('article',undefined,'card'),head=el('div',undefined,'paperhead');head.append(ico('folder'),el('span',stages[t.stage].name,'eyebrow'));item.append(head,el('h3',taskLabel(t)),el('p',t.id.endsWith('full')||t.id.endsWith('isometris')?'Dokumen acuan':'Gambar kerja praktik'),linkTo('Buka jobsheet PDF','modul/'+t.id+'/pdf','action'));grid.append(item)}if(!ts.length)grid.append(el('p','Tidak ada materi yang cocok. Coba kata lain atau pilih semua tahap.','localnotice'))}
 q.oninput=sel.onchange=refresh;wrap.className='';wrap.append(hero,filter,summary,grid);refresh();
}
function clinicPage(wrap){
 wrap.className='';const label=el('label','Cari kendala'),q=el('input');q.type='search';q.placeholder='Misalnya: sketsa, joint…';label.append(q);const filter=el('div',undefined,'filters card');filter.append(label);
 const rows=el('div');wrap.append(filter,rows);function update(){rows.replaceChildren();for(const [name,cause,repair,stage] of materials.clinic.filter(r=>r.join(' ').toLowerCase().includes(q.value.toLowerCase().trim()))){const block=el('details',undefined,'card studio-clinic');block.append(el('summary',name),el('p','Kemungkinan penyebab: '+cause),el('p','Coba langkah ini: '+repair),linkTo('Catat percobaan perbaikan →',(stages[stage]?.url||'modul/part-3')+'/2'));rows.append(block)}if(!rows.childNodes.length)rows.append(el('p','Kendala belum ditemukan. Catat gejalanya dan tanyakan kepada guru.','localnotice'))}q.oninput=update;update();
}

function listing(mode,filterStage){
 const metadata={modul:['Modul belajar','Pilih tahap belajarmu, dari pengenalan antarmuka hingga perakitan.'],pustaka:['Pustaka materi','Seluruh jobsheet asli, dikelompokkan menurut tahap latihan.'],portofolio:['Portofolio','Kumpulan rencana kerja, percobaan perbaikan, dan refleksi yang kamu tulis di browser ini.'],progres:['Progres saya','Jumlah pemeriksaan yang kamu centang untuk setiap jobsheet di perangkat ini.']};
 Object.assign(metadata,{modul:['Dari sketsa hingga bergerak.','Ikuti empat tahap: pengenalan Fusion, sketch 2D, membuat part 3D, dan assembly.'],klinik:['Kendala bukan jalan buntu.','Periksa gejalanya, pahami kemungkinan penyebabnya, lalu coba perbaikannya di Fusion.'],guru:['Dampingi prosesnya.','Panduan pendampingan di laboratorium. Data kelas dan akun siswa tidak ditampilkan.'],perangkat:['Perangkat ajar','Gambar kerja dan panduan untuk mendampingi praktik.'],portofolio:['Karya yang terus berkembang.','Rencana, percobaan perbaikan, dan refleksi yang tersimpan di browser ini.'],progres:['Lihat kemajuanmu.','Pantau checklist pemeriksaan yang kamu isi pada setiap jobsheet.']});
 document.querySelector('#listing .pagetitle').hidden=mode==='pustaka'||mode==='perangkat';
 document.querySelector('#listing .pagetitle .eyebrow').textContent=({modul:'JALUR BELAJAR',portofolio:'ARSIP PERJALANANMU',progres:'JEJAK BELAJAR',klinik:'BERHENTI SEJENAK, CARI SEBABNYA',guru:'GURU & KOLABORATOR PTK'})[mode]||'FUSION LEARNING STUDIO';
 const [title,desc]=metadata[mode];$('listTitle').textContent=title;$('listDesc').textContent=desc;
 const wrap=$('listBody');wrap.className=mode==='modul'?'modules':'card';wrap.replaceChildren();
 if(mode==='modul'){courseCards(wrap);return}
 if(mode==='pustaka'||mode==='perangkat'){shelf(wrap,filterStage,mode==='perangkat');return}
 if(mode==='klinik'){clinicPage(wrap);return}
 if(mode==='guru'){wrap.append(el('h2','Acuan pendampingan'),el('p','Amati cara siswa membaca gambar 2D, menentukan bidang sketsa, dan menjelaskan bentuk 3D.'),el('h3','Saat siswa mengalami kendala'),el('p','Tanyakan langkah yang sudah dicoba. Beri kesempatan untuk memperbaiki model, lalu bandingkan hasilnya dengan jobsheet.'),linkTo('Buka perangkat ajar','perangkat','action primary'));return}
 if(mode==='progres'||mode==='portofolio'){const ts=materials.tasks.map(t=>read(t.id));wrap.append(statRow([[ts.filter(t=>t.checks.every(Boolean)).length+' / '+ts.length,'Jobsheet diperiksa'],[ts.filter(t=>t.plan.trim()).length,'Rencana kerja'],[ts.filter(t=>t.review.trim()).length,'Refleksi tersimpan']]))}
 let seen=0,stage='';
 for(const t of materials.tasks){const s=read(t.id);if(mode==='portofolio'&&!(s.plan||s.attempt||s.review))continue;
  if(t.stage!==stage){stage=t.stage;wrap.append(el('h3',stages[stage].name))}
  const row=el('div',undefined,'row'),info=el('div');info.append(el('b',taskLabel(t)));
  if(mode==='progres')info.append(el('small',s.checks.filter(Boolean).length+' / '+checks.length+' pemeriksaan selesai'));
  if(mode==='portofolio')for(const [k,label] of [['plan','Rencana'],['attempt','Perbaikan'],['review','Refleksi']])if(s[k])info.append(el('p',label+': '+s[k]));
  const link=el('a',mode==='progres'?'Periksa':'Buka latihan','action');link.href='#modul/'+t.id+(mode==='progres'?'/3':'');row.append(info,link);wrap.append(row);seen++;
 }
 if(!seen){wrap.append(el('h3','Belum ada catatan latihan'),el('p','Tulis rencana pada salah satu jobsheet. Catatanmu akan muncul di sini.'));const l=el('a','Mulai latihan','action primary');l.href='#modul/part-3/1';wrap.append(l)}
}
const legacy={'modul/8/part3d':'intro','modul/9/part3d':'modul/sketch-1','modul/10/part3d':'modul/part-3','modul/11/part3d':'modul/assembly-full'};
function route(){
 let hash=location.hash.slice(1);hash=legacy[hash]||hash;
 if(materials.tasks.some(t=>t.id===hash))hash='modul/'+hash;
 let [mode='beranda',id,step]=hash.split('/');mode=mode||'beranda';
 if(!['beranda','modul','intro','pustaka','lab','klinik','portofolio','progres','guru','perangkat'].includes(mode))mode='beranda';
 if(mode==='modul'&&!id)id='part-3';
 const isPractice=mode==='lab'||(mode==='klinik'&&Boolean(id))||(mode==='modul'&&id!=='daftar');
 if(!isPractice)closeViewerTools();
 $('home').hidden=mode!=='beranda';$('introPage').hidden=mode!=='intro';$('practice').hidden=!isPractice;
 $('listing').hidden=isPractice||mode==='intro'||mode==='beranda';
 if(!$('listing').hidden)listing(mode,id);
 if(mode==='beranda')courseCards($('homeCourses'));
 $('crumbTitle').textContent=isPractice?'Praktik terpandu':({beranda:'Beranda',intro:'Pengenalan Fusion',modul:'Modul belajar',klinik:'Klinik kesalahan',pustaka:'Pustaka materi',progres:'Progres saya',portofolio:'Portofolio',guru:'Ruang tinjauan',perangkat:'Perangkat ajar'})[mode];
 if(isPractice){let t=materials.tasks.find(x=>x.id===id)||((mode==='klinik'||(mode==='lab'&&current?.model))&&current)||materials.tasks.find(x=>x.id==='part-3');
   if(mode==='lab'&&!t.model)t=materials.tasks.find(x=>x.id==='part-3');
   if(current?.id!==t.id)loadTask(t.id);
   activate(mode==='klinik'?2:Math.max(0,Math.min(3,Number(step)||0)));sheetTiles();
 }
 $('rail').querySelectorAll('a').forEach(a=>{if(a.dataset.nav===(mode==='intro'?'modul':mode))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
 if(mode!=='beranda')$('piston').pause();else if(!matchMedia('(prefers-reduced-motion: reduce)').matches)$('piston').play().catch(()=>{});
 document.querySelector('.sidebar').classList.remove('open');$('menuBtn').setAttribute('aria-expanded','false');
 if(isPractice && step==='pdf'){$('pdfFrame').scrollIntoView({block:'center'});}
 else if(mode==='intro' && id==='persiapan'){$('introPrep').scrollIntoView({block:'center'});}
 else if(isPractice && mode==='modul' && current.stage==='part' && !Number(step)){
   $('sheetGrid').scrollIntoView({block:'start'});
 }else window.scrollTo(0,0);
}
// A second click on the same menu also returns from the written steps to the viewer.
$('rail').querySelector('[data-nav="modul"]').addEventListener('click',e=>{
 if(location.hash==='#modul' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey){e.preventDefault();route()}
});
$('task').onchange=()=>{const t=materials.tasks.find(t=>t.id===$('task').value);const mode=location.hash.startsWith('#klinik')?'klinik':location.hash.startsWith('#lab')&&t.model?'lab':'modul';location.hash=mode+'/'+t.id};
$('menuBtn').onclick=()=>{const on=document.querySelector('.sidebar').classList.toggle('open');$('menuBtn').setAttribute('aria-expanded',String(on))};
function positionPdf(right){$('stageGrid').classList.toggle('right',right);$('beside').setAttribute('aria-pressed',String(right));$('below').setAttribute('aria-pressed',String(!right));viewer.refresh()}
$('beside').onclick=()=>positionPdf(true);$('below').onclick=()=>positionPdf(false);
$('expand').hidden=!document.fullscreenEnabled;
$('expand').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('visual').requestFullscreen()}catch{}};
document.addEventListener('fullscreenchange',()=>viewer.refresh());
$('mesh').addEventListener('wheel',e=>{e.preventDefault();viewer.view(e.deltaY<0?'in':'out')},{passive:false});
window.addEventListener('hashchange',route);route();
