export type Category = { id: number; name: string; created_at: string };
export type Budget = { id: number; category_id: number; month: string; limit_amount: number };
export type Expense = { id: number; category_id: number; month: string; amount: number; note: string | null; expense_date: string; created_at: string };

export type CategorySummary = Category & {
  limit_amount: number | null;
  spent: number;
  remaining: number;
};

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'same-origin', ...options });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

// ── Categories ────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  return api<Category[]>('/api/categories');
}

export async function addCategory(name: string): Promise<void> {
  await api('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

export async function deleteCategory(id: number): Promise<void> {
  await api(`/api/categories/${id}`, { method: 'DELETE' });
}

export async function updateCategory(id: number, name: string): Promise<void> {
  await api(`/api/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

// ── Budgets ───────────────────────────────────────────────────

export async function getBudget(categoryId: number, month: string): Promise<Budget | null> {
  return api<Budget | null>(`/api/budgets?categoryId=${categoryId}&month=${month}`);
}

export async function setBudget(categoryId: number, month: string, limitAmount: number): Promise<void> {
  await api('/api/budgets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoryId, month, limitAmount }),
  });
}

// ── Expenses ──────────────────────────────────────────────────

export async function addExpense(categoryId: number, amount: number, note: string, expenseDate: string): Promise<void> {
  await api('/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoryId, amount, note, expenseDate }),
  });
}

export async function getExpensesByMonth(month: string): Promise<(Expense & { category_name: string })[]> {
  return api<(Expense & { category_name: string })[]>(`/api/expenses?month=${month}`);
}

export async function deleteExpense(id: number): Promise<void> {
  await api(`/api/expenses/${id}`, { method: 'DELETE' });
}

export async function updateExpense(id: number, amount: number, note: string, expenseDate: string): Promise<void> {
  await api(`/api/expenses/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, note, expenseDate }),
  });
}

// ── Summary ───────────────────────────────────────────────────

export async function getMonthlySummary(month: string): Promise<CategorySummary[]> {
  return api<CategorySummary[]>(`/api/summary?month=${month}`);
}

export async function getDailySpend(categoryId: number, month: string): Promise<{ day: number; total: number }[]> {
  return api<{ day: number; total: number }[]>(`/api/daily-spend?categoryId=${categoryId}&month=${month}`);
}

export async function getSpentForCategory(categoryId: number, month: string): Promise<number> {
  const { total } = await api<{ total: number }>(`/api/spent?categoryId=${categoryId}&month=${month}`);
  return total;
}
