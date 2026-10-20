// ===== Onde ficam os dados do Distraction Block =====
// Bloqueios, listas e senha de controle ficam neste navegador (localStorage, chave "distraction-block:v1").
// Cada mudança é salva, avisa as telas e manda as listas novas para a extensão.
// Com o Supabase configurado (config.js), o login é feito na nuvem (nuvem.js).
import * as R from './regras.js';
import * as N from './nuvem.js';
import { MENSAGENS } from './compartilhado.js';
import { pingExtensao, enviarListas, buscarBloqueios } from './extensao.js';

const CHAVE = 'distraction-block:v1';
const CHAVE_SESSAO = 'distraction-block:sessao'; // fica no localStorage ("manter conectado") ou no sessionStorage
const CHAVE_FUNDO = 'distraction-block:fundo'; // imagem de fundo do painel (separada, porque é grande)
const NAVEGADORES = { chrome: 'Google Chrome', edge: 'Microsoft Edge', brave: 'Brave', opera: 'Opera' };

function carregar() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE));
  } catch {
    return null;
  }
}

let estado = R.migrate(carregar());
let fundo = lerFundo();

function lerFundo() {
  try {
    return localStorage.getItem(CHAVE_FUNDO) || null;
  } catch {
    return null;
  }
}
let extensao = null; // { navegador, nome, incognito, versao } quando a extensão responde
const ouvintes = new Set();

function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    /* sem acesso ao armazenamento */
  }
}

// ===== Sessão (quem está com o painel aberto neste navegador) =====
function lerSessao() {
  try {
    return sessionStorage.getItem(CHAVE_SESSAO) || localStorage.getItem(CHAVE_SESSAO);
  } catch {
    return null;
  }
}

// Com a nuvem: logado = sessão do Supabase + este navegador ligado à mesma conta.
// Sem a nuvem: a sessão local de antes.
let usuarioNuvem = null;
export function estaLogado() {
  if (N.NUVEM_ATIVA) {
    return Boolean(usuarioNuvem && estado.passwordHash && estado.account && estado.account.nuvemId === usuarioNuvem.id);
  }
  return Boolean(estado.passwordHash && estado.sessionId && lerSessao() === estado.sessionId);
}

function abrirSessao(manter) {
  const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
  estado.sessionId = id;
  try {
    sessionStorage.removeItem(CHAVE_SESSAO);
    localStorage.removeItem(CHAVE_SESSAO);
    (manter ? localStorage : sessionStorage).setItem(CHAVE_SESSAO, id);
  } catch {
    /* sem armazenamento: a sessão dura até recarregar */
  }
}

function fecharSessao() {
  try {
    sessionStorage.removeItem(CHAVE_SESSAO);
    localStorage.removeItem(CHAVE_SESSAO);
  } catch {
    /* ignora */
  }
}

// O que as telas recebem (sem o hash da senha nem os códigos)
export function retrato() {
  return R.publicState(estado, {
    logado: estaLogado(),
    nuvem: N.NUVEM_ATIVA,
    fundo,
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
    if (e.key === CHAVE_SESSAO) avisar(); // entrou ou saiu em outra aba
    if (e.key === CHAVE_FUNDO) { fundo = lerFundo(); avisar(); }
  });
  setTimeout(sincronizar, 300);
}

// Liberar qualquer coisa só depois de existir a senha de controle
function exigirSenha(s) {
  if (!s.passwordHash) throw new Error('Crie a sua senha de controle em Ajustes antes de pedir uma liberação.');
}

// ===== Abrir o site: confere o login da nuvem (e o link de confirmação do e-mail) =====
export async function iniciar() {
  if (!N.NUVEM_ATIVA) return;
  const user = await N.iniciar((novo) => {
    usuarioNuvem = novo;
    avisar();
  });
  usuarioNuvem = user;
  // Veio do link de confirmação e este navegador já tem a conta (criada aqui): liga as duas
  if (user && estado.account && !estado.account.nuvemId && estado.account.email === String(user.email || '').toLowerCase()) {
    try {
      await R.linkCloudAccount(estado, { uid: user.id, name: estado.account.name, email: user.email }, null);
      salvar();
    } catch {
      /* fica para o Entrar */
    }
  }
}

