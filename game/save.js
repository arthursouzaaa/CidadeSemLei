const SAVE_KEY = 'cidadeSemLei_save_v1';

function saveGame() {
  try {
    const data = {
      money: money,
      owned: owned,
      ammo: ammo.map(a => a === Infinity ? -1 : a),
      garage: garage,
      inv: inv
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Não foi possível salvar:', e);
  }
}

function loadGame() {
  const defaults = {
    money: 500, owned: [true, false, false], ammo: [Infinity, 0, 0], garage: [],
    inv: { faca: 0, bastao: 0, c4: 0, granada: 0, molotov: 0 }
  };
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaults;
    const d = JSON.parse(raw);
    const inv = { ...defaults.inv };
    if (d.inv && typeof d.inv === 'object') {
      for (const k in inv) inv[k] = Math.max(0, Number(d.inv[k]) || 0);
    }
    return {
      money: typeof d.money === 'number' ? d.money : defaults.money,
      owned: Array.isArray(d.owned) && d.owned.length === 3 ? d.owned.map(Boolean) : defaults.owned,
      ammo: Array.isArray(d.ammo) && d.ammo.length === 3
        ? d.ammo.map(a => a === -1 ? Infinity : Number(a) || 0)
        : defaults.ammo,
      garage: Array.isArray(d.garage)
        ? d.garage
            .filter(g => g && typeof g.model === 'string')
            .slice(0, 3)
            .map(g => ({
              model: g.model,
              col: typeof g.col === 'string' ? g.col : '#2563eb',
              hp: typeof g.hp === 'number' ? Math.max(1, Math.min(100, g.hp)) : 100,
              turbo: Math.max(0, Math.min(3, Number(g.turbo) || 0))
            }))
        : [],
      inv
    };
  } catch (e) {
    console.warn('Save corrompido, usando padrão:', e);
    return defaults;
  }
}

function resetSave() {
  localStorage.removeItem(SAVE_KEY);
}