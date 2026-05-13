const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

let cache = null;
let cacheTime = 0;
const CACHE_TTL = 2 * 60 * 1000; // 2분 캐시

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/bazaar', async (req, res) => {
  const now = Date.now();
  if (cache && now - cacheTime < CACHE_TTL) {
    return res.json(cache);
  }

  const apiKey = req.query.key || '';
  if (!apiKey) {
    return res.status(400).json({ success: false, error: 'API 키가 필요합니다.' });
  }

  try {
    const url = `https://api.hypixel.net/v2/skyblock/bazaar`;
    const response = await fetch(url, {
      headers: { 'API-Key': apiKey }
    });
    if (response.status === 403) {
      return res.status(403).json({ success: false, error: '유효하지 않은 API 키입니다.' });
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    cache = data;
    cacheTime = now;
    res.json(data);
  } catch (err) {
    if (cache) return res.json(cache);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
