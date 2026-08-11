import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Logger reads process.env.NODE_ENV at call time, so we need to stub it
describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("logger.debug doesn't log in production", async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { default: prodLogger } = await import('../logger');
    prodLogger.debug('test debug');
    expect(console.debug).not.toHaveBeenCalled();
  });

  it("logger.info doesn't log in production", async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { default: prodLogger } = await import('../logger');
    prodLogger.info('test info');
    expect(console.info).not.toHaveBeenCalled();
  });

  it("logger.warn always logs", async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { default: prodLogger } = await import('../logger');
    prodLogger.warn('test warn');
    expect(console.warn).toHaveBeenCalledWith('[WARN]', 'test warn');
  });

  it("logger.error always logs", async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { default: prodLogger } = await import('../logger');
    prodLogger.error('test error');
    expect(console.error).toHaveBeenCalledWith('[ERROR]', 'test error');
  });
});
