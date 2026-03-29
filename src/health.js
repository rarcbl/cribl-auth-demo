'use strict';

function healthCheck(req, res) {
  res.json({ status: 'ok', uptime: process.uptime(), ts: new Date().toISOString() });
}

module.exports = { healthCheck };
