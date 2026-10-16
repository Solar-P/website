import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import { JSDOM } from 'jsdom';
const base=(process.env.BASE_PATH||'').replace(/\/$/,'');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]);
const pages=walk('dist').filter(file=>file.endsWith('.html'));
for(const file of pages){const doc=new JSDOM(fs.readFileSync(file,'utf8')).window.document;assert.equal(doc.querySelectorAll('h1').length,1,file+' needs one H1');assert.ok(doc.title);assert.ok(doc.querySelector('meta[name="description"]'));
for(const el of doc.querySelectorAll('[href],[src]')){const raw=el.getAttribute('href')||el.getAttribute('src');if(!raw||/^(https?:|mailto:|data:|#)/.test(raw))continue;assert.ok(raw.startsWith(base+'/'),'base path: '+raw);const pathname=decodeURIComponent(raw.split(/[?#]/)[0].slice(base.length));let target=path.join('dist',pathname);if(pathname.endsWith('/'))target=path.join(target,'index.html');assert.ok(fs.existsSync(target),file+' missing '+raw);}}
const home=new JSDOM(fs.readFileSync('dist/index.html','utf8')).window.document;
assert.equal(home.querySelectorAll('.project-card').length,4);
assert.equal(home.querySelectorAll('#world .continent').length,5);
assert.equal(home.querySelectorAll('#world .island').length,116);
assert.deepEqual([...home.querySelectorAll('main > section')].map(s=>s.id),['','projects','about','experience','contact']);
assert.equal(pages.length,6);
console.log('PASS: '+pages.length+' static pages, four case studies, local assets/links, section order and original map geometry.');
