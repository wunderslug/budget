(() => {
  const root = document.querySelector("#twoMonthForecast");
  if (!root) return;

  const money = n => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(n);

  function startOfWeek(date) {
    const d = new Date(date);
    const diff = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function endOfWeek(date) {
    const d = new Date(date);
    d.setDate(d.getDate() + 6);
    return d;
  }

  function weeklyExpenses(expenses, start, end) {
    let total = 0;
    for (const expense of expenses || []) {
      if (expense.frequency === "weekly") {
        total += Number(expense.amount) || 0;
        continue;
      }
      let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
      const final = new Date(end.getFullYear(), end.getMonth(), 1);
      while (cursor <= final) {
        const lastDay = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
        const due = new Date(cursor.getFullYear(), cursor.getMonth(), Math.min(Number(expense.dueDay) || 1, lastDay));
        if (due >= start && due <= end) total += Number(expense.amount) || 0;
        cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      }
    }
    return total;
  }

  function makeForecast(state) {
    const rows = [];
    let running = Number(state.balance) || 0;
    const income = Number(state.weeklyIncome) || 0;
    const first = startOfWeek(new Date());
    for (let i = 0; i < 8; i++) {
      const start = new Date(first);
      start.setDate(start.getDate() + i * 7);
      const end = endOfWeek(start);
      const expenses = weeklyExpenses(state.expenses, start, end);
      running += income - expenses;
      rows.push({
        label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        balance: running,
        income,
        expenses
      });
    }
    return rows;
  }

  function draw(rows) {
    const totalIncome = rows.reduce((sum, r) => sum + r.income, 0);
    const totalExpenses = rows.reduce((sum, r) => sum + r.expenses, 0);
    const ending = rows.length ? rows[rows.length - 1].balance : 0;
    const lowest = rows.length ? Math.min(...rows.map(r => r.balance)) : 0;

    const width = 760, height = 210, left = 18, right = 18, top = 20, bottom = 34;
    const vals = rows.map(r => r.balance);
    let min = Math.min(0, ...vals), max = Math.max(0, ...vals);
    if (max === min) max = min + 1;
    const pad = Math.max(100, (max - min) * 0.12);
    min -= pad; max += pad;
    const x = i => left + (i * (width - left - right) / Math.max(1, rows.length - 1));
    const y = v => top + (max - v) * (height - top - bottom) / (max - min);
    const zeroY = y(0);
    const points = rows.map((r, i) => `${x(i)},${y(r.balance)}`).join(" ");

    const labels = rows.map((r, i) => `<text x="${x(i)}" y="${height - 9}" text-anchor="middle">${r.label}</text>`).join("");
    const dots = rows.map((r, i) => `<circle cx="${x(i)}" cy="${y(r.balance)}" r="4"><title>${r.label}: ${money(r.balance)}</title></circle>`).join("");

    root.innerHTML = `
      <div class="outlook-totals">
        <div><span>Income</span><strong>+${money(totalIncome)}</strong></div>
        <div><span>Bills</span><strong>−${money(totalExpenses)}</strong></div>
        <div><span>Lowest point</span><strong class="${lowest < 0 ? "outlook-negative" : ""}">${money(lowest)}</strong></div>
        <div><span>End of 2 months</span><strong class="${ending < 0 ? "outlook-negative" : "outlook-positive"}">${money(ending)}</strong></div>
      </div>
      <div class="outlook-chart-wrap">
        <svg class="outlook-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Projected available balance over the next eight weeks">
          <line class="outlook-zero" x1="${left}" x2="${width-right}" y1="${zeroY}" y2="${zeroY}"></line>
          <polyline class="outlook-line" points="${points}"></polyline>
          <g class="outlook-dots">${dots}</g>
          <g class="outlook-labels">${labels}</g>
        </svg>
      </div>`;
  }

  let busy = false;
  async function refresh() {
    if (busy) return;
    busy = true;
    try {
      const response = await fetch("/api/state", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const state = await response.json();
      draw(makeForecast(state));
    } catch {
      root.innerHTML = '<div class="empty">Could not load the two-month forecast.</div>';
    } finally {
      busy = false;
    }
  }

  refresh();
  const forecast = document.querySelector("#forecast");
  if (forecast) {
    let timer;
    new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(refresh, 80);
    }).observe(forecast, { childList: true, subtree: true, characterData: true });
  }
})();
