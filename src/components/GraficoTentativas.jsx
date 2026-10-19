// Painel › Tentativas bloqueadas: quantas vezes você tentou abrir algo bloqueado, por dia
import { useState } from 'react';
import { useEstado } from '../contexto/Estado.jsx';
import { fmtDate, isToday, plural } from '../dados/formato.js';
import './GraficoTentativas.css';

const DIAS_DA_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const CHAVE_PERIODO = 'db:periodo-grafico';

function lerPeriodo() {
  try { return localStorage.getItem(CHAVE_PERIODO) === '30' ? 30 : 7; } catch { return 7; }
}
function salvarPeriodo(p) {
  try { localStorage.setItem(CHAVE_PERIODO, String(p)); } catch { /* sem armazenamento */ }
}

// Um número "redondo" para o topo da escala (1, 2, 5, 10, 20, 50…)
function topoDaEscala(max) {
  if (max <= 4) return Math.max(1, max);
  const base = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 2, 5, 10]) if (m * base >= max) return m * base;
  return 10 * base;
}

export default function GraficoTentativas() {
  const { S } = useEstado();
  const [periodo, setPeriodo] = useState(lerPeriodo);
  const dias = periodo === 7 ? S.stats.week : S.stats.month;

  const total = dias.reduce((s, d) => s + d.count, 0);
  const sites = dias.reduce((s, d) => s + d.site, 0);
  const pesquisas = dias.reduce((s, d) => s + d.word, 0);
  const media = total / periodo;
  const pico = dias.reduce((a, d) => (d.count > a.count ? d : a), dias[0]);
  const topo = topoDaEscala(Math.max(...dias.map((d) => d.count)));

  function escolher(p) {
    setPeriodo(p);
    salvarPeriodo(p);
  }

  const rotulo = (d, i) => {
    const dt = new Date(d.start);
    if (periodo === 7) return DIAS_DA_SEMANA[dt.getDay()];
    // 30 dias: um rótulo a cada 5 dias, contando a partir de hoje
    return (dias.length - 1 - i) % 5 === 0 ? String(dt.getDate()).padStart(2, '0') : '';
  };

  return (
    <div className="card grafico">
      <div className="card-head wrap">
        <div>
          <h2>Tentativas bloqueadas</h2>
          <p className="sub" style={{ margin: 0 }}>Cada vez que você tentou abrir um site ou pesquisar uma palavra bloqueada.</p>
        </div>
        <div className="seg" role="radiogroup" aria-label="Período">
          {[7, 30].map((p) => (
            <button key={p} type="button" role="radio" aria-checked={periodo === p} className={periodo === p ? 'on' : ''} onClick={() => escolher(p)}>
              {p} dias
            </button>
          ))}
        </div>
      </div>

      <dl className="grafico-resumo">
        <div className="destaque"><dt>Total</dt><dd>{total}</dd></div>
        <div><dt>Sites</dt><dd>{sites}</dd></div>
        <div><dt>Pesquisas</dt><dd>{pesquisas}</dd></div>
        <div><dt>Média por dia</dt><dd>{media.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</dd></div>
        <div><dt>Pior dia</dt><dd>{pico.count ? <>{pico.count}<small> · {fmtDate(pico.start).slice(0, 5)}</small></> : '—'}</dd></div>
      </dl>

      <div className={'barras' + (periodo === 30 ? ' mes' : '')} role="img"
        aria-label={`${plural(total, 'tentativa bloqueada', 'tentativas bloqueadas')} nos últimos ${periodo} dias: ${sites} em sites e ${pesquisas} em pesquisas.`}>
        <div className="barras-escala" aria-hidden="true">
          <span>{topo}</span>
          <span>0</span>
        </div>
        <div className="barras-area" style={{ gridTemplateColumns: `repeat(${dias.length}, 1fr)` }}>
          <span className="barras-guia" aria-hidden="true" />
          {dias.map((d, i) => {
            const altura = d.count ? Math.max(3, (d.count / topo) * 100) : 0;
            const lado = i < 3 ? ' esq' : i > dias.length - 4 ? ' dir' : '';
            return (
              <div key={d.start} className={'barra-col' + (isToday(d.start) ? ' hoje' : '') + lado}>
                <span className="barra-tip">
                  <b>{plural(d.count, 'tentativa', 'tentativas')}</b>
                  <span>{fmtDate(d.start).slice(0, 5)}{isToday(d.start) ? ' · hoje' : ''}</span>
                  {d.count > 0 && <span>{plural(d.site, 'site', 'sites')} · {plural(d.word, 'pesquisa', 'pesquisas')}</span>}
                </span>
                <div className="barra-trilho">
                  <div className={'barra' + (d.count ? '' : ' zero')} style={{ height: `${altura}%` }} />
                </div>
                <span className="barra-lbl">{rotulo(d, i)}</span>
              </div>
            );
          })}
        </div>
      </div>
      {total === 0 && <p className="note">Nenhuma tentativa nesse período. Ou a extensão ainda não está instalada, ou você está mandando bem.</p>}
    </div>
  );
}
