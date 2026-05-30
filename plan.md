# Plan: Buget — Expo Mobile App (Offline-First)

## Overview

Build a fully offline personal budgeting app using **Expo (React Native)** + **expo-sqlite**.
No backend, no server. All data lives on the device.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Expo (React Native) | Cross-platform iOS + Android, quick setup |
| Language | TypeScript | Type safety, better DX |
| Database | expo-sqlite | Local SQLite on device, matches original spec |
| Navigation | Expo Router | File-based routing, clean structure |
| Styling | NativeWind (Tailwind for RN) | Fast styling, utility-first |

---

## Database Schema

### `categories`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| name | TEXT | e.g. "personal", "transport" |
| created_at | TEXT | ISO timestamp |

### `budgets`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| category_id | INTEGER FK | References categories |
| month | TEXT | Format: "YYYY-MM" |
| limit_amount | REAL | Monthly limit set by user |

### `expenses`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| category_id | INTEGER FK | References categories |
| month | TEXT | Format: "YYYY-MM" |
| amount | REAL | Expense amount |
| note | TEXT | Optional description |
| created_at | TEXT | ISO timestamp |

---

## App Screens

### 1. Home Screen (`/`)
- Shows current month's categories as cards
- Each card displays: category name, limit, amount spent, remaining balance
- Color indicators: green (safe), yellow (near limit, >80%), red (breached)
- Warning toast when a category hits 100%
- Insult message (modal/toast) when a category goes over limit

### 2. Categories Screen (`/categories`)
- List of all categories
- Add new category (name input)
- Delete category (with confirmation)

### 3. Set Budget Screen (`/budget`)
- For the current month, set/update limit for each category
- Pre-fills last month's limits as defaults

### 4. Add Expense Screen (`/add-expense`)
- Form: amount, category picker, optional note
- On submit: deduct from category, show warning/insult if threshold crossed
- Accessible from a floating action button on the home screen

### 5. History Screen (`/history`)
- Month picker to browse past months
- List of expenses per category for that month
- Summary totals per category

---

## Business Logic

- **Warning:** shown when `spent / limit >= 1.0` (limit exactly reached)
- **Insult:** shown when `spent / limit > 1.0` (limit breached)
- Insults are a hardcoded list of funny/harsh strings, picked randomly
- Month is always derived from the current device date (`YYYY-MM`)
- If no budget is set for a category in the current month, prompt user to set one before adding an expense

---

## Project Structure

```
buget-ts/
├── app/
│   ├── _layout.tsx          # Root layout, DB init
│   ├── index.tsx            # Home screen
│   ├── categories.tsx       # Manage categories
│   ├── budget.tsx           # Set monthly limits
│   ├── add-expense.tsx      # Add expense form
│   └── history.tsx          # Expense history
├── db/
│   ├── schema.ts            # Table creation SQL
│   └── queries.ts           # All DB query functions
├── components/
│   ├── CategoryCard.tsx     # Home screen category card
│   ├── InsultModal.tsx      # Insult popup
│   └── MonthPicker.tsx      # Month selector for history
├── constants/
│   └── insults.ts           # List of insult strings
├── hooks/
│   └── useDatabase.ts       # DB init hook
└── app.json
```

---

## Build Steps

1. **Init Expo project** with TypeScript template
2. **Install dependencies:** expo-sqlite, expo-router, nativewind
3. **Set up DB schema** — create tables on app first launch
4. **Build DB query layer** — typed functions for all CRUD operations
5. **Build screens** in order: Home → Add Expense → Categories → Set Budget → History
6. **Wire up navigation** via Expo Router
7. **Add insult logic** and warning thresholds
8. **Polish UI** — colors, spacing, mobile-friendly touch targets

---

## Out of Scope (for now)

- Cloud sync / backup
- Push notifications
- Multi-user support
- Charts/graphs (can be added later with Victory Native)
