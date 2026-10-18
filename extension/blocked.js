/* Tela de bloqueio — funciona tanto na extensão quanto no app desktop */
(function () {
  const params = new URLSearchParams(location.hash.slice(1) || location.search.slice(1));
  const type = params.get('t') || 'site';
  const value = params.get('v') || '';

  const COPY = {
    site:  { kind: 'Site bloqueado',      title: 'Esse site não faz parte do seu foco.' },
    word:  { kind: 'Pesquisa bloqueada',  title: 'Você não deveria pesquisar isso.' },
    app:   { kind: 'App bloqueado',       title: 'Esse app ficou de fora do seu dia.' },
    guard: { kind: 'Proteção desligada',  title: 'A extensão de proteção foi desativada.' }
  };
  const c = COPY[type] || COPY.site;
  document.getElementById('kind').textContent = c.kind;
  document.getElementById('title').textContent = c.title;
  document.getElementById('target').textContent =
    type === 'word' ? 'termo: ' + value :
    type === 'guard' ? 'navegador fechado: ' + value + ' — reative a extensão' : value;
  document.title = c.kind + ' · Distraction Block';

  const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
  const isDesktop = typeof window.db !== 'undefined';

  let messages = (self.DB_MESSAGES || []).slice();
  let last = -1;
  const msgEl = document.getElementById('message');
  function showMessage() {
    if (!messages.length) return;
    let i;
    do { i = Math.floor(Math.random() * messages.length); } while (messages.length > 1 && i === last);
    last = i;
    msgEl.classList.remove('swap'); void msgEl.offsetWidth; msgEl.classList.add('swap');
    msgEl.textContent = messages[i];
  }

  async function loadCustom() {
    try {
      if (isExtension) {
        const { config } = await chrome.storage.local.get('config');
        if (config && Array.isArray(config.messages) && config.messages.length) messages = config.messages;
      } else if (isDesktop) {
        const list = await window.db.messages();
        if (Array.isArray(list) && list.length) messages = list;
      }
    } catch (e) { /* usa as mensagens padrão */ }
  }

  // Guia de respiração: 4s inspirando, 4s soltando (sincronizado com a animação)
  const cue = document.getElementById('breathCue');
  let phase = 0;
  setInterval(() => { phase = 1 - phase; cue.textContent = phase ? 'Solte o ar' : 'Inspire'; }, 4000);
  cue.textContent = 'Inspire';

  document.getElementById('nextBtn').addEventListener('click', showMessage);
  document.getElementById('focusBtn').addEventListener('click', async () => {
    if (isExtension) {
      try {
        const tab = await chrome.tabs.getCurrent();
        await chrome.tabs.update(tab.id, { url: 'chrome://newtab/' });
        return;
      } catch (e) { /* cai para o fechamento */ }
      window.close();
    } else if (isDesktop) {
      window.db.closeOverlay();
    } else {
      window.close();
    }
  });

  if (isExtension && type === 'site') {
    // Bloqueios de site acontecem sem passar pelo script; registramos aqui.
    try { chrome.runtime.sendMessage({ type: 'blocked', t: 'site', v: value }); } catch (e) { /* ignora */ }
  }

  // Se outro bloqueio acontecer na mesma aba, só muda o # da URL: recarrega
  window.addEventListener('hashchange', () => location.reload());

  showMessage();
  loadCustom().then(() => { if (messages.length) showMessage(); });
})();
