// Painel › Até poder liberar: um checklist com os dias de espera de cada pedido aberto
import { Link } from 'react-router-dom';
import { useEstado } from '../contexto/Estado.jsx';
import { Vazio } from './Pecas.jsx';
import { TituloPedido } from '../pages/Liberacoes.jsx';
import { DAY, diasDoPedido, firstName, fmtDate, fmtDateTime, pedidoAberto, plural } from '../dados/formato.js';
import './ContagemLiberacao.css';

const MAX_NA_TELA = 4;

function Contagem({ r, agora, nomePessoa }) {
  const total = diasDoPedido(r);
  const pronto = r.status === 'ready';
  const feitos = pronto ? total : Math.min(total, Math.max(0, Math.floor((agora - r.createdAt) / DAY)));
  const faltam = Math.max(0, Math.ceil((r.availableAt - agora) / DAY));
  const compacto = total > 14;

  return (
    <li className={'contagem' + (pronto ? ' pronto' : '')}>
      <div className="contagem-topo">
        <span className="contagem-titulo"><TituloPedido r={r} /></span>
        <span className={'pill' + (pronto ? ' solid' : '')}>
          {pronto ? 'Prazo cumprido' : `Faltam ${plural(faltam, 'dia', 'dias')}`}
        </span>
      </div>

      <ol className={'dias' + (compacto ? ' compacto' : '')} aria-label={`${feitos} de ${total} dias cumpridos`}>
        {Array.from({ length: total }, (_, i) => {
          const estado = i < feitos ? 'feito' : i === feitos && !pronto ? 'hoje' : '';
          return (
            <li key={i} className={estado} title={`Dia ${i + 1} · ${fmtDate(r.createdAt + i * DAY)}${estado === 'feito' ? ' · cumprido' : estado === 'hoje' ? ' · hoje' : ''}`}>
              {!compacto && <span aria-hidden="true">{estado === 'feito' ? '✓' : i + 1}</span>}
            </li>
          );
        })}
      </ol>

      <div className="contagem-rodape">
        <span>{pronto ? `${total} de ${total} dias` : `Dia ${feitos + 1} de ${total}`} · libera em {fmtDateTime(r.availableAt)}</span>
        {r.needsApproval && <span className="falta">Falta a aprovação de {nomePessoa}</span>}
        {pronto && !r.needsApproval && <Link className="btn sm" to="/painel/liberacoes">Decidir</Link>}
      </div>
    </li>
  );
}

export default function ContagemLiberacao() {
  const { S, agora } = useEstado();
  const abertos = S.requests.filter(pedidoAberto).sort((a, b) => a.availableAt - b.availableAt);
  const mostrar = abertos.slice(0, MAX_NA_TELA);
  const nomePessoa = S.trusted ? firstName(S.trusted.name) : '';

  return (
    <div className="card">
      <div className="card-head">
        <h2>Até poder liberar</h2>
        <span className="tag">{plural(abertos.length, 'pedido aberto', 'pedidos abertos')}</span>
      </div>
      {mostrar.length ? (
        <>
          <ul className="contagens">
            {mostrar.map((r) => <Contagem key={r.id} r={r} agora={agora} nomePessoa={nomePessoa} />)}
          </ul>
          {abertos.length > MAX_NA_TELA && (
            <Link className="btn sm ghost contagem-mais" to="/painel/liberacoes">Ver os {abertos.length} pedidos</Link>
          )}
        </>
      ) : (
        <Vazio titulo="Nenhum pedido de liberação.">
          Tudo segue bloqueado. Quando você pedir para liberar algo, a contagem dos {S.delayDays} dias aparece aqui.
        </Vazio>
      )}
    </div>
  );
}
