function openPanelWithoutJump(buttonSelector, panelSelector) {
  const button = document.querySelector(buttonSelector);
  const panel = document.querySelector(panelSelector);
  if (!button || !panel) return;

  button.onclick = () => {
    panel.classList.add("open");
    const firstInput = panel.querySelector("input, select, button");
    if (firstInput && typeof firstInput.focus === "function") {
      firstInput.focus({ preventScroll: true });
    }
  };
}

openPanelWithoutJump("#addAccount", "#accountFormPanel");
openPanelWithoutJump("#addPlanned", "#plannedFormPanel");
