import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const js=read('my-page-auth.js'),html=read('index.html'),css=read('my-page-iphone.css'),article=read('materia.html');

test('auth permanece sintaticamente válido sem trocar a autenticação do Supabase',()=>{
 assert.doesNotThrow(()=>new Function(js.replace(/^import\s+[^;]+;/gm,'')));
 assert.match(js,/client\.auth\.getUser\(\)/);
 assert.match(js,/renderYouthSignup\(user,verifiedAdmin,current\)/);
});
test('telas dos seis atalhos possuem navegação e opção de voltar',()=>{
 for(const key of ['profile','interactions','saved','settings'])
  assert.match(html,new RegExp('data-fju-youth-panel="'+key+'"'));
 for(const key of ['profile','interactions','saved','settings'])
  assert.match(html,new RegExp('id="fju-youth-'+key+'-pane"'));
 assert.match(js,/youthPanel\(button\.dataset\.fjuYouthPanel\)/);
 assert.match(js,/byId\('fju-youth-back'\)\?\.addEventListener/);
 assert.match(js,/dialog\.dataset\.fjuView=view/);
});
test('perfil e cadastro usam foto e informações reais da conta, sem duplicar menus',()=>{
 assert.match(js,/syncYouthIdentity\(verifiedAdmin\)/);
 assert.match(js,/fju-member-card-photo/);
 assert.match(js,/fju-member-card-polo/);
 assert.match(js,/fju-member-card-rank/);
 assert.match(js,/fju-consultar-meu-cartao-jovem|fju_consultar_meu_cartao_jovem/);
 assert.doesNotMatch(js,/renderYouthMenu\(/);
 assert.match(js,/fju-youth-settings-content/);
});
test('interações, eventos, check-in e Salvos têm links e funções reais',()=>{
 assert.match(html,/href="\.\/check-in\/"/);
 assert.match(html,/href="\.\/eventos\/"/);
 assert.match(html,/href="\.\/materias\.html"/);
 assert.match(article,/db\.auth\.getUser\(\)/);
 assert.match(article,/fju_saved_articles_v1_'\+user\.id/);
 assert.match(js,/fju_saved_articles_v1_'\+activeYouthUserId/);
 assert.match(js,/renderYouthSaved\(\)/);
 assert.match(html,/id="fju-youth-saved-list"/);
});
test('UI traduzida, clean, responsiva e sem quebrar CSS',()=>{
 for(const key of ['youthProfile','youthSaved','youthSettings','youthBack'])assert.match(js,new RegExp(key+':'));
 assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/\@media\(max-width:740px\)/);
 assert.match(html,/my-page-auth\.js\?v=20261026-youth-menu-fix/);
 assert.match(html,/my-page-iphone\.css\?v=20261026-youth-menu-fix/);
 assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length);
});
