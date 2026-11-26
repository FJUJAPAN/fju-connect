# Galeria pública FJU JAPAN — plano de implementação

## Decisões confirmadas

- A galeria será pública: visitantes não precisam fazer login para visualizar álbuns publicados.
- As fotos novas desta galeria serão armazenadas no Cloudflare R2.
- As fotos já existentes no site/Supabase/GitHub não serão migradas nem alteradas.
- Quem pode iniciar envios: Administrador Nacional ativo e pessoas explicitamente autorizadas na equipe de mídia.
- Todo álbum novo ou alterado deverá passar por aprovação da Administração Nacional antes de ficar público.
- Coordenadores de polo, por padrão, não recebem permissão de upload nesta primeira versão.
- O Supabase guarda metadados, estado de aprovação e chaves dos objetos; não guarda os binários das fotos novas.

## Estado atual identificado no repositório

A página `eventos/index.html` já contém:
- listagem de álbuns com filtros de categoria e busca;
- visualização individual de álbum e lightbox;
- conteúdo de álbuns declarado estaticamente no JavaScript;
- formulário de envio que apenas prepara uma mensagem de WhatsApp, sem upload direto.

A implementação nova deve substituir/adicionar uma fonte dinâmica para os álbuns R2 sem remover os álbuns estáticos existentes. A galeria atual e os caminhos das fotos antigas devem continuar funcionando.

## Arquitetura proposta

1. **Frontend público**: `eventos/index.html` consulta apenas álbuns com estado `published` e suas fotos; as imagens usam URLs do domínio público de mídia da FJU.
2. **Supabase/Postgres**: tabelas para permissões da equipe de mídia, álbuns, fotos e trilha de aprovação. RLS habilitada em todas as tabelas expostas.
3. **Upload assinado**: endpoint backend autenticado valida o JWT do Supabase e confirma o perfil do usuário. Só Administrador Nacional ativo ou membro ativo da allowlist de mídia pode solicitar URL temporária de upload.
4. **Cloudflare R2**: bucket privado durante upload/revisão; depois da aprovação, objetos aprovados são servidos pelo domínio público/CDN configurado. Não publicar objetos pendentes.
5. **Aprovação nacional**: apenas Administrador Nacional ativo pode aprovar/rejeitar; publicação atualiza o estado do álbum e disponibiliza as imagens aprovadas.
6. **Segredos**: credenciais R2 e chave de assinatura somente em secrets do backend/Cloudflare; nunca em HTML, JavaScript público, GitHub ou tabela acessível ao navegador.

## Modelo de dados proposto

### `fju_galeria_equipe`
- `usuario_id` (UUID, referência ao usuário Auth, chave única)
- `ativo` (boolean)
- `criado_por` (UUID do administrador nacional)
- `criado_em`, `atualizado_em`
- A tabela é uma allowlist gerida exclusivamente pela Administração Nacional. Não usar `user_metadata` nem campos editáveis pelo próprio usuário para conceder autorização.

### `fju_galeria_albuns`
- UUID, título, descrição, categoria, cidade/polo, data do evento
- `status`: `draft`, `pending_review`, `published`, `rejected`
- `criado_por`, `aprovado_por`, `aprovado_em`, timestamps
- Um álbum só pode ser consultado anonimamente quando `status = 'published'`.

### `fju_galeria_fotos`
- UUID, álbum, chave do objeto R2, nome original sanitizado, MIME validado, tamanho, dimensões, ordem, status
- Não armazenar URL assinada permanente. Gerar URL de entrega a partir de chave validada e domínio configurado.
- Fotos de álbum não publicado nunca devem ser retornadas por endpoint público.

## Regras de autorização

| Ação | Visitante | Nacional ativo | Mídia ativa | Outros usuários |
|---|---:|---:|---:|---:|
| Ver álbuns publicados | Sim | Sim | Sim | Sim |
| Criar álbum / enviar fotos | Não | Sim | Sim | Não |
| Editar conteúdo antes de enviar | Não | Sim | Sim | Não |
| Enviar para revisão | Não | Sim | Sim | Não |
| Aprovar / rejeitar | Não | Sim | Não | Não |
| Gerir membros da equipe de mídia | Não | Sim | Não | Não |
| Ver rascunhos e pendentes | Não | Sim | Apenas os próprios, se necessário | Não |

A autorização deve ser conferida no backend e reforçada com RLS. Esconder botões na interface não é controle de segurança.

## Etapas de implementação

### Fase 1 — Base de dados e autorização
- Criar migração SQL versionada para as tabelas e índices.
- Habilitar RLS e criar políticas explícitas para leitura pública apenas de álbuns publicados.
- Permitir gestão da allowlist apenas ao Administrador Nacional ativo.
- Definir aprovação exclusivamente nacional.
- Não alterar as tabelas/políticas existentes de jovens, perfis ou fotos.

### Fase 2 — R2 e upload seguro
- Criar bucket R2 e domínio de entrega público dedicado (por exemplo, `fotos.fjujapan.com`, se o domínio estiver disponível e sob controle da organização).
- Criar endpoint autenticado para emitir URLs temporárias de upload.
- Validar tipo real do arquivo, tamanho máximo, quantidade por lote, extensão e nome/chave gerada pelo servidor.
- Definir limites contra abuso, repetição de upload e arquivos não-imagem.
- Manter objetos em área não pública até a aprovação.

### Fase 3 — Painel de gestão
- Criar área para Nacional e equipe de mídia autorizada.
- Upload múltiplo com progresso, cancelamento, tentativas e feedback de falha.
- Criar/editar álbuns, ordenar fotos e enviar para aprovação.
- Criar tela nacional de revisão, aprovação e rejeição.

### Fase 4 — Galeria pública
- Integrar os álbuns publicados à página existente `/eventos/`.
- Preservar álbuns estáticos e caminhos das fotos antigas.
- Paginar/carregar fotos sob demanda; usar miniaturas WebP e imagens maiores sob demanda.
- Preservar busca, filtros, links compartilháveis, acessibilidade e idiomas PT/JA/EN.

### Fase 5 — Testes e ativação
- Testar permissões com sessão Nacional, mídia autorizada, usuário comum e visitante anônimo.
- Confirmar que usuários não autorizados não conseguem obter URL assinada nem enviar objeto.
- Confirmar que rascunhos/pendentes/rejeitados não são acessíveis publicamente, inclusive por URL direta.
- Testar aprovação, rejeição, revogação de membro de mídia e arquivos inválidos.
- Testar volume de fotos, celular, paginação, cache e custos.
- Só depois configurar secrets e ativar o upload em produção.

## Critérios de aceite

- Nenhuma foto antiga é movida, renomeada ou apagada.
- Visitantes veem somente álbuns publicados.
- Só Nacional ativo e membros ativos da equipe de mídia conseguem enviar.
- Somente Nacional ativo aprova e publica.
- Revogar membro de mídia bloqueia novos uploads imediatamente.
- Nenhuma credencial R2 aparece no repositório ou no navegador.
- Upload em lote e navegação continuam funcionais em celular.
- Falhas de upload não criam álbuns parcialmente publicados nem links públicos para material pendente.

## Dependências externas / ações manuais

A implementação não pode ser ativada sem:
- conta Cloudflare com R2 habilitado;
- criação do bucket e configuração do domínio público/CDN;
- secrets de acesso R2 guardados no backend;
- definição de limites de upload e retenção;
- implantação do endpoint backend.

Essas ações exigem acesso e configuração na conta Cloudflare/Supabase. Não colocar tokens, secrets ou chaves no GitHub. O Merge de PRs não implanta automaticamente o bucket nem configura secrets.
