// Datas, contagens e textos usados nas telas
export const DAY = 86400000;
export const pad = (n) => String(n).padStart(2, '0');

export function fmtDate(t) {
  const d = new Date(t);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}
export function fmtDateTime(t) {
  const d = new Date(t);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} às ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function fmtTime(t) {
  const d = new Date(t);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function fmtLeft(ms) {
  if (ms <= 0) return 'pronto';
  const d = Math.floor(ms / DAY);
  const hh = Math.floor((ms % DAY) / 3600000);
  const mm = Math.ceil((ms % 3600000) / 60000);
  if (d > 0) return `${d}d ${hh}h`;
  if (hh > 0) return `${hh}h ${mm}min`;
  return `${mm} min`;
}
export function isToday(t) { return new Date(t).toDateString() === new Date().toDateString(); }
export function plural(n, um, varios) { return `${n} ${n === 1 ? um : varios}`; }
export function firstName(n) { return String(n || '').trim().split(/\s+/)[0] || ''; }
export function initials(n) {
  return String(n || '?').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}
export function mailto(email, subject, body) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export const LIST_NAMES = { sites: 'o site', words: 'a palavra' };
export const TYPE_LABEL = { site: 'Site', word: 'Pesquisa' };

// Mensagens ativas (as suas + as padrão ligadas)
export function mensagensAtivas(S) {
  if (!S) return [];
  const off = new Set(S.disabledDefaults || []);
  const list = [...S.customMessages, ...(S.mensagensPadrao || []).filter((m) => !off.has(m))];
  return list.length ? list : (S.mensagensPadrao || []);
}
export function mensagemAleatoria(S) {
  const all = mensagensAtivas(S);
  return all[Math.floor(Math.random() * all.length)] || '';
}
export function mensagemDoDia(S) {
  const all = mensagensAtivas(S);
  const d = new Date();
  const seed = d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate();
  return all[seed % all.length] || '';
}

export function pedidoAberto(r) { return r.status === 'pending' || r.status === 'ready'; }
