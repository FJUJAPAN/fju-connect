# FJU CONNECT — Atualização automática do Instagram @fjujapan

Este repositório está preparado para mostrar as **três publicações recentes** de @fjujapan na seção **FJU EM AÇÃO**, mantendo as três categorias visuais existentes. É um sistema separado do Instagram; nenhuma senha ou chave privada vai para a página pública.

## Etapa única: vincular a conta

1. Entre em https://developers.facebook.com/apps/ com uma conta autorizada a administrar @fjujapan.
2. Crie um app Meta do tipo Business (ou use um app seu com acesso à Instagram API). Configure **Instagram API with Instagram Login**.
3. Adicione o perfil profissional @fjujapan ao app e autorize o escopo **instagram_business_basic**. Se solicitado, aceite o convite de testador no próprio Instagram.
4. Gere um **Instagram User Access Token de longa duração (aprox. 60 dias)** para @fjujapan, usando o fluxo oficial do Meta App Dashboard (ou trocando o token de curta duração pelo de longa duração pelo endpoint oficial). **Não copie a senha, o App Secret nem o token para esta conversa, arquivo HTML ou commit.**
5. No repositório GitHub, entre em **Settings → Secrets and variables → Actions → New repository secret**.
6. Nome: `FJU_INSTAGRAM_TOKEN`; valor: o Instagram User Access Token de longa duração recém-gerado. Confirme para salvá-lo.
7. Acesse **Actions → Atualizar 3 fotos do Instagram FJU → Run workflow**. Abra o histórico dessa execução para verificar se terminou com sucesso.
8. Aguarde a publicação no GitHub Pages e abra https://fjujapan.github.io/fju-connect/#acao.

## Funcionamento

- A rotina do GitHub é agendada a cada **3 horas** (atrasos de agenda podem ocorrer).
- Busca até 18 publicações recentes, com fotos, carrosséis e miniaturas de vídeos/Reels, e utiliza as três mais recentes com imagem acessível.
- Os arquivos `instagram/latest.json` e `instagram/media/01.webp` a `03.webp` são publicados somente quando a sincronização é bem-sucedida.
- Cada imagem abre o post real do Instagram. Se a autorização ou a API falhar, as três fotos de reserva continuam sendo exibidas.
- Um token renovado é gravado somente de forma **criptografada**, com chave derivada do secret do Actions. A chave/token original continua apenas no secret do GitHub.
- Nunca compartilhe o token em mensagem, issue pública ou arquivo do site. Se houver vazamento, revogue-o no painel Meta e substitua o secret.
- GitHub pode desabilitar workflows agendados após **60 dias sem atividade** em repositórios públicos. Se isso ocorrer, reative a automação na aba Actions.
- O site é estático; não precisa de WordPress, Behold ou assinatura de um serviço de feed.

## Arquivos

- `.github/workflows/atualizar-instagram.yml` — agenda, execução e publicação automática.
- `scripts/sync_instagram.py` — acesso à API, validação do perfil, download e renovação de credenciais.
- `instagram/latest.json` e `instagram/media/` — criados automaticamente após a primeira sincronização autorizada.
- `index.html` — carrega o manifesto quando disponível e troca as três fotos de forma segura.

## Se não funcionar

Verifique se o acesso concedido é **Instagram Login**, não um token de Facebook Login; se o token pertence a **@fjujapan** e é de longa duração; e se a conta profissional foi adicionada e autorizada no Meta App. O script recusa tokens de outros perfis por segurança. Em caso de erro, as fotos atuais do site continuam intactas.
