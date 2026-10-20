// ===== Nuvem (Supabase): login de verdade e os dados de superação =====
//
// Como funciona:
// 1. O login (e-mail e senha) é feito pelo Supabase Auth.
// 2. Os bloqueios, as listas e a senha de controle continuam neste navegador (armazenamento.js),
//    porque é a extensão daqui que bloqueia. A senha de controle é a mesma do login.
// 3. A tela Superação (vícios e recaídas) lê e grava direto no Supabase, nas tabelas
//    "vicios" e "recaidas" (veja supabase/01_estrutura.sql).
//
// A chave publicável PODE ficar no site: quem protege os dados são as regras (RLS) do banco,
// que só deixam cada pessoa ler e mudar as próprias linhas. A chave secreta NUNCA entra aqui.

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_CHAVE_PUBLICA } from '../config.js';

const URL_DO_PROJETO = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL;
const CHAVE_PUBLICA = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_CHAVE_PUBLICA;

// Sem endereço e chave, o app funciona como antes (login só neste navegador)
export const NUVEM_ATIVA = Boolean(URL_DO_PROJETO && CHAVE_PUBLICA);

// "Manter conectado": com ele, o login fica no localStorage; sem ele, só até fechar o navegador
const CHAVE_MANTER = 'distraction-block:manter';
export function definirManter(manter) {
  try {
    localStorage.setItem(CHAVE_MANTER, manter ? '1' : '0');
  } catch {
    /* sem armazenamento */
  }
}
const armazenamentoDoLogin = {
  getItem(k) {
    try {
      return sessionStorage.getItem(k) ?? localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem(k, v) {
    try {
      const manter = localStorage.getItem(CHAVE_MANTER) !== '0';
      (manter ? localStorage : sessionStorage).setItem(k, v);
      (manter ? sessionStorage : localStorage).removeItem(k);
    } catch {
      /* sem armazenamento: o login dura até recarregar */
    }
  },
  removeItem(k) {
    try {
      sessionStorage.removeItem(k);
      localStorage.removeItem(k);
    } catch {
      /* ignora */
    }
  },
};

export const supabase = NUVEM_ATIVA
  ? createClient(URL_DO_PROJETO, CHAVE_PUBLICA, {
      auth: {
        flowType: 'implicit', // o link do e-mail volta com o login no endereço (tratado em tratarLinkDoEmail)
        detectSessionInUrl: false, // nós mesmos lemos o link, por causa do HashRouter (#/)
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'distraction-block:login',
        storage: armazenamentoDoLogin,
      },
    })
  : null;

// ----- Endereço do site (para onde o link de confirmação do e-mail leva) -----
export function enderecoDoSite() {
  return `${window.location.origin}${window.location.pathname}`;
}

// ----- Mensagens de erro do Supabase em português -----
export function traduzirErro(erro) {
  const codigo = (erro && erro.code) || '';
  const texto = String((erro && erro.message) || '').toLowerCase();
  if ((erro && erro.name === 'AuthRetryableFetchError') || texto.includes('failed to fetch') || texto.includes('network')) {
    return 'Sem conexão com o servidor. Confira a internet e tente de novo.';
  }
  const mensagens = {
    user_already_exists: 'Já existe uma conta com este e-mail. Use Entrar.',
    email_exists: 'Já existe uma conta com este e-mail. Use Entrar.',
    weak_password: 'Senha fraca. Use pelo menos 6 caracteres, misturando letras e números.',
    same_password: 'A nova senha precisa ser diferente da atual.',
    email_address_invalid: 'Este e-mail não parece certo. Ex.: nome@email.com',
    over_email_send_rate_limit: 'Muitos e-mails enviados em pouco tempo. Espere alguns minutos e tente de novo.',
    over_request_rate_limit: 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.',
    signup_disabled: 'O cadastro de novas contas está fechado no momento.',
    email_not_confirmed: 'Falta confirmar o seu e-mail. Abra o link que enviamos para a sua caixa de entrada.',
    invalid_credentials: 'E-mail ou senha incorretos.',
  };
  if (mensagens[codigo]) return mensagens[codigo];
  if (texto.includes('limite_vicios')) return 'Você chegou ao limite de 30 vícios na conta.';
  if (texto.includes('limite_recaidas')) return 'Você chegou ao limite de recaídas guardadas na conta.';
  if (texto.includes('already registered')) return mensagens.user_already_exists;
  if (texto.includes('invalid login')) return mensagens.invalid_credentials;
  if (texto.includes('email not confirmed')) return mensagens.email_not_confirmed;
  if (texto.includes('rate limit')) return mensagens.over_request_rate_limit;
  if (texto.includes('jwt') || texto.includes('not authenticated')) return 'Sua sessão expirou. Saia e entre de novo.';
  return 'Não foi possível concluir agora. Tente de novo em instantes.';
}

function falha(error) {
  const e = new Error(traduzirErro(error));
  e.codigo = (error && error.code) || (/invalid login/i.test((error && error.message) || '') ? 'invalid_credentials' : '');
  if (/email not confirmed/i.test((error && error.message) || '')) e.codigo = 'email_not_confirmed';
  return e;
}

function exigirNuvem() {
  if (!supabase) throw new Error('O Supabase ainda não foi configurado (src/config.js).');
}

// ----- Login -----
let usuario = null; // quem está logado no Supabase agora
export const usuarioDaNuvem = () => usuario;

export async function cadastrar({ nome, email, senha }) {
  exigirNuvem();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { emailRedirectTo: enderecoDoSite(), data: { nome } }, // o nome vai para a tabela "perfis"
  });
  if (error) throw falha(error);
  // Com a confirmação de e-mail ligada, um e-mail já cadastrado volta "sem identidades"
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error('Já existe uma conta com este e-mail. Use Entrar.');
  }
  if (!data.session) return { precisaConfirmar: true, user: data.user };
  usuario = data.session.user;
  return { precisaConfirmar: false, user: data.session.user };
}

