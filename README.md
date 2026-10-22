# Distraction Block (PJ002)

Bloqueia **sites** e **palavras pesquisadas** para você não perder tempo com distrações.
Quando algo é bloqueado, aparece um aviso e uma mensagem de "melhora".

Feito em **React** (Vite + React Router), do mesmo jeito que o CIFRA: site publicado no GitHub Pages
e instalável como app. Quem bloqueia de verdade é a **extensão do navegador** (pasta `extension`).

## Páginas

| Endereço | O que é |
|---|---|
| `#/` | Site de apresentação (Início) |
| `#/baixar` | Baixar e instalar (extensão, painel, primeiro bloqueio) |
| `#/entrar` | Login (e-mail e senha) |
| `#/cadastro` | Criar conta (nome, e-mail e senha) |
| `#/painel` | Painel do app, só com login (Bloqueios, Liberações, Mensagens e Ajustes ficam em `#/painel/...`) |

No primeiro acesso você cria a conta; depois entra com e-mail e senha. A senha do login é a mesma que confirma cada liberação. A conta fica só neste navegador (sem servidor), 5 senhas erradas travam o login por 5 minutos e não existe recuperação de senha, de propósito.

## Regra principal

- **Bloquear é imediato.** Adicionar um site ou uma palavra vale na hora.
- **Liberar leva 7 dias.** Você faz o pedido em *Liberações* e, depois de 7 dias, confirma com a senha.
- **O prazo é ajustável** em *Ajustes › Prazo para liberar*: 4, 7, 14, 30 dias ou outro número (de 4 a 90). Aumentar vale na hora. Diminuir também é uma liberação: espera o prazo atual (e a aprovação da pessoa de confiança, se houver) e é confirmado com a senha. Pedidos já abertos mantêm o prazo com que foram feitos.
- **Desistir é imediato.** Cancelar um pedido mantém tudo bloqueado.
- **Pessoa de confiança (opcional).** Ela recebe por e-mail 20 códigos de uso único. Para liberar algo, você clica em *Solicitar permissão*; se ela concordar, responde com um código. Se negar, nova tentativa só depois de mais 7 dias.

## Planos e estilos

- **Gratuito:** até 4 sites, 5 palavras e 2 apps. **Pro:** R$ 9,99 por mês, tudo ilimitado, mais cores, imagem de fundo, mensagens próprias e gráfico de 30 dias.
- Ainda não existe cobrança: com `COBRANCA_ATIVA = false` (em `src/config.js`) nada é travado. Preço e limites também ficam em `src/config.js`.
- **Estilos** (Ajustes): tema escuro ou claro, cor de destaque e imagem de fundo. Valem só no painel, depois do login. A imagem é reduzida e guardada no navegador.

## Login na nuvem (Supabase)

O login (nome, e-mail e senha) fica no Supabase. Bloqueios, listas e a senha de controle continuam no navegador, porque é a extensão dele que bloqueia.

1. No projeto do Distraction Block no Supabase: **SQL Editor → New query**, cole `supabase/01_estrutura.sql` e clique em **Run** (uma vez só). Se você já tinha rodado a versão antiga, com vícios e recaídas, rode também `supabase/02_remover_superacao.sql`.
2. **Project Settings → API**: copie o *Project URL* e a *Publishable key* (`sb_publishable_...`) para `SUPABASE_URL` e `SUPABASE_CHAVE_PUBLICA` em `src/config.js`. Nunca use a chave secreta.
3. **Authentication → URL Configuration**: *Site URL* = `https://distractionblock.vercel.app/`; adicione `https://rvazh.github.io/DistractionBlock/**` em *Redirect URLs*; em *Redirect URLs* adicione também `http://localhost:5173/**`.
4. **E-mails de confirmação**: o servidor de e-mail padrão do Supabase é bem limitado. Configure o SMTP do Brevo em **Authentication → Emails → SMTP Settings** (como no CIFRA) ou, só para testar, desligue *Confirm email* em **Authentication → Sign In / Providers → Email**.

Com `SUPABASE_URL` vazio, tudo funciona como antes (login só no navegador). Quem já tinha conta só no navegador entra normalmente: a conta é criada no servidor com o mesmo e-mail e senha.

## Estrutura

```
├── index.html            Página base (fontes, ícones, manifest do app)
├── public/               Ícones, manifest.webmanifest e sw.js (instalar como app)
├── src/
│   ├── main.jsx          Inicia o React com HashRouter
│   ├── App.jsx           Rotas: site (Início, Baixar) e painel (/painel/...)
│   ├── config.js         Endereço do GitHub, ID da extensão, dias de espera
│   ├── components/       Cabeçalho e rodapé do site, menu lateral do painel, janelas, peças comuns
│   ├── pages/            Uma tela por arquivo (.jsx + .css)
│   ├── dados/            Regras, armazenamento, conversa com a extensão, instalação
│   ├── contexto/         Estado do app e avisos (toasts)
│   ├── assets/telas/     Capturas do app usadas no site
│   └── styles/           global.css (painel, escuro) e site.css (apresentação, claro)
├── extension/            Extensão para Chrome/Edge/Brave/Opera
└── test/                 Testes das regras (npm test)
```

## Rodar no computador

```bash
npm install
npm run dev
```

Abra o endereço que aparecer (ex.: `http://localhost:5173`).

## Publicar no GitHub Pages

1. O arquivo de publicação precisa ficar em `.github/workflows/deploy.yml` (igual ao CIFRA).
2. No GitHub: **Settings › Pages › Build and deployment › Source: GitHub Actions**.
3. A cada push na `main`, o site é publicado em `https://rvazh.github.io/DistractionBlock/`.

## Instalar a extensão

1. Abra `chrome://extensions` (no Edge: `edge://extensions`).
2. Ligue o **Modo do desenvolvedor** e clique em **Carregar sem compactação**.
3. Escolha a pasta `extension`.
4. Em **Detalhes** da extensão, ative **Permitir no modo anônimo**.
5. Abra o site do Distraction Block: ele manda as listas para a extensão e o status muda para **Conectada**.

A extensão tem um ID fixo (`elgkdjcphcnfdbalpioafiogblhfhnbc`) e só aceita listas de `distractionblock.vercel.app`, `rvazh.github.io` e `localhost` (em `extension/manifest.json`, campo `externally_connectable`). Se publicar o site em outro endereço, adicione-o lá e recarregue a extensão.
Se publicar em outro endereço (ex.: Vercel), adicione-o em `externally_connectable` no `extension/manifest.json`.

## Editar o projeto

- As regras de busca (`extension/match.js`) e as mensagens padrão (`extension/messages.js`) são usadas pela extensão **e** pelo site. Mudou ali, muda nos dois.
- Depois de mudar a extensão, clique em ↻ (recarregar) no card dela em `chrome://extensions`.
- Testes: `npm test`.

## Limites desta versão

- Os dados ficam no navegador: limpar os dados do site apaga a conta, as listas e a senha.
- Bloqueio de apps do Windows (Discord, Steam…) ainda não existe: um site não consegue fechar programas.
- Na pessoa de confiança, os códigos passam pelo seu e-mail uma vez, na hora do cadastro. A versão com link de aprovação precisa de servidor (Supabase + Brevo).

## Próximas etapas

- Bloqueio de apps do Windows.
- Pessoa de confiança aprovando por link no e-mail.
- Versão Android.
