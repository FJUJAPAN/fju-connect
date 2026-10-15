# FJU Connect JAPAN — Sistema Interno de Cadastro de Jovens
> Especificação funcional — versão 1, 15/10/2026. **Planejamento, não é sistema ativo.**

## Objetivo e escopo
Sistema **restrito aos coordenadores** dos 23 polos da FJU JAPAN para fichas, acompanhamento das etapas/patentes, relatórios impressos e envio de relatórios semanais por polo. Não é inscrição pública. **Não haverá controle de presença**.

## Controle de acesso
- **Administrador nacional**: acesso total às fichas, polos, inclusão, edição, exclusão e transferência de jovens; visão nacional e relatórios.
- **Coordenador local**: gerencia **somente** fichas pertencentes ao próprio polo; não vê registros de outro polo.
- Os dois papéis são permissões de sistema; ter a **patente** de coordenador não cria automaticamente conta administrativa.
- Login individual; autorização de acesso aplicada no banco de dados; registro de alterações; exclusão recuperável inicialmente.
- Somente administradores autorizados podem ativar novas contas de coordenador (proposta, a confirmar).
- Respeitar as regras de proteção de dados aplicáveis no Japão, especialmente para menores de idade e dados sensíveis de religião e testemunhos. Não armazenar fichas em HTML estático ou repositório GitHub público.

## Etapas/patentes
`INCONSTANTE → FIRME → CPO → COLABORADOR → OBREIRO → COORDENADOR`

- **Inconstante**: ficha simplificada com **foto, telefone e endereço**, como solicitado. *Nome não foi incluído porque o pedido original foi “somente” estes três campos — confirmar como identificar fichas sem nome.* Há ID interno automático.
- **Firme**: após **batismo nas águas**; ficha completa, inclusive **testemunho**, **data do batismo nas águas** e **data do batismo com o Espírito Santo** (se ocorrer; não confundir datas).
- **CPO**: em preparação para tornar-se obreiro.
- **Colaborador**: etapa após CPO.
- **Obreiro**: etapa após colaborador.
- **Coordenador**: etapa após obreiro.
- Cada mudança de etapa deve guardar quem alterou e quando, com histórico; nenhuma mudança além da primeira deve ser automática sem regra aprovada.

## Ficha individual
### Inconstante
- Foto
- Telefone
- Endereço
- ID e polo atribuídos automaticamente pelo sistema (metadados).
- A esclarecer: incluir nome ou manter sem nome?

### Firme, CPO, Colaborador, Obreiro, Coordenador
Campos definidos até aqui:
- Nome completo, data de nascimento, telefone/WhatsApp, polo, data de ingresso (proposta anterior)
- Foto e endereço (já existentes no cadastro de inconstante)
- Data de batismo nas águas
- Data de batismo com o Espírito Santo, caso haja
- **Aba Testemunho**: espaço de texto, com edição restrita aos usuários autorizados e registro de alterações
- Patente atual e histórico de promoções
- Outros campos somente depois de aprovação

## Visita por igreja — impressão A4
- Selecionar um polo → **Imprimir relatório A4**.
- Uma versão compacta, diferente da ficha na tela, com **aproximadamente 20 jovens por página A4** (com páginas seguintes quando necessário).
- Cabeçalho com **polo, data e total de jovens**; rodapé com número da página, uso interno e confidencial.
- **Campos definitivos e enxutos do A4:** **Nº | Nome / Identificação | Patente | Idade**. Sem colunas de telefone, endereço, batismos, testemunho ou situação.
- **Idade calculada automaticamente** a partir da data de nascimento; exibir **—** se esse campo não estiver preenchido.
- Para ficha de **inconstante sem nome**, utilizar identificador interno no campo “Nome / Identificação”, sem inventar nome.
- Total geral do polo e paginação automática; layout legível para aproximadamente 20 registros por folha A4.

## Relatório semanal dos coordenadores
- **Quando:** todos os domingos, fuso do Japão `Asia/Tokyo`.
- **17h30:** notificação de lembrete ao coordenador.
- **22h00:** prazo final da entrega sem atraso.
- **Após 22h00:** ainda aceita envio, com indicador **ATR (atrasado)** e horário real registrado.
- **22h00:** polos que não enviaram recebem notificação de pendência; estado **NÃO ENVIADO**, depois **ATR** se enviado tardiamente.
- A coordenação nacional acompanha situação de todos os 23 polos; os coordenadores só o seu.
- A **lista de perguntas/campos do relatório semanal está pendente**; não confundir com marcação de presença.
- **Canal das notificações está pendente**: e-mail, push, WhatsApp etc. Cada canal tem autorização e limites próprios.
- Evitar notificações duplicadas, registrar horário e histórico de submissão.

## Protótipo e implantação
1. Revisar a demonstração visual com dados fictícios, sem coletar dados reais.
2. Aprovar campos, fluxos e modelos A4 e semanal.
3. Definir credenciais de administradores e coordenadores e canal de notificações.
4. Implantar backend protegido (ex.: Supabase para Auth/DB com políticas por polo) e painel (ex.: Vercel). O portal GitHub Pages atual continua público e independente.
5. Testar permissões com dados artificiais e contas de teste; só depois habilitar cadastros reais.

## Decisões em aberto
- Identificação nominal do **inconstante** sem contrariar a instrução “somente foto, telefone e endereço”.
- Campos e perguntas do relatório semanal.
- Canal das notificações.
- Política de exclusão e retenção, regras de alterações de patente, medidas de proteção dos dados e de menores.
