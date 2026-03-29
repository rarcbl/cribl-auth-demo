'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';

/**
 * Middleware to validate Bearer JWT tokens on protected routes.
 */
function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token expired or invalid' });
  }
}

/**
 * POST /auth/login — validates credentials and issues access + refresh tokens.
 */
async function loginHandler(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password required' });
  }

  // Stub: in production this queries the user store
  const user = await lookupUser(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const payload = { sub: user.id, email: user.email, roles: user.roles };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
  const refreshToken = jwt.sign({ sub: user.id }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL,
  });

  res.json({ accessToken, refreshToken, expiresIn: 900 });
}

/**
 * POST /auth/refresh — issues a new access token given a valid refresh token.
 */
function refreshHandler(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken required' });
  }
  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const accessToken = jwt.sign({ sub: decoded.sub }, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_TTL,
    });
    res.json({ accessToken, expiresIn: 900 });
  } catch (err) {
    res.status(401).json({ error: 'Refresh token expired or invalid' });
  }
}

/**
 * Stub user lookup — replace with actual DB/LDAP call in production.
 * @param {string} email
 */
async function lookupUser(email) {
  return null;
}

module.exports = { authMiddleware, loginHandler, refreshHandler };
