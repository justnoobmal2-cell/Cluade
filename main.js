// Game skeleton: full-screen view, flat tile map, trees, camera, player
// movement, boat visuals on water, zoomable minimap. No game systems yet.

const MAP_SIZE = 1600;       // tiles per side
const TILE = 16;             // sprite pixels per tile
const PLAYER_SPEED = 9;      // tiles/sec -> ~3 min edge to edge
const ZOOM_MIN = 0.5, ZOOM_MAX = 8, ZOOM_DEFAULT = 4;   // CSS px per sprite px
const MINI = 400;            // minimap canvas resolution
const MAP_ZOOM_MAX = 16;

const BIOMES = [
  { name: '바다', color: '#2f6f9f' },
  { name: '해변', color: '#d9c98a' },
  { name: '초원', color: '#6aa84f' },
  { name: '숲',   color: '#3d7a3a' },
  { name: '산',   color: '#8a8f98' },
];
const WATER = 0;

// ---------- helpers ----------
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

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

// Build a sprite by asking `fn` for the color of every pixel (null = transparent).
function paint(w, h, fn) {
  const c = makeCanvas(w, h), g = c.getContext('2d');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const col = fn(x, y);
      if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
    }
  }
  return c;
}

// ---------- sprites ----------
// Tree seen from above: a blocky canopy that fits inside one tile, with a drop shadow.
const treeTex = paint(TILE, TILE, (x, y) => {
  const block = (x0, y0, size, cut) => {
    const u = x - x0, v = y - y0;
    if (u < 0 || v < 0 || u >= size || v >= size) return false;
    const eu = Math.min(u, size - 1 - u), ev = Math.min(v, size - 1 - v);
    return eu + ev >= cut;                              // trim the corners
  };
  if (block(4, 3, 4, 1)) return '#7cc76a';
  if (block(2, 1, 9, 2)) return '#3f8f3c';
  if (block(1, 1, 13, 3)) return '#245226';
  if (block(3, 3, 13, 3)) return 'rgba(0,0,0,.25)';
  return null;
});

const BOAT_L = 26, BOAT_W = 14;

function boatPixel(x, y) {           // boat facing right
  const hull = (px, py) => {
    if (px < 0 || px >= BOAT_L) return false;
    const hw = px < 2 ? 4.5 : px <= 15 ? 6 : 6 * (1 - Math.pow((px - 15) / 11, 2));
    return Math.abs(py - 6.5) <= hw;
  };
  if (!hull(x, y)) return null;
  const near = (d) => hull(x - d, y) && hull(x + d, y) && hull(x, y - d) && hull(x, y + d);
  if (!near(1)) return '#3f2510';
  if (!near(2)) return '#7a4a22';
  return (x % 4 === 1) ? '#9a6a3a' : '#b07a45';
}
// 0 right, 1 down, 2 left, 3 up
const boatTex = [
  paint(BOAT_L, BOAT_W, (x, y) => boatPixel(x, y)),
  paint(BOAT_W, BOAT_L, (x, y) => boatPixel(y, x)),
  paint(BOAT_L, BOAT_W, (x, y) => boatPixel(BOAT_L - 1 - x, y)),
  paint(BOAT_W, BOAT_L, (x, y) => boatPixel(BOAT_L - 1 - y, x)),
];

// ---------- map ----------
const map = new Uint8Array(MAP_SIZE * MAP_SIZE);     // biome id per tile
const deco = new Uint8Array(MAP_SIZE * MAP_SIZE);    // 0 none, 1 tree

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
      const i = y * MAP_SIZE + x;
      map[i] = t;
      // Trees only grow on a staggered grid so they never touch, and forests are
      // broken into groves with clearings between them.
      let density = 0;
      if ((y & 1) === 0 && ((x + ((y >> 1) & 1)) & 1) === 0) {
        if (t === 3) density = valueNoise(x / 10, y / 10, seed + 8) > 0.42 ? 0.55 : 0.06;
        else if (t === 2) density = 0.02;
      }
      deco[i] = hash(x, y, seed + 9) < density ? 1 : 0;
    }
  }
}

function tileAt(x, y) {
  return map[Math.floor(y) * MAP_SIZE + Math.floor(x)];
}

