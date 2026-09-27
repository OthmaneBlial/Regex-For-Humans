for (const button of document.querySelectorAll("[data-copy]")) {
  button.addEventListener("click", async () => {
    const source = document.getElementById(button.dataset.copy);
    const status = document.getElementById("copy-status");
    try {
      await navigator.clipboard.writeText(source.textContent.trim());
      status.textContent = `${button.textContent.replace("Copy", "")} copied`;
      button.textContent = "Copied";
      window.setTimeout(() => {
        button.textContent = button.dataset.copy === "rules-code" ? "Copy rules" : "Copy regex";
      }, 1600);
    } catch {
      status.textContent = "Clipboard access is unavailable. Select the text to copy it.";
    }
  });
}
