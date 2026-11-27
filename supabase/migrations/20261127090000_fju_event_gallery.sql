-- FJU Connect Japan — galeria exclusiva de Eventos Realizados.
-- Fotografias antigas permanecem intocadas; esta estrutura atende apenas aos novos álbuns.
-- Os objetos ficam no R2 privado até a aprovação nacional.

BEGIN;

CREATE TABLE IF NOT EXISTS public.fju_galeria_equipe (
  usuario_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ativo boolean NOT NULL DEFAULT true,
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fju_galeria_albuns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL CHECK (length(trim(titulo)) BETWEEN 1 AND 160),
  descricao text NOT NULL DEFAULT '' CHECK (length(descricao) <= 3000),
  categoria text NOT NULL CHECK (categoria IN ('encontros','esporte','cultura','outros')),
  cidade text NOT NULL DEFAULT '' CHECK (length(cidade) <= 120),
  data_evento date,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','pending_review','published','rejected')),
  criado_por uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  aprovado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  aprovado_em timestamptz,
  motivo_rejeicao text CHECK (length(motivo_rejeicao) <= 1000),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'published' AND aprovado_por IS NOT NULL AND aprovado_em IS NOT NULL) OR status <> 'published')
);

CREATE TABLE IF NOT EXISTS public.fju_galeria_fotos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES public.fju_galeria_albuns(id) ON DELETE CASCADE,
  chave_r2_thumb text NOT NULL UNIQUE CHECK (length(chave_r2_thumb) BETWEEN 1 AND 500),
  chave_r2_full text NOT NULL UNIQUE CHECK (length(chave_r2_full) BETWEEN 1 AND 500),
  nome_original text NOT NULL DEFAULT '' CHECK (length(nome_original) <= 255),
  mime_type text NOT NULL DEFAULT 'image/webp' CHECK (mime_type = 'image/webp'),
  tamanho_thumb_bytes integer NOT NULL CHECK (tamanho_thumb_bytes BETWEEN 1 AND 204800),
  tamanho_full_bytes integer NOT NULL CHECK (tamanho_full_bytes BETWEEN 1 AND 204800),
  largura integer NOT NULL CHECK (largura BETWEEN 1 AND 1600),
  altura integer NOT NULL CHECK (altura BETWEEN 1 AND 1600),
  ordem integer NOT NULL DEFAULT 0 CHECK (ordem >= 0),
  status text NOT NULL DEFAULT 'staged' CHECK (status IN ('staged','published')),
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fju_galeria_albuns_publicados_idx
  ON public.fju_galeria_albuns (data_evento DESC, criado_em DESC)
  WHERE status = 'published';
CREATE INDEX IF NOT EXISTS fju_galeria_albuns_criador_idx
  ON public.fju_galeria_albuns (criado_por, status);
CREATE INDEX IF NOT EXISTS fju_galeria_fotos_album_ordem_idx
  ON public.fju_galeria_fotos (album_id, ordem, criado_em);

ALTER TABLE public.fju_galeria_equipe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fju_galeria_albuns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fju_galeria_fotos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fju_galeria_equipe_nacional ON public.fju_galeria_equipe;
CREATE POLICY fju_galeria_equipe_nacional ON public.fju_galeria_equipe
  FOR ALL TO authenticated
  USING (public.fju_eh_nacional())
  WITH CHECK (public.fju_eh_nacional());

DROP POLICY IF EXISTS fju_galeria_albuns_publicados_select ON public.fju_galeria_albuns;
CREATE POLICY fju_galeria_albuns_publicados_select ON public.fju_galeria_albuns
  FOR SELECT TO anon, authenticated USING (status = 'published');

DROP POLICY IF EXISTS fju_galeria_albuns_nacional_select ON public.fju_galeria_albuns;
CREATE POLICY fju_galeria_albuns_nacional_select ON public.fju_galeria_albuns
  FOR SELECT TO authenticated USING (public.fju_eh_nacional());

