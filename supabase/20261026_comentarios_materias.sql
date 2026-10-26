-- FJU JAPAN | Comentários nas matérias publicados por usuários cadastrados.
-- Execute MANUALMENTE no Supabase SQL Editor depois do merge deste PR.
-- Comentários públicos; identidade do autor derivada exclusivamente do cadastro.
-- O envio do comentário copia automaticamente a foto de perfil para um avatar público, com aviso ao usuário.
BEGIN;

CREATE TABLE IF NOT EXISTS public.fju_materias_comentarios_perfil(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  materia_id uuid NOT NULL REFERENCES public.fju_materias(id) ON DELETE CASCADE,
  autor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  autor_nome text NOT NULL CHECK (char_length(btrim(autor_nome)) BETWEEN 2 AND 180),
  texto text NOT NULL CHECK (char_length(btrim(texto)) BETWEEN 1 AND 600),
  criado_em timestamptz NOT NULL DEFAULT now(),
  removido_em timestamptz,
  removido_por uuid REFERENCES auth.users(id)
);

-- O banco já possui uma tabela antiga chamada fju_materias_comentarios, com
-- colunas diferentes. A nova tabela abaixo usa nome próprio, preservando
-- integralmente a tabela antiga e seus registros. Não há DROP TABLE nem DELETE.

CREATE INDEX IF NOT EXISTS fju_comentarios_perfil_materia_data
  ON public.fju_materias_comentarios_perfil(materia_id,criado_em DESC,id DESC)
  WHERE removido_em IS NULL;
CREATE INDEX IF NOT EXISTS fju_comentarios_perfil_autor_data
  ON public.fju_materias_comentarios_perfil(autor_id,criado_em DESC);

ALTER TABLE public.fju_materias_comentarios_perfil ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.fju_materias_comentarios_perfil FROM PUBLIC,anon,authenticated;

-- Ao PUBLICAR, o usuário torna pública uma CÓPIA da foto que já está no seu perfil.
-- A interface explica isso ao lado do botão Comentar. Os buckets originais continuam privados.
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('fju-comentarios-avatars','fju-comentarios-avatars',true,358400,ARRAY['image/jpeg'])
ON CONFLICT (id) DO UPDATE SET
 public=EXCLUDED.public,file_size_limit=EXCLUDED.file_size_limit,
 allowed_mime_types=EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS fju_comentarios_avatar_inserir ON storage.objects;
CREATE POLICY fju_comentarios_avatar_inserir ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id='fju-comentarios-avatars'
    AND name=auth.uid()::text||'/perfil.jpg');
DROP POLICY IF EXISTS fju_comentarios_avatar_atualizar ON storage.objects;
CREATE POLICY fju_comentarios_avatar_atualizar ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id='fju-comentarios-avatars' AND name=auth.uid()::text||'/perfil.jpg')
  WITH CHECK (bucket_id='fju-comentarios-avatars' AND name=auth.uid()::text||'/perfil.jpg');
DROP POLICY IF EXISTS fju_comentarios_avatar_selecionar ON storage.objects;
CREATE POLICY fju_comentarios_avatar_selecionar ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id='fju-comentarios-avatars' AND name=auth.uid()::text||'/perfil.jpg');
DROP POLICY IF EXISTS fju_comentarios_avatar_excluir ON storage.objects;
CREATE POLICY fju_comentarios_avatar_excluir ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id='fju-comentarios-avatars' AND name=auth.uid()::text||'/perfil.jpg');

