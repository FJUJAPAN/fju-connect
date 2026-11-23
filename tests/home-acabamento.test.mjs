import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const home=readFileSync(new URL('index.html',root),'utf8');

test('sem textos provisórios visíveis na home',()=>{
 assert.doesNotMatch(home,/class="project-note"/);
 assert.doesNotMatch(home,/id="editorToggle"/);
});

test('numeração das seções em sequência, sem repetir',()=>{
 const nums=[...home.matchAll(/<span class="kicker">(\d\d) \//g)].map(m=>m[1]);
 assert.ok(nums.length>=4);
 assert.deepEqual(nums,nums.map((_,i)=>String(i+1).padStart(2,'0')));
});

test('todas as fontes têm reserva sans-serif',()=>{
 const semReserva=[...home.matchAll(/font(?:-family)?:[^;}"<>]*'(?:Space Grotesk|DM Sans|Noto Sans JP)'[^;}"<>]*/g)].map(m=>m[0]).filter(d=>!/serif/.test(d));
 assert.deepEqual(semReserva,[]);
});

test('prévia de compartilhamento completa',()=>{
 for(const p of ['og:title','og:description','og:image','og:url'])assert.match(home,new RegExp(`property="${p}"`));
 assert.ok(existsSync(new URL('assets/og-fju-japan.jpg',root)));
});

test('zoom travado de propósito, para a home funcionar como app',()=>{
 assert.match(home,/maximum-scale=1, user-scalable=no/);
});

test('comportamento de app em todas as páginas com o menu do celular',()=>{
 const js=readFileSync(new URL('unified-mobile-header.js',root),'utf8');
 assert.match(js,/gesturestart/);
 assert.match(js,/touch-action:manipulation/);
 assert.match(js,/font-size:16px!important/);
 for(const p of ['index.html','check-in/index.html','encontre-a-fju/index.html','eventos/index.html','materia.html','materias.html','polos/hamamatsu/index.html','projetos/index.html','ranking/index.html']){
  const html=readFileSync(new URL(p,root),'utf8');
  assert.match(html,/user-scalable=no/,p);
  assert.match(html,/unified-mobile-header\.js\?v=20261123-app-1/,p);
 }
});

test('páginas sem fotos embutidas no HTML (carregam leves)',()=>{
 for(const p of ['index.html','eventos/index.html','polos/hamamatsu/index.html','encontre-a-fju/index.html','materia.html','materias.html']){
  const html=readFileSync(new URL(p,root),'utf8');
  assert.doesNotMatch(html,/base64,[A-Za-z0-9+\/=]{1000,}/,p);
  for(const m of html.matchAll(/(?:\.\.\/)*assets\/img\/([0-9a-f]{12}\.(?:webp|jpg|png|gif|svg))/g)){
   assert.ok(existsSync(new URL('assets/img/'+m[1],root)),p+' -> '+m[1]);
  }
 }
});

test('nova ordem da home: polos logo após o hero, projetos oficiais, música e Universal no rodapé',()=>{
 const pos=id=>home.indexOf(`id="${id}"`);
 const ordem=['inicio','polos','projetos','live','galeria','historias','acao'].map(pos);
 assert.ok(ordem.every(p=>p>0));
 assert.deepEqual(ordem,[...ordem].sort((a,b)=>a-b));
 for(const k of ['projectMedia','projectSports','projectCulture','projectHelp','projectBjj','projectUniforca'])assert.match(home,new RegExp(`<h3 data-i18n="${k}"`));
 assert.match(home,/class="btn pv2-all" href="projetos\/"/);
 assert.doesNotMatch(home,/id="musica"|id="fju-universal-news"|href="#musica"/);
 assert.match(home,/footer-links[^]*open\.spotify\.com[^]*universaljp\.org/);
});
