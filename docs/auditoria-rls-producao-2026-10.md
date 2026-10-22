# FJU Connect JAPAN — auditoria preliminar de RLS (outubro de 2026)

## Escopo
Revisão de CSV exportado do Supabase em 23/10/2026 com **38 políticas** de `pg_policies` no esquema `public`. Esta análise é documental; não houve teste com JWT de usuários, inspeção de funções SQL, privilégios de coluna ou políticas de Storage.

## Evidências favoráveis
- `fju_jovens`: SELECT e INSERT usam `fju_acessa_polo(polo_id)`; UPDATE usa `fju_eh_nacional()`.
- `fju_solicitacoes`: UPDATE de análise exige `fju_eh_nacional()`, status anterior pendente e novo status aprovada/rejeitada.
- `fju_perfis`: política de gerenciamento exige `fju_eh_nacional()`.
- `fju_push_inscricoes`: políticas de leitura e escrita limitadas a `usuario_id = auth.uid()`.

## Pontos a validar antes da conclusão
1. **Funções de autorização:** inspecionar definições de `fju_acessa_polo`, `fju_eh_nacional`, `fju_usuario_e_nacional`, funções RPC expostas e permissões EXECUTE; conferir `SECURITY DEFINER` e `search_path`.
2. **Relatórios:** `fju_relatorios` e `fju_relatorios_semanais` permitem UPDATE pelo polo; verificar privilégios por coluna, triggers e prazo de correção.
3. **Solicitações:** conferir definição integral da política INSERT, tipos permitidos, triggers e RPCs de aprovação, incluindo promoção a coordenador e associação de conta.
4. **Inscrições de jovens:** validar fluxo de cadastro e aprovação, que pode usar RPCs e tabelas não cobertas pelo filtro `tablename LIKE 'fju_%'`.
5. **Storage:** verificar políticas de buckets com fotos privadas, ausentes neste CSV.
6. **Notificações:** verificar autenticação/autorização das Edge Functions; RLS das inscrições de push não protege, por si só, o disparo de testes.

## Consulta somente leitura para próxima etapa
```sql
SELECT n.nspname AS esquema, p.proname AS funcao,
       pg_get_function_identity_arguments(p.oid) AS argumentos,
       p.prosecdef AS security_definer,
       p.proconfig AS configuracao,
       pg_get_functiondef(p.oid) AS definicao
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND (p.proname LIKE 'fju_%')
ORDER BY p.proname;
```

**Não executar migrações de RLS em produção sem revisar as funções e testar com contas de diferentes polos.** A presença de políticas restritivas não comprova, isoladamente, ausência de bypass por RPC, grants ou funções privilegiadas.
