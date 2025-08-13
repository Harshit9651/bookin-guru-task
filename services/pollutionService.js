const axios = require('axios');
const validateCity = require('../utils/validateCity');
const wikipedia = require('./wikiService');
const countries = require('i18n-iso-countries');
countries.registerLocale(require('i18n-iso-countries/langs/en.json'));
require('dotenv').config();

const MOCK_BASE = process.env.MOCK_API_BASE;
const MOCK_USER = process.env.MOCK_API_USER;
const MOCK_PASS = process.env.MOCK_API_PASS;

let cache = { citiesResponse: null, citiesResponseExpiresAt: 0 };
const CITIES_CACHE_TTL = 1000 * 60 * 5; 

function normalizeName(name) {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') 
    .replace(/\s*\(.*?\)\s*/g, '')
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function getCountryName(code) {
  return countries.getName(code, 'en', { select: 'official' }) || code;
}

async function loginToMockAPI() {
  const resp = await axios.post(`${MOCK_BASE}/auth/login`, {
    username: MOCK_USER,
    password: MOCK_PASS,
  }, { timeout: 10000 });

  if (!resp.data || !resp.data.token) throw new Error('Login failed: No token');
  return resp.data.token;
}

async function fetchMockPollutionList() {
  const token = await loginToMockAPI();
  const countryCodes = ['PL', 'DE', 'ES', 'FR'];
  let allResults = [];

  for (const code of countryCodes) {
    const resp = await axios.get(`${MOCK_BASE}/pollution`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { country: code, limit: 50 },
      timeout: 10000,
    });

    if (resp.data && Array.isArray(resp.data.results)) {
      allResults.push(...resp.data.results.map(r => ({ ...r, country: code })));
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
  if (typeof lat === 'number' && typeof lon === 'number') out.coordinates = { lat, lon };
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

  const raw = await fetchMockPollutionList();
  const candidates = (Array.isArray(raw) ? raw : [])
    .map(normalizeRecord)
    .filter(it => it && validateCity(it));

  const dedupMap = new Map();
  for (const c of candidates) {
    c.name = normalizeName(c.name);
    c.country = getCountryName(c.country);
    const key = `${c.name.toLowerCase()}|${c.country.toLowerCase()}`;
    if (!dedupMap.has(key) || (c.pollution || 0) > (dedupMap.get(key).pollution || 0)) {
      dedupMap.set(key, c);
    }
  }

  const validCities = Array.from(dedupMap.values())
    .sort((a, b) => (b.pollution || 0) - (a.pollution || 0));


  const enriched = await Promise.all(validCities.map(async (city) => {
    try {
      const desc = await wikipedia.getSummaryForCity(city.name, city.country);
      const { sourceId, ...rest } = city;
      return { ...rest, description: desc || null };
    } catch {
      const { sourceId, ...rest } = city;
      return { ...rest, description: null };
    }
  }));


  cache.citiesResponse = enriched;
  cache.citiesResponseExpiresAt = Date.now() + CITIES_CACHE_TTL;


  const start = (page - 1) * limit;
  return { total: enriched.length, cities: enriched.slice(start, start + limit) };
}

module.exports = { getMostPollutedCities };
