'use strict';

require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const { authMiddleware, loginHandler, refreshHandler } = require('./auth');
const { healthCheck } = require('./health');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Public routes
app.post('/auth/login', loginHandler);
app.post('/auth/refresh', refreshHandler);
app.get('/health', healthCheck);

// Protected routes
app.get('/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// Token revocation endpoint - calls internal revocation service
app.post('/auth/logout', authMiddleware, async (req, res) => {
  const axios = require('axios');
  try {
    await axios.post(
      `${process.env.REVOCATION_SERVICE_URL}/revoke`,
      { jti: req.user.jti },
      {
        headers: {
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    // Degrade gracefully - token will expire naturally
    console.error('Revocation service unreachable', { error: err.message });
    res.json({ message: 'Logged out (local only)' });
  }
});

app.listen(PORT, () => {
  console.log(`Auth service running on :${PORT}`);
});
