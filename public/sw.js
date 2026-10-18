// Service worker do Distraction Block
// Deixa o site ser instalado como app e abrir mesmo sem internet (com a última versão guardada).
//   - páginas (index.html): tenta a internet primeiro; sem internet, usa a última cópia guardada;
//   - arquivos de assets/ e ícones (o nome muda a cada versão): usa a cópia guardada, senão baixa e guarda;
//   - nada de outros endereços (fontes do Google etc.) passa por aqui.

const CACHE = 'distraction-block-v1';

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(['./', './manifest.webmanifest', './icones/icone-192.png']))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;
  if (pedido.method !== 'GET') return;
  const url = new URL(pedido.url);
  if (url.origin !== self.location.origin) return;

  // Página: internet primeiro, cópia guardada sem internet
  if (pedido.mode === 'navigate') {
    evento.respondWith(
      fetch(pedido)
        .then((resposta) => {
          const copia = resposta.clone();
          caches.open(CACHE).then((c) => c.put('./', copia)).catch(() => {});
          return resposta;
        })
        .catch(() => caches.match('./'))
    );
    return;
  }

  // Arquivos com versão no nome: cópia guardada primeiro
  if (url.pathname.includes('/assets/') || url.pathname.includes('/icones/')) {
    evento.respondWith(
      caches.match(pedido).then(
        (guardado) =>
          guardado ||
          fetch(pedido).then((resposta) => {
            const copia = resposta.clone();
            caches.open(CACHE).then((c) => c.put(pedido, copia)).catch(() => {});
            return resposta;
          })
      )
    );
  }
});
