-- FJU Connect JAPAN — Fase 1 da galeria pública
-- Cria somente tabelas e regras da nova galeria. Não migra nem altera fotos existentes.
-- NÃO habilita upload R2; credenciais e endpoint serão tratados em fases posteriores.
-- Dependência existente confirmada no projeto: public.fju_eh_nacional().

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
  CHECK (
    (status = 'published' AND aprovado_por IS NOT NULL AND aprovado_em IS NOT NULL)
    OR status <> 'published'
  )
);

CREATE TABLE IF NOT EXISTS public.fju_galeria_fotos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES public.fju_galeria_albuns(id) ON DELETE CASCADE,
  chave_r2 text NOT NULL UNIQUE CHECK (length(chave_r2) BETWEEN 1 AND 500),
  nome_original text NOT NULL DEFAULT '' CHECK (length(nome_original) <= 255),
  mime_type text NOT NULL CHECK (mime_type IN ('image/jpeg','image/png','image/webp','image/avif')),
  tamanho_bytes bigint NOT NULL CHECK (tamanho_bytes > 0),
  largura integer CHECK (largura IS NULL OR largura > 0),
  altura integer CHECK (altura IS NULL OR altura > 0),
  ordem integer NOT NULL DEFAULT 0,
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

-- A equipe só pode ser consultada/gerida pelo Administrador Nacional.
DROP POLICY IF EXISTS fju_galeria_equipe_nacional ON public.fju_galeria_equipe;
CREATE POLICY fju_galeria_equipe_nacional
  ON public.fju_galeria_equipe FOR ALL TO authenticated
  USING (public.fju_eh_nacional())
  WITH CHECK (public.fju_eh_nacional());

-- Álbuns publicados e apenas publicados são visíveis anonimamente.
DROP POLICY IF EXISTS fju_galeria_albuns_publicados_select ON public.fju_galeria_albuns;
CREATE POLICY fju_galeria_albuns_publicados_select
  ON public.fju_galeria_albuns FOR SELECT TO anon, authenticated
  USING (status = 'published');

-- Nacional pode consultar todos os álbuns e administrar conteúdo.
DROP POLICY IF EXISTS fju_galeria_albuns_nacional_select ON public.fju_galeria_albuns;
CREATE POLICY fju_galeria_albuns_nacional_select
  ON public.fju_galeria_albuns FOR SELECT TO authenticated
  USING (public.fju_eh_nacional());

DROP POLICY IF EXISTS fju_galeria_albuns_nacional_insert ON public.fju_galeria_albuns;
CREATE POLICY fju_galeria_albuns_nacional_insert
  ON public.fju_galeria_albuns FOR INSERT TO authenticated
  WITH CHECK (public.fju_eh_nacional() AND criado_por = (SELECT auth.uid()));

DROP POLICY IF EXISTS fju_galeria_albuns_nacional_update ON public.fju_galeria_albuns;
CREATE POLICY fju_galeria_albuns_nacional_update
  ON public.fju_galeria_albuns FOR UPDATE TO authenticated
  USING (public.fju_eh_nacional())
  WITH CHECK (public.fju_eh_nacional());

DROP POLICY IF EXISTS fju_galeria_albuns_nacional_delete ON public.fju_galeria_albuns;
CREATE POLICY fju_galeria_albuns_nacional_delete
  ON public.fju_galeria_albuns FOR DELETE TO authenticated
  USING (public.fju_eh_nacional());

-- Mídia autorizada pode criar e editar somente os próprios álbuns ainda não publicados.
DROP POLICY IF EXISTS fju_galeria_albuns_midia_insert ON public.fju_galeria_albuns;
CREATE POLICY fju_galeria_albuns_midia_insert
  ON public.fju_galeria_albuns FOR INSERT TO authenticated
  WITH CHECK (
    criado_por = (SELECT auth.uid())
    AND status IN ('draft','pending_review')
    AND EXISTS (
      SELECT 1 FROM public.fju_galeria_equipe e
      WHERE e.usuario_id = (SELECT auth.uid()) AND e.ativo = true
    )
  );

DROP POLICY IF EXISTS fju_galeria_albuns_midia_update ON public.fju_galeria_albuns;
CREATE POLICY fju_galeria_albuns_midia_update
  ON public.fju_galeria_albuns FOR UPDATE TO authenticated
  USING (
    criado_por = (SELECT auth.uid())
    AND status IN ('draft','pending_review')
    AND EXISTS (
      SELECT 1 FROM public.fju_galeria_equipe e
      WHERE e.usuario_id = (SELECT auth.uid()) AND e.ativo = true
    )
  )
  WITH CHECK (
    criado_por = (SELECT auth.uid())
    AND status IN ('draft','pending_review')
    AND EXISTS (
      SELECT 1 FROM public.fju_galeria_equipe e
      WHERE e.usuario_id = (SELECT auth.uid()) AND e.ativo = true
    )
  );

