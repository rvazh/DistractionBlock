/*
 * ===== Regras do Distraction Block =====
 * Princípio: deixar mais rígido é imediato; afrouxar exige um pedido
 * que só pode ser aplicado depois de 7 dias, com a senha
 * (e com a aprovação da pessoa de confiança, se houver uma).
 * Funções puras sobre o "estado"; quem salva no navegador é armazenamento.js.
 */
import { DBMatch } from './compartilhado.js';
import { DIAS_DE_ESPERA } from '../config.js';

const { normText, normSite } = DBMatch;
const enc = new TextEncoder();

export const DAY = 24 * 60 * 60 * 1000;
export const DELAY_MS = DIAS_DE_ESPERA * DAY;
export const LISTS = ['sites', 'words'];

/* ---------- Utilidades de criptografia ---------- */
function bytes(n) { return crypto.getRandomValues(new Uint8Array(n)); }
function toHex(buf) { return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join(''); }
function fromHex(hex) { return new Uint8Array(hex.match(/.{2}/g).map((h) => parseInt(h, 16))); }
async function sha256(text) { return toHex(await crypto.subtle.digest('SHA-256', enc.encode(text))); }
function newId() { return toHex(bytes(6)); }

/* ---------- Estado ---------- */
export function defaultState(now = Date.now()) {
  return {
    version: 1,
    createdAt: now,
    passwordHash: null,
    account: null,       // { name, email, createdAt }
    loginLock: null,     // { fails, until } — tentativas erradas de entrar
    sessionId: null,     // muda a cada login; a sessão aberta guarda o mesmo valor
    lists: { sites: [], words: [] },
    customMessages: [],
    disabledDefaults: [],
    trusted: null,
    requests: [],
    events: []
  };
}

export function migrate(raw, now = Date.now()) {
  const base = defaultState(now);
  if (!raw || typeof raw !== 'object') return base;
  const s = { ...base, ...raw };
  s.lists = { sites: [], words: [] };
  for (const l of LISTS) if (raw.lists && Array.isArray(raw.lists[l])) s.lists[l] = raw.lists[l];
  for (const k of ['customMessages', 'disabledDefaults', 'requests', 'events']) if (!Array.isArray(s[k])) s[k] = [];
  if (!s.trusted || typeof s.trusted !== 'object') s.trusted = null;
  if (!s.account || typeof s.account !== 'object') s.account = null;
  return s;
}

