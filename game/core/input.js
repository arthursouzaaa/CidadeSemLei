const keys = {}, mouse = { x: 0, y: 0, down: false, clicked: false };

addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (!e.repeat && typeof onKey === 'function') onKey(e.code);
});

addEventListener('keyup', e => keys[e.code] = false);

addEventListener('blur', () => { 
  for (const k in keys) keys[k] = false; 
  mouse.down = false; 
  mouse.clicked = false;
});

addEventListener('mousemove', e => { 
  mouse.x = e.clientX; 
  mouse.y = e.clientY; 
});

addEventListener('mousedown', (e) => { 
  if (e.button === 0) { // Apenas botão esquerdo
    mouse.down = true; 
    mouse.clicked = true; // PULSO DE CLIQUE: as UIs vão consumir e voltar pra false
    if (typeof st !== 'undefined' && st === 'menu') start(); 
  }
});

addEventListener('mouseup', (e) => { 
  if (e.button === 0) mouse.down = false; 
});