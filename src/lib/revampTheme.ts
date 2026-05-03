const KEY = "critiqs-revamp";
const CLASS = "revamp-aurora";

export function isRevampActive() {
  try { return localStorage.getItem(KEY) === "aurora"; } catch { return false; }
}

export function applyRevamp() {
  try { localStorage.setItem(KEY, "aurora"); } catch {}
  document.documentElement.classList.add(CLASS);
}

export function clearRevamp() {
  try { localStorage.removeItem(KEY); } catch {}
  document.documentElement.classList.remove(CLASS);
}

// Bootstrap synchronously on import — call once at app boot.
export function bootstrapRevamp() {
  if (isRevampActive()) document.documentElement.classList.add(CLASS);
}
