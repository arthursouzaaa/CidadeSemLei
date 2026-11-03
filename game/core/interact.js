// ===== INTERAÇÃO: tecla E centralizada =====
const _onKeyBase = onKey;

function placeNearE() {
  return bankNear() || casinoNear() || clothesNear() || shopNear() || ammuNear() ||
         !!houseNear() || (P.veh && oficinaNearAny());
}

onKey = function (c) {
  if (c === 'KeyE' && st === 'play') {
    if (placeNearE()) return;   // o estabelecimento trata o E no próprio listener
    if (nearAtm()) { atmOpenMenu(); return; }
    if (tryRestaurant()) return;
    toggleVeh();
    return;
  }
  if (c === 'KeyE' && st === 'atm') { st = 'play'; atmMenu = null; return; }
  return _onKeyBase(c);
};