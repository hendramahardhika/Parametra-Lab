// Component state and scroll-ref regression check; not a browser rendering test.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { build } from 'esbuild';

const root=process.cwd();
const source=(await readFile('app/components/local-teacher-panel.tsx','utf8'))
  .replace(/^import \{.*\} from 'react';\r?\n/m,'');
const output=await build({stdin:{contents:source,loader:'tsx',resolveDir:path.join(root,'app/components')},bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',plugins:[{
  name:'no-user-storage',setup(b){
    b.onResolve({filter:/^@\/local\/storage$/},()=>({path:'storage',namespace:'test'}));
    b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export async function readLocalTeacherProgress(){return []}'}));
  },
}]});
const pupils=['XI TP 1','XI TP 2'].flatMap((className,c)=>[1,2,3].map(attendance=>({
  id:`student:${c}:${attendance}`,className,attendance,name:`Siswa ${c+1}-${attendance}`,completedModules:0,lastActivity:null,modules:[],
})));
const original=JSON.stringify(pupils), states=[],refs=[],previousEffects=[];
let stateCursor=0,refCursor=0,effectCursor=0,pending=[];
const scroll={scrollTop:0};
const useState=initial=>{
  const slot=stateCursor++;
  if(!(slot in states))states[slot]=slot===0?pupils:initial;
  return [states[slot],value=>{states[slot]=typeof value==='function'?value(states[slot]):value;}];
};
const useRef=initial=>{const slot=refCursor++;return refs[slot]??=( {current:initial} );};
const useEffect=(fn,deps)=>{
  const slot=effectCursor++,previous=previousEffects[slot];previousEffects[slot]=deps;
  // Do not start storage reads/window listeners; exercise the actual scroll effect.
  if(deps.length===2 && ['XI TP 1','XI TP 2'].includes(deps[0]) && (!previous||deps.some((v,i)=>v!==previous[i])))pending.push(fn);
};
const module={exports:{}};
new Function('require','module','exports','useState','useRef','useEffect','useCallback',output.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports,useState,useRef,useEffect,fn=>fn);
function walk(tree){
  const nodes=[];function visit(node){if(Array.isArray(node))return node.forEach(visit);if(!node?.props)return;nodes.push(node);visit(node.props.children);}visit(tree);return nodes;
}
function render(){
  stateCursor=refCursor=effectCursor=0;pending=[];
  const nodes=walk(module.exports.LocalTeacherPanel());
  const list=nodes.find(n=>n.props.className==='teacher-student-buttons');
  list.props.ref.current=scroll;pending.forEach(fn=>fn());
  return nodes;
}
const classButton=(nodes,name)=>nodes.find(n=>n.props.className==='teacher-class-button' && walk(n).some(child=>child.type==='b'&&child.props.children===name));
const studentButtons=nodes=>nodes.filter(n=>n.props.className==='teacher-student-button');
let nodes=render();
assert.ok(nodes.some(n=>n.props['aria-label']==='Daftar siswa XI TP 1'));
assert.equal(studentButtons(nodes).length,3);
studentButtons(nodes)[1].props.onClick();nodes=render();
assert.ok(studentButtons(nodes)[1].props['aria-pressed']);
nodes.find(n=>n.type==='input').props.onChange({target:{value:'1-2'}});nodes=render();
assert.equal(studentButtons(nodes).length,1);
scroll.scrollTop=480;classButton(nodes,'XI TP 2').props.onClick();
assert.equal(scroll.scrollTop,0,'Class click resets the previous list immediately');
scroll.scrollTop=480;nodes=render();
assert.equal(scroll.scrollTop,0,'Reset again after the new class is committed');
assert.equal(nodes.find(n=>n.type==='input').props.value,'','Search is cleared');
assert.equal(nodes.find(n=>n.props.className==='teacher-student-buttons').key,'XI TP 2');
assert.ok(nodes.some(n=>n.props['aria-label']==='Daftar siswa XI TP 2'));
assert.equal(classButton(nodes,'XI TP 2').props['aria-pressed'],true);
assert.equal(classButton(nodes,'XI TP 1').props['aria-pressed'],false);
assert.equal(studentButtons(nodes).length,3);
assert.ok(studentButtons(nodes).every(n=>!n.props['aria-pressed']),'Old student selection is cleared');
assert.ok(studentButtons(nodes).every(n=>walk(n).some(child=>child.type==='b'&&child.props.children.startsWith('Siswa 2-'))));
studentButtons(nodes)[0].props.onClick();nodes=render();
assert.equal(studentButtons(nodes)[0].props['aria-pressed'],true);
scroll.scrollTop=250;classButton(nodes,'XI TP 2').props.onClick();nodes=render();
assert.equal(scroll.scrollTop,0,'Clicking the active class also returns to the top');
assert.ok(studentButtons(nodes).every(n=>!n.props['aria-pressed']));
scroll.scrollTop=250;classButton(nodes,'XI TP 1').props.onClick();nodes=render();
assert.equal(scroll.scrollTop,0);assert.ok(nodes.some(n=>n.props['aria-label']==='Daftar siswa XI TP 1'));
scroll.scrollTop=250;nodes.find(n=>n.type==='input').props.onChange({target:{value:'1-3'}});nodes=render();
assert.equal(scroll.scrollTop,0,'Filtering returns to the first result');assert.equal(studentButtons(nodes).length,1);
assert.equal(JSON.stringify(pupils),original,'Class switching cannot change pupil/progress data');
console.log('Lulus: XI TP 1 ↔ XI TP 2, label/nama/pilihan aktif, hapus pencarian & pilihan lama, reset gulir sebelum/sesudah render termasuk klik kelas aktif, data siswa tidak berubah. Uji state/ref, bukan browser.');
