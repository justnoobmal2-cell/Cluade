// Game skeleton: window, tile map, camera, player movement. No game systems yet.

const MAP_SIZE = 800;        // tiles per side
const TILE = 16;             // pixels per tile at zoom 1
const PLAYER_SPEED = 4.5;    // tiles/sec -> ~3 min edge to edge

const TILES = [
  { name: 'water', color: '#2f6f9f' },
  { name: 'sand',  color: '#d9c98a' },
  { name: 'grass', color: '#6aa84f' },
  { name: 'forest', color: '#3d7a3a' },
  { name: 'stone', color: '#8a8f98' },
];

// ---------- map ----------
const map = new Uint8Array(MAP_SIZE * MAP_SIZE);

function hash(x, y, seed) {
  let h = (x * 374761393 + y * 668265263 + seed * 144665) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function valueNoise(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const fx = x - xi, fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash(xi, yi, seed), b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed), d = hash(xi + 1, yi + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function generateMap(seed) {
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const h = valueNoise(x / 96, y / 96, seed) * 0.6
              + valueNoise(x / 32, y / 32, seed + 1) * 0.3
              + valueNoise(x / 8, y / 8, seed + 2) * 0.1;
      const m = valueNoise(x / 48, y / 48, seed + 3);
      let t;
      if (h < 0.40) t = 0;
      else if (h < 0.44) t = 1;
      else if (h > 0.68) t = 4;
      else t = m > 0.55 ? 3 : 2;
      map[y * MAP_SIZE + x] = t;
    }
  }
}

// ---------- state ----------
const player = { x: MAP_SIZE / 2, y: MAP_SIZE / 2 };
const camera = { x: player.x, y: player.y, zoom: 2 };
const keys = new Set();

// ---------- input ----------
addEventListener('keydown', (e) => keys.add(e.code));
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
addEventListener('wheel', (e) => {
  camera.zoom = Math.min(4, Math.max(0.25, camera.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
}, { passive: true });

// ---------- loop ----------
const canvas = document.getElementById('view');
const ctx = canvas.getContext('2d');
const hud = document.getElementById('hud');

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
addEventListener('resize', resize);

function update(dt) {
  let dx = 0, dy = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;
  if (dx || dy) {
    const len = Math.hypot(dx, dy);
    player.x = Math.min(MAP_SIZE - 0.5, Math.max(0.5, player.x + (dx / len) * PLAYER_SPEED * dt));
    player.y = Math.min(MAP_SIZE - 0.5, Math.max(0.5, player.y + (dy / len) * PLAYER_SPEED * dt));
  }
  camera.x = player.x;
  camera.y = player.y;
}

function render() {
  const s = TILE * camera.zoom;
  const w = canvas.width, h = canvas.height;
  const left = camera.x - w / 2 / s, top = camera.y - h / 2 / s;

  ctx.fillStyle = '#0d1014';
  ctx.fillRect(0, 0, w, h);

  const x0 = Math.max(0, Math.floor(left)), y0 = Math.max(0, Math.floor(top));
  const x1 = Math.min(MAP_SIZE - 1, Math.floor(left + w / s));
  const y1 = Math.min(MAP_SIZE - 1, Math.floor(top + h / s));
  const size = Math.ceil(s);

  for (let y = y0; y <= y1; y++) {
    const py = Math.floor((y - top) * s);
    for (let x = x0; x <= x1; x++) {
      ctx.fillStyle = TILES[map[y * MAP_SIZE + x]].color;
      ctx.fillRect(Math.floor((x - left) * s), py, size, size);
    }
  }

  const px = (player.x - left) * s, py = (player.y - top) * s;
  ctx.fillStyle = '#f2f2f2';
  ctx.fillRect(px - s * 0.35, py - s * 0.35, s * 0.7, s * 0.7);
  ctx.strokeStyle = '#14181d';
  ctx.lineWidth = Math.max(1, s * 0.08);
  ctx.strokeRect(px - s * 0.35, py - s * 0.35, s * 0.7, s * 0.7);

  const tile = TILES[map[Math.floor(player.y) * MAP_SIZE + Math.floor(player.x)]];
  hud.textContent =
    `pos  ${player.x.toFixed(1)}, ${player.y.toFixed(1)}  (${tile.name})\n` +
    `zoom ${camera.zoom.toFixed(2)}   map ${MAP_SIZE}x${MAP_SIZE}\n` +
    `WASD move / wheel zoom`;
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

generateMap(1337);
resize();
requestAnimationFrame(frame);
