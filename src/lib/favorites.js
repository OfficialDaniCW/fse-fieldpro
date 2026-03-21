const KEY = 'fse_fieldpro_favorites';

export function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function isFavorite(partId) {
  return getFavorites().includes(partId);
}

export function toggleFavorite(partId) {
  const favs = getFavorites();
  const idx = favs.indexOf(partId);
  if (idx === -1) {
    favs.push(partId);
  } else {
    favs.splice(idx, 1);
  }
  localStorage.setItem(KEY, JSON.stringify(favs));
  // Dispatch a custom event so any mounted component can react
  window.dispatchEvent(new CustomEvent('favorites-changed', { detail: { partId } }));
  return idx === -1; // returns true if now favorited
}

export function clearFavorites() {
  localStorage.removeItem(KEY);
}