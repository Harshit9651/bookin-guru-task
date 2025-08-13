const axios = require('axios');
const validateCity = require('../utils/validateCity');
const wikipedia = require('./wikiService');
require('dotenv').config();

const MOCK_BASE = process.env.MOCK_API_BASE ;
const MOCK_USER = process.env.MOCK_API_USER;
const MOCK_PASS = process.env.MOCK_API_PASS;

let cache = {
  citiesResponse: null,
  citiesResponseExpiresAt: 0,
};

const CITIES_CACHE_TTL = 1000 * 60 * 5; 

async function loginToMockAPI() {
  const resp = await axios.post(`${MOCK_BASE}/auth/login`, {
    username: MOCK_USER,
    password: MOCK_PASS,
  }, { timeout: 10_000 });

  if (!resp.data || !resp.data.token) {
    throw new Error('Login failed: No token returned');
  }
  return resp.data.token;
}

async function fetchMockPollutionList() {
  const token = await loginToMockAPI();
  const countries = ['PL', 'DE', 'ES', 'FR'];
  let allResults = [];

  for (const code of countries) {
    const resp = await axios.get(`${MOCK_BASE}/pollution`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { country: code, limit: 50 },
      timeout: 10_000,
    });

    if (resp.data && Array.isArray(resp.data.results)) {
      allResults.push(...resp.data.results.map(r => ({
        ...r,
        country: code
      })));
    }
  }
  return allResults;
}

function normalizeRecord(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const out = {
    name: raw.city || raw.name || raw.location || null,
    country: raw.country || raw.country_name || raw.ctry || null
  };

  const lat = raw.lat || raw.latitude || (raw.coordinates && raw.coordinates.lat);
  const lon = raw.lon || raw.longitude || (raw.coordinates && raw.coordinates.lon);
  if (typeof lat === 'number' && typeof lon === 'number') {
    out.coordinates = { lat, lon };
  }

  const pollution = raw.aqi || raw.pm25 || raw.pollution || raw.value || raw.index;
  out.pollution = typeof pollution === 'number' ? pollution : (Number(pollution) || null);
  out.sourceId = raw.id || raw._id || null;

  return out;
}

async function getMostPollutedCities(page = 1, limit = 10) {
  if (cache.citiesResponse && Date.now() < cache.citiesResponseExpiresAt) {
    const start = (page - 1) * limit;
    return {
      total: cache.citiesResponse.length,
      cities: cache.citiesResponse.slice(start, start + limit)
    };
  }

  let raw;
  try {
    raw = await fetchMockPollutionList();
  } catch (err) {
    throw new Error('Failed to fetch pollution data: ' + err.message);
  }

  const candidates = (Array.isArray(raw) ? raw : [])
    .map(normalizeRecord)
    .filter(it => it && validateCity(it));

  const dedupMap = new Map();
  for (const c of candidates) {
    const key = `${(c.name || '').toLowerCase().trim()}|${(c.country || '').toLowerCase().trim()}`;
    if (!dedupMap.has(key) || (c.pollution || 0) > (dedupMap.get(key).pollution || 0)) {
      dedupMap.set(key, c);
    }
  }
  const validCities = Array.from(dedupMap.values());

  validCities.sort((a, b) => (b.pollution || 0) - (a.pollution || 0));

  const enriched = await Promise.all(validCities.map(async (city) => {
    try {
      const desc = await wikipedia.getSummaryForCity(city.name, city.country);
      return {
        name: city.name,
        country: city.country,
        pollution: city.pollution,
        description: desc || null
      };
    } catch {
      return {
        name: city.name,
        country: city.country,
        pollution: city.pollution,
        description: null
      };
    }
  }));

  cache.citiesResponse = enriched;
  cache.citiesResponseExpiresAt = Date.now() + CITIES_CACHE_TTL;

  const start = (page - 1) * limit;
  return {
    total: enriched.length,
    cities: enriched.slice(start, start + limit)
  };
}

module.exports = { getMostPollutedCities };
