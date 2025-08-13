
module.exports = function validateCity(record) {
  if (!record || typeof record !== 'object') return false;

  const name = record.name;
  if (!name || typeof name !== 'string') return false;
  if (name.trim().length < 2) return false;

  
  if (/^[0-9\W_]+$/.test(name.trim())) return false;


  const country = record.country;
  if (!country || typeof country !== 'string' || country.trim().length < 2) return false;
  if (/^[0-9\W_]+$/.test(country.trim())) return false;

  if (record.coordinates) {
    const { lat, lon } = record.coordinates;
    if (typeof lat !== 'number' || typeof lon !== 'number') return false;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return false;
  }

  if (record.pollution != null && typeof record.pollution !== 'number') return false;
  if (typeof record.pollution === 'number' && record.pollution < 0) return false;

  return true;
};
