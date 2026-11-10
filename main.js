// Game skeleton: full-screen view, tile map, camera, player movement, minimap.
// No game systems yet.

const MAP_SIZE = 1600;       // tiles per side
const TILE = 16;             // CSS pixels per tile at zoom 1
const PLAYER_SPEED = 9;      // tiles/sec -> ~3 min edge to edge
const ZOOM_MIN = 0.5, ZOOM_MAX = 4;
const MINI = 200;            // minimap resolution in pixels

const TILES = [
  { name: '바다', color: '#2f6f9f' },
  { name: '해변', color: '#d9c98a' },
  { name: '초원', color: '#6aa84f' },
  { name: '숲',   color: '#3d7a3a' },
  { name: '산',   color: '#8a8f98' },
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
      const h = valueNoise(x / 256, y / 256, seed) * 0.45
              + valueNoise(x / 96, y / 96, seed + 1) * 0.3
              + valueNoise(x / 32, y / 32, seed + 2) * 0.17
              + valueNoise(x / 8, y / 8, seed + 3) * 0.08;
      const m = valueNoise(x / 64, y / 64, seed + 4);
      let t;
      if (h < 0.42) t = 0;
      else if (h < 0.45) t = 1;
      else if (h > 0.66) t = 4;
      else t = m > 0.55 ? 3 : 2;
      map[y * MAP_SIZE + x] = t;
    }
  }
}

function tileAt(x, y) {
  return map[Math.floor(y) * MAP_SIZE + Math.floor(x)];
}

// Nearest non-water tile to the map center, searched in growing square rings.
function findSpawn() {
  const c = MAP_SIZE >> 1;
  for (let r = 0; r < c; r++) {
    for (let d = -r; d <= r; d++) {
      const ring = [[c + d, c - r], [c + d, c + r], [c - r, c + d], [c + r, c + d]];
      for (const [x, y] of ring) if (map[y * MAP_SIZE + x] > 1) return { x: x + 0.5, y: y + 0.5 };
    }
  }
  return { x: c, y: c };
}

// ---------- state ----------
const player = { x: MAP_SIZE / 2, y: MAP_SIZE / 2 };
const camera = { x: player.x, y: player.y, zoom: 2 };
const keys = new Set();
let stick = null;            // { id, ox, oy, dx, dy } virtual joystick, dx/dy in -1..1
const STICK_RADIUS = 56;

// ---------- input ----------
const canvas = document.getElementById('view');
const ctx = canvas.getContext('2d');

function setZoom(z) {
  camera.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
}

addEventListener('keydown', (e) => keys.add(e.code));
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
addEventListener('wheel', (e) => setZoom(camera.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15)), { passive: true });
addEventListener('contextmenu', (e) => e.preventDefault());

const pointers = new Map();
let pinch = null;            // { dist, zoom }

function pinchDistance() {
  const [a, b] = [...pointers.values()];
  return Math.hypot(a.x - b.x, a.y - b.y) || 1;
}

canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) {
    stick = { id: e.pointerId, ox: e.clientX, oy: e.clientY, dx: 0, dy: 0 };
  } else if (pointers.size === 2) {
    stick = null;
    pinch = { dist: pinchDistance(), zoom: camera.zoom };
  }
});

canvas.addEventListener('pointermove', (e) => {
  const p = pointers.get(e.pointerId);
  if (!p) return;
  p.x = e.clientX; p.y = e.clientY;
  if (pinch && pointers.size >= 2) {
    setZoom(pinch.zoom * pinchDistance() / pinch.dist);
  } else if (stick && stick.id === e.pointerId) {
    let dx = (p.x - stick.ox) / STICK_RADIUS, dy = (p.y - stick.oy) / STICK_RADIUS;
    const len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; }
    stick.dx = dx; stick.dy = dy;
  }
});

function pointerEnd(e) {
  pointers.delete(e.pointerId);
  if (stick && stick.id === e.pointerId) stick = null;
  if (pointers.size < 2) pinch = null;
}
canvas.addEventListener('pointerup', pointerEnd);
canvas.addEventListener('pointercancel', pointerEnd);

document.getElementById('full').addEventListener('click', () => {
  const el = document.documentElement;
  if (document.fullscreenElement) document.exitFullscreen();
  else if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
});

// ---------- view ----------
let viewW = 0, viewH = 0, dpr = 1;

function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  viewW = window.innerWidth;
  viewH = window.innerHeight;
  canvas.width = Math.round(viewW * dpr);
  canvas.height = Math.round(viewH * dpr);
}
addEventListener('resize', resize);
addEventListener('orientationchange', resize);