// Nearest open land tile to the map center, searched in growing square rings.
function findSpawn() {
  const c = MAP_SIZE >> 1;
  for (let r = 0; r < c; r++) {
    for (let d = -r; d <= r; d++) {
      const ring = [[c + d, c - r], [c + d, c + r], [c - r, c + d], [c + r, c + d]];
      for (const [x, y] of ring) {
        const i = y * MAP_SIZE + x;
        if (map[i] > 1 && !deco[i]) return { x: x + 0.5, y: y + 0.5 };
      }
    }
  }
  return { x: c, y: c };
}

// ---------- state ----------
const player = { x: MAP_SIZE / 2, y: MAP_SIZE / 2, angle: Math.PI / 2, moving: false, onWater: false };
const camera = { x: player.x, y: player.y, zoom: ZOOM_DEFAULT };
const keys = new Set();
let stick = null;            // { id, ox, oy, dx, dy } virtual joystick, dx/dy in -1..1
const STICK_RADIUS = 56;
const wake = [];             // { x, y, age } ripples left behind the boat
const WAKE_LIFE = 0.9;
let wakeTimer = 0, clock = 0;

// ---------- view ----------
const canvas = document.getElementById('view');
const ctx = canvas.getContext('2d');
let dpr = 1;

function resize() {
  dpr = Math.min(3, window.devicePixelRatio || 1);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
}
addEventListener('resize', resize);
addEventListener('orientationchange', resize);

// Device pixels per sprite pixel. Always an integer so pixel art stays crisp.
function pixelScale() {
  return Math.max(1, Math.round(camera.zoom * dpr));
}

function setZoom(z) {
  camera.zoom = clamp(z, ZOOM_MIN, ZOOM_MAX);
}

function stepZoom(dir) {
  setZoom((pixelScale() + dir) / dpr);
}

// ---------- input ----------
addEventListener('keydown', (e) => keys.add(e.code));
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
addEventListener('contextmenu', (e) => e.preventDefault());
addEventListener('wheel', (e) => {
  if (e.target === mini) return;
  setZoom(camera.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
}, { passive: true });

const pointers = new Map();
let pinch = null;            // { dist, zoom }

function spread(m) {
  const [a, b] = [...m.values()];
  return Math.hypot(a.x - b.x, a.y - b.y) || 1;
}

canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) {
    stick = { id: e.pointerId, ox: e.clientX, oy: e.clientY, dx: 0, dy: 0 };
  } else if (pointers.size === 2) {
    stick = null;
    pinch = { dist: spread(pointers), zoom: camera.zoom };
  }
});

canvas.addEventListener('pointermove', (e) => {
  const p = pointers.get(e.pointerId);
  if (!p) return;
  p.x = e.clientX; p.y = e.clientY;
  if (pinch && pointers.size >= 2) {
    setZoom(pinch.zoom * spread(pointers) / pinch.dist);
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

// Buttons act on press so they respond instantly and never lose a tap to a gesture.
function onPress(id, fn) {
  document.getElementById(id).addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); fn(); });
}
onPress('zin', () => stepZoom(1));
onPress('zout', () => stepZoom(-1));
document.getElementById('full').addEventListener('click', () => {
  const el = document.documentElement;
  if (document.fullscreenElement) document.exitFullscreen();
  else if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
});

// ---------- minimap ----------
// Small: follows the player. Big (tap to open): drag to pan, pinch/wheel/buttons to zoom.
const mini = document.getElementById('mini');
const miniCtx = mini.getContext('2d');
const mapImg = makeCanvas(MAP_SIZE, MAP_SIZE);       // one pixel per tile
const mapView = { zoom: 1, cx: MAP_SIZE / 2, cy: MAP_SIZE / 2 };
const mapPointers = new Map();
let mapPinch = null;

