const picker = document.getElementById("interface-theme");
if (!(picker instanceof HTMLSelectElement)) throw new Error("The theme selector is missing.");

const storageKey = "regex-for-humans:workshop-theme";
const system = window.matchMedia("(prefers-color-scheme: dark)");
let saved = "system";
try {
  saved = localStorage.getItem(storageKey) ?? "system";
} catch {
  /* Storage is optional. */
}
picker.value = ["system", "light", "dark"].includes(saved) ? saved : "system";

function apply() {
  document.documentElement.dataset.theme =
    picker.value === "system" ? (system.matches ? "dark" : "light") : picker.value;
}

system.addEventListener("change", apply);
picker.addEventListener("change", () => {
  apply();
  try {
    localStorage.setItem(storageKey, picker.value);
  } catch {
    /* Storage is optional. */
  }
});
apply();
picker.disabled = false;
