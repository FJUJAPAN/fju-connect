import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const nav=read('my-page-dashboard.js'),auth=read('my-page-auth.js'),css=read('my-page-auth.css');
const index=read('index.html'),article=read('materia.html');

test('dashboard e login mantêm sintaxe JavaScript válida',()=>{
 for(const script of [nav,auth])assert.doesNotThrow(()=>new Function(script.replace(/^import\s+[^;]+;/gm,'').replace(/^export /gm,'')));
});
test('grade de seis opções usa destinos reais e screens internas',()=>{
 for(const key of ['profile','checkin','interactions','events','saved','settings'])assert.match(nav,new RegExp(key+":"));
 assert.match(nav,/'\.\/check-in\/'/);
 assert.match(nav,/'\.\/materias\.html'/);
 assert.match(nav,/'\.\/eventos\/'/);
 assert.match(nav,/showScreen\(key\)/);
 assert.match(nav,/home\.hidden=tab!=='home'/);
 assert.match(nav,/profile\.append\(node\)/);
 assert.match(nav,/settings\.append\(node\)/);
});
test('reaproveita cadastro, foto, hierarquia e login existentes',()=>{
 assert.match(auth,/import \{mountFjuMyPage,setFjuMyPageLanguage,clearFjuMyPage\}/);
 assert.match(auth,/mountFjuMyPage\(user\.id,lang\(\)\)/);
 assert.match(auth,/renderYouthSignup\(user,verifiedAdmin,current\)/);
 assert.match(auth,/client\.auth\.getUser\(\)/);
 assert.match(auth,/fju_consultar_meu_cartao_jovem/);
 assert.match(nav,/fju-member-card-photo/);
 assert.match(nav,/fju-youth-signup/);
 assert.match(nav,/fju-account-admin-access/);
 assert.match(nav,/fju-account-logout/);
});
test('salvos pertencem à conta atual neste dispositivo e têm link de remoção',()=>{
 assert.match(nav,/fju_saved_articles_v1_'\+userId/);
 assert.match(article,/fju_saved_articles_v1_'\+user\.id/);
 assert.match(article,/db\.auth\.getUser\(\)/);
 assert.match(nav,/saveRecords\(readSaved\(\)\.filter\(item=>item\.id!==entry\.id\)\)/);
 assert.match(nav,/encodeURIComponent\(entry\.id\)/);
 assert.doesNotMatch(nav,/localStorage\.setItem\('fju_saved_articles_v1_'\s*,/);
});
test('visão do painel usa português, japonês e inglês, visual de iPhone',()=>{
 assert.match(nav,/pt:\{/);assert.match(nav,/ja:\{/);assert.match(nav,/en:\{/);
 assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(index,/my-page-auth\.js\?v=20261026-iphone/);
 assert.match(index,/my-page-auth\.css\?v=20261026-iphone/);
 assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length);
});
