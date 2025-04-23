// ecosystem.config.js
module.exports = {
    apps: [
      {
        name: 'minebot-dashboard',
        script: 'src/server.js',
        instances: 1,
        autorestart: true,
        watch: false,
        env: {
          NODE_ENV: 'production',
          PORT: 3000
        }
      }
    ]
  };
  