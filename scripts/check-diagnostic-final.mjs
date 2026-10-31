// Strict local API mock. Does not access Google, credentials, or real responses.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const code = await readFile('integrations/google-form/Diagnostik-Fusion-Final.gs', 'utf8');
function fixture({failImageOnce=false,source=code}={}) {
  const items=[], logs=[], settings={}, props=new Map([
    ['DIAGNOSTIK_FUSION_FORM_ID','untouched-old-diagnostic'],
    ['PARAMETRA_ANGKET_FORM_ID','untouched-old-survey'],
    ['PARAMETRA_DIAGNOSTIK_FINAL_V1_FORM_ID','untouched-final-v1'],
    ['PARAMETRA_DIAGNOSTIK_FINAL_V1_STATUS','SELESAI']
  ]);
  let creates=0, releases=0, acquired=0, responses=[], failed=false;
  const TYPES=['SECTION_HEADER','PAGE_BREAK','IMAGE','TEXT','MULTIPLE_CHOICE','PARAGRAPH_TEXT'];
  function add(type) {
    const state={type}, api={}; items.push(state);
    for(const method of ['setTitle','setHelpText','setRequired','setValidation','setChoiceValues','setChoices','setWidth','setAlignment']) {
      api[method]=value=>{state[method]=value;return api;};
    }
    // Reproduce the actual Google Forms failure reported on Kode.gs:78.
    api.setPoints=value=>{
      if(value===0) throw new Error('Invalid data updating form: setPoints(0) rejected');
      assert.ok(Number.isInteger(value)&&value>0);state.setPoints=value;return api;
    };
    api.createChoice=(value,isCorrect)=>{assert.equal(typeof isCorrect,'boolean');return {value,isCorrect};};
    api.setImage=value=>{
      if(failImageOnce&&!failed){failed=true;throw new Error('simulated transient image error');}
      state.setImage=value;return api;
    };
    api.getTitle=()=>state.setTitle;
    api.getType=()=>type;
    for(const name of ['SectionHeader','PageBreak','Image','Text','MultipleChoice','ParagraphText']) api['as'+name+'Item']=()=>api;
    state.api=api;
    return api;
  }
  const form={getId:()=> 'new-final-form',getEditUrl:()=> 'https://example.invalid/edit',getPublishedUrl:()=> 'https://example.invalid/respond',
    getItems:type=>items.filter(i=>!type||i.type===type).map(i=>i.api),getResponses:()=>responses};
  for(const method of ['setDescription','setIsQuiz','setCollectEmail','setPublishingSummary','setShowLinkToRespondAgain','setLimitOneResponsePerUser','setShuffleQuestions','setProgressBar','setConfirmationMessage']) {
    form[method]=value=>{settings[method]=value;return form;};
  }
  for(const [method,type] of [['addSectionHeaderItem','SECTION_HEADER'],['addPageBreakItem','PAGE_BREAK'],['addImageItem','IMAGE'],['addTextItem','TEXT'],['addMultipleChoiceItem','MULTIPLE_CHOICE'],['addParagraphTextItem','PARAGRAPH_TEXT']]) form[method]=()=>add(type);
  const context=vm.createContext({
    FormApp:{
      create:(title,published)=>{assert.equal(published,false);creates++;assert.ok(title.includes('Pretest'));return form;},
      openById:id=>{assert.equal(id,'new-final-form');return form;},
      ItemType:Object.fromEntries(TYPES.map(t=>[t,t])),Alignment:{CENTER:'CENTER'},
      createTextValidation:()=>{const value={},api={};api.requireTextMatchesPattern=p=>{value.pattern=p;return api;};api.setHelpText=t=>{value.help=t;return api;};api.build=()=>value;return api;}
    },
    LockService:{getScriptLock:()=>({waitLock:ms=>{assert.equal(ms,30000);acquired++;},releaseLock:()=>{releases++;}})},
    PropertiesService:{getScriptProperties:()=>({getProperty:key=>props.get(key),setProperty:(key,val)=>props.set(key,val)})},
    Utilities:{base64Decode:value=>Buffer.from(value,'base64'),newBlob:(bytes,mime,name)=>({bytes:Buffer.from(bytes),mime,name})},
    Logger:{log:value=>logs.push(value)}
  });
  vm.runInContext(source,context);
  return {items,logs,settings,props,context,setResponses:r=>{responses=r;},stats:()=>({creates,releases,acquired})};
}

