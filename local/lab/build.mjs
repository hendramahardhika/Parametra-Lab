// Optional rebuild of the restored studio; regular offline builds use lab.bundle.js.
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const here=path.dirname(fileURLToPath(import.meta.url));
const dependencyRoot=process.env.PARAMETRA_DEPENDENCIES;
const require=createRequire(dependencyRoot?path.join(path.resolve(dependencyRoot),'package.json'):import.meta.url);
const {build}=require('esbuild');
await build({entryPoints:[path.join(here,'main.tsx')],outfile:path.join(here,'../lab.bundle.js'),bundle:true,minify:true,format:'iife',platform:'browser',target:'es2020',jsx:'automatic',loader:{'.css':'text'},nodePaths:dependencyRoot?[path.join(path.resolve(dependencyRoot),'node_modules')]:[],define:{'process.env.NODE_ENV':'"production"'},legalComments:'inline'});
console.log('Lab 3D siap. Jalankan npm run build:offline.');
