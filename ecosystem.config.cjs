module.exports = {
  apps: [
    {
      name: 'ai-agent-bot',
      cwd: __dirname,
      script: 'scripts/bot-runner.sh',
      interpreter: 'bash',
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
