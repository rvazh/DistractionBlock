# Distraction Block (PJ002)

Bloqueia **sites** e **palavras pesquisadas** para você não perder tempo com distrações.
Quando algo é bloqueado, aparece um aviso e uma mensagem de "melhora".

Feito em **React** (Vite + React Router), do mesmo jeito que o CIFRA: site publicado no GitHub Pages
e instalável como app. Quem bloqueia de verdade é a **extensão do navegador** (pasta `extension`).

## Regra principal

- **Bloquear é imediato.** Adicionar um site ou uma palavra vale na hora.
- **Liberar leva 7 dias.** Você faz o pedido em *Liberações* e, depois de 7 dias, confirma com a senha.
- **Desistir é imediato.** Cancelar um pedido mantém tudo bloqueado.
- **Pessoa de confiança (opcional).** Ela recebe por e-mail 20 códigos de uso único. Para liberar algo, você clica em *Solicitar permissão*; se ela concordar, responde com um código. Se negar, nova tentativa só depois de mais 7 dias.

## Estrutura

```
├── index.html            Página base (fontes, ícones, manifest do app)
├── public/               Ícones, manifest.webmanifest e sw.js (instalar como app)
├── src/
│   ├── main.jsx          Inicia o React com HashRouter
│   ├── App.jsx           Rotas: Painel, Bloqueios, Liberações, Mensagens, Ajustes
│   ├── config.js         Endereço do GitHub, ID da extensão, dias de espera
│   ├── components/       Menu lateral, janelas (modal), peças comuns
│   ├── pages/            Uma tela por arquivo (.jsx + .css)
│   ├── dados/            Regras, armazenamento, conversa com a extensão, instalação
│   ├── contexto/         Estado do app e avisos (toasts)
│   └── styles/global.css Cores e peças comuns
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

A extensão tem um ID fixo (`elgkdjcphcnfdbalpioafiogblhfhnbc`) e só aceita listas de `rvazh.github.io` e `localhost`.
Se publicar em outro endereço (ex.: Vercel), adicione-o em `externally_connectable` no `extension/manifest.json`.

## Editar o projeto

- As regras de busca (`extension/match.js`) e as mensagens padrão (`extension/messages.js`) são usadas pela extensão **e** pelo site. Mudou ali, muda nos dois.
- Depois de mudar a extensão, clique em ↻ (recarregar) no card dela em `chrome://extensions`.
- Testes: `npm test`.

## Limites desta versão

- Os dados ficam no navegador: limpar os dados do site apaga as listas e a senha.
- Bloqueio de apps do Windows (Discord, Steam…) ainda não existe: um site não consegue fechar programas.
- Na pessoa de confiança, os códigos passam pelo seu e-mail uma vez, na hora do cadastro. A versão com link de aprovação precisa de servidor (Supabase + Brevo).

## Próximas etapas

- Bloqueio de apps do Windows.
- Pessoa de confiança aprovando por link no e-mail.
- Versão Android.
