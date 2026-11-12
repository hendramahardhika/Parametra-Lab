import {readFile,writeFile} from 'node:fs/promises';
const file=name=>new URL(name,import.meta.url);
export async function build(){
  const [layout,assets,viewer,app]=await Promise.all(['halaman.html','materi.json','viewer.js','app.js'].map(n=>readFile(file(n),'utf8')));
  const {tasks,guide,clinic}=JSON.parse(assets);
  if(!tasks.length||guide.length!==9||!clinic.length)throw Error('Materi belum lengkap');
  for(const t of tasks)if(!t.hints?.length||!t.pdf.startsWith('JVBER')||!(t.model||t.image))throw Error('Aset latihan tidak lengkap: '+t.id);
  const parts={__MATERIALS__:assets.replace(/</g,'\\u003c'),__VIEWER__:viewer,__APP__:app};
  parts.__VIDEO__=(await readFile(file('animation-piston-white.mp4'))).toString('base64');
  return layout.replace(/__MATERIALS__|__VIEWER__|__APP__|__VIDEO__/g,key=>parts[key]);
}
if(process.argv.includes('--dev')){
  const {createServer}=await import('node:http');
  const server=createServer(async(req,res)=>{if(req.url?.split('?')[0]!=='/'&&req.url?.split('?')[0]!=='/index.html'){res.writeHead(404).end();return}
    try{const html=await build();res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}).end(html)}catch{res.writeHead(500).end('Gagal membaca sumber.')}});
  const port=Number(process.env.PORT||5173);
  server.listen(port,'127.0.0.1',()=>console.log('http://127.0.0.1:'+server.address().port+'/'));
}else{
  const html=await build();
  await writeFile(file('../index.html'),html);console.log('index.html siap: '+(Buffer.byteLength(html)/1048576).toFixed(2)+' MiB.');
}
