'use strict';

// baseDrops: 행운 0 기준 시간당 예상 드롭 수 (중급 설정 기준)
const CATEGORIES = {
  farming: {
    label: '농사 행운 (Farming Fortune)',
    maxFortune: 800,
    items: [
      { id: 'SUGAR_CANE',         alt: [],                     name: '사탕수수',       icon: '🌿', baseDrops: 15000 },
      { id: 'CACTUS',             alt: [],                     name: '선인장',         icon: '🌵', baseDrops: 10000 },
      { id: 'COCOA_BEANS',        alt: [],                     name: '코코아 콩',      icon: '🟫', baseDrops: 8000  },
      { id: 'WHEAT',              alt: [],                     name: '밀',             icon: '🌾', baseDrops: 7000  },
      { id: 'CARROT_ITEM',        alt: ['CARROT'],             name: '당근',           icon: '🥕', baseDrops: 7000  },
      { id: 'POTATO_ITEM',        alt: ['POTATO'],             name: '감자',           icon: '🥔', baseDrops: 7000  },
      { id: 'PUMPKIN',            alt: [],                     name: '호박',           icon: '🎃', baseDrops: 1500  },
      { id: 'MELON',              alt: [],                     name: '수박',           icon: '🍉', baseDrops: 12000 },
      { id: 'MUSHROOM_COLLECTION',alt: ['RED_MUSHROOM'],       name: '빨간 버섯',      icon: '🍄', baseDrops: 3000  },
      { id: 'NETHER_STALK',       alt: ['NETHER_WART'],        name: '네더 사마귀',    icon: '🟢', baseDrops: 10000 },
    ]
  },
  mining: {
    label: '광질 행운 (Mining Fortune)',
    maxFortune: 500,
    items: [
      { id: 'MITHRIL_ORE',   alt: [],            name: '미스릴 광석',   icon: '💠', baseDrops: 700   },
      { id: 'TITANIUM_ORE',  alt: [],            name: '티타늄 광석',   icon: '🔩', baseDrops: 80    },
      { id: 'HARD_STONE',    alt: [],            name: '단단한 돌',     icon: '🪨', baseDrops: 30000 },
      { id: 'DIAMOND',       alt: [],            name: '다이아몬드',    icon: '💎', baseDrops: 800   },
      { id: 'EMERALD',       alt: [],            name: '에메랄드',      icon: '💚', baseDrops: 700   },
      { id: 'GOLD_INGOT',    alt: [],            name: '금 주괴',       icon: '🟡', baseDrops: 1000  },
      { id: 'IRON_INGOT',    alt: [],            name: '철 주괴',       icon: '⚙️', baseDrops: 2000  },
      { id: 'QUARTZ',        alt: [],            name: '석영',          icon: '🔷', baseDrops: 4000  },
      { id: 'REDSTONE',      alt: [],            name: '레드스톤',      icon: '🔴', baseDrops: 6000  },
      { id: 'LAPIS_LAZULI',  alt: [],            name: '청금석',        icon: '🔵', baseDrops: 5000  },
      { id: 'COAL',          alt: [],            name: '석탄',          icon: '⬛', baseDrops: 3000  },
      { id: 'SULPHUR',       alt: [],            name: '황 (크림슨)',   icon: '🌕', baseDrops: 2000  },
      { id: 'OBSIDIAN',      alt: [],            name: '흑요석',        icon: '🟣', baseDrops: 500   },
    ]
  },
  logging: {
    label: '채집 행운 (Foraging Fortune)',
    maxFortune: 500,
    items: [
      { id: 'JUNGLE_LOG',    alt: ['LOG:3'],     name: '정글나무',      icon: '🪵', baseDrops: 15000 },
      { id: 'OAK_LOG',       alt: ['LOG'],       name: '참나무',        icon: '🪵', baseDrops: 12000 },
      { id: 'BIRCH_LOG',     alt: ['LOG:2'],     name: '자작나무',      icon: '🪵', baseDrops: 12000 },
      { id: 'SPRUCE_LOG',    alt: ['LOG:1'],     name: '가문비나무',    icon: '🪵', baseDrops: 10000 },
      { id: 'DARK_OAK_LOG',  alt: ['LOG_2:1'],   name: '짙은 참나무',  icon: '🪵', baseDrops: 10000 },
      { id: 'ACACIA_LOG',    alt: ['LOG_2'],     name: '아카시아',      icon: '🪵', baseDrops: 9000  },
    ]
  }
};

let currentTab = 'farming';
let fortuneValues = { farming: 0, mining: 0, logging: 0 };
let bazaarData = null;
let apiKey = localStorage.getItem('hypixel_api_key') || '';

function openKeyModal() {
  document.getElementById('keyModal').classList.remove('hidden');
  document.getElementById('keyInput').value = apiKey;
  document.getElementById('keyStatus').textContent = '';
}

function saveKey() {
  const val = document.getElementById('keyInput').value.trim();
  if (!val) {
    document.getElementById('keyStatus').textContent = '⚠️ 키를 입력해주세요.';
    return;
  }
  apiKey = val;
  localStorage.setItem('hypixel_api_key', val);
  document.getElementById('keyModal').classList.add('hidden');
  updateKeyBadge();
  refreshData();
}

function updateKeyBadge() {
  const badge = document.getElementById('keyBadge');
  if (apiKey) {
    badge.textContent = '🔑 API 키 설정됨';
    badge.classList.add('set');
  } else {
    badge.textContent = '🔑 API 키 없음';
    badge.classList.remove('set');
  }
}

function findPrice(item, products) {
  if (!products) return null;
  for (const id of [item.id, ...item.alt]) {
    const p = products[id];
    if (!p) continue;
    // v2 API: p.sellPrice / p.buyPrice
    // v1 API: p.quick_status.sellPrice
    const price = p.sellPrice ?? p.quick_status?.sellPrice;
    if (price && price > 0) return price;
  }
  return null;
}