-- Fotos: público somente de álbuns publicados e fotos marcadas como publicadas.
DROP POLICY IF EXISTS fju_galeria_fotos_publicadas_select ON public.fju_galeria_fotos;
CREATE POLICY fju_galeria_fotos_publicadas_select
  ON public.fju_galeria_fotos FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.fju_galeria_albuns a
      WHERE a.id = album_id AND a.status = 'published'
    )
  );

DROP POLICY IF EXISTS fju_galeria_fotos_nacional_select ON public.fju_galeria_fotos;
CREATE POLICY fju_galeria_fotos_nacional_select
  ON public.fju_galeria_fotos FOR SELECT TO authenticated
  USING (public.fju_eh_nacional());

DROP POLICY IF EXISTS fju_galeria_fotos_midia_select ON public.fju_galeria_fotos;
CREATE POLICY fju_galeria_fotos_midia_select
  ON public.fju_galeria_fotos FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.fju_galeria_albuns a
      WHERE a.id = album_id
        AND a.criado_por = (SELECT auth.uid())
        AND a.status IN ('draft','pending_review')
    )
    AND EXISTS (
      SELECT 1 FROM public.fju_galeria_equipe e
      WHERE e.usuario_id = (SELECT auth.uid()) AND e.ativo = true
    )
  );

DROP POLICY IF EXISTS fju_galeria_fotos_nacional_insert ON public.fju_galeria_fotos;
CREATE POLICY fju_galeria_fotos_nacional_insert
  ON public.fju_galeria_fotos FOR INSERT TO authenticated
  WITH CHECK (public.fju_eh_nacional());

DROP POLICY IF EXISTS fju_galeria_fotos_midia_insert ON public.fju_galeria_fotos;
CREATE POLICY fju_galeria_fotos_midia_insert
  ON public.fju_galeria_fotos FOR INSERT TO authenticated
  WITH CHECK (
    status = 'staged'
    AND EXISTS (
      SELECT 1 FROM public.fju_galeria_albuns a
      WHERE a.id = album_id AND a.criado_por = (SELECT auth.uid())
        AND a.status IN ('draft','pending_review')
    )
    AND EXISTS (
      SELECT 1 FROM public.fju_galeria_equipe e
      WHERE e.usuario_id = (SELECT auth.uid()) AND e.ativo = true
    )
  );

DROP POLICY IF EXISTS fju_galeria_fotos_nacional_update ON public.fju_galeria_fotos;
CREATE POLICY fju_galeria_fotos_nacional_update
  ON public.fju_galeria_fotos FOR UPDATE TO authenticated
  USING (public.fju_eh_nacional())
  WITH CHECK (public.fju_eh_nacional());

DROP POLICY IF EXISTS fju_galeria_fotos_midia_delete ON public.fju_galeria_fotos;
CREATE POLICY fju_galeria_fotos_midia_delete
  ON public.fju_galeria_fotos FOR DELETE TO authenticated
  USING (
    status = 'staged'
    AND EXISTS (
      SELECT 1 FROM public.fju_galeria_albuns a
      WHERE a.id = album_id AND a.criado_por = (SELECT auth.uid())
        AND a.status IN ('draft','pending_review')
    )
    AND EXISTS (
      SELECT 1 FROM public.fju_galeria_equipe e
      WHERE e.usuario_id = (SELECT auth.uid()) AND e.ativo = true
    )
  );

-- Aprovação/rejeição por RPC: somente Administrador Nacional ativo.
-- A função valida papel no banco e publica somente metadados já enviados;
-- o backend de R2 deverá copiar objetos de staging para o bucket público
-- antes de marcar fotos como publicadas (implementação da fase de upload).
CREATE OR REPLACE FUNCTION public.fju_galeria_aprovar_album(p_album_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NOT public.fju_eh_nacional() THEN
    RAISE EXCEPTION 'Apenas o Administrador Nacional pode aprovar álbuns'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.fju_galeria_albuns
  SET status = 'published',
      aprovado_por = (SELECT auth.uid()),
      aprovado_em = now(),
      motivo_rejeicao = NULL,
      atualizado_em = now()
  WHERE id = p_album_id
    AND status = 'pending_review';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Álbum não encontrado ou não está aguardando aprovação'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.fju_galeria_rejeitar_album(p_album_id uuid, p_motivo text DEFAULT '')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NOT public.fju_eh_nacional() THEN
    RAISE EXCEPTION 'Apenas o Administrador Nacional pode rejeitar álbuns'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.fju_galeria_albuns
  SET status = 'rejected',
      aprovado_por = NULL,
      aprovado_em = NULL,
      motivo_rejeicao = left(coalesce(p_motivo,''),1000),
      atualizado_em = now()
  WHERE id = p_album_id
    AND status = 'pending_review';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Álbum não encontrado ou não está aguardando aprovação'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.fju_galeria_aprovar_album(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fju_galeria_rejeitar_album(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fju_galeria_aprovar_album(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fju_galeria_rejeitar_album(uuid,text) TO authenticated;

GRANT SELECT ON public.fju_galeria_albuns, public.fju_galeria_fotos TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fju_galeria_albuns, public.fju_galeria_fotos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fju_galeria_equipe TO authenticated;

COMMIT;
