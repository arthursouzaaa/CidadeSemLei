const SAVE_KEY = 'cidadeSemLei_save_v2';
const SAVE_OLD_KEY = 'cidadeSemLei_save_v1';

let bank = { acc: null, pin: null, balance: 0 };
let debt = 0;
let look = { shirt: '#2563eb', pants: '#1f2937' };

function saveGame() {
  try {
    const data = {
      v: 2,
      money, owned, garage, inv,
      ammo: ammo.map(a => a === Infinity ? -1 : a),
      bank, debt, look,
      run: {
        x: P ? Math.round(P.x) : SX, y: P ? Math.round(P.y) : SY,
        mission: mission ? { t: mission.t, r: mission.r } : null
      }
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Não foi possível salvar:', e);
  }
}

function defaultSave() {
  return {
    money: 500, owned: [false, false, false], ammo: [0, 0, 0], garage: [],
    inv: { faca: 0, bastao: 0, c4: 0, granada: 0, molotov: 0 },
    bank: { acc: null, pin: null, balance: 0 }, debt: 0,
    look: { shirt: '#2563eb', pants: '#1f2937' },
    run: null
  };
}

function cleanGarage(list) {
  return Array.isArray(list)
    ? list.filter(g => g && typeof g.model === 'string').slice(0, 3).map(g => ({
        model: g.model,
        col: typeof g.col === 'string' ? g.col : '#2563eb',
        hp: typeof g.hp === 'number' ? Math.max(1, Math.min(100, g.hp)) : 100,
        turbo: Math.max(0, Math.min(3, Number(g.turbo) || 0))
      }))
    : [];
}

function loadGame() {
  const defaults = defaultSave();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    let d = raw ? JSON.parse(raw) : null;
    if (!d) {
      const old = localStorage.getItem(SAVE_OLD_KEY);
      if (old) d = JSON.parse(old);
    }
    if (!d) return defaults;
    const inv = { ...defaults.inv };
    if (d.inv && typeof d.inv === 'object') for (const k in inv) inv[k] = Math.max(0, Number(d.inv[k]) || 0);
    const bk = d.bank && typeof d.bank === 'object' ? d.bank : {};
    return {
      money: typeof d.money === 'number' ? d.money : defaults.money,
      owned: Array.isArray(d.owned) && d.owned.length === 3 ? d.owned.map(Boolean) : defaults.owned,
      ammo: Array.isArray(d.ammo) && d.ammo.length === 3
        ? d.ammo.map(a => a === -1 ? Infinity : Number(a) || 0) : defaults.ammo,
      garage: cleanGarage(d.garage),
      inv,
      bank: {
        acc: typeof bk.acc === 'string' ? bk.acc : null,
        pin: typeof bk.pin === 'string' ? bk.pin : null,
        balance: Math.max(0, Number(bk.balance) || 0)
      },
      debt: Math.max(0, Number(d.debt) || 0),
      look: {
        shirt: typeof d.look?.shirt === 'string' ? d.look.shirt : defaults.look.shirt,
        pants: typeof d.look?.pants === 'string' ? d.look.pants : defaults.look.pants
      },
      run: d.run && typeof d.run.x === 'number' ? d.run : null
    };
  } catch (e) {
    console.warn('Save corrompido, usando padrão:', e);
    return defaults;
  }
}

function resetSave() {
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem(SAVE_OLD_KEY);
}

// Multa ao morrer: carteira → banco → dívida (que rende juros no banco)
function applyDeathFine(amount) {
  let rest = amount;
  const fromWallet = Math.min(money, rest); money -= fromWallet; rest -= fromWallet;
  const fromBank = Math.min(bank.balance, rest); bank.balance -= fromBank; rest -= fromBank;
  if (rest > 0) { debt += rest; toast('Multa pendente de $' + rest + ' (paga no banco).'); }
  else toast('Multa de $' + amount + ' descontada.');
}