// ===== Ações usadas pelas telas =====
export const acoes = {
  // Conta e login
  // Devolve { precisaConfirmar: true } quando o Supabase pede para confirmar o e-mail antes de entrar
  async criarConta(dados, manter) {
    if (!N.NUVEM_ATIVA) {
      await mudar(async (s) => {
        const primeiraVez = !s.passwordHash;
        await R.createAccount(s, dados);
        if (primeiraVez) s.createdAt = Date.now();
        abrirSessao(manter);
      });
      return { precisaConfirmar: false };
    }
    if (estado.account) throw new Error('Já existe uma conta neste navegador. Use Entrar.');
    const erro = R.validateAccountInput(dados);
    if (erro) throw new Error(erro);
    if (estado.passwordHash && !(await R.verifyPassword(dados.password, estado.passwordHash))) {
      throw new Error('Use a senha de controle que você já tinha criado.');
    }
    const email = String(dados.email).trim().toLowerCase();
    N.definirManter(manter);
    const r = await N.cadastrar({ nome: dados.name.trim(), email, senha: dados.password });
    await mudar(async (s) => {
      const primeiraVez = !s.passwordHash;
      await R.createAccount(s, { ...dados, email });
      if (primeiraVez) s.createdAt = Date.now();
      if (!r.precisaConfirmar) {
        await R.linkCloudAccount(s, { uid: r.user.id, name: dados.name, email }, dados.password);
        usuarioNuvem = r.user;
      }
    });
    return { precisaConfirmar: r.precisaConfirmar, email };
  },

  async entrar(email, senha, manter) {
    if (!N.NUVEM_ATIVA) {
      try {
        await R.login(estado, { email, password: senha });
      } catch (e) {
        salvar(); // guarda a contagem de tentativas erradas
        throw e;
      }
      abrirSessao(manter);
      salvar();
      avisar();
      mandarListas();
      return;
    }
    R.checkLoginLock(estado);
    const mail = String(email || '').trim().toLowerCase();
    N.definirManter(manter);
    let user;
    try {
      user = await N.entrar(mail, senha);
    } catch (e) {
      if (e.codigo !== 'invalid_credentials') throw e;
      // Conta antiga, que só existia neste navegador: sobe para a nuvem com o mesmo e-mail e senha
      const local = estado.account;
      if (local && !local.nuvemId && local.email === mail && (await R.verifyPassword(senha, estado.passwordHash))) {
        const r = await N.cadastrar({ nome: local.name, email: mail, senha });
        if (r.precisaConfirmar) {
          const aviso = new Error(`Sua conta agora também fica na nuvem. Enviamos um link de confirmação para ${mail}: abra e entre de novo.`);
          aviso.confirmar = mail;
          throw aviso;
        }
        user = r.user;
      } else {
        const msg = R.registerLoginFail(estado);
        salvar();
        throw new Error(msg);
      }
    }
    try {
      const nome = await N.nomeDoPerfil(user);
      await R.linkCloudAccount(estado, { uid: user.id, name: nome, email: user.email }, senha);
    } catch (e) {
      await N.sair();
      throw e;
    }
    usuarioNuvem = user;
    salvar();
    avisar();
    mandarListas();
  },
  reenviarConfirmacao: (email) => N.reenviarConfirmacao(email),

  async sair() {
    fecharSessao();
    if (N.NUVEM_ATIVA) {
      usuarioNuvem = null;
      avisar();
      await N.sair();
    }
    avisar();
  },
  atualizarConta: (dados) =>
    mudar(async (s) => {
      if (N.NUVEM_ATIVA) {
        // Na nuvem, o e-mail é o do login: aqui só o nome muda
        const nome = String((dados && dados.name) || '').trim();
        if (nome.length < 2) throw new Error('Informe o seu nome.');
        await N.atualizarNome(nome.slice(0, 60));
        s.account = { ...s.account, name: nome.slice(0, 60) };
        return s.account;
      }
      return R.updateAccount(s, dados);
    }),

  trocarSenha: (atual, nova) =>
    mudar(async (s) => {
      if (!(await R.verifyPassword(atual, s.passwordHash))) throw new Error('Senha atual incorreta.');
      const erro = R.validateNewPassword(nova);
      if (erro) throw new Error(erro);
      if (N.NUVEM_ATIVA) await N.trocarSenha(nova); // troca também a senha do login
      s.passwordHash = await R.hashPassword(nova);
    }),

  bloquear: (lista, valor) => mudar((s) => R.addItem(s, lista, valor)),
  pedirLiberacao: (lista, valor) => mudar((s) => { exigirSenha(s); return R.requestRemoval(s, lista, valor); }),
  desistir: (id) => mudar((s) => R.cancelRequest(s, id)),
  liberar: (id, senha) => mudar((s) => R.applyRequest(s, id, senha)),
  // Aumentar vale na hora; diminuir vira um pedido de liberação
  mudarPrazo: (dias) => mudar((s) => { exigirSenha(s); return R.setDelay(s, dias); }),

  adicionarPessoa: (dados) => mudar((s) => R.setTrusted(s, dados)),
  pedirRemocaoPessoa: () => mudar((s) => { exigirSenha(s); return R.requestTrustedRemoval(s); }),
  solicitarPermissao: (id) => mudar((s) => R.askApproval(s, id)),
  aprovarComCodigo: (id, codigo) => mudar((s) => R.approveWithCode(s, id, codigo)),
  registrarNegacao: (id) => mudar((s) => R.denyRequest(s, id)),

  // Estilos do painel
  mudarEstilo: (dados) => mudar((s) => R.setStyle(s, dados)),
  definirFundo(dataUrl) {
    try {
      localStorage.setItem(CHAVE_FUNDO, dataUrl);
    } catch {
      throw new Error('A imagem é grande demais para guardar neste navegador. Tente outra, menor.');
    }
    fundo = dataUrl;
    avisar();
  },
  removerFundo() {
    try { localStorage.removeItem(CHAVE_FUNDO); } catch { /* ignora */ }
    fundo = null;
    avisar();
  },

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
