import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 3025;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "state.json");

const defaultState = {
  balance: 1000,
  weeklyIncome: 850,
  expenses: [
    { id: 1, name: "Mortgage / Rent", amount: 1200, dueDay: 1, frequency: "monthly" },
    { id: 2, name: "Electric", amount: 150, dueDay: 10, frequency: "monthly" },
    { id: 3, name: "Internet", amount: 80, dueDay: 14, frequency: "monthly" },
    { id: 4, name: "Cell phone", amount: 90, dueDay: 18, frequency: "monthly" },
    { id: 5, name: "Car payment", amount: 375, dueDay: 20, frequency: "monthly" },
    { id: 6, name: "Car insurance", amount: 140, dueDay: 25, frequency: "monthly" },
    { id: 7, name: "Groceries", amount: 150, dueDay: 1, frequency: "weekly" },
    { id: 8, name: "Gas / Fuel", amount: 60, dueDay: 1, frequency: "weekly" }
  ]
};

fs.mkdirSync(DATA_DIR, { recursive: true });

function cleanState(raw = {}) {
  const expenses = Array.isArray(raw.expenses) ? raw.expenses : [];
  return {
    balance: Number.isFinite(Number(raw.balance)) ? Number(raw.balance) : 0,
    weeklyIncome: Number.isFinite(Number(raw.weeklyIncome)) ? Number(raw.weeklyIncome) : 0,
    expenses: expenses.slice(0, 500).map((e, i) => ({
      id: Number.isFinite(Number(e.id)) ? Number(e.id) : Date.now() + i,
      name: String(e.name || "Expense").slice(0, 80),
      amount: Math.max(0, Number(e.amount) || 0),
      dueDay: Math.max(1, Math.min(31, Number(e.dueDay) || 1)),
      frequency: e.frequency === "weekly" ? "weekly" : "monthly"
    }))
  };
}

function loadState() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultState, null, 2));
    return defaultState;
  }
  try {
    return cleanState(JSON.parse(fs.readFileSync(DATA_FILE, "utf8")));
  } catch {
    return defaultState;
  }
}

function saveState(state) {
  const clean = cleanState(state);
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(clean, null, 2));
  fs.renameSync(tmp, DATA_FILE);
  return clean;
}

app.use(express.json({ limit: "200kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/state", (_req, res) => res.json(loadState()));
app.put("/api/state", (req, res) => {
  try {
    res.json(saveState(req.body));
  } catch {
    res.status(500).json({ error: "Could not save changes." });
  }
});
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Weekly Money Planner running on port ${PORT}`);
});
