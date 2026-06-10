require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Load whitelisted users from env: EMAIL_1, PASSWORD_1, EMAIL_2, PASSWORD_2, ...
const users = [];
let i = 1;
while (process.env[`EMAIL_${i}`]) {
  users.push({
    email: process.env[`EMAIL_${i}`].toLowerCase(),
    password: process.env[`PASSWORD_${i}`],
  });
  i++;
}

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,   // HTTP only
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
}));

// For API routes: return JSON 401 instead of redirecting
function requireAuthApi(req, res, next) {
  if (req.session.user) return next();
  res.status(401).json({ error: 'not logged in' });
}

// For page routes: redirect to login
function requireAuth(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login');
}

// Login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Login submit
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(
    u => u.email === (email || '').toLowerCase() && u.password === password
  );
  if (!user) {
    return res.redirect('/login?error=1');
  }
  req.session.user = email.toLowerCase();
  res.redirect('/');
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// ── API routes ────────────────────────────────────────────────

// Categories
app.get('/api/categories', requireAuthApi, (req, res) => {
  const rows = db.prepare(
    'SELECT id, name, created_at FROM categories WHERE user_email = ? ORDER BY name ASC'
  ).all(req.session.user);
  res.json(rows);
});

app.post('/api/categories', requireAuthApi, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    db.prepare(
      'INSERT INTO categories (user_email, name, created_at) VALUES (?, ?, ?)'
    ).run(req.session.user, name.trim().toLowerCase(), new Date().toISOString());
    res.json({ ok: true });
  } catch (e) {
    res.status(409).json({ error: 'category already exists' });
  }
});

app.delete('/api/categories/:id', requireAuthApi, (req, res) => {
  db.prepare(
    'DELETE FROM categories WHERE id = ? AND user_email = ?'
  ).run(Number(req.params.id), req.session.user);
  res.json({ ok: true });
});

app.patch('/api/categories/:id', requireAuthApi, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  db.prepare(
    'UPDATE categories SET name = ? WHERE id = ? AND user_email = ?'
  ).run(name.trim().toLowerCase(), Number(req.params.id), req.session.user);
  res.json({ ok: true });
});

// Budgets
app.get('/api/budgets', requireAuthApi, (req, res) => {
  const { categoryId, month } = req.query;
  const row = db.prepare(
    'SELECT id, category_id, month, limit_amount FROM budgets WHERE user_email = ? AND category_id = ? AND month = ?'
  ).get(req.session.user, Number(categoryId), month);
  res.json(row || null);
});

app.post('/api/budgets', requireAuthApi, (req, res) => {
  const { categoryId, month, limitAmount } = req.body;
  db.prepare(
    `INSERT INTO budgets (user_email, category_id, month, limit_amount) VALUES (?, ?, ?, ?)
     ON CONFLICT(user_email, category_id, month) DO UPDATE SET limit_amount = excluded.limit_amount`
  ).run(req.session.user, Number(categoryId), month, Number(limitAmount));
  res.json({ ok: true });
});

// Expenses
app.post('/api/expenses', requireAuthApi, (req, res) => {
  const { categoryId, amount, note, expenseDate } = req.body;
  const month = expenseDate.slice(0, 7);
  db.prepare(
    'INSERT INTO expenses (user_email, category_id, month, amount, note, expense_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.session.user, Number(categoryId), month, Number(amount), note || null, expenseDate, new Date().toISOString());
  res.json({ ok: true });
});

app.get('/api/expenses', requireAuthApi, (req, res) => {
  const { month } = req.query;
  const rows = db.prepare(
    `SELECT e.id, e.category_id, e.month, e.amount, e.note, e.expense_date, e.created_at, c.name as category_name
     FROM expenses e
     JOIN categories c ON c.id = e.category_id
     WHERE e.user_email = ? AND e.month = ?
     ORDER BY e.expense_date DESC, e.created_at DESC`
  ).all(req.session.user, month);
  res.json(rows);
});

app.delete('/api/expenses/:id', requireAuthApi, (req, res) => {
  db.prepare(
    'DELETE FROM expenses WHERE id = ? AND user_email = ?'
  ).run(Number(req.params.id), req.session.user);
  res.json({ ok: true });
});

app.patch('/api/expenses/:id', requireAuthApi, (req, res) => {
  const { amount, note, expenseDate } = req.body;
  const month = expenseDate.slice(0, 7);
  db.prepare(
    'UPDATE expenses SET amount = ?, note = ?, expense_date = ?, month = ? WHERE id = ? AND user_email = ?'
  ).run(Number(amount), note || null, expenseDate, month, Number(req.params.id), req.session.user);
  res.json({ ok: true });
});

// Summary
app.get('/api/summary', requireAuthApi, (req, res) => {
  const { month } = req.query;
  const rows = db.prepare(
    `SELECT
       c.id, c.name, c.created_at,
       b.limit_amount,
       COALESCE(SUM(e.amount), 0) as spent,
       COALESCE(b.limit_amount, 0) - COALESCE(SUM(e.amount), 0) as remaining
     FROM categories c
     LEFT JOIN budgets b ON b.category_id = c.id AND b.month = ? AND b.user_email = ?
     LEFT JOIN expenses e ON e.category_id = c.id AND e.month = ? AND e.user_email = ?
     WHERE c.user_email = ?
     GROUP BY c.id
     ORDER BY c.name ASC`
  ).all(month, req.session.user, month, req.session.user, req.session.user);
  res.json(rows);
});

app.get('/api/daily-spend', requireAuthApi, (req, res) => {
  const { categoryId, month } = req.query;
  const rows = db.prepare(
    `SELECT CAST(strftime('%d', expense_date) AS INTEGER) as day, SUM(amount) as total
     FROM expenses
     WHERE user_email = ? AND category_id = ? AND month = ?
     GROUP BY day
     ORDER BY day ASC`
  ).all(req.session.user, Number(categoryId), month);
  res.json(rows);
});

app.get('/api/spent', requireAuthApi, (req, res) => {
  const { categoryId, month } = req.query;
  const row = db.prepare(
    'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_email = ? AND category_id = ? AND month = ?'
  ).get(req.session.user, Number(categoryId), month);
  res.json({ total: row ? row.total : 0 });
});

// ── Static serving ────────────────────────────────────────────

// Serve Expo web build — protected
app.use(requireAuth, express.static(path.join(__dirname, '../dist')));

// SPA fallback — protected
app.get('*', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`buget server running on http://0.0.0.0:${PORT}`);
});
