/*
 * Distraction Block — extensão (service worker)
 * - Recebe do site (distractionblock.vercel.app ou rvazh.github.io/DistractionBlock) as listas de sites e palavras
 *   (os endereços aceitos ficam em manifest.json → externally_connectable)
 * - Bloqueia sites com regras do declarativeNetRequest
 * - Bloqueia pesquisas que contenham palavras proibidas
 * - Guarda os bloqueios que aconteceram para o site mostrar no Painel
 */
importScripts('match.js', 'messages.js');

const BLOCK_PAGE = chrome.runtime.getURL('blocked.html');
const VERSION = chrome.runtime.getManifest().version;

let config = null;
const lastRedirect = new Map();

function browserKey() {
  const ua = navigator.userAgent || '';
  if (/Edg\//.test(ua)) return 'edge';
  if (/OPR\//.test(ua)) return 'opera';
  if (navigator.brave) return 'brave';
  return 'chrome';
}

async function getConfig() {
  if (config) return config;
  const { config: c } = await chrome.storage.local.get('config');
  config = c || { sites: [], words: [], messages: [] };
  return config;
}

/* ---------- Sites ---------- */
let aplicando = Promise.resolve();
function applySiteRules() {
  // uma atualização por vez (evita regras com o mesmo id)
  aplicando = aplicando.then(async () => {
    const sites = ((await getConfig()).sites) || [];
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const current = existing.map((r) => (r.condition.requestDomains || [])[0]).sort();
    if (JSON.stringify(current) === JSON.stringify(sites.slice().sort())) return;
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existing.map((r) => r.id),
      addRules: sites.map((s, i) => ({
        id: i + 1,
        priority: 1,
        action: { type: 'redirect', redirect: { url: `${BLOCK_PAGE}#t=site&v=${encodeURIComponent(s)}` } },
        condition: { requestDomains: [s], resourceTypes: ['main_frame', 'sub_frame'] }
      }))
    });
  }).catch((e) => console.warn('regras', e));
  return aplicando;
}

/* ---------- Pesquisas ---------- */
async function checkUrl(tabId, url, frameId) {
  if (frameId !== 0 || tabId < 0 || !url || url.startsWith(BLOCK_PAGE)) return;
  const c = await getConfig();
  if (!c.words || !c.words.length) return;
  const hit = DBMatch.blockedTermInUrl(url, c.words);
  if (!hit) return;
  const last = lastRedirect.get(tabId) || 0;
  if (Date.now() - last < 1500) return;
  lastRedirect.set(tabId, Date.now());
  try {
    await chrome.tabs.update(tabId, { url: `${BLOCK_PAGE}#t=word&v=${encodeURIComponent(hit.word)}` });
  } catch (e) { /* aba fechada */ }
  registrar('word', hit.word);
}

chrome.webNavigation.onBeforeNavigate.addListener((d) => checkUrl(d.tabId, d.url, d.frameId));
chrome.webNavigation.onHistoryStateUpdated.addListener((d) => checkUrl(d.tabId, d.url, d.frameId));
chrome.webNavigation.onReferenceFragmentUpdated.addListener((d) => checkUrl(d.tabId, d.url, d.frameId));
chrome.tabs.onUpdated.addListener((tabId, info) => { if (info.url) checkUrl(tabId, info.url, 0); });
chrome.tabs.onRemoved.addListener((tabId) => lastRedirect.delete(tabId));

/* ---------- Bloqueios que aconteceram (o site busca para o Painel) ---------- */
async function registrar(type, target) {
  const { pending = [] } = await chrome.storage.local.get('pending');
  pending.push({ type, target, t: Date.now() });
  await chrome.storage.local.set({ pending: pending.slice(-500) });
}

// Mensagens de dentro da extensão: a tela de bloqueio e a ponte que roda nas páginas do site (ponte.js)
const SITES_DO_PAINEL = ['https://distractionblock.vercel.app', 'https://rvazh.github.io', 'http://localhost', 'http://127.0.0.1'];
function ehDoPainel(sender) {
  const origem = (sender && (sender.origin || (sender.url && new URL(sender.url).origin))) || '';
  return SITES_DO_PAINEL.some((s) => origem === s || origem.startsWith(s + ':'));
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'blocked' && msg.t === 'site') registrar('site', msg.v);
  if (msg && msg.__doSite && ehDoPainel(sender)) {
    tratarDoSite(msg.msg).then(sendResponse, () => sendResponse({ ok: false }));
    return true; // resposta assíncrona
  }
});

/* ---------- Conversa com o site ---------- */
function lista(v, max) { return Array.isArray(v) ? v.slice(0, max).map(String) : []; }

// O que o site pede: ping (status), config (as listas) e events (bloqueios que aconteceram)
async function tratarDoSite(msg) {
  if (!msg || typeof msg !== 'object') return { ok: false };

  if (msg.type === 'ping') {
    let incognito = false;
    try { incognito = await chrome.extension.isAllowedIncognitoAccess(); } catch (e) { /* ignora */ }
    await chrome.storage.local.set({ incognito, lastSeen: Date.now() });
    return { ok: true, browser: browserKey(), incognito, version: VERSION };
  }

  if (msg.type === 'config') {
    const c = msg.config || {};
    config = {
      sites: lista(c.sites, 5000).map((x) => DBMatch.normSite(x)).filter(Boolean),
      words: lista(c.words, 2000).map((x) => x.slice(0, 80)),
      messages: lista(c.messages, 500).map((x) => x.slice(0, 240))
    };
    await chrome.storage.local.set({ config, lastSync: Date.now() });
    await applySiteRules();
    return { ok: true };
  }

  if (msg.type === 'events') {
    const { pending = [] } = await chrome.storage.local.get('pending');
    await chrome.storage.local.set({ pending: [] });
    return { events: pending };
  }

  return { ok: false };
}

// Caminho direto (externally_connectable), usado quando a ponte não está na página
chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  tratarDoSite(msg).then(sendResponse, () => sendResponse({ ok: false }));
  return true; // resposta assíncrona
});

// Ao iniciar o navegador, reaplica a última lista recebida
chrome.runtime.onStartup.addListener(() => applySiteRules());
chrome.runtime.onInstalled.addListener(() => applySiteRules());
