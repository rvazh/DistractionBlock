/* Peças pequenas reaproveitadas pelas telas */

export function PageHead({ tag, title, desc, right }) {
  return (
    <div className="page-head">
      <div>
        <p className="tag">{tag}</p>
        <h1>{title}</h1>
        {desc && <p>{desc}</p>}
      </div>
      {right || null}
    </div>
  );
}

export function Switch({ on, label, onToggle }) {
  return (
    <button
      type="button"
      className={'switch' + (on ? ' on' : '')}
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
    />
  );
}

export function Citacao({ children, pequena }) {
  return (
    <div className="card frame" style={{ margin: pequena ? '4px 0 16px' : undefined }}>
      <p className="quote" style={{ fontSize: 15, margin: 0 }}>{children}</p>
    </div>
  );
}

export function Vazio({ titulo, children }) {
  return (
    <p className="empty"><b>{titulo}</b>{children}</p>
  );
}

/* A mira animada com o número no centro */
export function Reticulo({ valor, rotulo }) {
  const ticks = [[120, 0, 120, 16], [120, 224, 120, 240], [0, 120, 16, 120], [224, 120, 240, 120]];
  return (
    <div className="reticle">
      <svg viewBox="0 0 240 240" aria-hidden="true">
        <circle cx="120" cy="120" r="118" className="rg rg1" />
        <circle cx="120" cy="120" r="104" className="rg rg2" />
        <circle cx="120" cy="120" r="90" className="rg rg3" />
        {ticks.map(([x1, y1, x2, y2], i) => <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="tk" />)}
      </svg>
      <div className="center">
        {/* Números grandes encolhem para caber dentro da mira */}
        <div className={'big' + (String(valor).length > 5 ? ' menor' : String(valor).length > 4 ? ' medio' : '')}>{valor}</div>
        <span className="tag">{rotulo}</span>
      </div>
    </div>
  );
}
