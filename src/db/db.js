// src/db/db.js
const path = require('path');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');

const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile(file);

// ← Provide your default shape here
const db = new Low(adapter, { bots: [] });

async function init() {
  await db.read();
  // ensure data object even if file is empty
  db.data ||= { bots: [] };
  await db.write();
}

module.exports = { db, init };
