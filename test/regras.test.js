// Testes das regras do Distraction Block (rodam com: npm test)
import test from 'node:test';
import assert from 'node:assert/strict';

// Os arquivos da extensão se registram em "self", como no navegador
globalThis.self = globalThis;
const R = await import('../src/dados/regras.js');
const { DBMatch } = await import('../src/dados/compartilhado.js');

test('bloquear é imediato e normaliza', () => {
  const s = R.defaultState();
  R.addItem(s, 'sites', 'https://www.Instagram.com/reels', null);
  assert.equal(s.lists.sites[0].value, 'instagram.com');
  assert.throws(() => R.addItem(s, 'sites', 'instagram.com'), /já está/);
  assert.throws(() => R.addItem(s, 'sites', 'naoeumsite'), /inválido/);
  R.addItem(s, 'words', 'Cassíno');
  assert.equal(s.lists.words[0].value, 'cassino');
});

test('palavras pesquisadas: começo de palavra, sem acento', () => {
  const w = [{ value: 'aposta' }, { value: 'bet' }];
  assert.equal(DBMatch.blockedTermInUrl('https://www.google.com/search?q=melhor+apost%C3%A1', w).word, 'aposta');
  assert.equal(DBMatch.blockedTermInUrl('https://www.youtube.com/results?search_query=bet365', w).word, 'bet');
  assert.equal(DBMatch.blockedTermInUrl('https://www.google.com/search?q=alfabeto', w), null);
});

test('liberar só depois de 7 dias e com a senha', async () => {
  const t0 = Date.UTC(2026, 9, 18, 12);
  const s = R.defaultState(t0);
  s.passwordHash = await R.hashPassword('segredo1');
  R.addItem(s, 'sites', 'youtube.com', null, t0);
  const r = R.requestRemoval(s, 'sites', 'youtube.com', t0);
  await assert.rejects(R.applyRequest(s, r.id, 'segredo1', t0 + 6 * R.DAY), /prazo de 7 dias ainda não terminou\. Falta 1 dia/);
  await assert.rejects(R.applyRequest(s, r.id, 'errada', t0 + 7 * R.DAY), /Senha/);
  await R.applyRequest(s, r.id, 'segredo1', t0 + 7 * R.DAY);
  assert.equal(s.lists.sites.length, 0);
});

test('desistir mantém bloqueado', () => {
  const s = R.defaultState();
  R.addItem(s, 'words', 'aposta');
  const r = R.requestRemoval(s, 'words', 'aposta');
  R.cancelRequest(s, r.id);
  assert.equal(s.lists.words.length, 1);
});

test('pessoa de confiança aprova com código de uso único', async () => {
  const t0 = Date.UTC(2026, 9, 18, 12);
  const s = R.defaultState(t0);
  s.passwordHash = await R.hashPassword('segredo1');
  const codigos = await R.setTrusted(s, { name: 'Ana', email: 'ana@exemplo.com' }, t0);
  assert.equal(codigos.length, 20);
  assert.ok(!JSON.stringify(s.trusted).includes(codigos[0]));
  R.addItem(s, 'words', 'aposta', null, t0);
  const r = R.requestRemoval(s, 'words', 'aposta', t0);
  await assert.rejects(R.applyRequest(s, r.id, 'segredo1', t0 + 7 * R.DAY), /aprovação de Ana/);
  R.askApproval(s, r.id, t0);
  await R.approveWithCode(s, r.id, codigos[0].toLowerCase(), t0);
  await R.applyRequest(s, r.id, 'segredo1', t0 + 7 * R.DAY);
  assert.equal(s.lists.words.length, 0);
  R.addItem(s, 'words', 'bet', null, t0);
  const r2 = R.requestRemoval(s, 'words', 'bet', t0);
  await assert.rejects(R.approveWithCode(s, r2.id, codigos[0]), /já usado/);
});

test('negação bloqueia novas tentativas por 7 dias', async () => {
  const s = R.defaultState(0);
  await R.setTrusted(s, { name: 'Ana', email: 'ana@exemplo.com' }, 0);
  R.addItem(s, 'sites', 'x.com', null, 0);
  const r = R.requestRemoval(s, 'sites', 'x.com', 0);
  R.denyRequest(s, r.id, R.DAY);
  assert.throws(() => R.requestRemoval(s, 'sites', 'x.com', 3 * R.DAY), /Ana negou/);
  assert.ok(R.requestRemoval(s, 'sites', 'x.com', 8 * R.DAY + 1));
});

test('mensagens padrão podem ser desligadas', () => {
  const s = R.defaultState();
  R.setDefaultMessage(s, 'b', false);
  assert.deepEqual(R.activeMessages(s, ['a', 'b']), ['a']);
  s.disabledDefaults = ['a', 'b'];
  assert.deepEqual(R.activeMessages(s, ['a', 'b']), ['a', 'b']);
});

