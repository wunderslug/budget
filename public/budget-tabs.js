(() => {
  const params = new URLSearchParams(window.location.search);
  const budget = params.get("budget") === "2" ? "2" : "1";

  document.documentElement.dataset.budget = budget;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const raw = typeof input === "string" ? input : input?.url;
    if (typeof raw === "string" && raw.startsWith("/api/state")) {
      const url = new URL(raw, window.location.origin);
      url.searchParams.set("budget", budget);
      if (typeof input === "string") return nativeFetch(url.pathname + url.search, init);
      return nativeFetch(new Request(url, input), init);
    }
    return nativeFetch(input, init);
  };

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-budget-tab]").forEach(tab => {
      const active = tab.dataset.budgetTab === budget;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-current", active ? "page" : "false");
    });

    const label = document.querySelector("#activeBudgetLabel");
    if (label) label.textContent = budget === "2" ? "Budget 2" : "Main budget";
  });
})();
