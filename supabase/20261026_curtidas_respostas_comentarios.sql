-- FJU JAPAN | Curtidas e respostas em comentários identificados das matérias.
-- Executar manualmente no Supabase SQL Editor APÓS PR aprovado e merge.
-- Pré-requisito: supabase/20261026_comentarios_materias.sql executado com sucesso.
-- A tabela antiga fju_materias_comentarios não é alterada.
BEGIN;

-- Respostas só podem citar comentário principal: validação feita pela RPC,
-- e não apenas pelo navegador.
ALTER TABLE public.fju_materias_comentarios_perfil
 ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.fju_materias_comentarios_perfil(id);
CREATE INDEX IF NOT EXISTS fju_comentarios_perfil_respostas_idx
 ON public.fju_materias_comentarios_perfil(parent_id,criado_em ASC,id ASC)
 WHERE parent_id IS NOT NULL AND removido_em IS NULL;

CREATE TABLE IF NOT EXISTS public.fju_comentarios_curtidas(
 comentario_id uuid NOT NULL REFERENCES public.fju_materias_comentarios_perfil(id) ON DELETE CASCADE,
 usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 criado_em timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(comentario_id,usuario_id)
);
CREATE INDEX IF NOT EXISTS fju_curtidas_usuario_idx
 ON public.fju_comentarios_curtidas(usuario_id,criado_em DESC);
ALTER TABLE public.fju_comentarios_curtidas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.fju_comentarios_curtidas FROM PUBLIC,anon,authenticated;

-- A versão anterior do site continua vendo apenas os comentários principais.
CREATE OR REPLACE FUNCTION public.fju_listar_comentarios_materia(
 p_materia_id uuid,p_limite integer DEFAULT 20,p_offset integer DEFAULT 0)
