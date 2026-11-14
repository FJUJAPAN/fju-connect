import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const auth=readFileSync(new URL('my-page-auth.js',root),'utf8');
const index=readFileSync(new URL('index.html',root),'utf8');
const sql=readFileSync(new URL('supabase/20261027_cadastro_grupos_igreja.sql',root),'utf8');

test('a ficha detalhada FJU pede foto e dados no fluxo correto',()=>{
 assert.match(auth,/signupDetails\.root\.hidden=youth&&!coordinator;/);
 assert.match(auth,/field\.required=coordinator\|\|\(!youth&&key==='photo'\);/);
 assert.match(auth,/if\(key!=='photo'\)field\.closest\('label'\)\.style\.display=youth\?'grid':'none'/);
 assert.match(auth,/signupPolo\.hidden=youth&&!coordinator;signupProjects\.hidden=true;/);
 assert.match(auth,/signupPolo\.required=coordinator;/);
 assert.match(auth,/const photo=await prepareSignupPhoto\(details\.fields\.photo\.files\[0\]\)/);
 assert.match(auth,/const input=document\.createElement\(key==='nationality'\?'select':'input'\);input\.required=true;/);
});

test('escolha do grupo é recuperável após confirmação de email',()=>{
 assert.match(auth,/signup_group:details\.group/);
 assert.match(auth,/user\.user_metadata\?\.signup_group/);
 assert.match(auth,/if\(!pendingGroup&&requestedChurchGroup\)/);
 assert.match(auth,/finishChurchGroupSignup\(user,pendingGroup/);
});

test('contas dos demais grupos não criam ficha nem usam patente da FJU',()=>{
 assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.fju_contas_grupos_igreja/);
 assert.match(sql,/fju_cadastrar_grupo_igreja/);
 assert.match(auth,/byId\('fju-member-card-polo'\)\.textContent=group\.grupo/);
 assert.match(auth,/byId\('fju-member-card-rank'\)\.textContent=/);
});

test('HTML atualiza versão do javascript do cadastro',()=>{
 assert.match(index,/my-page-auth\.js\?v=\d{8}-[\w-]+/);
});
