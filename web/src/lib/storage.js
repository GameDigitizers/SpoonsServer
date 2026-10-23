// Storage can be unavailable (private browsing, blocked site data), so never let it throw

export function load(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function save(storage, key, value) {
  try {
    storage.setItem(key, value);
  } catch {
    // Not remembering is fine
  }
}

// Per-tab so several tabs on one laptop can each be a player; survives reloads
export function playerIdFor(gameId) {
  const key = `spoons:${gameId}:playerId`;
  let id = load(sessionStorage, key);
  if (!id) {
    // crypto.randomUUID is unavailable over plain http on a LAN address
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    save(sessionStorage, key, id);
  }
  return id;
}
