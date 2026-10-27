const keys = {}, mouse = { x: 0, y: 0, down: false };

addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (!e.repeat && typeof onKey === 'function') onKey(e.code);
});
addEventListener('keyup', e => keys[e.code] = false);
addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouse.down = false; });
addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
addEventListener('mousedown', () => { mouse.down = true; if (st === 'menu') start(); });
addEventListener('mouseup', () => mouse.down = false);