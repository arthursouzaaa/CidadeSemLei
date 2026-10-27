// ===== NOTÍCIAS DO RÁDIO: o mundo reage às ações do jogador =====
const NEWS_MAX = 5;
let newsQueue = [];

function pushNews(t) {
  if (newsQueue.includes(t)) return;
  newsQueue.push(t);
  if (newsQueue.length > NEWS_MAX) newsQueue.shift();
}

const _detonateBase = detonateAtm;
detonateAtm = function (a) {
  _detonateBase(a);
  pushNews('A polícia investiga uma explosão em caixa eletrônico. Suspeitos armados.');
};

const _hurtPedBase = hurtPed;
hurtPed = function (p, d, src) {
  const wasDead = p.dead, wasCop = p.cop;
  _hurtPedBase(p, d, src);
  if (!wasDead && p.dead && wasCop) pushNews('Um policial foi morto. A polícia promete resposta.');
};

const NEWS_BY_MISSION = {
  d: 'Uma entrega foi interceptada no centro. Motorista ainda não identificado.',
  h: 'Um homem foi executado em via pública. Testemunhas descrevem atirador armado.',
  s: 'Roubo de veículo registrado. Carro visto pela última vez em alta velocidade.',
  r: 'Perseguição de carro em alta velocidade deixa moradores assustados.',
  e: 'Fuga da polícia termina sem prisão. Autoridades investigam.'
};
const _updMissionBase = updMission;
updMission = function (dt) {
  const m = mission, before = money;
  _updMissionBase(dt);
  if (m && !mission && money > before && NEWS_BY_MISSION[m.t]) pushNews(NEWS_BY_MISSION[m.t]);
};

radioIntro = function () {
  if (!radio) return;
  clearTimeout(radioTimer);
  const lines = [];
  while (newsQueue.length && lines.length < 2) lines.push('[Notícia] ' + newsQueue.shift());
  while (lines.length < 2) lines.push(pick(RADIO_LINES));
  let k = 0;
  const next = () => {
    if (!P.veh || !radio || st !== 'play' || k >= lines.length) return;
    toast(lines[k++]);
    radioTimer = setTimeout(next, 4500);
  };
  next();
};