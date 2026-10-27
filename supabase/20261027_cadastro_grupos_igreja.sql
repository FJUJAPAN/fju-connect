-- Execute no Supabase SQL Editor APÓS o merge. Não cria fichas de jovens.
BEGIN;
CREATE TABLE IF NOT EXISTS public.fju_contas_grupos_igreja (
 usuario_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 nome text NOT NULL CHECK (char_length(btrim(nome)) BETWEEN 2 AND 120),
 grupo text NOT NULL CHECK (grupo IN ('FTU','Calebe','EVG','Obreiros','Membros')),
 criado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fju_contas_grupos_igreja ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.fju_contas_grupos_igreja FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.fju_cadastrar_grupo_igreja(p_nome text,p_grupo text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR coalesce((SELECT email_confirmed_at IS NOT NULL FROM auth.users WHERE id=auth.uid()),false)=false
 THEN RAISE EXCEPTION 'Confirme seu e-mail para concluir o cadastro'; END IF;
 IF char_length(btrim(coalesce(p_nome,''))) NOT BETWEEN 2 AND 120
 OR p_grupo IS NULL OR p_grupo NOT IN ('FTU','Calebe','EVG','Obreiros','Membros')
 THEN RAISE EXCEPTION 'Nome ou grupo inválido'; END IF;
 IF EXISTS (SELECT 1 FROM public.fju_vinculos_conta_jovem WHERE usuario_id=auth.uid() AND ativo)
 OR EXISTS (SELECT 1 FROM public.fju_inscricoes_jovens WHERE usuario_id=auth.uid())
 OR EXISTS (SELECT 1 FROM public.fju_perfis WHERE usuario_id=auth.uid() AND ativo AND papel IN ('coordenador','nacional'))
 THEN RAISE EXCEPTION 'Esta conta já possui vínculo com a FJU'; END IF;
 INSERT INTO public.fju_contas_grupos_igreja(usuario_id,nome,grupo)
 VALUES(auth.uid(),btrim(p_nome),p_grupo)
 ON CONFLICT(usuario_id) DO NOTHING;
END;$$;
CREATE OR REPLACE FUNCTION public.fju_meu_grupo_igreja()
RETURNS TABLE(nome text,grupo text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT c.nome,c.grupo FROM public.fju_contas_grupos_igreja c WHERE c.usuario_id=auth.uid();
$$;
REVOKE ALL ON FUNCTION public.fju_cadastrar_grupo_igreja(text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.fju_meu_grupo_igreja() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.fju_cadastrar_grupo_igreja(text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fju_meu_grupo_igreja() TO authenticated;
-- Reaproveita a publicação existente: nome verificado pelo servidor, sem anonimato.
CREATE OR REPLACE FUNCTION public.fju_nome_autor_comentario(p_usuario_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT COALESCE(
  (SELECT NULLIF(btrim(j.nome_completo),'') FROM public.fju_vinculos_conta_jovem v JOIN public.fju_jovens j ON j.id=v.jovem_id WHERE v.usuario_id=p_usuario_id AND v.ativo AND j.excluido_em IS NULL LIMIT 1),
  (SELECT NULLIF(btrim(c.nome_exibicao),'') FROM public.fju_coordenador_cards c JOIN public.fju_perfis p ON p.usuario_id=c.usuario_id WHERE c.usuario_id=p_usuario_id AND p.ativo AND p.papel IN ('coordenador','nacional') LIMIT 1),
  (SELECT NULLIF(btrim(i.nome),'') FROM public.fju_inscricoes_jovens i WHERE i.usuario_id=p_usuario_id AND i.status IN ('pendente','aprovado') LIMIT 1),
  (SELECT NULLIF(btrim(g.nome),'') FROM public.fju_contas_grupos_igreja g WHERE g.usuario_id=p_usuario_id LIMIT 1)
 );
$$;
REVOKE ALL ON FUNCTION public.fju_nome_autor_comentario(uuid) FROM PUBLIC,anon,authenticated;
COMMIT;