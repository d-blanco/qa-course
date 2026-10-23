const express = require('express');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const books = require('./data/books');

const app = express();
const PORT = process.env.PORT || 3000;
const PAGE_SIZE = 20;
const SHIPPING_FEE = 499;
const FREE_SHIPPING_THRESHOLD = 3500;
const LOG_FILE = path.join(__dirname, 'logs', 'booknook.log');

const DISCOUNT_CODES = {
  SAVE15: { type: 'percent', value: 15, expires: '2030-12-31' },
  FIVEOFF: { type: 'fixed', value: 500, expires: '2030-12-31' },
  SUMMER20: { type: 'percent', value: 20, expires: '2025-08-31' }
};

const LOCK_THRESHOLD = 5;
const LOCK_MINUTES = 15;

// cartId -> { items: [{ bookId, qty }], discounts: [code] }
const carts = new Map();
// email -> { email, salt, passwordHash, failedAttempts, lockedUntil }
const users = new Map();
// session token -> email
const sessions = new Map();

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 32).toString('hex');
}

function addUser(email, password) {
  const salt = crypto.randomBytes(16).toString('hex');
  users.set(email, { email, salt, passwordHash: hashPassword(password, salt), failedAttempts: 0, lockedUntil: 0 });
}

function seedData() {
  carts.clear();
  users.clear();
  sessions.clear();
  addUser('qa.user@booknook.test', 'Passw0rd!');
  addUser('second.user@booknook.test', 'Passw0rd!');
}
seedData();

fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });

function log(level, message) {
  const line = `${new Date().toISOString()} ${level.padEnd(5)} ${message}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Log every API request with its status and duration (after any simulated latency).
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
    log(level, `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  setTimeout(next, apiDelay());
});

