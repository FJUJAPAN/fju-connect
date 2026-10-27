import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const auth=readFileSync(new URL('my-page-auth.js',root),'utf8');
const index=readFileSync(new URL('index.html',root),'utf8');
const sql=readFileSync(new URL('supabase/20261027_cadastro_grupos_igreja.sql',root),'utf8');

test('foto permanece visível e obrigatória para todos os grupos',()=>{
 assert.match(auth,/signupDetails\.root\.hidden=false;/);
 assert.match(auth,/field\.required=key==='photo'\|\|youth/);
 assert.match(auth,/if\(key!=='photo'\)field\.closest\('label'\)\.style\.display=youth\?'grid':'none'/);
 assert.match(auth,/signupPolo\.required=youth;/);
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
 assert.match(index,/my-page-auth\.js\?v=20261027-(?:cadastro-grupos-foto|my-page-navegacao)/);
});