function buildMapImage() {
  const g = mapImg.getContext('2d');
  const img = g.createImageData(MAP_SIZE, MAP_SIZE);
  const rgb = BIOMES.map((t) => [1, 3, 5].map((i) => parseInt(t.color.slice(i, i + 2), 16)));
  for (let i = 0; i < map.length; i++) {
    const c = rgb[map[i]], o = i * 4;
    img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
}

const mapIsBig = () => mini.classList.contains('big');

function clampMapView() {
  const half = MAP_SIZE / mapView.zoom / 2;
  mapView.cx = clamp(mapView.cx, half, MAP_SIZE - half);
  mapView.cy = clamp(mapView.cy, half, MAP_SIZE - half);
}

function setMapZoom(z) {
  mapView.zoom = clamp(z, 1, MAP_ZOOM_MAX);
}

function openMap(open) {
  mini.classList.toggle('big', open);
  document.body.classList.toggle('mapopen', open);
  mapPointers.clear();
  mapPinch = null;
  if (open) { mapView.cx = player.x; mapView.cy = player.y; }
}

// Source rectangle of the map currently shown, in tiles.
function mapRect() {
  const sw = MAP_SIZE / mapView.zoom;
  const cx = mapIsBig() ? mapView.cx : player.x, cy = mapIsBig() ? mapView.cy : player.y;
  return { sx: clamp(cx - sw / 2, 0, MAP_SIZE - sw), sy: clamp(cy - sw / 2, 0, MAP_SIZE - sw), sw };
}

function renderMinimap() {
  const { sx, sy, sw } = mapRect();
  const k = MINI / sw, t = TILE * pixelScale();
  miniCtx.imageSmoothingEnabled = false;
  miniCtx.drawImage(mapImg, sx, sy, sw, sw, 0, 0, MINI, MINI);
  miniCtx.strokeStyle = '#ffffff';
  miniCtx.lineWidth = 2;
  miniCtx.strokeRect(
    Math.round((camera.x - canvas.width / 2 / t - sx) * k), Math.round((camera.y - canvas.height / 2 / t - sy) * k),
    Math.max(4, canvas.width / t * k), Math.max(4, canvas.height / t * k));
  const mx = Math.round((player.x - sx) * k), my = Math.round((player.y - sy) * k);
  miniCtx.fillStyle = '#000';
  miniCtx.fillRect(mx - 7, my - 7, 14, 14);
  miniCtx.fillStyle = '#ffd400';
  miniCtx.fillRect(mx - 5, my - 5, 10, 10);
  miniCtx.fillStyle = '#f2f2f2';
  miniCtx.fillRect(mx - 3, my - 3, 6, 6);
}

mini.addEventListener('pointerdown', (e) => {
  if (!mapIsBig()) { openMap(true); return; }
  mini.setPointerCapture(e.pointerId);
  mapPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (mapPointers.size === 2) mapPinch = { dist: spread(mapPointers), zoom: mapView.zoom };
});

mini.addEventListener('pointermove', (e) => {
  const p = mapPointers.get(e.pointerId);
  if (!p) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y;
  p.x = e.clientX; p.y = e.clientY;
  if (mapPinch && mapPointers.size >= 2) {
    setMapZoom(mapPinch.zoom * spread(mapPointers) / mapPinch.dist);
  } else if (mapPointers.size === 1) {
    const tilesPerPx = MAP_SIZE / mapView.zoom / mini.getBoundingClientRect().width;
    clampMapView();
    mapView.cx -= dx * tilesPerPx;
    mapView.cy -= dy * tilesPerPx;
    clampMapView();
  }
});

function mapPointerEnd(e) {
  mapPointers.delete(e.pointerId);
  if (mapPointers.size < 2) mapPinch = null;
}
mini.addEventListener('pointerup', mapPointerEnd);
mini.addEventListener('pointercancel', mapPointerEnd);
mini.addEventListener('wheel', (e) => setMapZoom(mapView.zoom * (e.deltaY < 0 ? 1.25 : 0.8)), { passive: true });

onPress('mapin', () => setMapZoom(mapView.zoom * 2));
onPress('mapout', () => setMapZoom(mapView.zoom / 2));
onPress('mapclose', () => openMap(false));

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
    player.x = clamp(player.x + dx * PLAYER_SPEED * dt, 0.5, MAP_SIZE - 0.5);
    player.y = clamp(player.y + dy * PLAYER_SPEED * dt, 0.5, MAP_SIZE - 0.5);
  }
  player.moving = !!(dx || dy);
  if (player.moving) player.angle = Math.atan2(dy, dx);
  player.onWater = tileAt(player.x, player.y) === WATER;

  clock += dt;
  for (const w of wake) w.age += dt;
  while (wake.length && wake[0].age > WAKE_LIFE) wake.shift();
  wakeTimer -= dt;
  if (player.onWater && player.moving && wakeTimer <= 0) {
    wake.push({ x: player.x - Math.cos(player.angle) * 0.7, y: player.y - Math.sin(player.angle) * 0.7, age: 0 });
    wakeTimer = 0.12;
  }

  camera.x = player.x;
  camera.y = player.y;
}

