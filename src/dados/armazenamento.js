// ===== Onde ficam os dados do Distraction Block =====
// Tudo fica neste navegador (localStorage, chave "distraction-block:v1").
// Cada mudança é salva, avisa as telas e manda as listas novas para a extensão.
import * as R from './regras.js';
import { MENSAGENS } from './compartilhado.js';
import { pingExtensao, enviarListas, buscarBloqueios } from './extensao.js';

const CHAVE = 'distraction-block:v1';
const NAVEGADORES = { chrome: 'Google Chrome', edge: 'Microsoft Edge', brave: 'Brave', opera: 'Opera' };

function carregar() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE));
  } catch {
    return null;
  }
}

let estado = R.migrate(carregar());
let extensao = null; // { navegador, nome, incognito, versao } quando a extensão responde
const ouvintes = new Set();

function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    /* sem acesso ao armazenamento */
  }
}

// O que as telas recebem (sem o hash da senha nem os códigos)
export function retrato() {
  return R.publicState(estado, {
    extensao,
    mensagensPadrao: MENSAGENS,
  });
}

function avisar() {
  const r = retrato();
  ouvintes.forEach((f) => f(r));
}

export function ouvir(fn) {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

function mandarListas() {
  if (!estado.passwordHash) return;
  enviarListas({
    sites: estado.lists.sites.map((i) => i.value),
    words: estado.lists.words.map((i) => i.value),
    messages: R.activeMessages(estado, MENSAGENS),
  });
}

async function mudar(fn) {
  const resultado = await fn(estado);
  salvar();
  avisar();
  mandarListas();
  return resultado;
}

// Confere a extensão, traz os bloqueios que ela registrou e reenvia as listas
export async function sincronizar() {
  const r = await pingExtensao();
  extensao = r && r.ok
    ? { navegador: r.browser, nome: NAVEGADORES[r.browser] || 'Navegador', incognito: !!r.incognito, versao: r.version }
    : null;
  if (extensao) {
    const eventos = await buscarBloqueios();
    for (const e of eventos) {
      if (e && (e.type === 'site' || e.type === 'word')) R.addEvent(estado, e.type, e.target, e.t || Date.now());
    }
    if (eventos.length) salvar();
    mandarListas();
  }
  avisar();
}

if (typeof window !== 'undefined') {
  setInterval(sincronizar, 30 * 1000);
  window.addEventListener('focus', sincronizar);
  // Outra aba do site mudou os dados
  window.addEventListener('storage', (e) => {
    if (e.key === CHAVE) {
      estado = R.migrate(carregar());
      avisar();
    }
  });
  setTimeout(sincronizar, 300);
}

// ===== Ações usadas pelas telas =====
export const acoes = {
  async criarSenha(senha) {
    await mudar(async (s) => {
      if (s.passwordHash) throw new Error('A senha já foi criada.');
      const erro = R.validateNewPassword(senha);
      if (erro) throw new Error(erro);
      s.passwordHash = await R.hashPassword(senha);
      s.createdAt = Date.now();
    });
  },
  trocarSenha: (atual, nova) =>
    mudar(async (s) => {
      if (!(await R.verifyPassword(atual, s.passwordHash))) throw new Error('Senha atual incorreta.');
      const erro = R.validateNewPassword(nova);
      if (erro) throw new Error(erro);
      s.passwordHash = await R.hashPassword(nova);
    }),

  bloquear: (lista, valor) => mudar((s) => R.addItem(s, lista, valor)),
  pedirLiberacao: (lista, valor) => mudar((s) => R.requestRemoval(s, lista, valor)),
  desistir: (id) => mudar((s) => R.cancelRequest(s, id)),
  liberar: (id, senha) => mudar((s) => R.applyRequest(s, id, senha)),

  adicionarPessoa: (dados) => mudar((s) => R.setTrusted(s, dados)),
  pedirRemocaoPessoa: () => mudar((s) => R.requestTrustedRemoval(s)),
  solicitarPermissao: (id) => mudar((s) => R.askApproval(s, id)),
  aprovarComCodigo: (id, codigo) => mudar((s) => R.approveWithCode(s, id, codigo)),
  registrarNegacao: (id) => mudar((s) => R.denyRequest(s, id)),

  adicionarMensagem: (texto) =>
    mudar((s) => {
      const t = String(texto || '').trim();
      if (t.length < 3 || t.length > 240) throw new Error('A mensagem precisa ter entre 3 e 240 caracteres.');
      s.customMessages.unshift(t);
    }),
  removerMensagem: (indice) => mudar((s) => { s.customMessages.splice(Number(indice), 1); }),
  usarMensagemPadrao: (texto, usar) =>
    mudar((s) => {
      if (!MENSAGENS.includes(texto)) throw new Error('Mensagem desconhecida.');
      R.setDefaultMessage(s, texto, !!usar);
    }),
  usarTodasPadrao: (usar) => mudar((s) => { s.disabledDefaults = usar ? [] : MENSAGENS.slice(); }),
};
