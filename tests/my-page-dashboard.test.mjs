import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const html=readFileSync(new URL('index.html',root),'utf8');
const js=readFileSync(new URL('my-page-auth.js',root),'utf8');
const css=readFileSync(new URL('my-page-iphone.css',root),'utf8');

test('a My Page mantém JavaScript válido e seu fluxo de login',()=>{
 assert.doesNotThrow(()=>new Function(js.replace(/^import\s+[^;]+;/gm,'')));
 assert.match(js,/async function loadAccount\(\)/);
 assert.match(js,/renderYouthSignup\(user,verifiedAdmin,current\)/);
 assert.match(js,/client\.auth\.getUser\(\)/);
 assert.match(js,/passwordRecovery/);
 assert.match(js,/client\.auth\.signOut\(\)/);
});
test('todos os atalhos usam ações reais ou explicam o que ainda não está ativo',()=>{
 for(const key of ['profile','interactions','saved'])assert.match(html,new RegExp('data-fju-youth-panel="'+key+'"'));
 assert.match(html,/href="\.\/check-in\/"/);
 assert.match(html,/href="\.\/eventos\/"/);
 assert.match(html,/href="\.\/materias\.html"/);
 assert.match(html,/id="fju-youth-admin-tile"[^>]*hidden/);
 assert.match(js,/byId\('fju-youth-admin-tile'\)\.hidden=!verifiedAdmin/);
 assert.match(js,/saving articles is coming soon/i);
});
test('painel jovem: cabeçalho com foto, nome, polo e patente do cadastro',()=>{
 for(const id of ['fju-youth-dashboard','fju-youth-profile-pane','fju-youth-interactions-pane','fju-youth-saved-pane','fju-youth-hero-photo','fju-youth-hero-name','fju-youth-hero-polo','fju-youth-hero-rank','fju-youth-subpage-head','fju-youth-back']){
  assert.match(html,new RegExp('id="'+id+'"'));
 }
 assert.match(js,/function syncYouthHero\(\)/);
 assert.match(js,/fju-member-card-name/);
 assert.match(js,/fju-member-card-photo/);
 assert.match(js,/fju-member-card-rank/);
 assert.match(js,/function showYouthPanel/);
 assert.match(js,/showView\('account'\);\s*syncYouthHero\(\)/);
});
test('preserva controles importantes do cadastro e do perfil',()=>{
 for(const id of ['fju-member-collectible','fju-account-email','fju-account-admin-access','fju-account-member-note','fju-account-logout'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(js,/byId\('fju-youth-profile-pane'\)\.append\(section\)/);
 assert.match(js,/fju-consultar-minha-inscricao|fju_consultar_minha_inscricao/);
 assert.match(js,/fju_consultar_meu_cartao_jovem/);
 assert.match(js,/fju-preferred-language-select/);
});
test('aparência de app é restrita à conta autenticada e acessível',()=>{
 assert.match(html,/my-page-iphone\.css\?v=20261026-youth-dashboard/);
 assert.match(html,/my-page-auth\.js\?v=20261026-youth-dashboard/);
 assert.match(css,/#fju-account-dialog\[data-fju-view="account"\]/);
 assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length);
 const ids=[...html.matchAll(/\bid="(fju-youth-[a-z0-9-]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
});
test('menu é multilíngue: português, japonês e inglês',()=>{
 for(const k of ['youthOverline','youthProfile','youthInteractions','youthEvents','youthSaved','youthAdmin','youthBack','youthSavedText'])assert.equal(js.split(k+":").length,4,k);
 assert.match(html,/data-fju-auth-i18n="youthInteractions"/);
 assert.match(js,/localeSelect\?\.addEventListener\('change'/);
});