RETURNS TABLE(id uuid,autor_id uuid,autor_nome text,texto text,criado_em timestamptz,avatar_path text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT c.id,c.autor_id,c.autor_nome,c.texto,c.criado_em,
 (c.autor_id::text||'/perfil.jpg')::text AS avatar_path
 FROM public.fju_materias_comentarios_perfil c
 JOIN public.fju_materias m ON m.id=c.materia_id
 WHERE c.materia_id=p_materia_id AND m.status='publicada'
 AND c.removido_em IS NULL AND c.parent_id IS NULL
 ORDER BY c.criado_em DESC,c.id DESC
 LIMIT least(greatest(coalesce(p_limite,20),1),50)
 OFFSET least(greatest(coalesce(p_offset,0),0),10000);
$$;

-- Listagem pública com total de curtidas, curtida própria e número de respostas.
CREATE OR REPLACE FUNCTION public.fju_listar_interacoes_materia(
 p_materia_id uuid,p_limite integer DEFAULT 20,p_offset integer DEFAULT 0)
RETURNS TABLE(
 id uuid,autor_id uuid,autor_nome text,texto text,criado_em timestamptz,
 avatar_path text,curtidas bigint,curtiu boolean,respostas bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT c.id,c.autor_id,c.autor_nome,c.texto,c.criado_em,
 (c.autor_id::text||'/perfil.jpg')::text,
 (SELECT count(*) FROM public.fju_comentarios_curtidas k WHERE k.comentario_id=c.id),
 EXISTS(SELECT 1 FROM public.fju_comentarios_curtidas k
   WHERE k.comentario_id=c.id AND k.usuario_id=auth.uid()),
 (SELECT count(*) FROM public.fju_materias_comentarios_perfil r
   WHERE r.parent_id=c.id AND r.removido_em IS NULL)
 FROM public.fju_materias_comentarios_perfil c
 JOIN public.fju_materias m ON m.id=c.materia_id
 WHERE c.materia_id=p_materia_id AND m.status='publicada'
  AND c.removido_em IS NULL AND c.parent_id IS NULL
 ORDER BY c.criado_em DESC,c.id DESC
 LIMIT least(greatest(coalesce(p_limite,20),1),50)
 OFFSET least(greatest(coalesce(p_offset,0),0),10000);
$$;

-- Respostas em ordem cronológica para que a conversa seja fácil de acompanhar.
CREATE OR REPLACE FUNCTION public.fju_listar_respostas_comentario(
 p_comentario_id uuid,p_limite integer DEFAULT 20,p_offset integer DEFAULT 0)
RETURNS TABLE(
 id uuid,autor_id uuid,autor_nome text,texto text,criado_em timestamptz,
 avatar_path text,curtidas bigint,curtiu boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT r.id,r.autor_id,r.autor_nome,r.texto,r.criado_em,
 (r.autor_id::text||'/perfil.jpg')::text,
 (SELECT count(*) FROM public.fju_comentarios_curtidas k WHERE k.comentario_id=r.id),
 EXISTS(SELECT 1 FROM public.fju_comentarios_curtidas k
   WHERE k.comentario_id=r.id AND k.usuario_id=auth.uid())
 FROM public.fju_materias_comentarios_perfil r
 JOIN public.fju_materias_comentarios_perfil c ON c.id=r.parent_id
 JOIN public.fju_materias m ON m.id=c.materia_id
 WHERE c.id=p_comentario_id AND c.parent_id IS NULL
 AND c.removido_em IS NULL AND r.removido_em IS NULL
 AND r.materia_id=c.materia_id AND m.status='publicada'
 ORDER BY r.criado_em DESC,r.id DESC
 LIMIT least(greatest(coalesce(p_limite,20),1),50)
 OFFSET least(greatest(coalesce(p_offset,0),0),10000);
$$;

-- Autenticação, identidade e foto são verificadas pelo banco. Sem anonimato.
CREATE OR REPLACE FUNCTION public.fju_responder_comentario_materia(
 p_comentario_id uuid,p_texto text)
RETURNS uuid LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid;v_nome text;v_texto text;v_id uuid;v_materia uuid;
BEGIN
 v_uid:=auth.uid();
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Entre na FJU JAPAN para responder'; END IF;
 v_nome:=public.fju_nome_autor_comentario(v_uid);
 IF v_nome IS NULL THEN RAISE EXCEPTION 'Conclua o cadastro antes de responder'; END IF;
 IF NOT EXISTS(SELECT 1 FROM storage.objects
   WHERE bucket_id='fju-comentarios-avatars' AND name=v_uid::text||'/perfil.jpg')
 THEN RAISE EXCEPTION 'É necessário ter uma foto de perfil para responder'; END IF;
 SELECT c.materia_id INTO v_materia FROM public.fju_materias_comentarios_perfil c
 JOIN public.fju_materias m ON m.id=c.materia_id
 WHERE c.id=p_comentario_id AND c.parent_id IS NULL
 AND c.removido_em IS NULL AND m.status='publicada' FOR SHARE OF c;
 IF v_materia IS NULL THEN RAISE EXCEPTION 'Comentário indisponível para respostas'; END IF;
 v_texto:=btrim(coalesce(p_texto,''));
 IF char_length(v_texto) NOT BETWEEN 1 AND 600
 THEN RAISE EXCEPTION 'A resposta deve conter entre 1 e 600 caracteres'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('comentario-fju-'||v_uid::text,0));
 IF EXISTS(SELECT 1 FROM public.fju_materias_comentarios_perfil
   WHERE autor_id=v_uid AND criado_em>now()-INTERVAL '20 seconds')
 THEN RAISE EXCEPTION 'Aguarde 20 segundos para responder novamente'; END IF;
 IF (SELECT count(*) FROM public.fju_materias_comentarios_perfil
   WHERE autor_id=v_uid AND criado_em>now()-INTERVAL '24 hours')>=30
 THEN RAISE EXCEPTION 'Limite diário de comentários e respostas atingido'; END IF;
 INSERT INTO public.fju_materias_comentarios_perfil(materia_id,parent_id,autor_id,autor_nome,texto)
 VALUES(v_materia,p_comentario_id,v_uid,v_nome,v_texto) RETURNING id INTO v_id;
 RETURN v_id;
END;$$;

-- Alternar ❤️. Cada pessoa pode curtir uma vez por comentário.
CREATE OR REPLACE FUNCTION public.fju_alternar_curtida_comentario(p_comentario_id uuid)
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid;v_added integer;
BEGIN
 v_uid:=auth.uid();
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Entre na FJU JAPAN para curtir'; END IF;
 IF public.fju_nome_autor_comentario(v_uid) IS NULL THEN
   RAISE EXCEPTION 'Conclua o cadastro antes de curtir'; END IF;
 IF NOT EXISTS(SELECT 1 FROM storage.objects
   WHERE bucket_id='fju-comentarios-avatars' AND name=v_uid::text||'/perfil.jpg')
 THEN RAISE EXCEPTION 'É necessário ter uma foto de perfil para curtir'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.fju_materias_comentarios_perfil c
  JOIN public.fju_materias m ON m.id=c.materia_id
  WHERE c.id=p_comentario_id AND c.removido_em IS NULL AND m.status='publicada'
   AND (c.parent_id IS NULL OR EXISTS(
      SELECT 1 FROM public.fju_materias_comentarios_perfil p
      WHERE p.id=c.parent_id AND p.removido_em IS NULL)))
 THEN RAISE EXCEPTION 'Comentário não disponível'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('curtida-fju-'||v_uid::text||'-'||p_comentario_id::text,0));
 DELETE FROM public.fju_comentarios_curtidas
 WHERE comentario_id=p_comentario_id AND usuario_id=v_uid;
 GET DIAGNOSTICS v_added=ROW_COUNT;
 IF v_added>0 THEN RETURN false; END IF;
 INSERT INTO public.fju_comentarios_curtidas(comentario_id,usuario_id)
 VALUES(p_comentario_id,v_uid);
 RETURN true;
END;$$;

REVOKE ALL ON FUNCTION public.fju_listar_interacoes_materia(uuid,integer,integer) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.fju_listar_respostas_comentario(uuid,integer,integer) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.fju_responder_comentario_materia(uuid,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.fju_alternar_curtida_comentario(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.fju_listar_interacoes_materia(uuid,integer,integer) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.fju_listar_respostas_comentario(uuid,integer,integer) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.fju_responder_comentario_materia(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fju_alternar_curtida_comentario(uuid) TO authenticated;
COMMIT;
