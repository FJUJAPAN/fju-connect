# FJU Connect JAPAN — revisão de segurança e acessos

> Checklist de validação antes da conclusão. Este documento não comprova que os testes foram executados.

## Fonte de verdade
- A interface pública (`my-page-auth.js`) consulta `fju_perfis` (`papel`, `polo_id`, `ativo`) para exibir o link administrativo.
- Esconder botões **não** é uma barreira de segurança. As tabelas, políticas RLS e funções RPC do **projeto Supabase em produção** devem impor as permissões.
- `painel-interno/schema.sql` contém um esquema anterior com `fju_staff` e `fju_youth`; não assumir que representa o banco atual e **não executá-lo** em produção sem comparação.

## Testes obrigatórios (contas separadas)

| Conta | Deve conseguir | Não deve conseguir |
| --- | --- | --- |
| Anônimo | Acessar páginas públicas | Ler fichas, solicitações, relatórios e fotos privadas por API |
| Jovem pendente | Consultar o estado da própria inscrição | Ler dados de outros jovens ou acessar painel |
| Jovem aprovado | Acessar apenas o próprio perfil e recursos autorizados | Alterar a própria patente, polo ou papel administrativo |
| Coordenador do polo A | Consultar fichas do polo A e enviar solicitações permitidas | Ler/editar polo B; aprovar patente, exclusão ou acesso administrativo |
| Coordenador com patente alterada, mas sem aprovação administrativa | Continuar com permissões anteriores | Ganhar acesso ao painel só pela patente |
| Nacional | Analisar solicitações de todos os polos | — |
| Conta desativada | Ser bloqueada das áreas administrativas | Reutilizar sessão antiga para ler/escrever dados privados |

## Casos de teste críticos
1. Repetir as tentativas diretamente na API Supabase com JWT de cada papel, **não apenas pela interface**.
2. Tentar editar `polo_id`, `papel`, `ativo`, patente e identificadores de propriedade no corpo da requisição.
3. Confirmar que promoção para **Coordenador** gera pedido de acesso administrativo e exige aprovação do Nacional; a aprovação deve associar a conta existente ao polo correto.
4. Verificar que o coordenador pode **solicitar** edição de ficha, mas não contornar o fluxo de aprovação.
5. Verificar que só o Nacional consegue disparar testes de notificações; a proteção deve existir no servidor/Edge Function, não só no botão.
6. Confirmar que imagens de fichas e inscrições estão em buckets privados com políticas de leitura restritas.
7. Testar rejeição, revogação, transferência de polo, logout e token de sessão antigo.
8. Conferir histórico/auditoria das aprovações e alterações de patente.

## Critério para concluir
- Executar os testes acima contra o ambiente real, registrar resultado e evidência de cada caso.
- Corrigir qualquer falha de isolamento entre polos ou escalonamento de privilégios antes de liberar o sistema.
- Não publicar tokens de sessão, chaves secretas, fotos, testemunhos ou dados pessoais nas evidências.