-- Helper não exposto aos usuários: obtém nome oficial da ficha aprovada ou
-- do cadastro pendente; exclui cadastros rejeitados.
CREATE OR REPLACE FUNCTION public.fju_nome_autor_comentario(p_usuario_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT COALESCE(
   (SELECT NULLIF(btrim(j.nome_completo),'')
     FROM public.fju_vinculos_conta_jovem v
     JOIN public.fju_jovens j ON j.id=v.jovem_id
     WHERE v.usuario_id=p_usuario_id AND v.ativo=true AND j.excluido_em IS NULL
     LIMIT 1),
   (SELECT NULLIF(btrim(c.nome_exibicao),'')
     FROM public.fju_coordenador_cards c
     JOIN public.fju_perfis p ON p.usuario_id=c.usuario_id
     WHERE c.usuario_id=p_usuario_id AND p.ativo AND p.papel IN ('coordenador','nacional')
     LIMIT 1),
   (SELECT NULLIF(btrim(i.nome),'')
     FROM public.fju_inscricoes_jovens i
     WHERE i.usuario_id=p_usuario_id AND i.status IN ('pendente','aprovado')
     LIMIT 1)
 );
$$;
REVOKE ALL ON FUNCTION public.fju_nome_autor_comentario(uuid) FROM PUBLIC,anon,authenticated;

-- O navegador recebe somente o NOME da própria conta, nunca pode inventar
-- nome de autor ao publicar.
CREATE OR REPLACE FUNCTION public.fju_meu_perfil_comentarios()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_nome text;
BEGIN
 IF auth.uid() IS NULL THEN RETURN jsonb_build_object('habilitado',false); END IF;
 v_nome:=public.fju_nome_autor_comentario(auth.uid());
 RETURN jsonb_build_object('habilitado',v_nome IS NOT NULL,'nome',v_nome);
END;$$;

CREATE OR REPLACE FUNCTION public.fju_publicar_comentario_materia(p_materia_id uuid,p_texto text)
RETURNS uuid LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_nome text;v_texto text;v_id uuid;v_uid uuid;
BEGIN
 v_uid:=auth.uid();
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Faça login para comentar'; END IF;
 v_nome:=public.fju_nome_autor_comentario(v_uid);
 IF v_nome IS NULL THEN RAISE EXCEPTION 'Conclua seu cadastro na FJU JAPAN antes de comentar'; END IF;
 IF NOT EXISTS (SELECT 1 FROM storage.objects
   WHERE bucket_id='fju-comentarios-avatars'
   AND name=v_uid::text||'/perfil.jpg') THEN
  RAISE EXCEPTION 'Cadastre a foto de perfil antes de comentar'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.fju_materias WHERE id=p_materia_id AND status='publicada')
 THEN RAISE EXCEPTION 'Esta matéria não está disponível para comentários'; END IF;
 v_texto:=btrim(coalesce(p_texto,''));
 IF char_length(v_texto) NOT BETWEEN 1 AND 600 THEN
   RAISE EXCEPTION 'Escreva de 1 a 600 caracteres'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('comentario-fju-'||v_uid::text,0));
 IF EXISTS(SELECT 1 FROM public.fju_materias_comentarios_perfil
  WHERE autor_id=v_uid AND criado_em>now()-INTERVAL '20 seconds') THEN
  RAISE EXCEPTION 'Aguarde 20 segundos antes de comentar novamente'; END IF;
 IF (SELECT count(*) FROM public.fju_materias_comentarios_perfil
   WHERE autor_id=v_uid AND criado_em>now()-INTERVAL '24 hours')>=30 THEN
  RAISE EXCEPTION 'Limite de comentários atingido. Tente novamente amanhã'; END IF;
 INSERT INTO public.fju_materias_comentarios_perfil(materia_id,autor_id,autor_nome,texto)
 VALUES(p_materia_id,v_uid,v_nome,v_texto) RETURNING id INTO v_id;
 RETURN v_id;
END;$$;

CREATE OR REPLACE FUNCTION public.fju_listar_comentarios_materia(
 p_materia_id uuid,p_limite integer DEFAULT 20,p_offset integer DEFAULT 0)
RETURNS TABLE(
 id uuid,autor_id uuid,autor_nome text,texto text,criado_em timestamptz,avatar_path text
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT c.id,c.autor_id,c.autor_nome,c.texto,c.criado_em,
  (c.autor_id::text||'/perfil.jpg')::text AS avatar_path
 FROM public.fju_materias_comentarios_perfil c
 JOIN public.fju_materias m ON m.id=c.materia_id
 WHERE c.materia_id=p_materia_id AND m.status='publicada' AND c.removido_em IS NULL
 ORDER BY c.criado_em DESC,c.id DESC
 LIMIT least(greatest(coalesce(p_limite,20),1),50)
 OFFSET least(greatest(coalesce(p_offset,0),0),10000);
$$;

CREATE OR REPLACE FUNCTION public.fju_remover_comentario_materia(p_comentario_id uuid)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_autor uuid;v_permitido boolean;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Faça login'; END IF;
 SELECT c.autor_id INTO v_autor FROM public.fju_materias_comentarios_perfil c
 WHERE c.id=p_comentario_id AND c.removido_em IS NULL FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Comentário não encontrado'; END IF;
 v_permitido:=v_autor=auth.uid() OR EXISTS(
  SELECT 1 FROM public.fju_perfis p
  WHERE p.usuario_id=auth.uid() AND p.ativo=true AND p.papel='nacional'
 );
 IF NOT v_permitido THEN RAISE EXCEPTION 'Sem permissão para excluir este comentário'; END IF;
 UPDATE public.fju_materias_comentarios_perfil
 SET removido_em=now(),removido_por=auth.uid() WHERE id=p_comentario_id;
END;$$;

REVOKE ALL ON FUNCTION public.fju_meu_perfil_comentarios() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.fju_publicar_comentario_materia(uuid,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.fju_listar_comentarios_materia(uuid,integer,integer) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.fju_remover_comentario_materia(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.fju_meu_perfil_comentarios() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fju_publicar_comentario_materia(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fju_listar_comentarios_materia(uuid,integer,integer) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.fju_remover_comentario_materia(uuid) TO authenticated;
COMMIT;
