// ===== Superação: contas do contador de cada vício =====
// Datas no formato "AAAA-MM-DD" (dia do calendário, sem hora), como vêm do banco.

export const METAS = [1, 3, 7, 14, 30, 60, 90, 180, 365, 730, 1095];
export const SUGESTOES = ['Redes sociais', 'Apostas', 'Jogos', 'Pornografia', 'Álcool', 'Cigarro', 'Compras online', 'Doces'];

// Hoje no fuso de quem está usando (não em UTC)
export function hojeISO(agora = new Date()) {
  const d = new Date(agora);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function paraDia(iso) {
  const [a, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return Date.UTC(a, m - 1, d) / 86400000;
}

export function diasEntre(de, ate) {
  return Math.round(paraDia(ate) - paraDia(de));
}

export function formatarData(iso) {
  const [a, m, d] = String(iso).slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

// Resumo de um vício: dias sem recair agora, recorde, recaídas e a próxima meta
export function resumoVicio(v, hoje = hojeISO()) {
  const recaidas = (v.recaidas || []).map((r) => r.quando).filter((q) => q && q >= v.inicio && q <= hoje).sort();
  // Pontos em que o contador (re)começou: o início e cada recaída
  const pontos = [v.inicio, ...recaidas];
  let recorde = 0;
  for (let i = 1; i < pontos.length; i++) recorde = Math.max(recorde, diasEntre(pontos[i - 1], pontos[i]));
  const desde = pontos[pontos.length - 1];
  const dias = Math.max(0, diasEntre(desde, hoje));
  recorde = Math.max(recorde, dias);
  const meta = METAS.find((m) => m > dias) || null;
  const metaAnterior = [...METAS].reverse().find((m) => m <= dias) || 0;
  const pct = meta ? Math.round(((dias - metaAnterior) / (meta - metaAnterior)) * 100) : 100;
  return {
    dias,
    desde,
    recorde,
    ehRecorde: dias > 0 && dias >= recorde,
    totalRecaidas: (v.recaidas || []).length,
    meta,
    faltam: meta ? meta - dias : 0,
    pct,
    comecou: diasEntre(v.inicio, hoje) >= 0,
  };
}

export function textoDias(n) {
  return n === 1 ? '1 dia' : `${n} dias`;
}
