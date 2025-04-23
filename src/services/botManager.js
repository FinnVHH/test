// src/services/botManager.js

const { EventEmitter } = require('events');
const mineflayer = require('mineflayer');
const { Authflow, Titles } = require('prismarine-auth');
const path = require('path');

class BotManager extends EventEmitter {
  constructor() {
    super();
    this.bots = new Map();
    this.intervals = new Map();
    this.cacheDir = path.join(__dirname, '..', 'auth_cache');
  }

  /**
   * Add & connect a new bot
   */
  async addBot(config) {
    const { id, email, password, host, port, version } = config;

    const flow = new Authflow(
      email,
      this.cacheDir,
      { flow: 'live', authTitle: Titles.MinecraftJava, deviceType: 'Win32', password }
    );
    const mcData = await flow.getMinecraftJavaToken({ fetchProfile: true });

    const bot = mineflayer.createBot({
      host,
      port,
      username: mcData.profile.name,
      auth: 'microsoft',
      accessToken: mcData.token,
      version,
    });

    this.bots.set(id, bot);
    this._attachListeners(id, bot);

    // send '/shards' every 10 seconds
    const iv = setInterval(() => {
      if (bot.entity) bot.chat('/shards');
    }, 10000);
    this.intervals.set(id, iv);

    return bot;
  }

  /**
   * Disconnect & remove a bot
   */
  removeBot(id) {
    const bot = this.bots.get(id);
    if (bot) bot.quit();
    this.bots.delete(id);
    if (this.intervals.has(id)) {
      clearInterval(this.intervals.get(id));
      this.intervals.delete(id);
    }
    this.emit('removed', id);
  }

  /**
   * Get current status of a bot
   */
  getStatus(id) {
    const bot = this.bots.get(id);
    if (!bot || !bot.entity) {
      return { connected: false };
    }
    const { x, y, z } = bot.entity.position;
    return {
      connected: true,
      health: bot.health,
      food: bot.food,
      position: { x, y, z }
    };
  }

  /**
   * Pull current inventory
   */
  getInventory(id) {
    const bot = this.bots.get(id);
    return bot ? bot.inventory.items() : [];
  }

  /**
   * Attach event listeners, including shards parsing
   */
  _attachListeners(id, bot) {
    bot.on('spawn', () => this.emit(`${id}:spawn`));
    bot.on('end', reason => this.emit(`${id}:end`, reason));

    // normal chat messages
    bot.on('chat', (username, message) => {
      this.emit(`${id}:chat`, { username, message });
    });

    // raw messages to catch shards
    bot.on('message', jsonMsg => {
      const raw = jsonMsg.toString();
      const clean = raw.replace(/§[0-9A-FK-OR]/gi, '');
      const m = clean.match(/Shards:\s*(\d+)/i);
      if (m) this.emit(`${id}:shards`, { shards: parseInt(m[1], 10) });
    });

    bot.on('health', () =>
      this.emit(`${id}:health`, { health: bot.health, food: bot.food })
    );

    bot.on('windowUpdate', () =>
      this.emit(`${id}:inventory`, { items: bot.inventory.items() })
    );
  }
}

module.exports = new BotManager();
