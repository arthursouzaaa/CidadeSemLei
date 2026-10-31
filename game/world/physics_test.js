// ===== TESTE DE FÍSICA (Matter.js), tecla Ctrl+B =====
// Simulação isolada: uma caixa de teste com um carro (retângulo) que bate numa parede.
// Não altera a física do jogo; serve para ver o Matter rodando.
let phys = null, physOn = false, physCar = null;

function physStart() {
  if (!Matter_) { toast('Matter.js não carregou.'); return; }
  const { Engine, Bodies, World } = Matter_;
  phys = { engine: Engine.create(), t: 0 };
  phys.engine.gravity.y = 0; // vista de cima: sem gravidade
  const wallL = Bodies.rectangle(180, 260, 20, 320, { isStatic: true });
  const wallR = Bodies.rectangle(520, 260, 20, 320, { isStatic: true });
  const wallT = Bodies.rectangle(350, 100, 360, 20, { isStatic: true });
  const wallB = Bodies.rectangle(350, 420, 360, 20, { isStatic: true });
  physCar = Bodies.rectangle(350, 300, 44, 22, { frictionAir: .02, restitution: .4 });
  World.add(phys.engine.world, [wallL, wallR, wallT, wallB, physCar]);
  Matter_.Body.setVelocity(physCar, { x: 6, y: -2 });
  physOn = true;
}

function physStep() {
  if (!physOn) return;
  Matter_.Engine.update(phys.engine, 1000 / 60);
  if (physCar.speed < .5) Matter_.Body.setVelocity(physCar, { x: 6, y: 0 }); // empurra de volta quando para
}

function drawPhysics() {
  if (!physOn) return;
  const b = Matter_.Composite.allBodies(phys.engine.world);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(0,0,10,.8)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(W / 2 - 350, H / 2 - 260);
  for (const body of b) {
    const v = body.vertices;
    ctx.fillStyle = body.isStatic ? '#64748b' : '#38bdf8';
    ctx.beginPath(); ctx.moveTo(v[0].x, v[0].y);
    for (let i = 1; i < v.length; i++) ctx.lineTo(v[i].x, v[i].y);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  label('FÍSICA DE TESTE (Matter.js)  •  Ctrl+B para fechar', W / 2, 40, 18, '#facc15', 'center');
}

addEventListener('keydown', e => {
  if (e.ctrlKey && e.code === 'KeyB') {
    e.preventDefault();
    if (physOn) { physOn = false; return; }
    physStart();
  }
});

// Atualização e desenho da simulação, por quadro
const _updPhys = update;
update = function (dt) {
  _updPhys(dt);
  physStep();
};