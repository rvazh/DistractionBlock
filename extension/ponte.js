/*
 * Distraction Block — ponte entre o site e a extensão.
 * Roda dentro das páginas do site (veja "content_scripts" no manifest.json) e leva as mensagens
 * do painel até a extensão. Funciona em qualquer navegador baseado no Chrome (Chrome, Edge, Brave, Opera),
 * sem depender do "externally_connectable".
 */
(function () {
  const versao = chrome.runtime.getManifest().version;
  // Sinal para o site saber que a extensão está aqui (e qual versão)
  document.documentElement.setAttribute('data-distraction-block', versao);

  window.addEventListener('message', (e) => {
    if (e.source !== window || !e.data || e.data.__db !== 'pedido') return;
    const { id, msg } = e.data;
    const responder = (res) => window.postMessage({ __db: 'resposta', id, res: res || null }, window.location.origin);
    try {
      chrome.runtime.sendMessage({ __doSite: true, msg }, (res) => {
        if (chrome.runtime.lastError) return responder(null); // extensão recarregada: a página precisa recarregar
        responder(res);
      });
    } catch (err) {
      responder(null);
    }
  });
})();