/* ---------- Senha (PBKDF2) ---------- */
const ITER = 210000;
async function derive(pw, salt, iter) {
  const key = await crypto.subtle.importKey('raw', enc.encode(String(pw)), 'PBKDF2', false, ['deriveBits']);
  return toHex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256));
}
export async function hashPassword(pw) {
  const salt = bytes(16);
  return `pbkdf2$${ITER}$${toHex(salt)}$${await derive(pw, salt, ITER)}`;
}
export async function verifyPassword(pw, stored) {
  if (!stored) return false;
  const [algo, iter, saltHex, hashHex] = stored.split('$');
  if (algo !== 'pbkdf2' || !saltHex || !hashHex) return false;
  const got = await derive(pw, fromHex(saltHex), Number(iter));
  let diff = got.length ^ hashHex.length;
  for (let i = 0; i < Math.min(got.length, hashHex.length); i++) diff |= got.charCodeAt(i) ^ hashHex.charCodeAt(i);
  return diff === 0;
}
export function validateNewPassword(pw) {
  if (typeof pw !== 'string' || pw.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
  return null;
}

/* ---------- Conta e login (neste navegador) ----------
 * A senha da conta é a mesma senha de controle que confirma as liberações.
 * Não existe recuperação de senha: é de propósito.
 */
const MAX_TENTATIVAS = 5;
const ESPERA_LOGIN_MS = 5 * 60 * 1000;

function normEmail(e) { return String(e || '').trim().toLowerCase(); }

export async function createAccount(state, info, now = Date.now()) {
  if (state.account) throw new Error('Já existe uma conta neste navegador. Use Entrar.');
  const name = String((info && info.name) || '').trim().slice(0, 60);
  const email = normEmail(info && info.email);
  const password = String((info && info.password) || '');
  if (name.length < 2) throw new Error('Informe o seu nome.');
  if (!validEmail(email)) throw new Error('E-mail inválido.');
  if (state.passwordHash) {
    // Versão anterior já tinha senha de controle: a conta usa a mesma senha
    if (!(await verifyPassword(password, state.passwordHash))) throw new Error('Use a senha de controle que você já tinha criado.');
  } else {
    const err = validateNewPassword(password);
    if (err) throw new Error(err);
    state.passwordHash = await hashPassword(password);
  }
  state.account = { name, email, createdAt: now };
  state.loginLock = null;
  return state.account;
}

export async function login(state, info, now = Date.now()) {
  if (!state.passwordHash) throw new Error('Crie a sua conta primeiro.');
  const lock = state.loginLock;
  if (lock && lock.until && now < lock.until) {
    const min = Math.ceil((lock.until - now) / 60000);
    throw new Error(`Muitas tentativas erradas. Tente de novo em ${min} ${min === 1 ? 'minuto' : 'minutos'}.`);
  }
  const emailOk = !state.account || normEmail(info && info.email) === state.account.email;
  const senhaOk = await verifyPassword(String((info && info.password) || ''), state.passwordHash);
  if (!emailOk || !senhaOk) {
    const fails = ((lock && !lock.until ? lock.fails : 0) || 0) + 1;
    state.loginLock = fails >= MAX_TENTATIVAS ? { fails: 0, until: now + ESPERA_LOGIN_MS } : { fails, until: null };
    const restam = MAX_TENTATIVAS - fails;
    throw new Error(fails >= MAX_TENTATIVAS
      ? 'Muitas tentativas erradas. Tente de novo em 5 minutos.'
      : `E-mail ou senha incorretos.${restam <= 2 ? ` Restam ${restam} ${restam === 1 ? 'tentativa' : 'tentativas'}.` : ''}`);
  }
  state.loginLock = null;
  return true;
}

export function updateAccount(state, info) {
  if (!state.account) throw new Error('Não há conta neste navegador.');
  const name = String((info && info.name) || '').trim().slice(0, 60);
  const email = normEmail(info && info.email);
  if (name.length < 2) throw new Error('Informe o seu nome.');
  if (!validEmail(email)) throw new Error('E-mail inválido.');
  state.account = { ...state.account, name, email };
  return state.account;
}

/* ---------- Normalização ---------- */
function normWord(input) {
  const s = normText(input);
  if (s.length < 2 || s.length > 80) return null;
  return s;
}
export function normalizeItem(list, input) {
  switch (list) {
    case 'sites': {
      const v = normSite(input);
      return v ? { value: v } : { error: 'Endereço inválido. Ex.: instagram.com' };
    }
    case 'words': {
      const v = normWord(input);
      return v ? { value: v } : { error: 'Use de 2 a 80 caracteres.' };
    }
    default:
      return { error: 'Lista desconhecida.' };
  }
}

/* ---------- Mudanças imediatas (mais rígidas) ---------- */
export function addItem(state, list, input, label, now = Date.now()) {
  if (!LISTS.includes(list)) throw new Error('Lista desconhecida.');
  const n = normalizeItem(list, input);
  if (n.error) throw new Error(n.error);
  if (state.lists[list].some((i) => i.value === n.value)) throw new Error('Esse item já está bloqueado.');
  const item = { value: n.value, addedAt: now };
  if (label && String(label).trim()) item.label = String(label).trim().slice(0, 80);
  state.lists[list].push(item);
  return item;
}

/* ---------- Pedidos de liberação (7 dias) ---------- */
export function requestStatus(r, now = Date.now()) {
  if (r.status === 'pending' && now >= r.availableAt) return 'ready';
  return r.status;
}

function hasOpenRequest(state, match) {
  return state.requests.some((r) => r.status === 'pending' && Object.keys(match).every((k) => r[k] === match[k]));
}

function checkDenied(state, match, now) {
  const denied = state.requests
    .filter((r) => r.status === 'denied' && Object.keys(match).every((k) => r[k] === match[k]))
    .sort((a, b) => b.retryAt - a.retryAt)[0];
  if (denied && now < denied.retryAt) {
    const d = new Date(denied.retryAt);
    const who = state.trusted ? state.trusted.name : 'A pessoa de confiança';
    throw new Error(`${who} negou esse pedido. Nova tentativa a partir de ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}.`);
  }
}

export function requestRemoval(state, list, value, now = Date.now()) {
  if (!LISTS.includes(list)) throw new Error('Lista desconhecida.');
  if (!state.lists[list].some((i) => i.value === value)) throw new Error('Item não encontrado.');
  if (hasOpenRequest(state, { kind: 'remove', list, value })) throw new Error('Já existe um pedido para esse item.');
  checkDenied(state, { kind: 'remove', list, value }, now);
  const r = { id: newId(), kind: 'remove', list, value, createdAt: now, availableAt: now + DELAY_MS, status: 'pending' };
  state.requests.push(r);
  return r;
}

export function cancelRequest(state, id) {
  const r = state.requests.find((x) => x.id === id);
  if (!r || r.status !== 'pending') throw new Error('Pedido não está aberto.');
  r.status = 'cancelled';
  r.closedAt = Date.now();
  return r;
}

export async function applyRequest(state, id, password, now = Date.now()) {
  const r = state.requests.find((x) => x.id === id);
  if (!r) throw new Error('Pedido não encontrado.');
  if (r.status !== 'pending') throw new Error('Esse pedido já foi encerrado.');
  if (now < r.availableAt) throw new Error(`Ainda não se passaram ${DIAS_DE_ESPERA} dias desde o pedido.`);
  if (needsApproval(state, r)) throw new Error(`Falta a aprovação de ${state.trusted.name}.`);
  if (!(await verifyPassword(password, state.passwordHash))) throw new Error('Senha incorreta.');
  if (r.kind === 'remove') {
    state.lists[r.list] = state.lists[r.list].filter((i) => i.value !== r.value);
  } else if (r.kind === 'trusted') {
    state.trusted = null;
  }
  r.status = 'applied';
  r.closedAt = now;
  return r;
}

/* ---------- Pessoa de confiança (códigos de aprovação) ---------- */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODES_PER_PERSON = 20;

export function normCode(c) { return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
function hashCode(c) { return sha256('db-code:' + normCode(c)); }
function makeCode() {
  const b = bytes(8);
  let out = '';
  for (let i = 0; i < 8; i++) out += CODE_ALPHABET[b[i] % CODE_ALPHABET.length];
  return out.slice(0, 4) + '-' + out.slice(4);
}
function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim()); }