// ---------- minimap ----------
const mini = document.getElementById('mini');
const miniCtx = mini.getContext('2d');
const miniBase = document.createElement('canvas');
miniBase.width = miniBase.height = MINI;

function buildMinimap() {
  const g = miniBase.getContext('2d');
  const img = g.createImageData(MINI, MINI);
  const rgb = TILES.map((t) => [1, 3, 5].map((i) => parseInt(t.color.slice(i, i + 2), 16)));
  const step = MAP_SIZE / MINI;
  for (let y = 0; y < MINI; y++) {
    for (let x = 0; x < MINI; x++) {
      const c = rgb[tileAt((x + 0.5) * step, (y + 0.5) * step)];
      const i = (y * MINI + x) * 4;
      img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
}

function renderMinimap() {
  const k = MINI / MAP_SIZE, s = TILE * camera.zoom;
  miniCtx.drawImage(miniBase, 0, 0);
  miniCtx.strokeStyle = 'rgba(255,255,255,.85)';
  miniCtx.lineWidth = 1;
  miniCtx.strokeRect(
    (camera.x - viewW / 2 / s) * k, (camera.y - viewH / 2 / s) * k,
    Math.max(2, viewW / s * k), Math.max(2, viewH / s * k));
  miniCtx.fillStyle = '#ff4d4d';
  miniCtx.fillRect(player.x * k - 2.5, player.y * k - 2.5, 5, 5);
  miniCtx.strokeStyle = '#fff';
  miniCtx.strokeRect(player.x * k - 2.5, player.y * k - 2.5, 5, 5);
}

// ---------- loop ----------
const biomeEl = document.getElementById('biome');
const coordsEl = document.getElementById('coords');

function update(dt) {
  let dx = 0, dy = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;
  if (dx || dy) {
    const len = Math.hypot(dx, dy);
    dx /= len; dy /= len;
  } else if (stick) {
    dx = stick.dx; dy = stick.dy;
  }
  if (dx || dy) {
    player.x = Math.min(MAP_SIZE - 0.5, Math.max(0.5, player.x + dx * PLAYER_SPEED * dt));
    player.y = Math.min(MAP_SIZE - 0.5, Math.max(0.5, player.y + dy * PLAYER_SPEED * dt));
  }
  camera.x = player.x;
  camera.y = player.y;
}

function render() {
  const s = TILE * camera.zoom;
  const left = camera.x - viewW / 2 / s, top = camera.y - viewH / 2 / s;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#0d1014';
  ctx.fillRect(0, 0, viewW, viewH);

  const x0 = Math.max(0, Math.floor(left)), y0 = Math.max(0, Math.floor(top));
  const x1 = Math.min(MAP_SIZE - 1, Math.floor(left + viewW / s));
  const y1 = Math.min(MAP_SIZE - 1, Math.floor(top + viewH / s));
  const size = Math.ceil(s) + 1;

  for (let y = y0; y <= y1; y++) {
    const py = Math.floor((y - top) * s);
    const row = y * MAP_SIZE;
    for (let x = x0; x <= x1; x++) {
      ctx.fillStyle = TILES[map[row + x]].color;
      ctx.fillRect(Math.floor((x - left) * s), py, size, size);
    }
  }

  const px = (player.x - left) * s, py = (player.y - top) * s;
  ctx.fillStyle = '#f2f2f2';
  ctx.fillRect(px - s * 0.35, py - s * 0.35, s * 0.7, s * 0.7);
  ctx.strokeStyle = '#14181d';
  ctx.lineWidth = Math.max(1, s * 0.08);
  ctx.strokeRect(px - s * 0.35, py - s * 0.35, s * 0.7, s * 0.7);

  if (stick) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,.45)';
    ctx.fillStyle = 'rgba(255,255,255,.12)';
    ctx.beginPath();
    ctx.arc(stick.ox, stick.oy, STICK_RADIUS, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.beginPath();
    ctx.arc(stick.ox + stick.dx * STICK_RADIUS, stick.oy + stick.dy * STICK_RADIUS, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  renderMinimap();
  biomeEl.textContent = TILES[tileAt(player.x, player.y)].name;
  coordsEl.textContent = `X ${Math.floor(player.x)} · Y ${Math.floor(player.y)}`;
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
Object.assign(player, findSpawn());
buildMinimap();
resize();
if (Math.min(viewW, viewH) < 600) camera.zoom = 1.25;   // show more of the map on phones
requestAnimationFrame(frame);