test('criar conta e entrar', async () => {
  const s = R.defaultState();
  await assert.rejects(R.createAccount(s, { name: 'R', email: 'r@x.com', password: 'segredo1' }), /nome/);
  await assert.rejects(R.createAccount(s, { name: 'Ryan', email: 'ryan', password: 'segredo1' }), /E-mail/);
  await assert.rejects(R.createAccount(s, { name: 'Ryan', email: 'r@x.com', password: '123' }), /6 caracteres/);
  await R.createAccount(s, { name: 'Ryan', email: 'R@X.com', password: 'segredo1' });
  assert.equal(s.account.email, 'r@x.com');
  assert.ok(s.passwordHash);
  await assert.rejects(R.createAccount(s, { name: 'Outro', email: 'o@x.com', password: 'segredo1' }), /Já existe/);
  assert.equal(await R.login(s, { email: 'r@x.com', password: 'segredo1' }), true);
  await assert.rejects(R.login(s, { email: 'r@x.com', password: 'errada' }), /incorretos/);
  await assert.rejects(R.login(s, { email: 'outro@x.com', password: 'segredo1' }), /incorretos/);
});

test('5 tentativas erradas bloqueiam o login por 5 minutos', async () => {
  const s = R.defaultState();
  await R.createAccount(s, { name: 'Ryan', email: 'r@x.com', password: 'segredo1' }, 0);
  for (let i = 0; i < 4; i++) await assert.rejects(R.login(s, { email: 'r@x.com', password: 'x' }, 1000), /incorretos/);
  await assert.rejects(R.login(s, { email: 'r@x.com', password: 'x' }, 1000), /Muitas tentativas/);
  await assert.rejects(R.login(s, { email: 'r@x.com', password: 'segredo1' }, 2000), /Tente de novo em 5 minutos/);
  assert.equal(await R.login(s, { email: 'r@x.com', password: 'segredo1' }, 1000 + 5 * 60 * 1000 + 1), true);
});

test('conta criada depois de já existir senha usa a mesma senha', async () => {
  const s = R.defaultState();
  s.passwordHash = await R.hashPassword('antiga1');
  await assert.rejects(R.createAccount(s, { name: 'Ryan', email: 'r@x.com', password: 'nova123' }), /senha de controle/);
  await R.createAccount(s, { name: 'Ryan', email: 'r@x.com', password: 'antiga1' });
  assert.ok(s.account);
});

test('prazo de espera: aumentar vale na hora, diminuir vira pedido', async () => {
  const t0 = Date.UTC(2026, 9, 18, 12);
  const s = R.defaultState(t0);
  s.passwordHash = await R.hashPassword('segredo1');
  assert.equal(s.delayDays, 7);
  assert.throws(() => R.setDelay(s, 3, t0), /entre 4 e 90/);
  assert.throws(() => R.setDelay(s, 7, t0), /já é de 7/);

  // aumentar: imediato e vale para os próximos pedidos
  assert.equal(R.setDelay(s, 14, t0).applied, true);
  R.addItem(s, 'sites', 'instagram.com', null, t0);
  const r = R.requestRemoval(s, 'sites', 'instagram.com', t0);
  assert.equal(r.availableAt, t0 + 14 * R.DAY);
  assert.equal(R.requestDays(r), 14);

  // diminuir: pedido que espera o prazo atual (14 dias)
  const d = R.setDelay(s, 4, t0);
  assert.equal(d.applied, false);
  assert.equal(s.delayDays, 14);
  assert.equal(d.request.availableAt, t0 + 14 * R.DAY);
  assert.throws(() => R.setDelay(s, 5, t0), /Já existe um pedido/);
  await assert.rejects(R.applyRequest(s, d.request.id, 'segredo1', t0 + 13 * R.DAY), /Faltam|Falta/);
  await R.applyRequest(s, d.request.id, 'segredo1', t0 + 14 * R.DAY);
  assert.equal(s.delayDays, 4);
  // o pedido antigo mantém o prazo dele
  assert.equal(R.requestDays(r), 14);

  // aumentar cancela um pedido aberto para diminuir
  R.setDelay(s, 30, t0);
  const d2 = R.setDelay(s, 7, t0);
  R.setDelay(s, 60, t0);
  assert.equal(s.requests.find((x) => x.id === d2.request.id).status, 'cancelled');
  assert.equal(R.publicState(s, {}, t0).delayDays, 60);

  // valor estranho salvo volta ao padrão
  assert.equal(R.migrate({ delayDays: 2 }).delayDays, 7);
});

test('total geral de bloqueios não some com o tempo', () => {
  const t0 = Date.UTC(2026, 0, 1, 12);
  const s = R.defaultState(t0);
  R.addEvent(s, 'site', 'instagram.com', t0);
  R.addEvent(s, 'word', 'aposta', t0);
  R.addEvent(s, 'site', 'tiktok.com', t0 + 200 * R.DAY); // apaga os eventos com mais de 120 dias
  assert.equal(s.events.length, 1);
  const st = R.stats(s, t0 + 200 * R.DAY);
  assert.equal(st.total, 3);
  assert.deepEqual(st.totalByType, { site: 2, word: 1 });
  // versão antiga, sem contador: começa pelo histórico
  const velho = R.migrate({ events: [{ t: t0, type: 'site', target: 'x' }, { t: t0, type: 'word', target: 'y' }] });
  assert.deepEqual(velho.totals, { site: 1, word: 1 });
});
