// Logger seguro: só emite no DEV. Em produção, silencia para não vazar
// estrutura interna em DevTools. Erros críticos podem ser enviados a um
// serviço externo no futuro (Sentry, etc).

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => { if (isDev) console.log(...args); },
  info: (...args: unknown[]) => { if (isDev) console.info(...args); },
  warn: (...args: unknown[]) => { if (isDev) console.warn(...args); },
  error: (...args: unknown[]) => { if (isDev) console.error(...args); },
  debug: (...args: unknown[]) => { if (isDev) console.debug(...args); },
};
