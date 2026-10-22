// ===== Conversa com a extensão do navegador =====
// Dois caminhos:
// 1. Ponte (preferido): a extensão roda um pequeno script nas páginas do site (extension/ponte.js) que leva
//    as mensagens até ela. Funciona em Chrome, Edge, Brave e Opera. Ela marca a página com
//    data-distraction-block="<versão>" no <html>.
// 2. Direto: chrome.runtime.sendMessage para o ID fixo da extensão, para as páginas listadas em
//    "externally_connectable" (extension/manifest.json). Fica como reserva para versões antigas.
import { EXTENSAO_ID } from '../config.js';

const TEMPO = 2500;

export function versaoNaPagina() {
  return document.documentElement.getAttribute('data-distraction-block') || '';
}

function viaPonte(msg) {
  return new Promise((resolve) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const fim = (res) => {
      clearTimeout(tempo);
      window.removeEventListener('message', ouvir);
      resolve(res || null);
    };
    const ouvir = (e) => {
      if (e.source !== window || !e.data || e.data.__db !== 'resposta' || e.data.id !== id) return;
      fim(e.data.res);
    };
    const tempo = setTimeout(() => fim(null), TEMPO);
    window.addEventListener('message', ouvir);
    window.postMessage({ __db: 'pedido', id, msg }, window.location.origin);
  });
}

function direto(msg) {
  return new Promise((resolve) => {
    const rt = typeof chrome !== 'undefined' && chrome.runtime;
    // Sem extensão (ou site fora do externally_connectable), chrome.runtime.sendMessage não existe aqui
    if (!rt || typeof rt.sendMessage !== 'function') return resolve(null);
    const tempo = setTimeout(() => resolve(null), TEMPO);
    try {
      rt.sendMessage(EXTENSAO_ID, msg, (resposta) => {
        clearTimeout(tempo);
        if (chrome.runtime.lastError) return resolve(null); // extensão desativada ou removida
        resolve(resposta || null);
      });
    } catch {
      clearTimeout(tempo);
      resolve(null);
    }
  });
}

async function enviar(msg) {
  if (versaoNaPagina()) {
    const r = await viaPonte(msg);
    if (r) return r;
  }
  return direto(msg);
}

// Para a tela Ajustes explicar por que está desconectada
export function diagnostico() {
  const rt = typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function';
  return {
    endereco: window.location.origin,
    ponte: versaoNaPagina(), // versão da extensão vista nesta página ('' = não está aqui)
    direto: Boolean(rt),
  };
}

// { ok, browser, incognito, version } ou null se a extensão não respondeu
export const pingExtensao = () => enviar({ type: 'ping' });

// Manda as listas de sites, palavras e mensagens
export const enviarListas = (config) => enviar({ type: 'config', config });

// Bloqueios que aconteceram desde a última vez (a extensão esvazia a fila ao entregar)
export async function buscarBloqueios() {
  const r = await enviar({ type: 'events' });
  return r && Array.isArray(r.events) ? r.events : [];
}
