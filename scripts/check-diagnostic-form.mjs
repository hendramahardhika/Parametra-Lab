// Local mock only: does not create/read Google files, responses, or user credentials.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const items=[],properties=new Map(),settings={},logs=[];let creates=0;
function item(type){
  const data={type};items.push(data);const api={};
  for(const method of ['setTitle','setHelpText','setRequired','setValidation','setChoiceValues'])api[method]=value=>{data[method]=value;return api;};
  return api;
}
const form={getId:()=> 'mock-diagnostic',getEditUrl:()=> 'mock-edit',getPublishedUrl:()=> 'mock-respond'};
for(const method of ['setDescription','setIsQuiz','setCollectEmail','setPublishingSummary','setShowLinkToRespondAgain','setLimitOneResponsePerUser','setShuffleQuestions','setProgressBar','setConfirmationMessage'])form[method]=value=>{settings[method]=value;return form;};
for(const [method,type] of [['addSectionHeaderItem','section'],['addTextItem','text'],['addMultipleChoiceItem','choice'],['addPageBreakItem','page'],['addParagraphTextItem','essay']])form[method]=()=>item(type);
const context=vm.createContext({
  PropertiesService:{getScriptProperties:()=>({getProperty:key=>properties.get(key),setProperty:(key,value)=>properties.set(key,value)})},
  Logger:{log:message=>logs.push(message)},
  FormApp:{
    create:(title,published)=>{creates++;assert.equal(published,false);assert.ok(title.includes('Diagnostik'));return form;},
    openById:id=>{assert.equal(id,'mock-diagnostic');return form;},
    createTextValidation:()=>{
      const result={},api={};api.requireTextMatchesPattern=value=>{result.pattern=value;return api;};
      api.setHelpText=value=>{result.help=value;return api;};api.build=()=>result;return api;
    },
  },
});
vm.runInContext(await readFile('integrations/google-form/Asesmen-Diagnostik-Fusion.gs','utf8'),context);
context.buatAsesmenDiagnostikFusion();
assert.equal(creates,1);assert.equal(properties.get('DIAGNOSTIK_FUSION_FORM_ID'),'mock-diagnostic');
assert.ok(!properties.has('PARAMETRA_ANGKET_FORM_ID'),'Independent from the post-use survey');
const questions=items.filter(i=>['text','choice','essay'].includes(i.type));
assert.equal(questions.length,28);assert.ok(questions.every(i=>i.setRequired===true));
assert.equal(items.filter(i=>i.type==='page').length,3,'Four pages');
assert.deepEqual(Array.from(items.find(i=>i.setTitle==='Kelas').setChoiceValues),['XI TP 1','XI TP 2']);
const knowledge=items.filter(i=>/^B\d+\./.test(i.setTitle));assert.equal(knowledge.length,10);
knowledge.forEach((i,n)=>{assert.ok(i.setTitle.startsWith('B'+(n+1)+'. '));assert.equal(i.setChoiceValues.length,5);assert.equal(i.setChoiceValues[4],'E. Belum tahu');assert.equal(new Set(i.setChoiceValues).size,5);});
const key=context.soalPemahamanDiagnostikFusion_();
assert.equal(key.length,10);assert.deepEqual(Array.from(key,q=>q.benar),[1,0,2,3,1,2,0,3,1,2]);
key.forEach((q,i)=>{assert.equal(q.opsi.length,4);assert.ok(Number.isInteger(q.benar)&&q.benar>=0&&q.benar<4);assert.equal(knowledge[i].setChoiceValues[q.benar],String.fromCharCode(65+q.benar)+'. '+q.opsi[q.benar]);});
const difficulty=items.filter(i=>/^C\d+\./.test(i.setTitle));assert.equal(difficulty.length,8);
difficulty.forEach(i=>{assert.equal(i.setChoiceValues.length,6);assert.equal(i.setChoiceValues[5],'Belum mempelajari/mencoba');assert.ok(i.setChoiceValues[0].startsWith('1 —'));assert.ok(i.setChoiceValues[4].startsWith('5 —'));});
assert.equal(items.filter(i=>i.type==='essay').length,2);
assert.ok(items.find(i=>i.setTitle.startsWith('D1.')).setChoiceValues.includes('Belum memerlukan bantuan tambahan'));
assert.ok(items.find(i=>i.setTitle.startsWith('D2.')).setChoiceValues.includes('Modul atau jobsheet cetak'));
const pattern=new RegExp(items.find(i=>i.setTitle==='Nomor presensi').setValidation.pattern);
for(const value of ['1','01','24','99'])assert.ok(pattern.test(value));
for(const value of ['0','100','1.5','abc','17528'])assert.ok(!pattern.test(value));
const namePattern=new RegExp(items.find(i=>i.setTitle==='Nama lengkap').setValidation.pattern);
assert.ok(namePattern.test('Siswa Uji'));assert.ok(!namePattern.test('   '));
assert.equal(settings.setIsQuiz,false);assert.equal(settings.setCollectEmail,false);assert.equal(settings.setPublishingSummary,false);assert.equal(settings.setProgressBar,true);
assert.ok(items.every(i=>!Object.hasOwn(i,'benar')&&!Object.hasOwn(i,'setPoints')),'Answer-key metadata does not enter respondent questions');
assert.ok(items.every(i=>!i.setTitle.includes('Kunci jawaban')));
const snapshot=JSON.stringify(items);context.buatAsesmenDiagnostikFusion();
assert.equal(creates,1);assert.equal(JSON.stringify(items),snapshot);assert.ok(logs.some(s=>s.includes('Tautan edit guru')));
console.log('Lulus: 4 halaman/28 isian wajib, identitas, 10 soal dan kunci terpisah, 8 kesulitan dengan opsi belum mencoba, kebutuhan netral/2 esai, validasi, draf dan privasi, ulang tanpa duplikasi. Uji mock, bukan akun Google nyata.');
