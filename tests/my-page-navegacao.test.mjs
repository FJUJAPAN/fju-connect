import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=new URL('../',import.meta.url);
const js=readFileSync(new URL('my-page-auth.js',base),'utf8');
const html=readFileSync(new URL('index.html',base),'utf8');
const css=readFileSync(new URL('my-page-iphone.css',base),'utf8');

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
 assert.match(html,/my-page-auth\.js\?v=20261027-my-page-navegacao/);
});
test('labels portugueses, japoneses e ingleses para o dashboard',()=>{
 assert.match(js,/youthMenuHeading:'Acesso rápido'/);
 assert.match(js,/youthMenuHeading:'クイックアクセス'/);
 assert.match(js,/youthMenuHeading:'Quick access'/);
});
