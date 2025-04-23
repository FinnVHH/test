// src/sockets/index.js
module.exports = (io, botManager) => {
  const subscribed = new Set();

  io.on('connection', socket => {
    socket.on('watchBot', botId => {
      socket.join(botId);

      if (!subscribed.has(botId)) {
        subscribed.add(botId);

        botManager.on(`${botId}:chat`, data =>
          io.to(botId).emit('chatUpdate', data)
        );
        botManager.on(`${botId}:health`, data =>
          io.to(botId).emit('healthUpdate', data)
        );
        botManager.on(`${botId}:inventory`, data =>
          io.to(botId).emit('inventoryUpdate', data)
        );
        botManager.on(`${botId}:shards`, data =>
          io.to(botId).emit('shardsUpdate', data)
        );
        botManager.on(`${botId}:spawn`, () =>
          io.to(botId).emit('spawn')
        );
        botManager.on(`${botId}:end`, reason =>
          io.to(botId).emit('end', reason)
        );
      }
    });

    socket.on('getStatus', (botId, cb) => {
      cb(botManager.getStatus(botId));
    });
    socket.on('getHealth', (botId, cb) => {
      const { health, food } = botManager.getStatus(botId);
      cb({ health, food });
    });
    socket.on('getInventory', (botId, cb) => {
      cb({ items: botManager.getInventory(botId) });
    });

    socket.on('chatMessage', ({ botId, message }) => {
      const bot = botManager.bots.get(botId);
      if (bot) bot.chat(message);
    });
  });
};