DROP POLICY IF EXISTS fju_galeria_albuns_midia_select ON public.fju_galeria_albuns;
CREATE POLICY fju_galeria_albuns_midia_select ON public.fju_galeria_albuns
  FOR SELECT TO authenticated USING (
    criado_por = (SELECT auth.uid())
    AND EXISTS (SELECT 1 FROM public.fju_galeria_equipe e
      WHERE e.usuario_id = (SELECT auth.uid()) AND e.ativo = true)
  );

DROP POLICY IF EXISTS fju_galeria_albuns_nacional_insert ON public.fju_galeria_albuns;
CREATE POLICY fju_galeria_albuns_nacional_insert ON public.fju_galeria_albuns
  FOR INSERT TO authenticated WITH CHECK (
    public.fju_eh_nacional() AND criado_por = (SELECT auth.uid()) AND status = 'draft'
  );

DROP POLICY IF EXISTS fju_galeria_albuns_midia_insert ON public.fju_galeria_albuns;
CREATE POLICY fju_galeria_albuns_midia_insert ON public.fju_galeria_albuns
  FOR INSERT TO authenticated WITH CHECK (
    criado_por = (SELECT auth.uid()) AND status = 'draft'
    AND EXISTS (SELECT 1 FROM public.fju_galeria_equipe e
      WHERE e.usuario_id = (SELECT auth.uid()) AND e.ativo = true)
  );

DROP POLICY IF EXISTS fju_galeria_albuns_nacional_update ON public.fju_galeria_albuns;
CREATE POLICY fju_galeria_albuns_nacional_update ON public.fju_galeria_albuns
  FOR UPDATE TO authenticated USING (public.fju_eh_nacional())
  WITH CHECK (public.fju_eh_nacional());

DROP POLICY IF EXISTS fju_galeria_albuns_midia_update ON public.fju_galeria_albuns;
CREATE POLICY fju_galeria_albuns_midia_update ON public.fju_galeria_albuns
  FOR UPDATE TO authenticated USING (
    criado_por = (SELECT auth.uid()) AND status IN ('draft','rejected')
    AND EXISTS (SELECT 1 FROM public.fju_galeria_equipe e
      WHERE e.usuario_id = (SELECT auth.uid()) AND e.ativo = true)
  ) WITH CHECK (
    criado_por = (SELECT auth.uid()) AND status IN ('draft','rejected')
    AND EXISTS (SELECT 1 FROM public.fju_galeria_equipe e
      WHERE e.usuario_id = (SELECT auth.uid()) AND e.ativo = true)
  );

DROP POLICY IF EXISTS fju_galeria_fotos_publicadas_select ON public.fju_galeria_fotos;
CREATE POLICY fju_galeria_fotos_publicadas_select ON public.fju_galeria_fotos
  FOR SELECT TO anon, authenticated USING (
    status = 'published' AND EXISTS (
      SELECT 1 FROM public.fju_galeria_albuns a
      WHERE a.id = album_id AND a.status = 'published'
    )
  );

DROP POLICY IF EXISTS fju_galeria_fotos_nacional_select ON public.fju_galeria_fotos;
CREATE POLICY fju_galeria_fotos_nacional_select ON public.fju_galeria_fotos
  FOR SELECT TO authenticated USING (public.fju_eh_nacional());

DROP POLICY IF EXISTS fju_galeria_fotos_midia_select ON public.fju_galeria_fotos;
CREATE POLICY fju_galeria_fotos_midia_select ON public.fju_galeria_fotos
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.fju_galeria_albuns a
      WHERE a.id = album_id AND a.criado_por = (SELECT auth.uid())
        AND a.status IN ('draft','pending_review','rejected'))
    AND EXISTS (SELECT 1 FROM public.fju_galeria_equipe e
      WHERE e.usuario_id = (SELECT auth.uid()) AND e.ativo = true)
  );

-- O cliente não insere fotos nem altera status: o backend processa e grava metadados.
REVOKE ALL ON public.fju_galeria_equipe, public.fju_galeria_albuns, public.fju_galeria_fotos FROM anon, authenticated;
GRANT SELECT ON public.fju_galeria_albuns, public.fju_galeria_fotos TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fju_galeria_equipe TO authenticated;
GRANT INSERT ON public.fju_galeria_albuns TO authenticated;
GRANT UPDATE (titulo, descricao, categoria, cidade, data_evento) ON public.fju_galeria_albuns TO authenticated;