export async function setTrusted(state, info, now = Date.now()) {
  if (state.trusted) throw new Error('Já existe uma pessoa de confiança. Para trocar, peça a remoção dela.');
  const name = String((info && info.name) || '').trim().slice(0, 60);
  const email = String((info && info.email) || '').trim().toLowerCase();
  const relation = String((info && info.relation) || '').trim().slice(0, 40);
  if (name.length < 2) throw new Error('Informe o nome da pessoa.');
  if (!validEmail(email)) throw new Error('E-mail inválido.');
  const codes = Array.from({ length: CODES_PER_PERSON }, makeCode);
  const hashes = await Promise.all(codes.map(hashCode));
  state.trusted = { name, email, relation, addedAt: now, codes: hashes.map((h) => ({ h, used: false })), approvals: 0, denials: 0 };
  return codes;
}

export function codesLeft(state) {
  return state.trusted ? state.trusted.codes.filter((c) => !c.used).length : 0;
}

export function needsApproval(state, r) {
  if (!state.trusted) return false;
  if (r.approval === 'approved') return false;
  if (r.kind === 'trusted' && codesLeft(state) === 0) return false;
  return true;
}

function openRequestById(state, id) {
  const r = state.requests.find((x) => x.id === id);
  if (!r || r.status !== 'pending') throw new Error('Pedido não está aberto.');
  return r;
}

export function askApproval(state, id, now = Date.now()) {
  if (!state.trusted) throw new Error('Cadastre uma pessoa de confiança primeiro.');
  const r = openRequestById(state, id);
  if (r.approval === 'approved') throw new Error('Esse pedido já foi aprovado.');
  r.approval = 'requested';
  r.approvalRequestedAt = now;
  return r;
}