// Facing as one of four directions: 0 right, 1 down, 2 left, 3 up.
function facing() {
  const c = Math.cos(player.angle), s = Math.sin(player.angle);
  return Math.abs(c) >= Math.abs(s) ? (c >= 0 ? 0 : 2) : (s >= 0 ? 1 : 3);
}

function drawWake(ox, oy, t, p) {
  for (const w of wake) {
    const a = 1 - w.age / WAKE_LIFE;
    const half = (2 + Math.floor(w.age * 9)) * p;
    const x = ox + Math.round(w.x * t), y = oy + Math.round(w.y * t);
    ctx.fillStyle = a > 0.66 ? '#d8ecf8' : a > 0.33 ? '#8fbfe0' : '#5b9bc8';
    ctx.fillRect(x - half, y - half, half * 2, p);
    ctx.fillRect(x - half, y + half - p, half * 2, p);
    ctx.fillRect(x - half, y - half, p, half * 2);
    ctx.fillRect(x + half - p, y - half, p, half * 2);
  }
}

function drawPlayer(ox, oy, t, p) {
  let px = ox + Math.round(player.x * t), py = oy + Math.round(player.y * t);
  if (player.onWater) {
    drawWake(ox, oy, t, p);
    py += Math.round(Math.sin(clock * 3)) * p;            // bob one sprite pixel up/down
    const img = boatTex[facing()];
    ctx.drawImage(img, px - (img.width >> 1) * p, py - (img.height >> 1) * p, img.width * p, img.height * p);
  }
  ctx.fillStyle = '#ffd400';
  ctx.fillRect(px - 6 * p, py - 6 * p, 12 * p, 12 * p);
  ctx.fillStyle = '#f2f2f2';
  ctx.fillRect(px - 4 * p, py - 4 * p, 8 * p, 8 * p);
}

function drawStick() {
  const r = STICK_RADIUS * dpr, cx = stick.ox * dpr, cy = stick.oy * dpr;
  ctx.lineWidth = 2 * dpr;
  ctx.strokeStyle = 'rgba(255,255,255,.45)';
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.6)';
  ctx.beginPath();
  ctx.arc(cx + stick.dx * r, cy + stick.dy * r, 22 * dpr, 0, Math.PI * 2);
  ctx.fill();
}

function render() {
  const p = pixelScale(), t = TILE * p;
  const W = canvas.width, H = canvas.height;
  const ox = Math.round(W / 2 - camera.x * t), oy = Math.round(H / 2 - camera.y * t);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#0d1014';
  ctx.fillRect(0, 0, W, H);

  const x0 = Math.max(0, Math.floor(-ox / t)), y0 = Math.max(0, Math.floor(-oy / t));
  const x1 = Math.min(MAP_SIZE - 1, Math.floor((W - ox) / t));
  const y1 = Math.min(MAP_SIZE - 1, Math.floor((H - oy) / t));

  // Flat tiles; runs of the same biome in a row are drawn as one rectangle.
  for (let y = y0; y <= y1; y++) {
    const row = y * MAP_SIZE;
    let start = x0, type = map[row + x0];
    for (let x = x0 + 1; x <= x1 + 1; x++) {
      const next = x <= x1 ? map[row + x] : -1;
      if (next === type) continue;
      ctx.fillStyle = BIOMES[type].color;
      ctx.fillRect(ox + start * t, oy + y * t, (x - start) * t, t);
      start = x; type = next;
    }
  }

  // The player walks under the canopies; trees right around the player turn
  // see-through so the player stays visible.
  drawPlayer(ox, oy, t, p);
  const prow = Math.floor(player.y), pcol = Math.floor(player.x);
  for (let y = y0; y <= y1; y++) {
    const row = y * MAP_SIZE;
    for (let x = x0; x <= x1; x++) {
      if (!deco[row + x]) continue;
      const hide = Math.abs(y - prow) <= 1 && Math.abs(x - pcol) <= 1;
      if (hide) ctx.globalAlpha = 0.35;
      ctx.drawImage(treeTex, ox + x * t, oy + y * t, t, t);
      if (hide) ctx.globalAlpha = 1;
    }
  }

  if (stick) drawStick();

  renderMinimap();
  biomeEl.textContent = BIOMES[tileAt(player.x, player.y)].name;
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
buildMapImage();
resize();
requestAnimationFrame(frame);
