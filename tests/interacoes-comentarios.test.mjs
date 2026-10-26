// Regras de segurança e regressão de curtidas e respostas da FJU JAPAN.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const base=new URL('../',import.meta.url);
const sql=readFileSync(new URL('supabase/20261026_curtidas_respostas_comentarios.sql',base),'utf8');
const js=readFileSync(new URL('comentarios-materias.js',base),'utf8');
const css=readFileSync(new URL('comentarios-materias.css',base),'utf8');
const page=readFileSync(new URL('materia.html',base),'utf8');

test('o script mantém sintaxe válida e exibe nome/textos sem injetar HTML',()=>{
 assert.doesNotThrow(()=>new Function(js.replace(/^import\s+[^;]+;/gm,'')));
 assert.match(js,/\.textContent=String\(text\)/);
 assert.doesNotMatch(js,/innerHTML\s*=/);
 assert.match(js,/row\.autor_nome/);
 assert.match(js,/publicAvatar\(row\.avatar_path/);
});
test('visitação anônima pode ler, mas não curtir nem responder',()=>{
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.fju_listar_interacoes_materia\(uuid,integer,integer\) TO anon,authenticated/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.fju_listar_respostas_comentario\(uuid,integer,integer\) TO anon,authenticated/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.fju_responder_comentario_materia\(uuid,text\) TO authenticated/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.fju_alternar_curtida_comentario\(uuid\) TO authenticated/);
 assert.match(sql,/IF v_uid IS NULL THEN RAISE EXCEPTION/);
 assert.match(sql,/public\.fju_nome_autor_comentario\(v_uid\)/);
 assert.match(sql,/bucket_id='fju-comentarios-avatars'/);
});
test('curtida é única por usuário e valida comentário publicado',()=>{
 assert.match(sql,/PRIMARY KEY\(comentario_id,usuario_id\)/);
 assert.match(sql,/ALTER TABLE public\.fju_comentarios_curtidas ENABLE ROW LEVEL SECURITY/);
 assert.match(sql,/REVOKE ALL ON public\.fju_comentarios_curtidas FROM PUBLIC,anon,authenticated/);
 assert.match(sql,/c\.removido_em IS NULL AND m\.status='publicada'/);
 assert.match(sql,/DELETE FROM public\.fju_comentarios_curtidas/);
 assert.match(sql,/RETURN true/);
 assert.match(sql,/RETURN false/);
});
test('resposta vinculada apenas ao comentário principal, sem encadeamento infinito',()=>{
 assert.match(sql,/ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public\.fju_materias_comentarios_perfil\(id\)/);
 assert.match(sql,/c\.id=p_comentario_id AND c\.parent_id IS NULL/);
 assert.match(sql,/INSERT INTO public\.fju_materias_comentarios_perfil\(materia_id,parent_id,autor_id,autor_nome,texto\)/);
 assert.match(sql,/INTERVAL '20 seconds'/);
 assert.match(sql,/count\(\*\).*fju_materias_comentarios_perfil/s);
 assert.match(sql,/AND c\.parent_id IS NULL/);
});
test('visitantes veem total de curtidas e respostas, mas não formulários anônimos',()=>{
 assert.match(js,/fju_listar_interacoes_materia/);
 assert.match(js,/fju_listar_respostas_comentario/);
 assert.match(js,/fju_alternar_curtida_comentario/);
 assert.match(js,/fju_responder_comentario_materia/);
 assert.match(js,/function canInteract\(\)/);
 assert.match(js,/await checkCommenter\(\)/);
 assert.match(js,/t\(\)\.interactLogin/);
 assert.match(js,/aria-pressed/);
 assert.match(js,/aria-expanded/);
 assert.match(js,/if\(!isReply\)/);
});
test('o fluxo anterior continua funcionando e o CSS é responsivo',()=>{
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.fju_listar_comentarios_materia\(/);
 assert.match(sql,/c\.parent_id IS NULL/);
 assert.match(js,/fju_listar_comentarios_materia/);
 assert.match(page,/comentarios-materias\.js\?v=20261026-interacoes/);
 assert.match(page,/comentarios-materias\.css\?v=20261026-interacoes/);
 assert.match(css,/fju-comment-thread/);
 assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length);
 assert.doesNotMatch(sql,/^\s*(?:DROP\s+TABLE|TRUNCATE\s+TABLE)\b/gm);
});