export async function approveWithCode(state, id, code, now = Date.now()) {
  if (!state.trusted) throw new Error('Não há pessoa de confiança cadastrada.');
  const r = openRequestById(state, id);
  const h = await hashCode(code);
  const slot = state.trusted.codes.find((c) => !c.used && c.h === h);
  if (!slot) throw new Error('Código inválido ou já usado.');
  slot.used = true;
  slot.usedAt = now;
  slot.requestId = r.id;
  r.approval = 'approved';
  r.approvedAt = now;
  state.trusted.approvals = (state.trusted.approvals || 0) + 1;
  return r;
}

export function denyRequest(state, id, now = Date.now()) {
  const r = openRequestById(state, id);
  r.status = 'denied';
  r.approval = 'denied';
  r.closedAt = now;
  r.retryAt = now + DELAY_MS;
  if (state.trusted) state.trusted.denials = (state.trusted.denials || 0) + 1;
  return r;
}

export function requestTrustedRemoval(state, now = Date.now()) {
  if (!state.trusted) throw new Error('Não há pessoa de confiança cadastrada.');
  if (hasOpenRequest(state, { kind: 'trusted' })) throw new Error('Já existe um pedido para remover a pessoa de confiança.');
  checkDenied(state, { kind: 'trusted' }, now);
  const r = { id: newId(), kind: 'trusted', value: state.trusted.name, createdAt: now, availableAt: now + DELAY_MS, status: 'pending' };
  state.requests.push(r);
  return r;
}

/* ---------- Mensagens ---------- */
export function setDefaultMessage(state, text, on) {
  const set = new Set(state.disabledDefaults);
  if (on) set.delete(text); else set.add(text);
  state.disabledDefaults = [...set];
}

export function activeMessages(state, defaults) {
  const off = new Set(state.disabledDefaults);
  const list = [...state.customMessages, ...defaults.filter((m) => !off.has(m))];
  return list.length ? list : defaults.slice();
}

/* ---------- Eventos / estatísticas ---------- */
export function addEvent(state, type, target, now = Date.now()) {
  state.events.push({ t: now, type, target: String(target || '').slice(0, 200) });
  const cutoff = now - 120 * DAY;
  if (state.events.length > 20000 || (state.events[0] && state.events[0].t < cutoff)) {
    state.events = state.events.filter((e) => e.t >= cutoff).slice(-20000);
  }
}

function startOfDay(t) { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }

export function stats(state, now = Date.now()) {
  const today = startOfDay(now);
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    days.push({ start: d.getTime(), count: 0 });
  }
  const byType = { site: 0, word: 0 };
  let todayCount = 0;
  for (const ev of state.events) {
    if (ev.t >= today) { todayCount++; byType[ev.type] = (byType[ev.type] || 0) + 1; }
    if (ev.t < days[0].start) continue;
    for (let i = days.length - 1; i >= 0; i--) {
      if (ev.t >= days[i].start) { days[i].count++; break; }
    }
  }
  const sinceDays = Math.floor((today - startOfDay(state.createdAt)) / DAY) + 1;
  return {
    today: todayCount,
    byType,
    total: state.events.length,
    week: days,
    recent: state.events.slice(-12).reverse(),
    activeDays: sinceDays
  };
}

export function publicState(state, extra = {}, now = Date.now()) {
  return {
    hasPassword: !!state.passwordHash,
    account: state.account ? { name: state.account.name, email: state.account.email, createdAt: state.account.createdAt } : null,
    lists: state.lists,
    customMessages: state.customMessages,
    disabledDefaults: state.disabledDefaults,
    trusted: state.trusted ? {
      name: state.trusted.name,
      email: state.trusted.email,
      relation: state.trusted.relation,
      addedAt: state.trusted.addedAt,
      codesLeft: codesLeft(state),
      codesTotal: state.trusted.codes.length,
      approvals: state.trusted.approvals || 0,
      denials: state.trusted.denials || 0
    } : null,
    requests: state.requests
      .slice(-60)
      .map((r) => ({ ...r, status: requestStatus(r, now), needsApproval: needsApproval(state, r) }))
      .reverse(),
    stats: stats(state, now),
    delayDays: DELAY_MS / DAY,
    now,
    ...extra
  };
}