export async function reenviarConfirmacao(email) {
  exigirNuvem();
  const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: enderecoDoSite() } });
  if (error) throw falha(error);
}

export async function entrar(email, senha) {
  exigirNuvem();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) throw falha(error);
  usuario = data.user;
  return data.user;
}

export async function sair() {
  usuario = null;
  if (!supabase) return;
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    /* mesmo sem internet o login deste navegador é apagado */
  }
}

export async function trocarSenha(nova) {
  exigirNuvem();
  const { error } = await supabase.auth.updateUser({ password: nova });
  if (error) throw falha(error);
}

export async function nomeDoPerfil(user) {
  const reserva = (user && user.user_metadata && user.user_metadata.nome) || '';
  if (!supabase || !user) return reserva;
  const { data } = await supabase.from('perfis').select('nome').eq('id', user.id).maybeSingle();
  return (data && data.nome) || reserva;
}

export async function atualizarNome(nome) {
  exigirNuvem();
  if (!usuario) throw new Error('Entre de novo para salvar.');
  const { error } = await supabase.from('perfis').upsert({ id: usuario.id, nome });
  if (error) throw falha(error);
}

// ----- Abrir o site: lê o link do e-mail (se veio de um) e a sessão guardada -----
let avisoParaEntrar = '';
export const pegarAvisoParaEntrar = () => {
  const a = avisoParaEntrar;
  avisoParaEntrar = '';
  return a;
};

function trocarEndereco(rota) {
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${rota}`);
}

async function tratarLinkDoEmail() {
  const hash = window.location.hash;
  if (!/(access_token|error_description|error_code)=/.test(hash)) return;
  const p = new URLSearchParams(hash.replace(/^#\/?/, ''));
  if (p.get('error') || p.get('error_code')) {
    avisoParaEntrar = p.get('error_code') === 'otp_expired'
      ? 'Este link expirou ou já foi usado. Entre com e-mail e senha para receber outro.'
      : 'Não foi possível usar este link. Entre com e-mail e senha.';
    trocarEndereco('/entrar');
    return;
  }
  try {
    const { error } = await supabase.auth.setSession({ access_token: p.get('access_token'), refresh_token: p.get('refresh_token') });
    if (error) throw error;
    avisoParaEntrar = 'E-mail confirmado!';
    trocarEndereco('/painel');
  } catch {
    avisoParaEntrar = 'Não foi possível usar este link. Entre com e-mail e senha.';
    trocarEndereco('/entrar');
  }
}

function comLimite(promessa, ms) {
  return Promise.race([promessa, new Promise((ok) => setTimeout(() => ok(null), ms))]);
}

// Chama ao mudar o login (saiu em outra aba, sessão expirou...)
export async function iniciar(aoMudar) {
  if (!supabase) return null;
  await comLimite(tratarLinkDoEmail(), 6000);
  const r = await comLimite(supabase.auth.getSession(), 6000);
  usuario = (r && r.data && r.data.session && r.data.session.user) || null;
  supabase.auth.onAuthStateChange((evento, sessao) => {
    const novo = (sessao && sessao.user) || null;
    const mudou = (novo && novo.id) !== (usuario && usuario.id);
    usuario = novo;
    if (mudou || evento === 'SIGNED_OUT') aoMudar(novo);
  });
  return usuario;
}

// ===== Superação: vícios e recaídas =====
const CAMPOS_VICIO = 'id, nome, motivo, inicio, criado_em, recaidas (id, quando, nota, criado_em)';

export async function listarVicios() {
  exigirNuvem();
  const { data, error } = await supabase
    .from('vicios')
    .select(CAMPOS_VICIO)
    .order('criado_em', { ascending: true })
    .order('quando', { referencedTable: 'recaidas', ascending: false });
  if (error) throw falha(error);
  return data || [];
}

export async function criarVicio({ nome, motivo, inicio }) {
  exigirNuvem();
  const { data, error } = await supabase.from('vicios').insert({ nome, motivo, inicio }).select(CAMPOS_VICIO).single();
  if (error) throw falha(error);
  return data;
}

export async function editarVicio(id, campos) {
  exigirNuvem();
  const { error } = await supabase.from('vicios').update(campos).eq('id', id);
  if (error) throw falha(error);
}

export async function apagarVicio(id) {
  exigirNuvem();
  const { error } = await supabase.from('vicios').delete().eq('id', id);
  if (error) throw falha(error);
}

export async function registrarRecaida(vicioId, { quando, nota }) {
  exigirNuvem();
  const { error } = await supabase.from('recaidas').insert({ vicio_id: vicioId, quando, nota });
  if (error) throw falha(error);
}

export async function apagarRecaida(id) {
  exigirNuvem();
  const { error } = await supabase.from('recaidas').delete().eq('id', id);
  if (error) throw falha(error);
}
