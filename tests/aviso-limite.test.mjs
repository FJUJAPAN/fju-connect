import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
test('aviso de limite carrega antes do Supabase em todas as páginas que usam o servidor',()=>{
 for(const p of ['index.html','check-in/index.html','encontre-a-fju/index.html','eventos/index.html','materia.html','materias.html','polos/hamamatsu/index.html','projetos/index.html','ranking/index.html']){
  const s=readFileSync(new URL(p,root),'utf8');
  const i=s.indexOf('aviso-limite.js');
  assert.ok(i>0,p);
  const head=s.indexOf('</head>');
  assert.ok(i<head,p+' fora do <head>');
  const primeiroModulo=s.search(/<script[^>]*type="module"/);
  assert.ok(primeiroModulo===-1||i<primeiroModulo,p+' carrega depois de um módulo');
 }
 const js=readFileSync(new URL('aviso-limite.js',root),'utf8');
 assert.match(js,/status===402/);
 for(const k of ['pt:','ja:','en:'])assert.ok(js.includes(k));
});
