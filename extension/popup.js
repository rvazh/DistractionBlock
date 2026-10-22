(async function () {
  document.getElementById('versao').textContent = `Versão ${chrome.runtime.getManifest().version}`;
  const { config, lastSync, incognito } = await chrome.storage.local.get(['config', 'lastSync', 'incognito']);
  const c = config || { sites: [], words: [] };
  document.getElementById('sites').textContent = c.sites.length;
  document.getElementById('words').textContent = c.words.length;
  const st = document.getElementById('state');
  st.textContent = lastSync ? 'Recebendo a lista do site' : 'Abra o site para sincronizar';
  st.className = 'tag ' + (lastSync ? 'on' : 'off');
  const warns = [];
  if (!lastSync) warns.push('Abra o painel em distractionblock.vercel.app e entre na sua conta: a extensão recebe as listas na hora.');
  if (!incognito) warns.push('Ative "Permitir no modo anônimo" nos detalhes da extensão.');
  if (warns.length) {
    const w = document.getElementById('warn');
    w.hidden = false;
    w.textContent = warns.join(' ');
  }
})();
