-- FJU JAPAN: apenas nomes e IDs dos polos para o formulário público.
-- Não concede SELECT direto sobre fju_polos nem expõe dados de coordenadores.
CREATE OR REPLACE FUNCTION public.fju_listar_polos_cadastro()
RETURNS TABLE(id uuid, nome text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.id, p.nome::text
  FROM public.fju_polos AS p
  ORDER BY p.nome;
$$;
REVOKE ALL ON FUNCTION public.fju_listar_polos_cadastro() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fju_listar_polos_cadastro() TO anon, authenticated;