function dropsPerHour(base, fortune) {
  return Math.round(base * (1 + fortune / 100));
}

function formatCoins(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return Math.round(n).toLocaleString('ko-KR');
}

function formatPrice(n) {
  if (n >= 1000) return n.toLocaleString('ko-KR', { maximumFractionDigits: 0 });
  return n.toFixed(1);
}

function barColor(ratio) {
  if (ratio >= 0.65) return '#3fb950';
  if (ratio >= 0.35) return '#d29922';
  return '#f85149';
}

function rankDisplay(rank) {
  if (rank === 1) return '<span class="top1">🥇</span>';
  if (rank === 2) return '<span class="top2">🥈</span>';
  if (rank === 3) return '<span class="top3">🥉</span>';
  return `<span style="color:#6e7681">${rank}</span>`;
}

function renderTable(tab) {
  const cat = CATEGORIES[tab];
  const fortune = fortuneValues[tab];
  const products = bazaarData?.products ?? {};

  const rows = cat.items.map(item => {
    const price = findPrice(item, products);
    const drops = dropsPerHour(item.baseDrops, fortune);
    const coinsHr = price !== null ? drops * price : null;
    return { ...item, price, drops, coinsHr };
  }).sort((a, b) => {
    if (a.coinsHr === null && b.coinsHr === null) return 0;
    if (a.coinsHr === null) return 1;
    if (b.coinsHr === null) return -1;
    return b.coinsHr - a.coinsHr;
  });

  const maxCoins = Math.max(...rows.map(r => r.coinsHr ?? 0), 1);

  const header = `
    <div class="table-header">
      <span>#</span>
      <span>아이템</span>
      <span>개당 가격</span>
      <span>시간당 드롭</span>
      <span>시간당 수익</span>
      <span>상대 수익</span>
    </div>`;

  const items = rows.map((item, i) => {
    const rank = i + 1;
    const priceCell = item.price !== null
      ? `<span style="color:#e3b341">${formatPrice(item.price)}c</span>`
      : `<span class="no-price">없음</span>`;

    const coinsCell = item.coinsHr !== null
      ? `<span class="coins-value">${formatCoins(item.coinsHr)}</span>`
      : `<span class="no-price">-</span>`;

    const ratio = item.coinsHr !== null ? item.coinsHr / maxCoins : 0;
    const fillColor = barColor(ratio);
    const barHtml = `
      <div class="bar-track">
        <div class="bar-fill" style="width:${(ratio * 100).toFixed(1)}%;background:${fillColor}"></div>
      </div>`;

    return `
      <div class="item-row">
        <span class="rank">${rankDisplay(rank)}</span>
        <span class="item-name">
          <span class="item-icon">${item.icon}</span>
          ${item.name}
        </span>
        <span class="price-cell">${priceCell}</span>
        <span class="drops-cell">${item.drops.toLocaleString('ko-KR')}</span>
        <span class="coins-cell">${coinsCell}</span>
        <span class="bar-cell">${barHtml}</span>
      </div>`;
  }).join('');

  return header + items;
}

function render() {
  const el = document.getElementById('content');
  if (!bazaarData) {
    el.innerHTML = `<div class="loading"><div class="spinner"></div><div>불러오는 중...</div></div>`;
    return;
  }
  el.innerHTML = renderTable(currentTab);
}

function switchTab(btn, tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  const cat = CATEGORIES[tab];
  document.getElementById('fortuneLabel').textContent = cat.label;
  const slider = document.getElementById('fortuneSlider');
  slider.max = cat.maxFortune;
  slider.value = fortuneValues[tab];
  updateDisplay(fortuneValues[tab]);
  render();
}

function updateFortune(value) {
  const v = parseInt(value, 10);
  fortuneValues[currentTab] = v;
  updateDisplay(v);
  render();
}

function updateDisplay(v) {
  document.getElementById('fortuneDisplay').textContent = v;
  document.getElementById('fortuneMultiplier').textContent = `× ${(1 + v / 100).toFixed(1)}배`;
}

async function refreshData() {
  const btn = document.getElementById('refreshBtn');
  btn.disabled = true;
  btn.textContent = '로딩 중...';

  if (!apiKey) {
    document.getElementById('content').innerHTML = `
      <div class="error-box">
        🔑 API 키를 먼저 설정해주세요.<br>
        <small style="margin-top:8px;display:block">
          우측 상단 <strong>API 키 없음</strong> 버튼을 클릭해 키를 입력하세요.<br>
          키 발급: <a href="https://developer.hypixel.net/" target="_blank" style="color:#58a6ff">developer.hypixel.net</a>
        </small>
      </div>`;
    btn.disabled = false;
    btn.textContent = '🔄 새로고침';
    return;
  }

  try {
    const res = await fetch(`/api/bazaar?key=${encodeURIComponent(apiKey)}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || '알 수 없는 오류');
    bazaarData = data;
    const time = new Date().toLocaleTimeString('ko-KR');
    document.getElementById('lastUpdated').textContent = `업데이트: ${time}`;
    render();
  } catch (err) {
    const el = document.getElementById('content');
    if (!bazaarData) {
      el.innerHTML = `<div class="error-box">❌ 데이터 로드 실패: ${err.message}<br><small>잠시 후 다시 시도해 주세요.</small></div>`;
    }
  } finally {
    btn.disabled = false;
    btn.textContent = '🔄 새로고침';
  }
}

// 초기화 및 5분마다 자동 갱신
updateKeyBadge();
if (apiKey) {
  refreshData();
} else {
  openKeyModal();
}
setInterval(refreshData, 5 * 60 * 1000);
