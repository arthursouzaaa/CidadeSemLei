// ===== INTERAÇÃO: tecla E centralizada =====
// Todos os estabelecimentos abrem com E. Este arquivo decide o que o E faz no mundo.
// Os locais com menu próprio (banco, cassino, roupas, loja, Ammu-Nation, oficina)
// abrem pelo listener do próprio arquivo, então aqui só evitamos conflito.
const _onKeyBase = onKey;

function placeNearE() {
  return bankNear() || casinoNear() || clothesNear() || shopNear() || ammuNear() ||
         (P.veh && oficinaNearAny());
}

onKey = function (c) {
  if (c === 'KeyE' && st === 'play') {
    if (placeNearE()) return;           // o estabelecimento abre no próprio listener
    if (tryHouse()) return;             // casa: comprar, descansar e salvar
    if (nearAtm()) { atmOpenMenu(); return; }
    if (tryRestaurant()) return;        // balcão e entrega
    toggleVeh();                        // entrar/sair do carro
    return;
  }
  if (c === 'KeyE' && st === 'atm') { st = 'play'; atmMenu = null; return; }
  return _onKeyBase(c);
};