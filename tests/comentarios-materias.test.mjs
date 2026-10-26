import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const dir=new URL('../',import.meta.url);
const js=readFileSync(new URL('comentarios-materias.js',dir),'utf8');
const sql=readFileSync(new URL('supabase/20261026_comentarios_materias.sql',dir),'utf8');
const html=readFileSync(new URL('materia.html',dir),'utf8');
const css=readFileSync(new URL('comentarios-materias.css',dir),'utf8');

test('script de comentários tem sintaxe válida e não injeta texto como HTML',()=>{
 const code=js.replace(/^import\s+[^;]+;/gm,'');
 assert.doesNotThrow(()=>new Function(code));
 assert.match(js,/const element=.*document\.createElement/);
 assert.match(js,/\.textContent=String\(text\)/);
 assert.doesNotMatch(js,/innerHTML\s*=/);
});
test('comentários são visíveis ao público mas publicação exige login e cadastro',()=>{
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.fju_listar_comentarios_materia\(uuid,integer,integer\) TO anon,authenticated;/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.fju_publicar_comentario_materia\(uuid,text\) TO authenticated;/);
 assert.match(sql,/IF v_uid IS NULL THEN RAISE EXCEPTION/);
 assert.match(sql,/IF v_nome IS NULL THEN RAISE EXCEPTION/);
 assert.match(sql,/Cadastre a foto de perfil antes de comentar/);
 assert.match(js,/db\.auth\.getUser\(\)/);
});
test('nome do comentário sempre vem do perfil FJU autenticado',()=>{
 assert.match(sql,/public\.fju_nome_autor_comentario\(v_uid\)/);
 assert.match(sql,/fju_vinculos_conta_jovem/);
 assert.match(sql,/fju_inscricoes_jovens/);
 assert.match(sql,/fju_coordenador_cards/);
 assert.match(sql,/INSERT INTO public\.fju_materias_comentarios_perfil\(materia_id,autor_id,autor_nome,texto\)/);
 assert.doesNotMatch(js,/p_autor_nome/);
});
test('foto original permanece privada e publicação envia cópia automática',()=>{
 assert.match(js,/sourceProfilePhoto\(user\)/);
 assert.match(js,/fju-coordenadores/);
 assert.match(js,/fju-inscricoes-fotos/);
 assert.match(js,/\.upload\(validUser\.id\+'\/perfil\.jpg',profileBlob/);
 assert.match(sql,/fju-comentarios-avatars/);
 assert.match(js,/t\(\)\.preview/);
});
test('somente o autor ou o Nacional pode excluir comentário',()=>{
 assert.match(sql,/v_permitido:=v_autor=auth\.uid\(\) OR EXISTS\(/);
 assert.match(sql,/p\.papel='nacional'/);
 assert.match(sql,/removido_em=now\(\)/);
});
test('interface só aparece em matéria publicada',()=>{
 assert.match(html,/id="fju-materia-comments"[^>]+hidden/);
 assert.match(html,/fju:article-ready/);
 assert.match(html,/comentarios-materias\.js\?v=/);
 assert.match(html,/comentarios-materias\.css\?v=/);
 assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length);
});

test('tabela identificada é independente do esquema legado sem excluir dados',()=>{
 assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.fju_materias_comentarios_perfil\(/);
 assert.match(sql,/CREATE INDEX IF NOT EXISTS fju_comentarios_perfil_materia_data/);
 assert.doesNotMatch(sql,/CREATE TABLE IF NOT EXISTS public\.fju_materias_comentarios\(/);
 assert.doesNotMatch(sql,/DROP TABLE|DELETE FROM public\.fju_materias_comentarios|TRUNCATE/);
});
