/*
 * Distraction Block — regras de comparação compartilhadas
 * Usado pela extensão (service worker) e pelo app desktop (Node).
 */
(function (root) {
  // Parâmetros de URL onde os buscadores colocam o texto pesquisado
  const SEARCH_PARAMS = ['q', 'query', 'search_query', 'p', 'text', 'wd', 'k', 'search', 'keyword', 'keywords', 'term', 'searchTerm'];

  function normText(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[+_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // A palavra precisa aparecer no início de uma palavra da pesquisa:
  // "bet" bloqueia "bet365" e "bets", mas não "alfabeto".
  function matchWord(text, word) {
    const t = normText(text);
    const w = normText(word);
    if (!t || !w) return false;
    return new RegExp('(^|[^a-z0-9])' + escapeRegex(w)).test(t);
  }

  function firstMatch(text, words) {
    for (const w of words || []) {
      const value = typeof w === 'string' ? w : w.value;
      if (matchWord(text, value)) return value;
    }
    return null;
  }

  // Extrai os textos pesquisados de uma URL (Google, Bing, YouTube, DuckDuckGo, etc.)
  function searchTermsFromUrl(url) {
    let u;
    try { u = new URL(url); } catch (e) { return []; }
    if (!/^https?:$/.test(u.protocol)) return [];
    const out = [];
    const read = (params) => {
      for (const key of SEARCH_PARAMS) {
        const v = params.get(key);
        if (v && v.trim()) out.push(v);
      }
    };
    read(u.searchParams);
    if (u.hash && u.hash.includes('=')) {
      try { read(new URLSearchParams(u.hash.slice(1))); } catch (e) { /* ignora */ }
    }
    // Ex.: /search/termo  ou  /results/termo
    const m = u.pathname.match(/\/(?:search|results|busca|pesquisa)\/([^/]+)/i);
    if (m) { try { out.push(decodeURIComponent(m[1])); } catch (e) { out.push(m[1]); } }
    return out;
  }

  function blockedTermInUrl(url, words) {
    for (const term of searchTermsFromUrl(url)) {
      const hit = firstMatch(term, words);
      if (hit) return { word: hit, query: term };
    }
    return null;
  }

  function normSite(input) {
    let s = String(input || '').trim().toLowerCase();
    s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, '');
    s = s.split(/[/?#]/)[0];
    s = s.replace(/^[^@]*@/, '').replace(/:\d+$/, '').replace(/^www\./, '').replace(/\.$/, '');
    if (!/^([a-z0-9-]+\.)+[a-z0-9-]{2,}$/.test(s)) return null;
    return s;
  }

  const api = { normText, matchWord, firstMatch, searchTermsFromUrl, blockedTermInUrl, normSite };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DBMatch = api;
})(typeof self !== 'undefined' ? self : this);
