import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=new URL('../',import.meta.url);
const sql=readFileSync(new URL('supabase/20261026_editar_comentarios.sql',base),'utf8');
const js=readFileSync(new URL('comentarios-materias.js',base),'utf8');
const css=readFileSync(new URL('comentarios-materias.css',base),'utf8');
const html=readFileSync(new URL('materia.html',base),'utf8');

test('sintaxe JS válida e editor não usa innerHTML',()=>{
 assert.doesNotThrow(()=>new Function(js.replace(/^import\s+[^;]+;/gm,'')));
 assert.match(js,/const editor=element\('div','fju-comment-editor'\)/);
 assert.match(js,/const textarea=element\('textarea','fju-comments-text'\)/);
 assert.match(js,/commentText\.textContent=text/);
 assert.doesNotMatch(js,/innerHTML\s*=/);
});
test('só autor autenticado pode editar; Nacional não edita terceiros',()=>{
 assert.match(sql,/v_uid:=auth\.uid\(\)/);
 assert.match(sql,/c\.autor_id=v_uid/);
 assert.match(sql,/c\.removido_em IS NULL/);
 assert.match(sql,/m\.status='publicada'/);
 assert.match(sql,/c\.parent_id IS NULL OR EXISTS/);
 assert.match(sql,/IF char_length\(v_texto\) NOT BETWEEN 1 AND 600/);
 assert.match(sql,/SET texto=v_texto,editado_em=now\(\)/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.fju_editar_comentario_materia\(uuid,text\) TO authenticated;/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.fju_editar_comentario_materia\(uuid,text\) FROM PUBLIC,anon;/);
 assert.doesNotMatch(sql,/autor_nome\s*=/);
});
test('listas v2 mantêm forma de APIs antigas, preservam curtidas e expõem marcador de edição',()=>{
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.fju_listar_interacoes_materia_v2/);
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.fju_listar_respostas_comentario_v2/);
 assert.match(sql,/editado_em timestamptz/);
 assert.match(sql,/fju_comentarios_curtidas/);
 assert.match(sql,/curtidas bigint,curtiu boolean/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.fju_listar_interacoes_materia_v2\(uuid,integer,integer\) TO anon,authenticated;/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.fju_listar_respostas_comentario_v2\(uuid,integer,integer\) TO anon,authenticated;/);
 assert.match(js,/fju_listar_interacoes_materia_v2/);
 assert.match(js,/fju_listar_respostas_comentario_v2/);
 assert.match(js,/fju_listar_interacoes_materia'/);
 assert.match(js,/fju_listar_respostas_comentario'/);
});
test('somente o autor vê editar no navegador; resposta também permite edição',()=>{
 assert.match(js,/currentUser\?\.id===row\.autor_id&&editingEnabled/);
 assert.match(js,/editButton=element\('button','fju-comment-edit',t\(\)\.edit\)/);
 assert.match(js,/fju_editar_comentario_materia/);
 assert.match(js,/if\(userError\|\|!user\|\|user\.id!==row\.autor_id\)/);
 assert.match(js,/updateEdited\(row\.editado_em\)/);
 assert.match(js,/commentText\.textContent=text;updateEdited\(data\)/);
 assert.match(js,/renderComment\(reply,true\)/);
});
test('interface trilingue e adaptação ao celular',()=>{
 for(const x of ['Salvar alteração','変更を保存','Save changes','Editado','編集済み','Edited'])assert.ok(js.includes(x));
 assert.match(html,/comentarios-materias\.js\?v=20261026-editar/);
 assert.match(css,/\.fju-comment-editor/);
 assert.match(css,/@media\(max-width:600px\)/);
 assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length);
});
test('migração idempotente e não destrutiva',()=>{
 assert.match(sql,/ADD COLUMN IF NOT EXISTS editado_em timestamptz/);
 assert.match(sql,/^BEGIN;/m);
 assert.match(sql,/^COMMIT;/m);
 assert.doesNotMatch(sql,/^\s*(?:DROP\s+TABLE|DELETE\s+FROM|TRUNCATE\s+TABLE)\b/gm);
});
