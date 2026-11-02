import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=new URL('../',import.meta.url);
const js=readFileSync(new URL('my-page-auth.js',base),'utf8');
const html=readFileSync(new URL('index.html',base),'utf8');
const css=readFileSync(new URL('my-page-iphone.css',base),'utf8');
const requests=readFileSync(new URL('fju-solicitacoes-pontos.js',base),'utf8');
const points=readFileSync(new URL('fju-pontos-ranking.js',base),'utf8');

test('habilita a aparência iPhone na tela autenticada',()=>{
 assert.match(js,/dialog\.dataset\.fjuView=view;/);
 assert.match(css,/#fju-account-dialog\[data-fju-view="account"\]/);
});
test('abre painel do perfil, interações, e permite voltar ao dashboard',()=>{
 assert.match(js,/function showYouthPane\(target=''\)/);
 assert.match(js,/data-fju-youth-panel/);
 assert.match(js,/fju-youth-back/);
 assert.match(js,/activeYouthPane/);
 assert.match(html,/id="fju-youth-profile-pane"/);
 assert.match(html,/id="fju-youth-interactions-pane"/);
});
test('carrega nome, grupo e avatar no cartão principal sem atribuir privilégios',()=>{
 assert.match(js,/function syncYouthHero\(isAdmin=false,churchGroup=null\)/);
 assert.match(js,/const churchGroup=await renderYouthSignup/);
 assert.match(js,/syncYouthHero\(verifiedAdmin,churchGroup\)/);
 assert.match(js,/adminTile\.hidden=!verifiedAdmin/);
 assert.match(js,/if\(verifiedAdmin\)adminTile\.href/);
 assert.match(js,/return group\.grupo/);
});
test('não duplica menus, links admin nem anuncia função Salvos pendente',()=>{
 assert.doesNotMatch(js,/function renderYouthMenu/);
 assert.match(js,/if\(savedTile\)savedTile\.hidden=true/);
 assert.doesNotMatch(js,/fju-verified-admin-shortcut/);
 assert.match(html,/my-page-auth\.js\?v=\d{8}-[\w-]+/);
});
test('labels portugueses, japoneses e ingleses para o dashboard',()=>{
 assert.match(js,/youthMenuHeading:'Acesso rápido'/);
 assert.match(js,/youthMenuHeading:'クイックアクセス'/);
 assert.match(js,/youthMenuHeading:'Quick access'/);
});

test('troca de idioma atualiza metadados e não chama menu excluído',()=>{
 assert.match(js,/preferredLanguageUser=data\?\.user\|\|/);
 assert.doesNotMatch(js,/renderYouthMenu\(/);
 assert.match(js,/localeSelect\?\.addEventListener\('change'/);
});
test('alteração de senha na My Page tem confirmação e tradução',()=>{
 for(const id of ['fju-profile-password-form','fju-profile-password-new','fju-profile-password-confirm','fju-profile-password-status']){
  assert.match(html,new RegExp('id="'+id+'"'));
 }
 assert.match(js,/client\.auth\.updateUser\(\{password:newPassword\}\)/);
 assert.match(js,/newPassword\.length<8\|\|newPassword!==confirmPassword/);
 assert.match(js,/profilePasswordForm\?\.addEventListener\('submit'/);
 for(const translation of ["profileSecurityTitle:'Segurança da conta'","profileSecurityTitle:'アカウントのセキュリティ'","profileSecurityTitle:'Account security'"]){
  assert.ok(js.includes(translation));
 }
});

test('idioma preferido da conta também sincroniza o formulário de pontos',()=>{
 assert.match(js,/if\(localeSelect\)\{localeSelect\.value=savedLanguage;localeSelect\.dispatchEvent\(new Event\('change',\{bubbles:true\}\)\);\}/);
 assert.match(requests,/let renderedLanguage='';/);
 assert.match(requests,/new MutationObserver\(syncLanguage\)/);
 assert.match(requests,/window\.addEventListener\('pageshow',syncLanguage\)/);
 assert.match(html,/fju-pontos-ranking\.js\?v=20261102-idioma-pontos-1/);
});

test('cartão Meus pontos traduz quatro rótulos sem sobrescrever saldos',()=>{
 for(const key of ['mine','total','weekLabel','monthLabel']){
  assert.match(points,new RegExp('data-points-label="'+key+'"'));
 }
 assert.match(points,/node\.textContent=t\(node\.dataset\.pointsLabel\)/);
 assert.match(points,/async function refresh\(\)\{labels\(\);/);
 assert.match(points,/new MutationObserver\(\(\)=>\{labels\(\);/);
 assert.match(points,/window\.addEventListener\('pageshow',/);
 assert.doesNotMatch(points,/x\[2\]\.childNodes\[0\]/);
 assert.match(html,/fju-pontos-ranking\.js\?v=20261102-card-idioma-2/);
});
