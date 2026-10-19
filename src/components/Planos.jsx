// Seção Planos do site: Gratuito e Pro (R$ 9,99/mês)
import { Link } from 'react-router-dom';
import { useEstado } from '../contexto/Estado.jsx';
import { COBRANCA_ATIVA, PLANOS } from '../dados/planos.js';
import './Planos.css';

function Check() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3.5 9.5l3.5 3.5 7.5-8" />
    </svg>
  );
}

export default function Planos() {
  const { S } = useEstado();
  const destino = S.logado ? '/painel/ajustes' : S.account ? '/entrar' : '/cadastro';

  return (
    <section id="planos" className="s-conteudo planos" aria-labelledby="planos-t">
      <div className="planos-cabeca">
        <p className="s-rotulo">Planos</p>
        <h2 id="planos-t" className="s-titulo">Comece de graça. Tire tudo da mira com o Pro.</h2>
        {!COBRANCA_ATIVA && (
          <p className="s-texto">Fase de lançamento: ainda não existe cobrança. Todo mundo usa tudo do Pro, sem cartão e sem limite.</p>
        )}
      </div>

      <div className="planos-grade">
        {PLANOS.map((p) => (
          <article key={p.id} className={'plano' + (p.destaque ? ' plano-pro s-escuro' : '')} aria-labelledby={`plano-${p.id}`}>
            <div className="plano-topo">
              <h3 id={`plano-${p.id}`}>{p.nome}</h3>
              {p.destaque && <span className="plano-selo">{COBRANCA_ATIVA ? 'Mais completo' : 'Liberado no lançamento'}</span>}
            </div>
            <p className="plano-resumo">{p.resumo}</p>
            <p className="plano-preco">
              <span className="moeda">R$</span>
              <span className="valor">{p.preco}</span>
              <span className="periodo">{p.periodo}</span>
            </p>
            <ul>
              {p.itens.map((i) => <li key={i}><Check />{i}</li>)}
            </ul>
            <Link className={'sbtn grande ' + (p.destaque ? 'sbtn-branco' : 'sbtn-escuro')} to={destino}>
              {S.logado ? 'Ver o meu plano' : p.destaque ? 'Começar com o Pro' : 'Criar conta grátis'}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
