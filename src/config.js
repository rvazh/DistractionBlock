// Informações gerais do Distraction Block, usadas em várias páginas.
// Troque aqui uma vez e o site inteiro é atualizado.

// Repositório no GitHub (onde fica a pasta da extensão)
export const REPO_URL = 'https://github.com/rvazh/DistractionBlock';

// ID fixo da extensão (vem do campo "key" de extension/manifest.json — não mude um sem o outro)
export const EXTENSAO_ID = 'elgkdjcphcnfdbalpioafiogblhfhnbc';

// Dias de espera para qualquer liberação
export const DIAS_DE_ESPERA = 7;

// Botão de atendimento (canto inferior direito), igual ao do CIFRA
export const EMAIL_SUPORTE = 'contatocifratech@gmail.com'; // se criar um e-mail só do Distraction Block, troque aqui
export const WHATSAPP_ATENDIMENTO = {
  numero: '5511976474912', // 55 (Brasil) + DDD + número, só dígitos
  texto: '(11) 97647-4912', // como aparece na tela
};

// Botão do CIFRA (acima do atendimento): o outro projeto, de finanças pessoais
// Cole aqui o endereço do CIFRA na Vercel. Enquanto estiver vazio, o botão não aparece.
export const CIFRA_URL = 'https://cifra-ashen.vercel.app';

// Planos. Enquanto COBRANCA_ATIVA for false, nada é travado: os limites só aparecem como informação
// e os recursos Pro ficam liberados para todo mundo (fase de lançamento, ainda sem pagamento de verdade).
export const COBRANCA_ATIVA = false;
export const PRECO_PRO = { valor: '9,99', periodo: 'mês' };
export const LIMITES_GRATIS = { sites: 4, apps: 2, words: 5 };
