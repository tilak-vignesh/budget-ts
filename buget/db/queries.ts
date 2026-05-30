import { getDb } from './schema';

export type Category = { id: number; name: string; created_at: string };
export type Budget = { id: number; category_id: number; month: string; limit_amount: number };
export type Expense = { id: number; category_id: number; month: string; amount: number; note: string | null; expense_date: string; created_at: string };

export type CategorySummary = Category & {
  limit_amount: number | null;
  spent: number;
  remaining: number;
};

// ── Categories ────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const db = await getDb();
  return db.getAllAsync<Category>('SELECT * FROM categories ORDER BY name ASC');
}

export async function addCategory(name: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO categories (name, created_at) VALUES (?, ?)',
    name.trim().toLowerCase(),
    new Date().toISOString()
  );
}

export async function deleteCategory(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM categories WHERE id = ?', id);
}

export async function updateCategory(id: number, name: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE categories SET name = ? WHERE id = ?', name.trim().toLowerCase(), id);
}

// ── Budgets ───────────────────────────────────────────────────

export async function getBudget(categoryId: number, month: string): Promise<Budget | null> {
  const db = await getDb();
  return db.getFirstAsync<Budget>(
    'SELECT * FROM budgets WHERE category_id = ? AND month = ?',
    categoryId,
    month
  );
}

export async function setBudget(categoryId: number, month: string, limitAmount: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO budgets (category_id, month, limit_amount) VALUES (?, ?, ?)
     ON CONFLICT(category_id, month) DO UPDATE SET limit_amount = excluded.limit_amount`,
    categoryId,
    month,
    limitAmount
  );
}

// ── Expenses ──────────────────────────────────────────────────

// expenseDate: "YYYY-MM-DD" — month is derived from it
export async function addExpense(categoryId: number, amount: number, note: string, expenseDate: string): Promise<void> {
  const db = await getDb();
  const month = expenseDate.slice(0, 7); // "YYYY-MM"
  await db.runAsync(
    'INSERT INTO expenses (category_id, month, amount, note, expense_date, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    categoryId,
    month,
    amount,
    note || null,
    expenseDate,
    new Date().toISOString()
  );
}

export async function getExpensesByMonth(month: string): Promise<(Expense & { category_name: string })[]> {
  const db = await getDb();
  return db.getAllAsync<Expense & { category_name: string }>(
    `SELECT e.*, c.name as category_name
     FROM expenses e
     JOIN categories c ON c.id = e.category_id
     WHERE e.month = ?
     ORDER BY e.expense_date DESC, e.created_at DESC`,
    month
  );
}

export async function deleteExpense(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM expenses WHERE id = ?', id);
}

export async function updateExpense(id: number, amount: number, note: string, expenseDate: string): Promise<void> {
  const db = await getDb();
  const month = expenseDate.slice(0, 7);
  await db.runAsync(
    'UPDATE expenses SET amount = ?, note = ?, expense_date = ?, month = ? WHERE id = ?',
    amount, note || null, expenseDate, month, id
  );
}

// ── Summary ───────────────────────────────────────────────────

export async function getMonthlySummary(month: string): Promise<CategorySummary[]> {
  const db = await getDb();
  return db.getAllAsync<CategorySummary>(
    `SELECT
       c.id, c.name, c.created_at,
       b.limit_amount,
       COALESCE(SUM(e.amount), 0) as spent,
       COALESCE(b.limit_amount, 0) - COALESCE(SUM(e.amount), 0) as remaining
     FROM categories c
     LEFT JOIN budgets b ON b.category_id = c.id AND b.month = ?
     LEFT JOIN expenses e ON e.category_id = c.id AND e.month = ?
     GROUP BY c.id
     ORDER BY c.name ASC`,
    month,
    month
  );
}

export async function getDailySpend(categoryId: number, month: string): Promise<{ day: number; total: number }[]> {
  const db = await getDb();
  return db.getAllAsync<{ day: number; total: number }>(
    `SELECT CAST(strftime('%d', expense_date) AS INTEGER) as day, SUM(amount) as total
     FROM expenses
     WHERE category_id = ? AND month = ?
     GROUP BY day
     ORDER BY day ASC`,
    categoryId,
    month
  );
}

export async function getSpentForCategory(categoryId: number, month: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE category_id = ? AND month = ?',
    categoryId,
    month
  );
  return row?.total ?? 0;
}
