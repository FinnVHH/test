const express = require('express');
const router = express.Router();
const bots = require('./bots');

router.use('/bots', bots);

module.exports = router;
