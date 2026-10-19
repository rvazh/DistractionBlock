// ===== Planos do Distraction Block =====
// Gratuito: bloqueio com limite. Pro (R$ 9,99/mês): bloqueio ilimitado e personalização.
// Por enquanto é só informação: com COBRANCA_ATIVA = false nada é travado (veja config.js).
import { COBRANCA_ATIVA, LIMITES_GRATIS, PRECO_PRO } from '../config.js';

export { COBRANCA_ATIVA, LIMITES_GRATIS, PRECO_PRO };

export const PLANOS = [
  {
    id: 'gratis',
    nome: 'Gratuito',
    preco: '0',
    periodo: 'para sempre',
    resumo: 'Para começar a tirar as maiores distrações do caminho.',
    itens: [
      `Até ${LIMITES_GRATIS.sites} sites bloqueados`,
      `Até ${LIMITES_GRATIS.words} palavras pesquisadas`,
      `Até ${LIMITES_GRATIS.apps} apps do Windows (quando chegar)`,
      'Prazo de espera ajustável',
      'Pessoa de confiança',
      'Mensagens de melhora padrão',
      'Painel e gráfico dos últimos 7 dias',
    ],
  },
  {
    id: 'pro',
    nome: 'Pro',
    preco: PRECO_PRO.valor,
    periodo: `por ${PRECO_PRO.periodo}`,
    resumo: 'Para quem quer bloquear tudo e deixar o app com a sua cara.',
    destaque: true,
    itens: [
      'Sites, palavras e apps ilimitados',
      'Tudo o que tem no Gratuito',
      'Cores e tema claro ou escuro',
      'Imagem de fundo no painel',
      'Mensagens de melhora suas',
      'Gráfico dos últimos 30 dias',
    ],
  },
];

// Quanto do limite do plano gratuito já foi usado
export function usoDoPlano(S) {
  return [
    { id: 'sites', rotulo: 'Sites', usado: S.lists.sites.length, limite: LIMITES_GRATIS.sites },
    { id: 'words', rotulo: 'Palavras', usado: S.lists.words.length, limite: LIMITES_GRATIS.words },
    { id: 'apps', rotulo: 'Apps', usado: 0, limite: LIMITES_GRATIS.apps, emBreve: true },
  ];
}