function getCookie(req, name) {
  const match = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`).exec(req.headers.cookie || '');
  return match && match[1];
}

function getCart(req, res) {
  let cartId = getCookie(req, 'cartId');
  if (!cartId || !carts.has(cartId)) {
    cartId = crypto.randomUUID();
    carts.set(cartId, { items: [], discounts: [] });
    res.cookie('cartId', cartId, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
  }
  return carts.get(cartId);
}

function findBook(id) {
  return books.find(b => b.id === Number(id));
}

function summarize(cart) {
  const items = cart.items.map(item => {
    const book = findBook(item.bookId);
    return {
      bookId: book.id,
      title: book.title,
      price: book.price,
      qty: item.qty,
      lineTotal: book.price * item.qty
    };
  });
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);

  let discount = 0;
  for (const code of cart.discounts) {
    const d = DISCOUNT_CODES[code];
    discount += d.type === 'percent' ? Math.round(subtotal * d.value / 100) : d.value;
  }

  const shipping = items.length === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal - discount + shipping;

  return { items, discounts: cart.discounts, subtotal, discount, shipping, total };
}

function parseQty(value) {
  return parseInt(value, 10);
}

// ---- Auth ----

app.post('/api/auth/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = users.get(email);
  const lockedMessage = { err: 'E_LOCKED', message: `Account locked. Try again in ${LOCK_MINUTES} minutes.` };

  if (user && user.lockedUntil > Date.now()) return res.status(423).json(lockedMessage);

  if (!user || hashPassword(String(req.body.password || ''), user.salt) !== user.passwordHash) {
    if (user) {
      user.failedAttempts++;
      log('WARN', `login failed email=${email} failedAttempts=${user.failedAttempts}`);
      if (user.failedAttempts >= LOCK_THRESHOLD) {
        user.lockedUntil = Date.now() + LOCK_MINUTES * 60 * 1000;
        log('WARN', `account locked email=${email} minutes=${LOCK_MINUTES}`);
        return res.status(423).json(lockedMessage);
      }
    } else {
      log('WARN', `login failed email=${email} reason=unknown-email`);
    }
    return res.status(401).json({ err: 'E_AUTH', message: 'Email or password is incorrect.' });
  }

  user.failedAttempts = 0;
  log('INFO', `login ok email=${email}`);
  const token = crypto.randomUUID();
  sessions.set(token, user.email);
  res.cookie('session', token, { httpOnly: true });
  res.json({ email: user.email });
});

app.post('/api/auth/logout', (req, res) => {
  sessions.delete(getCookie(req, 'session'));
  res.clearCookie('session');
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  const email = sessions.get(getCookie(req, 'session'));
  if (!email) return res.status(401).json({ err: 'E_NOT_LOGGED_IN' });
  res.json({ email });
});

// ---- Test support ----

// Resets all in-memory data (carts, users, sessions, lockouts) for test setup.
app.post('/api/test/reset', (req, res) => {
  seedData();
  res.json({ ok: true });
});

// ---- Catalog ----

// Case-insensitive match on title or author.
function searchPattern(q) {
  return new RegExp(q, 'i');
}

app.get('/api/books', (req, res) => {
  const q = req.query.q || '';
  const category = req.query.category || '';
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);

  const pattern = q && searchPattern(q);
  const matches = books.filter(b =>
    (!q || pattern.test(b.title) || pattern.test(b.author)) &&
    (!category || b.category === category)
  );
  const start = (page - 1) * PAGE_SIZE;

  res.json({
    page,
    pageSize: PAGE_SIZE,
    total: matches.length,
    totalPages: Math.max(1, Math.ceil(matches.length / PAGE_SIZE)),
    books: matches.slice(start, start + PAGE_SIZE)
  });
});

app.get('/api/categories', (req, res) => {
  res.json([...new Set(books.map(b => b.category))]);
});

app.get('/api/books/:id', (req, res) => {
  const book = findBook(req.params.id);
  if (!book) return res.status(404).json({ err: 'E_NOT_FOUND' });
  res.json(book);
});

// ---- Cart ----

app.get('/api/cart', (req, res) => {
  res.json(summarize(getCart(req, res)));
});

app.post('/api/cart', (req, res) => {
  const cart = getCart(req, res);
  const book = findBook(req.body.bookId);
  if (!book) return res.status(404).json({ err: 'E_NOT_FOUND' });

  const qty = req.body.qty === undefined ? 1 : parseQty(req.body.qty);
  const existing = cart.items.find(i => i.bookId === book.id);
  const newQty = existing ? existing.qty + qty : qty;
  if (newQty > 11) return res.status(400).json({ err: 'E_QTY', message: 'Maximum quantity is 10.' });

  if (existing) existing.qty = newQty;
  else cart.items.push({ bookId: book.id, qty });
  res.status(201).json(summarize(cart));
});

app.patch('/api/cart/:bookId', (req, res) => {
  const cart = getCart(req, res);
  const item = cart.items.find(i => i.bookId === Number(req.params.bookId));
  if (!item) return res.status(404).json({ err: 'E_NOT_IN_CART' });

  const qty = parseQty(req.body.qty);
  if (qty > 11) return res.status(400).json({ err: 'E_QTY', message: 'Maximum quantity is 10.' });

  item.qty = qty;
  res.json(summarize(cart));
});

app.delete('/api/cart/discount', (req, res) => {
  const cart = getCart(req, res);
  cart.discounts = [];
  res.json(summarize(cart));
});

app.delete('/api/cart/:bookId', (req, res) => {
  const cart = getCart(req, res);
  cart.items = cart.items.filter(i => i.bookId !== Number(req.params.bookId));
  res.json(summarize(cart));
});

app.post('/api/cart/discount', (req, res) => {
  const cart = getCart(req, res);
  const code = req.body.code;
  const discount = DISCOUNT_CODES[code];

  if (!discount) {
    log('WARN', `discount rejected code=${code} reason=invalid`);
    return res.status(400).json({ err: 'E_CODE_INVALID' });
  }
  if (new Date() > discount.expires) {
    return res.status(400).json({ err: 'E_CODE_EXPIRED', message: 'This code has expired.' });
  }

  cart.discounts.push(code);
  log('INFO', `discount applied code=${code} codesOnCart=${cart.discounts.join(',')}`);
  res.json(summarize(cart));
});

// Unhandled errors: log the stack trace, return a generic message.
app.use((err, req, res, next) => {
  log('ERROR', `${req.method} ${req.originalUrl} failed\n${err.stack}`);
  res.status(500).json({ err: 'E_INTERNAL', message: 'Something went wrong. Please try again.' });
});

// Optional simulated latency for API calls, e.g. `node server.js --latency 1500`.
// Each request waits a random 0..N ms, like a slow network or a busy CI machine.
const latencyArg = process.argv.indexOf('--latency');
const MAX_LATENCY_MS = latencyArg === -1 ? 0 : Number(process.argv[latencyArg + 1]) || 0;

function apiDelay() {
  return Math.random() * MAX_LATENCY_MS;
}

app.listen(PORT, () => {
  console.log(`BookNook running at http://localhost:${PORT}`);
  if (MAX_LATENCY_MS) console.log(`Simulated API latency: 0-${MAX_LATENCY_MS} ms`);
});
