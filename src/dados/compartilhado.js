// Arquivos da extensão usados também pelo site (uma fonte só para as regras de busca e as mensagens).
// São scripts comuns (sem import/export): ao serem carregados, se registram em "self".
import '../../extension/match.js';
import '../../extension/messages.js';

export const DBMatch = globalThis.DBMatch;
export const MENSAGENS = globalThis.DB_MESSAGES || [];
