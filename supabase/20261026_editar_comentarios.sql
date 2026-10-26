-- FJU JAPAN | Edição de comentários e respostas pelo autor.
-- Executar manualmente no Supabase SQL Editor APÓS o merge deste PR.
-- Pré-requisito: curtidas e respostas já instaladas (SQL 20261026).
-- Preserva texto, curtidas, respostas, nomes, fotos e comentários antigos.
BEGIN;

ALTER TABLE public.fju_materias_comentarios_perfil
 ADD COLUMN IF NOT EXISTS editado_em timestamptz;

-- Edição somente do PRÓPRIO texto (nem mesmo o Nacional pode editar o texto
-- de outra pessoa). Nome e foto permanecem vinculados ao perfil cadastrado.
CREATE OR REPLACE FUNCTION public.fju_editar_comentario_materia(
 p_comentario_id uuid,p_texto text)
RETURNS timestamptz LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid;v_texto text;v_data timestamptz;
BEGIN
 v_uid:=auth.uid();
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Entre na FJU JAPAN para editar'; END IF;
 IF public.fju_nome_autor_comentario(v_uid) IS NULL THEN
  RAISE EXCEPTION 'Cadastro FJU JAPAN não encontrado'; END IF;
 v_texto:=btrim(coalesce(p_texto,''));
 IF char_length(v_texto) NOT BETWEEN 1 AND 600 THEN
  RAISE EXCEPTION 'Escreva entre 1 e 600 caracteres'; END IF;

 UPDATE public.fju_materias_comentarios_perfil c
 SET texto=v_texto,editado_em=now()
 FROM public.fju_materias m
 WHERE c.id=p_comentario_id
   AND c.autor_id=v_uid
   AND c.removido_em IS NULL
   AND m.id=c.materia_id
   AND m.status='publicada'
   AND (c.parent_id IS NULL OR EXISTS(
      SELECT 1 FROM public.fju_materias_comentarios_perfil pai
      WHERE pai.id=c.parent_id AND pai.removido_em IS NULL))
   AND c.texto IS DISTINCT FROM v_texto
 RETURNING c.editado_em INTO v_data;

 IF v_data IS NOT NULL THEN RETURN v_data; END IF;

 -- Mesmo texto não altera o histórico de edição, mas é aceito se for do autor.
 SELECT c.editado_em INTO v_data
 FROM public.fju_materias_comentarios_perfil c
 JOIN public.fju_materias m ON m.id=c.materia_id
 WHERE c.id=p_comentario_id AND c.autor_id=v_uid
  AND c.removido_em IS NULL AND m.status='publicada'
  AND (c.parent_id IS NULL OR EXISTS(
     SELECT 1 FROM public.fju_materias_comentarios_perfil pai
     WHERE pai.id=c.parent_id AND pai.removido_em IS NULL))
  AND c.texto=v_texto;
 IF NOT FOUND THEN RAISE EXCEPTION 'Você só pode editar seus próprios comentários ativos'; END IF;
 RETURN v_data;
END;$$;

-- APIs v2 evitam substituir a forma das funções públicas existentes
-- e preservam compatibilidade com o site antes da nova migração.
CREATE OR REPLACE FUNCTION public.fju_listar_interacoes_materia_v2(
 p_materia_id uuid,p_limite integer DEFAULT 20,p_offset integer DEFAULT 0)
RETURNS TABLE(
 id uuid,autor_id uuid,autor_nome text,texto text,criado_em timestamptz,
 avatar_path text,curtidas bigint,curtiu boolean,respostas bigint,editado_em timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT c.id,c.autor_id,c.autor_nome,c.texto,c.criado_em,
 (c.autor_id::text||'/perfil.jpg')::text,
 (SELECT count(*) FROM public.fju_comentarios_curtidas k WHERE k.comentario_id=c.id),
 EXISTS(SELECT 1 FROM public.fju_comentarios_curtidas k
   WHERE k.comentario_id=c.id AND k.usuario_id=auth.uid()),
 (SELECT count(*) FROM public.fju_materias_comentarios_perfil r
   WHERE r.parent_id=c.id AND r.removido_em IS NULL),
 c.editado_em
 FROM public.fju_materias_comentarios_perfil c
 JOIN public.fju_materias m ON m.id=c.materia_id
 WHERE c.materia_id=p_materia_id AND m.status='publicada'
  AND c.removido_em IS NULL AND c.parent_id IS NULL
 ORDER BY c.criado_em DESC,c.id DESC
 LIMIT least(greatest(coalesce(p_limite,20),1),50)
 OFFSET least(greatest(coalesce(p_offset,0),0),10000);
$$;

CREATE OR REPLACE FUNCTION public.fju_listar_respostas_comentario_v2(
 p_comentario_id uuid,p_limite integer DEFAULT 20,p_offset integer DEFAULT 0)
RETURNS TABLE(
 id uuid,autor_id uuid,autor_nome text,texto text,criado_em timestamptz,
 avatar_path text,curtidas bigint,curtiu boolean,editado_em timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT r.id,r.autor_id,r.autor_nome,r.texto,r.criado_em,
 (r.autor_id::text||'/perfil.jpg')::text,
 (SELECT count(*) FROM public.fju_comentarios_curtidas k WHERE k.comentario_id=r.id),
 EXISTS(SELECT 1 FROM public.fju_comentarios_curtidas k
   WHERE k.comentario_id=r.id AND k.usuario_id=auth.uid()),
 r.editado_em
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

REVOKE ALL ON FUNCTION public.fju_editar_comentario_materia(uuid,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.fju_listar_interacoes_materia_v2(uuid,integer,integer) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.fju_listar_respostas_comentario_v2(uuid,integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.fju_editar_comentario_materia(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fju_listar_interacoes_materia_v2(uuid,integer,integer) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.fju_listar_respostas_comentario_v2(uuid,integer,integer) TO anon,authenticated;
COMMIT;
