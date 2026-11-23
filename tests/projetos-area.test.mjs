import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const page=read('projetos/index.html');
const script=read('projetos/projetos.js');
const sql=read('supabase/20261123_projetos_area_membros.sql');
const home=read('index.html');
const mobile=read('unified-mobile-header.js');

test('Projetos no cabeçalho, no menu do celular e na barra de baixo',()=>{
 assert.match(home,/<a href="projetos\/" data-i18n="navProjects">/);
 assert.match(home,/<a href="projetos\/">Projetos<\/a>/);
 assert.match(home,/<a href="projetos\/"><svg[^>]*>.*?<\/svg>Projetos<\/a>/);
 assert.match(mobile,/new URL\('projetos\/',base\)\}">Projetos</);
});

test('a página consulta o acesso no banco, nunca decide sozinha',()=>{
 assert.match(script,/db\.rpc\('fju_projetos_acesso'\)/);
 assert.doesNotMatch(script,/from\('fju_jovens'\)/);
 assert.doesNotMatch(script,/innerHTML/);
});

test('os projetos da tela são os mesmos do banco',()=>{
 const values=[...script.matchAll(/value:'([^']+)'/g)].map(m=>m[1]);
 const catalog=sql.match(/unnest\(array\[([^\]]+)\]\)/)[1].match(/'([^']+)'/g).map(v=>v.slice(1,-1));
 assert.deepEqual(values,catalog);
});

test('funções de acesso fechadas para visitantes sem login',()=>{
 for(const fn of ['fju_meus_projetos()','fju_tem_projeto(text)','fju_projetos_acesso()']){
  assert.ok(sql.includes(`revoke all on function public.${fn} from public, anon;`),fn);
  assert.ok(sql.includes(`grant execute on function public.${fn} to authenticated;`),fn);
 }
 assert.equal((sql.match(/security definer set search_path = ''/g)||[]).length,3);
});

test('página com idioma, descrição e script do menu do celular',()=>{
 assert.match(page,/<meta name="description"/);
 assert.match(page,/unified-mobile-header\.js/);
 assert.match(page,/id="language"/);
});

test('nenhum link de navegação aponta mais para a seção antiga #projetos',()=>{
 for(const p of ['index.html','check-in/index.html','encontre-a-fju/index.html','eventos/index.html']){
  assert.doesNotMatch(read(p),/href="(\.\.\/)?#projetos"/,p);
 }
});
