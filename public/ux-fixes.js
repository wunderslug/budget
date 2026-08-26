const addAccountButton = document.querySelector("#addAccount");
const accountFormPanel = document.querySelector("#accountFormPanel");

if (addAccountButton && accountFormPanel) {
  addAccountButton.onclick = () => {
    accountFormPanel.classList.add("open");
    const firstInput = accountFormPanel.querySelector("input");
    if (firstInput) firstInput.focus({ preventScroll: true });
  };
}
