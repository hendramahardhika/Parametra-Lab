// Mock-only check: no network, Google credentials, Forms creation or existing responses.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const items=[],properties=new Map(),logs=[],settings={};let creates=0;
function item(type){
  const data={type};items.push(data);
  const api={};
  for(const method of ['setTitle','setHelpText','setRequired','setValidation','setChoiceValues'])api[method]=value=>{data[method]=value;return api;};
  for(const method of ['setBounds','setLabels'])api[method]=(...values)=>{data[method]=values;return api;};
  return api;
}
const form={getId:()=> 'mock-form',getEditUrl:()=> 'mock-edit',getPublishedUrl:()=> 'mock-respond',getItems:type=>items.filter(i=>i.type===type).map(i=>({getTitle:()=>i.setTitle}))};
for(const method of ['setDescription','setIsQuiz','setCollectEmail','setLimitOneResponsePerUser','setPublishingSummary','setShowLinkToRespondAgain','setShuffleQuestions','setConfirmationMessage','setProgressBar'])form[method]=value=>{settings[method]=value;return form;};
for(const [method,type] of [['addTextItem','text'],['addMultipleChoiceItem','choice'],['addSectionHeaderItem','section'],['addScaleItem','scale'],['addPageBreakItem','page'],['addParagraphTextItem','paragraph']])form[method]=()=>item(type);
const context=vm.createContext({
  Logger:{log:value=>logs.push(value)},
  PropertiesService:{getScriptProperties:()=>({getProperty:key=>properties.get(key),setProperty:(key,value)=>properties.set(key,value)})},
  FormApp:{
    ItemType:{PAGE_BREAK:'page',PARAGRAPH_TEXT:'paragraph'},
    create:(title,published)=>{creates++;assert.equal(published,false);assert.ok(title.includes('Parametra Lab'));return form;},
    openById:id=>{assert.equal(id,'mock-form');return form;},
    createTextValidation:()=>{
      const data={},builder={};builder.requireTextMatchesPattern=pattern=>{data.pattern=pattern;return builder;};
      builder.setHelpText=text=>{data.help=text;return builder;};builder.build=()=>data;return builder;
    },
  },
});
vm.runInContext(await readFile('integrations/google-form/Angket-Parametra-Lab.gs','utf8'),context);
context.buatAngketParametraLab();
assert.equal(creates,1);
const scales=items.filter(i=>i.type==='scale'),texts=items.filter(i=>i.type==='text'),classes=items.find(i=>i.type==='choice');
assert.equal(scales.length,10);assert.equal(texts.length,2);assert.equal(items.filter(i=>i.type==='choice').length,1);
assert.deepEqual(Array.from(classes.setChoiceValues),['XI TP 1','XI TP 2']);
assert.ok([...scales,...texts,classes].every(i=>i.setRequired===true));
scales.forEach((i,n)=>{assert.deepEqual(Array.from(i.setBounds),[1,5]);assert.ok(i.setTitle.startsWith((n+1)+'. '));assert.equal(i.setLabels.length,2);});
const attendance=new RegExp(texts.find(i=>i.setTitle==='Nomor presensi').setValidation.pattern);
for(const good of ['1','01','09','10','24','99'])assert.ok(attendance.test(good));
for(const bad of ['','0','00','100','1.5','-1','abc','17528',' 1 '])assert.ok(!attendance.test(bad));
const name=new RegExp(texts.find(i=>i.setTitle==='Nama lengkap').setValidation.pattern);
for(const good of ['Aji Bayu Saputra',"MUS'AB MAHESWARA",' Siswa Satu '])assert.ok(name.test(good));
for(const bad of ['','   '])assert.ok(!name.test(bad));
assert.equal(settings.setIsQuiz,false);assert.equal(settings.setPublishingSummary,false);assert.equal(settings.setCollectEmail,false);
assert.equal(properties.get('PARAMETRA_ANGKET_FORM_ID'),'mock-form');
const essays=items.filter(i=>i.type==='paragraph');
assert.equal(essays.length,2);assert.ok(essays.every(i=>i.setRequired===true));
assert.ok(essays[0].setTitle.startsWith('11. '));assert.ok(essays[1].setTitle.startsWith('12. '));
assert.equal(items.filter(i=>i.type==='page').length,1);
const pageIndex=items.findIndex(i=>i.type==='page');
assert.ok(items.slice(0,pageIndex).filter(i=>i.type==='scale').length===10);
assert.deepEqual(items.slice(pageIndex+1).map(i=>i.type),['paragraph','paragraph']);
assert.equal(settings.setProgressBar,true);
const before=JSON.stringify(items);context.buatAngketParametraLab();
assert.equal(creates,1);assert.equal(JSON.stringify(items),before);assert.ok(logs.some(log=>log.includes('Tautan edit')));
// Simulate an existing pre-reflection form; the first-page items and responses stay intact.
items.splice(pageIndex);const originalPage=JSON.stringify(items),savedResponses=[{name:'Siswa uji',answers:[4,5,4]}];
const responsesBefore=JSON.stringify(savedResponses);
context.buatAngketParametraLab();assert.equal(creates,1);
assert.equal(JSON.stringify(items.slice(0,pageIndex)),originalPage);
assert.equal(JSON.stringify(savedResponses),responsesBefore);
assert.equal(items.filter(i=>i.type==='paragraph').length,2);assert.equal(items.filter(i=>i.type==='page').length,1);
// A previous interrupted addition can complete the missing essay without repeating the first one.
items.pop();context.buatAngketParametraLab();
assert.equal(items.filter(i=>i.type==='paragraph').length,2);assert.equal(items.filter(i=>i.type==='page').length,1);
const completed=JSON.stringify(items);context.buatAngketParametraLab();assert.equal(JSON.stringify(items),completed);
console.log('Lulus: 10 skala 1–5 + 3 identitas + 2 esai wajib di halaman baru; validasi/privasi; pembaruan form lama dan penambahan parsial tanpa duplikasi/pengubahan item lama. Uji mock, bukan akun Google nyata.');
