# Galeria de Eventos Realizados — contrato do backend

Esta implementação é isolada da galeria/fotos legadas. Não migrar, renomear, mover ou apagar objetos existentes.

## Regras obrigatórias
- Álbuns são públicos somente depois da aprovação nacional.
- Somente Administrador Nacional e equipe de mídia explicitamente autorizada podem enviar álbuns.
- Toda foto enviada fica em armazenamento privado até aprovação.
- A aprovação publica todas as fotos e o álbum de forma atômica no banco.
- O cliente nunca recebe credenciais Supabase Storage nem pode definir status de fotos/álbuns.
- Imagens aceitas: WebP, até 1600 × 1600 px, até 200 KiB por arquivo.
- Validar o conteúdo real do arquivo, não confiar no MIME informado pelo navegador.

## Contrato esperado para a Edge Function
A função deve exigir JWT Supabase válido (verify_jwt=true) e obter o usuário exclusivamente de auth.getUser(token). Nunca aceitar actor_id do corpo da requisição.

Operações previstas:
1. create-upload: validar perfil ativo e permissão nacional/equipe; criar álbum em rascunho e emitir destinos de upload privados com chaves aleatórias vinculadas ao UUID do álbum.
2. finalize-upload: confirmar que os objetos privados existem, validar tamanho e formato, registrar metadados das imagens processadas e manter status staged.
3. submit: chamar a RPC de envio com o usuário autenticado no servidor.
4. approve: exigir papel nacional; copiar todos os objetos do bucket privado para o público; somente após confirmar todas as cópias, chamar a RPC transacional de aprovação. Se qualquer cópia falhar, não publicar no banco e remover as cópias parciais.
5. reject: exigir papel nacional e chamar a RPC de rejeição com o usuário autenticado no servidor.

## Configuração necessária antes de implantar
Criar dois buckets exclusivos: fju-eventos-privado (privado) e fju-eventos-publico (público). O backend usa a chave service_role apenas no servidor; nunca expor essa chave no frontend.

## Bloqueios de implantação
- Criar e validar os buckets exclusivos fju-eventos-privado e fju-eventos-publico.
- Escolher/validar o processador WebP no runtime Edge; não aceitar imagens apenas renomeadas para .webp.
- Implementar e testar rollback de cópias parciais no Supabase Storage.
- Aplicar a migração somente após revisão e aprovação do PR.
- Não implantar a função até que os secrets e o fluxo de armazenamento estejam configurados.

## Critérios de aceite
- Usuário sem permissão não consegue criar, enviar, aprovar ou rejeitar.
- JWT expirado/inválido é recusado.
- Alterar actor_id no payload não altera a identidade usada no servidor.
- Upload inválido, >200 KiB ou >1600 px é recusado.
- Álbuns pendentes e suas fotos não aparecem publicamente.
- Falha de cópia Supabase Storage não publica álbum/fotos no banco.
- Aprovação publica todas as fotos e o álbum numa única transação SQL.
- Fotos e álbuns antigos continuam intactos.