CREATE OR REPLACE FUNCTION public.fju_galeria_enviar_album(p_album_id uuid, p_actor_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE v_role text;
BEGIN
  SELECT p.papel INTO v_role FROM public.fju_perfis p
  WHERE p.usuario_id = p_actor_id AND p.ativo = true;
  IF v_role IS NULL OR NOT (v_role = 'nacional' OR EXISTS (
    SELECT 1 FROM public.fju_galeria_equipe e
    WHERE e.usuario_id = p_actor_id AND e.ativo = true
  )) THEN
    RAISE EXCEPTION 'Usuário não autorizado a enviar álbuns' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.fju_galeria_fotos f
    WHERE f.album_id = p_album_id AND f.status = 'staged') THEN
    RAISE EXCEPTION 'O álbum precisa conter ao menos uma foto pronta' USING ERRCODE = '23514';
  END IF;
  UPDATE public.fju_galeria_albuns
  SET status = 'pending_review', atualizado_em = now(), motivo_rejeicao = NULL
  WHERE id = p_album_id AND criado_por = p_actor_id AND status IN ('draft','rejected');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Álbum não encontrado ou não pode ser enviado' USING ERRCODE = 'P0002';
  END IF;
  RETURN true;
END;
$function$;

-- O backend copia primeiro os objetos do R2 privado para o público; esta RPC
-- publica todas as fotos e o álbum em uma única transação SQL.
CREATE OR REPLACE FUNCTION public.fju_galeria_aprovar_album(p_album_id uuid, p_actor_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.fju_perfis p
    WHERE p.usuario_id = p_actor_id AND p.papel = 'nacional' AND p.ativo = true) THEN
    RAISE EXCEPTION 'Apenas o Administrador Nacional pode aprovar álbuns' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.fju_galeria_albuns a
    WHERE a.id = p_album_id AND a.status = 'pending_review') THEN
    RAISE EXCEPTION 'Álbum não encontrado ou não está aguardando aprovação' USING ERRCODE = 'P0002';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.fju_galeria_fotos f
    WHERE f.album_id = p_album_id AND f.status = 'staged')
    OR EXISTS (SELECT 1 FROM public.fju_galeria_fotos f
      WHERE f.album_id = p_album_id AND f.status <> 'staged') THEN
    RAISE EXCEPTION 'Todas as fotos precisam estar prontas para publicação' USING ERRCODE = '23514';
  END IF;
  UPDATE public.fju_galeria_fotos SET status = 'published'
  WHERE album_id = p_album_id AND status = 'staged';
  UPDATE public.fju_galeria_albuns
  SET status = 'published', aprovado_por = p_actor_id, aprovado_em = now(),
      motivo_rejeicao = NULL, atualizado_em = now()
  WHERE id = p_album_id AND status = 'pending_review';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Álbum não encontrado ou não está aguardando aprovação' USING ERRCODE = 'P0002';
  END IF;
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.fju_galeria_rejeitar_album(p_album_id uuid, p_actor_id uuid, p_motivo text DEFAULT '')
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.fju_perfis p
    WHERE p.usuario_id = p_actor_id AND p.papel = 'nacional' AND p.ativo = true) THEN
    RAISE EXCEPTION 'Apenas o Administrador Nacional pode rejeitar álbuns' USING ERRCODE = '42501';
  END IF;
  UPDATE public.fju_galeria_albuns
  SET status = 'rejected', aprovado_por = NULL, aprovado_em = NULL,
      motivo_rejeicao = left(coalesce(p_motivo,''),1000), atualizado_em = now()
  WHERE id = p_album_id AND status = 'pending_review';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Álbum não encontrado ou não está aguardando aprovação' USING ERRCODE = 'P0002';
  END IF;
  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.fju_galeria_enviar_album(uuid,uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fju_galeria_aprovar_album(uuid,uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fju_galeria_rejeitar_album(uuid,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fju_galeria_enviar_album(uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.fju_galeria_aprovar_album(uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.fju_galeria_rejeitar_album(uuid,uuid,text) TO service_role;

COMMIT;
