// src/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const { init, db } = require('./db/db');
const botManager = require('./services/botManager');
const routes = require('./routes');

async function start() {
  await init();

  // reconnect saved bots
  for (const cfg of db.data.bots) {
    botManager.addBot(cfg).catch(console.error);
  }

  const app = express();               // ← app must be defined before using it
  app.use(express.json());
  app.use(express.static('client'));   // serve client folder
  app.use('/api', routes);             // mount API routes

  const server = http.createServer(app);
  const io = socketio(server, { cors: { origin: '*' } });
  require('./sockets')(io, botManager);

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`Listening on ${PORT}`));
}

start();
