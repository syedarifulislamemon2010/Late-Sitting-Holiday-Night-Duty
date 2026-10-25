// ==============================================================================
// ecosystem.config.cjs
// PM2 Configuration for Janata Bank PLC Duty Portal on RHEL Production
// ==============================================================================

module.exports = {
  apps: [
    {
      name: 'duty-portal',
      cwd: '/var/www/duty-portal', // Adjust to production absolute deployment directory on RHEL
      script: 'npm',
      args: 'start',

      // Execution Mode:
      // STRICT REQUIREMENT: Run in 'fork' mode with exactly 1 instance (instances: 1).
      // REASON: The application utilizes in-memory state for security-critical brute-force
      // authentication lockout tracking (see src/lib/auth-options.ts, lines 22-30:
      // const loginAttempts = new Map<string, LoginAttempt>()). Running multiple clustered
      // instances without a centralized Redis cache would cause fragmented lockout states,
      // allowing attackers to bypass rate limits by routing requests across worker processes.
      exec_mode: 'fork',
      instances: 1,

      // Environment Variables:
      // STRICT REQUIREMENT: No production secrets are hardcoded here.
      // All sensitive values (DATABASE_URL, NEXTAUTH_SECRET, GEMINI_API_KEY, etc.)
      // are loaded dynamically by Next.js and Node from the secure .env file.
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Process Management & Reliability:
      autorestart: true,
      watch: false, // File watching disabled in production
      max_memory_restart: '1G', // Gracefully restart process if heap exceeds 1GB
      restart_delay: 5000, // 5s delay between unexpected crash loops
      max_restarts: 10,

      // Logging & Diagnostics:
      output: '/var/log/pm2/duty-portal-out.log',
      error: '/var/log/pm2/duty-portal-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
