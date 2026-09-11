// src/utils/logger.js
// Simple logger abstraction — replace with winston/pino in production.

const isDev = process.env.NODE_ENV !== 'production';

const format = (level, message, ...args) => {
  const ts = new Date().toISOString();
  const extra = args.length ? ' ' + args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ') : '';
  return `[${ts}] [${level}] ${message}${extra}`;
};

const logger = {
  info:  (msg, ...args) => console.log(format('INFO',  msg, ...args)),
  warn:  (msg, ...args) => console.warn(format('WARN',  msg, ...args)),
  error: (msg, ...args) => console.error(format('ERROR', msg, ...args)),
  debug: (msg, ...args) => { if (isDev) console.debug(format('DEBUG', msg, ...args)); },
};

export default logger;
