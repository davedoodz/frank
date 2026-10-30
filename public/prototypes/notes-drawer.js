(() => {
  const trigger = document.querySelector("[data-notes-drawer]");
  if (!(trigger instanceof HTMLAnchorElement) || typeof HTMLDialogElement === "undefined") return;

  const source = new URL(trigger.href, window.location.href);
  source.searchParams.set("embed", "1");

  const dialog = document.createElement("dialog");
  dialog.className = "notes-drawer";
  dialog.setAttribute("aria-labelledby", "notes-drawer-title");
  dialog.innerHTML = `
    <header class="notes-drawer__header">
      <h2 class="notes-drawer__title" id="notes-drawer-title">User notes</h2>
      <button class="notes-drawer__close" type="button" aria-label="Close user notes">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
      </button>
    </header>
    <iframe class="notes-drawer__frame" title="User interview notes"></iframe>
  `;
  document.body.append(dialog);

  const closeButton = dialog.querySelector(".notes-drawer__close");
  const frame = dialog.querySelector(".notes-drawer__frame");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let closeTimer = 0;

  function openDrawer(event) {
    event?.preventDefault();
    window.clearTimeout(closeTimer);
    if (!frame.src) frame.src = source.href;
    if (!dialog.open) dialog.showModal();
    trigger.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      dialog.classList.add("is-open");
      closeButton.focus();
    }));
  }

  function closeDrawer() {
    if (!dialog.open) return;
    dialog.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
    const finish = () => {
      if (dialog.open) dialog.close();
      trigger.focus();
    };
    if (reducedMotion.matches) finish();
    else closeTimer = window.setTimeout(finish, 220);
  }

  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-expanded", "false");
  trigger.addEventListener("click", openDrawer);
  closeButton.addEventListener("click", closeDrawer);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDrawer();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDrawer();
  });
})();
