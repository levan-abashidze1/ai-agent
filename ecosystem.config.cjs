module.exports = {
  apps: [
    {
      name: 'ai-agent-bot',
      cwd: __dirname + '/apps/bot',
      script: 'node_modules/.bin/tsx',
      args: 'src/index.ts',
      autorestart: true,
      max_memory_restart: '500M',
      restart_delay: 3000,
      env: {
        NODE_ENV: 'production',
      },
      out_file: __dirname + '/logs/bot.log',
      error_file: __dirname + '/logs/bot-error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
