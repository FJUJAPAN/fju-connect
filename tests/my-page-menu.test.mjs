import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=new URL('../',import.meta.url);
const menu=readFileSync(new URL('my-page-menu.js',base),'utf8');
const auth=readFileSync(new URL('my-page-auth.js',base),'utf8');
const css=readFileSync(new URL('my-page-menu.css',base),'utf8');
const html=readFileSync(new URL('index.html',base),'utf8');

test('novos módulos Javascript têm sintaxe válida',()=>{
 assert.doesNotThrow(()=>new Function(menu));
 assert.doesNotThrow(()=>new Function(auth.replace(/^import\s+[^;]+;/gm,'')));
 assert.match(auth,/import '\.\/my-page-menu\.js\?v=/);
 assert.match(html,/my-page-menu\.css\?v=/);
 assert.match(html,/my-page-auth\.js\?v=20261026-iphone-menu/);
});
test('My Page do jovem tem menu funcional e sem Meu FJU',()=>{
 for(const name of ['profile','checkin','interactions','events','saved'])assert.match(menu,new RegExp("tile\\('"+name+"'"));
 assert.match(menu,/\.\/check-in\//);
 assert.match(menu,/\.\/eventos\//);
 assert.match(menu,/\.\/materias\.html/);
 assert.match(menu,/tile\('admin','https:\/\/fjujapan\.github\.io\/fju-connect-admin\/'\)/);
 assert.doesNotMatch(menu,/tile\('meu-fju'/);
 assert.match(menu,/node\.addEventListener\('click',\(\)=>navigate\(name,true\)\)/);
 assert.match(menu,/last==='home'/);
});
test('cadastro, ficha e acesso dos coordenadores são preservados',()=>{
 assert.match(auth,/renderYouthSignup\(user,verifiedAdmin,current\)/);
 assert.match(auth,/fju_consultar_meu_cartao_jovem/);
 assert.match(auth,/fju_consultar_minha_inscricao/);
 assert.match(auth,/client\.auth\.getUser\(\)/);
 assert.match(auth,/client\.auth\.signOut\(\)/);
 assert.match(auth,/byId\('fju-mypage-admin-tile'\)\.hidden=!verifiedAdmin/);
 assert.match(auth,/accountAccess\.hidden=!verifiedAdmin/);
 assert.match(auth,/byId\('fju-mypage-profile'\)\?\.append\(section\)/);
});
test('UI em português, japonês e inglês; Salvos não promete função inexistente',()=>{
 for(const x of ["pt:{intro:","ja:{intro:","en:{intro:","savedText:","interactionsText:"])assert.ok(menu.includes(x));
 assert.match(menu,/saving articles is not yet available|Saving articles is not yet available/);
 assert.match(menu,/root\.querySelectorAll\('\[data-mypage-text\]'\)/);
 assert.match(auth,/FjuMyPageUI\?\.localize\(\)/);
});
test('interface clean isolada da autenticação e adaptada para iPhone',()=>{
 assert.match(auth,/dialog\.dataset\.view=view/);
 assert.match(css,/#fju-account-dialog\[data-view="account"\]/);
 assert.match(css,/@media\(max-width:740px\)/);
 assert.match(css,/100dvh/);
 assert.match(css,/env\(safe-area-inset-bottom/);
 assert.match(css,/\.fju-mypage-grid/);
 assert.match(css,/:focus-visible/);
 assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length);
});
test('sem HTML interpolado com dados da pessoa e sem dependência de SQL',()=>{
 assert.doesNotMatch(menu,/innerHTML\s*=/);
 assert.match(menu,/node\.textContent=/);
 assert.doesNotMatch(menu,/client\.from\(|client\.rpc\(|createClient/);
});
