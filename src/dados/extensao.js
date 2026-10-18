// ===== Conversa com a extensão do navegador =====
// A extensão tem um ID fixo e só aceita mensagens das páginas listadas em
// "externally_connectable" (extension/manifest.json): o site no GitHub Pages e o localhost.
import { EXTENSAO_ID } from '../config.js';

function enviar(msg) {
  return new Promise((resolve) => {
    const rt = typeof chrome !== 'undefined' && chrome.runtime;
    // Sem extensão instalada (ou em outro navegador), chrome.runtime.sendMessage não existe
    if (!rt || typeof rt.sendMessage !== 'function') return resolve(null);
    const tempo = setTimeout(() => resolve(null), 2500);
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

// { ok, browser, incognito, version } ou null se a extensão não respondeu
export const pingExtensao = () => enviar({ type: 'ping' });

// Manda as listas de sites, palavras e mensagens
export const enviarListas = (config) => enviar({ type: 'config', config });

// Bloqueios que aconteceram desde a última vez (a extensão esvazia a fila ao entregar)
export async function buscarBloqueios() {
  const r = await enviar({ type: 'events' });
  return r && Array.isArray(r.events) ? r.events : [];
}
