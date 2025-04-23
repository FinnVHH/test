const express = require('express')
const router = express.Router()
const botManager = require('../services/botManager')
const { db } = require('../db/db')

// list bots
router.get('/', async (req, res) => {
  res.json(db.data.bots)
})

// add bot
router.post('/', async (req, res) => {
  const cfg = req.body
  if (db.data.bots.find(b => b.id === cfg.id)) {
    return res.status(400).json({ error: 'Bot ID already exists' })
  }
  db.data.bots.push(cfg)
  await db.write()
  await botManager.addBot(cfg)
  res.status(201).json(cfg)
})

// delete + remove bot config
router.delete('/:id', async (req, res) => {
  const { id } = req.params
  const idx = db.data.bots.findIndex(b => b.id === id)
  if (idx === -1) return res.status(404).end()
  db.data.bots.splice(idx, 1)
  await db.write()
  botManager.removeBot(id)
  res.status(204).end()
})

// disconnect only
router.post('/:id/disconnect', (req, res) => {
  const { id } = req.params
  if (!db.data.bots.find(b => b.id === id)) {
    return res.status(404).json({ error: 'Bot not found' })
  }
  botManager.removeBot(id)
  res.json({ disconnected: id })
})

module.exports = router
