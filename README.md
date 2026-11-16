# Surplus To Smiles Network

Crie do zero um aplicativo WEB React TypeScript chamado AlimentaBot para FIAP Global Solution 2026, SEM backend real, pronto para banca. A prioridade absoluta é build sem erros, rotas funcionando e frontend de produto SaaS de verdade (não apresentação em site). Todo conteúdo em português brasileiro. O app não precisa de login e todos os dados são DEMONSTRATIVOS locais por visitante, persistidos em localStorage e reiniciáveis; nenhum dado real de beneficiários. Não usar Supabase, nem serviços externos que exijam credenciais.

Separar em dois ambientes com design premium FoodTech, consistente com a marca AlimentaBot: off-white #F7F9F4, verde-floresta #153D32, verde-lima #A7D63D, esmeralda #168B62, grafite #202B27, tipografia Sora/Inter, curvas orgânicas, muita legibilidade, imagens de alimentos na landing, ícones lucide, layout responsivo e acessível. Marca com logo-conceito robô simpático + bowl de comida + rota.

AMBIENTE 1: Landing comercial em /, com hero 'Alimento bom não deveria virar desperdício.', subtítulo sobre ligar excedentes seguros a pessoas/instituições, CTAs 'Acessar plataforma' levando a /app e 'Como funciona' levando à seção. Seções: problema/oportunidade, quatro etapas publicar > revisão humana > matching/retirada > recebimento, público-alvo, valor proposto, tecnologia, dúvidas, chamada final e equipe Carolina Feitosa RM 563049 e Guilherme Machado RM 564658. Não inventar depoimentos, parceiros, clientes, testes de campo, números de impacto. Robôs e smart lockers são apenas visão futura condicionada a licenças e segurança.

AMBIENTE 2: MVP FRONTEND em /app com sidebar de SaaS no desktop, drawer no mobile, header e métricas ilustrativas; /app/doador, /app/transportador, /app/instituicao, /app/gestor, /app/simulador. Navegação por quatro papéis sem autenticação para banca, mostrar chip 'DEMONSTRAÇÃO • DADOS SINTÉTICOS'. O frontend deve parecer um sistema real e não slides.

DOADOR: painel de lotes fictícios, filtros e busca, formulário para cadastrar excedente (item/categoria, kg/quantidade, conservação, preparação e validade, janela segura de coleta, origem fictícia, observações) com validações. Novo lote sempre PENDENTE DE REVISÃO, nunca liberado automaticamente. Tabela e cartões profissionais, detalhes do lote, toasts.

GESTOR/OPERADOR DEMO: painel de métricas calculadas do estado demonstrativo, gestão do ciclo e revisão sanitária puramente HIPOTÉTICA para simulação (sem atestado verdadeiro), aprovar/rejeitar para teste. Histórico de custódia fictício auditável, atividades, notificações e botão Reiniciar demonstração.

TRANSPORTADOR: oportunidades liberadas, requisitos de conservação e capacidade, escolher/aceitar entrega e registrar coleta; bloquear reserva duplicada e etapa fora de ordem. Distâncias hipotéticas, não GPS real.

INSTITUIÇÃO: painel de lotes destinados à instituição fictícia, capacidade e janela, conferir e confirmar/recusar recebimento; sincronizar alterações com outros painéis em estado local.

SIMULADOR: explicação do matching e comparação de pesquisa SIMULADA 24 lotes, 16 motoristas, 8 destinos; baseline sequencial 14 entregas/79kg/48,08km de desvio, otimização 15 entregas/98kg/41,43km. Comparação visual com gráficos e ressalva de que são números acadêmicos sintéticos, não resultado operacional nem execução de IA real. Validade, conservação, capacidade e janela + revisão humana são bloqueios antes da sugestão.

Fluxo demo ponta a ponta operacional no mesmo navegador: cadastrar lote > validar hipoteticamente como gestor > encontrar oportunidade > motorista aceita e coleta > instituição confirma recebimento > indicadores e histórico reativos. Opcional tour guiado 'Experimente em 3 minutos'. Dados independentes entre visitantes. Não implementa pagamento, recompensas por entrega, patrocínio inventado ou parceria real.

Arquitetura pronta para posterior integração via API REST com Python/FastAPI/PostgreSQL a ser desenvolvida pelo usuário na IDE: separar camada de serviços mock, models/interfaces TS, armazenamento e componentes; documentação curta de como substituir mock adapter por fetch. Evitar qualquer alegação de backend já feito. Usar React, TypeScript, Tailwind e componentes com design consistente.

CRITÉRIOS DE ACEITE: validar build, evitar referências a arquivos ou imports que não existem, testar /, /app, as quatro rotas de papel e simulador. Priorizar execução funcional de uma versão enxuta sobre uma grande com build quebrado. Se algo não ficar pronto, avisar exatamente o que falta. O projeto deve ser publicável e navegável sem login.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a0a8c24d-1a49-42fb-858d-b91ab83d6e31).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Operação e produção

O projeto possui ambientes locais separados para demo, API e PostgreSQL. Consulte
[`docs/PRODUCAO.md`](docs/PRODUCAO.md) antes de configurar Render ou Vercel: o backend
tem definição de serviço em `render.yaml`, mas o frontend ainda usa preset Nitro para
Cloudflare e não deve ser publicado na Vercel até que esse preset/roteamento seja
validado. Nunca versione `.env`, tokens Auth0 ou URLs de banco.

## Histórico e contribuição

Os marcos publicados estão em [CHANGELOG.md](CHANGELOG.md). Consulte
[`docs/CONTRIBUINDO.md`](docs/CONTRIBUINDO.md) para a convenção de commits e as regras
de histórico compatíveis com a integração Lovable.
