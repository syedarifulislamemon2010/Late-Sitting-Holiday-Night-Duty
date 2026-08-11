const logger = {
  debug: (message: unknown, ...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG]`, message, ...args);
    }
  },
  info: (message: unknown, ...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[INFO]`, message, ...args);
    }
  },
  warn: (message: unknown, ...args: unknown[]) => {
    console.warn(`[WARN]`, message, ...args);
  },
  error: (message: unknown, ...args: unknown[]) => {
    console.error(`[ERROR]`, message, ...args);
  },
};

export default logger;
