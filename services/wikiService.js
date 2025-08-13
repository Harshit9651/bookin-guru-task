const axios = require('axios');

const cache = new Map();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

function cacheKey(title) {
  return title.toLowerCase().trim();
}

function cleanTitle(title) {
  return title.replace(/\(.*?\)/g, '').trim();
}

async function fetchWikiSummary(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const r = await axios.get(url, { timeout: 8000 });
  if (r.data && r.data.extract) return r.data.extract;
  return null;
}

async function getSummaryForCity(cityName, countryName) {
  if (!cityName) return null;

  const cleanCity = cleanTitle(cityName);
  const attempts = [];
  if (countryName) attempts.push(`${cleanCity}, ${countryName}`);
  attempts.push(cleanCity);

  for (const attempt of attempts) {
    const key = cacheKey(attempt);
    const cached = cache.get(key);
    if (cached && Date.now() < cached.expiresAt) return cached.value;

    try {
      const summary = await fetchWikiSummary(attempt);
      if (summary) {
        cache.set(key, { value: summary, expiresAt: Date.now() + CACHE_TTL });
        return summary;
      }
    } catch (err) {
      if (err.response && err.response.status === 429) {
        throw new Error('Wikipedia rate limit exceeded');
      }
    }
  }

  return null; 
}

module.exports = { getSummaryForCity };