const f=fixture();f.context.buatDiagnostikFusionFinal();
const questions=f.items.filter(i=>['TEXT','MULTIPLE_CHOICE','PARAGRAPH_TEXT'].includes(i.type));
assert.equal(questions.length,39);assert.ok(questions.every(q=>q.setRequired));
assert.equal(f.items.filter(i=>i.type==='PAGE_BREAK').length,5);
assert.equal(f.items.filter(i=>i.type==='SECTION_HEADER').length,1);
assert.equal(f.items.filter(i=>i.type==='IMAGE').length,4);
assert.equal(f.props.get('PARAMETRA_DIAGNOSTIK_FINAL_V2_QUIZ_STATUS'),'SELESAI');
assert.equal(f.props.get('PARAMETRA_DIAGNOSTIK_FINAL_V1_FORM_ID'),'untouched-final-v1');
assert.equal(f.props.get('PARAMETRA_DIAGNOSTIK_FINAL_V1_STATUS'),'SELESAI');
assert.equal(f.props.get('DIAGNOSTIK_FUSION_FORM_ID'),'untouched-old-diagnostic');
assert.equal(f.props.get('PARAMETRA_ANGKET_FORM_ID'),'untouched-old-survey');
const knowledge=questions.filter(q=>/^B\d+\./.test(q.setTitle));
assert.equal(knowledge.length,12);
const packageData=f.context.paketDiagnostikFinal_();
const sourceQuestions=packageData.halaman.flatMap(p=>p.items);
const key=sourceQuestions.filter(q=>Number.isInteger(q.benar));
assert.deepEqual(Array.from(key,q=>q.benar),[0,2,3,1,2,0,3,3,1,2,0,1]);
assert.deepEqual([0,1,2,3].map(n=>key.filter(q=>q.benar===n).length),[3,3,3,3]);
assert.equal(sourceQuestions.filter(q=>q.inti).length,13,'11 core MCQ + 2 core essays');
for(const [i,q] of knowledge.entries()) {
  assert.equal(q.setChoices.length,5);
  const options=Array.from(q.setChoices,c=>c.value);
  assert.equal(options[4],'E. Belum tahu');
  assert.equal(new Set(options).size,5);
  assert.equal(options[key[i].benar],key[i].opsi[key[i].benar]);
  assert.equal(q.setPoints,1);
  assert.equal(q.setChoices.filter(c=>c.isCorrect).length,1);
  assert.equal(q.setChoices[key[i].benar].isCorrect,true);
  assert.equal(q.setChoices[4].isCorrect,false);
  if(key[i].gambar) {
    const at=f.items.indexOf(q), previous=f.items[at-1];
    assert.equal(previous.type,'IMAGE');assert.equal(previous.setTitle,'Gambar untuk '+key[i].kode);
    assert.ok(previous.setHelpText.length>50);
  }
}
for(const prefix of ['D','E']) {
  const group=questions.filter(q=>new RegExp('^'+prefix+'\\d+\\.').test(q.setTitle));
  assert.equal(group.length,prefix==='D'?9:6);
  group.forEach(q=>{assert.equal(q.setChoiceValues.length,6);assert.ok(!/^[1-5]/.test(q.setChoiceValues[5]));});
}
assert.equal(questions.filter(q=>q.type==='PARAGRAPH_TEXT').length,4,'2 scored essays + 2 needs reflections');
assert.ok(questions.find(q=>q.setTitle.startsWith('F1.')).setChoiceValues.includes('Belum memerlukan bantuan tambahan'));
assert.ok(questions.find(q=>q.setTitle.startsWith('F4.')).setHelpText.includes('Tidak harus berupa website'));
assert.deepEqual(Array.from(questions.find(q=>q.setTitle==='Kelas').setChoiceValues),['XI TP 1','XI TP 2']);
for(const [name,good,bad] of [
  ['Nomor presensi',['1','01','24','99'],['0','100','12.5','17528','abc']],
  ['Nama lengkap',['Siswa Uji',"Siswa O'Nama"],['','   ']]
]) {
  const re=new RegExp(questions.find(q=>q.setTitle===name).setValidation.pattern);
  good.forEach(v=>assert.ok(re.test(v)));bad.forEach(v=>assert.ok(!re.test(v)));
}
assert.equal(f.settings.setIsQuiz,true);assert.equal(f.settings.setCollectEmail,false);
assert.equal(f.settings.setPublishingSummary,false);assert.equal(f.settings.setLimitOneResponsePerUser,false);
assert.equal(f.settings.setProgressBar,true);assert.equal(f.settings.setShuffleQuestions,false);
for(const i of f.items) {
  assert.ok(!Object.hasOwn(i,'benar')&&!Object.hasOwn(i,'rubrik'));
  assert.ok(!/Kunci jawaban|1 poin:|intiLintas/.test((i.setTitle||'')+(i.setHelpText||'')));
}
assert.equal(questions.reduce((sum,q)=>sum+(q.setPoints??0),0),18,'Total available quiz points');
assert.equal(questions.filter(q=>q.setPoints===1).length,12);
assert.equal(questions.filter(q=>q.setPoints===3).length,2);
for(const q of questions) {
  if(/^C[12]\./.test(q.setTitle)) assert.equal(q.setPoints,3,'Essays need manual grading');
  else if(!/^B\d+\./.test(q.setTitle)) {
    assert.equal(q.setPoints,undefined,'Identity and questionnaires use default 0; no setPoints(0) call');
    assert.ok(!q.setChoices,'No correctness key on self-reports');
  }
}
function autoGrade(q,value) {return q.setChoices.find(c=>c.value===value)?.isCorrect?q.setPoints:0;}
const diameterQuestion=knowledge[1];
assert.equal(autoGrade(diameterQuestion,diameterQuestion.setChoices[0].value),0,'B2: choosing A instead of key C gives 0');
assert.equal(autoGrade(diameterQuestion,diameterQuestion.setChoices[2].value),1,'B2: choosing C gives 1');
assert.equal(knowledge.reduce((sum,q)=>sum+autoGrade(q,'E. Belum tahu'),0),0);
assert.equal(knowledge.reduce((sum,q)=>sum+autoGrade(q,q.setChoices.find(c=>c.isCorrect).value),0),12);
// Recover the actual first-item failure in the SAME saved partial form.
const unsafeSource=code.replace('if (poin > 0) item.setPoints(poin);','item.setPoints(poin);');
assert.notEqual(unsafeSource,code);
const stopped=fixture({source:unsafeSource});
assert.throws(()=>stopped.context.buatDiagnostikFusionFinal(),/setPoints\(0\) rejected/);
assert.equal(stopped.props.get('PARAMETRA_DIAGNOSTIK_FINAL_V2_QUIZ_STATUS'),'MEMBANGUN');
assert.equal(stopped.items.filter(q=>q.setTitle==='Nama lengkap').length,1);
vm.runInContext(code,stopped.context);
stopped.context.buatDiagnostikFusionFinal();
assert.equal(stopped.stats().creates,1,'Resume same form after replacing the code');
for(const i of f.items.filter(i=>i.type==='IMAGE')) {
  const png=i.setImage.bytes;
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),720);
  const file=await readFile('integrations/google-form/gambar-diagnostik-final/'+i.setImage.name);
  assert.deepEqual(png,file);assert.equal(i.setWidth,640);
}
function snapshot(x) {return JSON.stringify(x.items,(k,v)=>k==='api'?undefined:v);}
const before=snapshot(f);f.setResponses([{id:'existing-response'}]);f.context.buatDiagnostikFusionFinal();
assert.equal(snapshot(stopped),before,'Recovery from real-world zero-point failure preserves structure and scoring');
assert.equal(snapshot(f),before,'Completed form is not modified even if it has responses');
assert.deepEqual(f.stats(),{creates:1,releases:2,acquired:2});
const partial=fixture({failImageOnce:true});
assert.throws(()=>partial.context.buatDiagnostikFusionFinal(),/simulated/);
assert.equal(partial.stats().releases,1);
assert.equal(partial.props.get('PARAMETRA_DIAGNOSTIK_FINAL_V2_QUIZ_STATUS'),'MEMBANGUN');
partial.context.buatDiagnostikFusionFinal();
assert.equal(snapshot(partial),before,'Partial creation resumes in the original order without duplicate items');
assert.equal(partial.stats().creates,1);
const occupied=fixture({failImageOnce:true});
assert.throws(()=>occupied.context.buatDiagnostikFusionFinal(),/simulated/);
occupied.setResponses([{id:'must-preserve'}]);
const partialBefore=snapshot(occupied);
assert.throws(()=>occupied.context.buatDiagnostikFusionFinal(),/sudah memiliki respons/);
assert.equal(snapshot(occupied),partialBefore);assert.equal(occupied.stats().releases,2);
console.log('Lulus: reproduksi kegagalan setPoints(0) dan pemulihan di form parsial yang sama; tanpa setter poin nol, PG otomatis 12 × 1 + uraian manual 2 × 3, 25 isian default 0; kasus kunci C/jawab A=0 dan C=1; 6 halaman/39 isian/4 PNG, ulang tanpa duplikasi dan respons terlindungi. Mock lokal; belum menjalankan Google Forms nyata.');
