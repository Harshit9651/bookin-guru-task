module.exports = function validateCity(record) {
  if (!record || typeof record !== 'object') return false;

  const name = record.name;
  if (!name || typeof name !== 'string') return false;
  const trimmedName = name.trim();
  if (trimmedName.length < 2) return false;

 
  if (/^[0-9\W_]+$/.test(trimmedName)) return false;

  
  const invalidPatterns = /\b(district|zone|area|region|sector|station|unknown|power\s?plant|plant)\b/i;
  if (invalidPatterns.test(trimmedName)) return false;

  const country = record.country;
  if (!country || typeof country !== 'string') return false;
  const trimmedCountry = country.trim();
  if (trimmedCountry.length < 2) return false;


  if (/^[0-9\W_]+$/.test(trimmedCountry)) return false;

  if (record.coordinates) {
    const { lat, lon } = record.coordinates;
    if (typeof lat !== 'number' || typeof lon !== 'number') return false;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return false;
  }

  if (record.pollution != null) {
    if (typeof record.pollution !== 'number') return false;
    if (record.pollution < 0) return false;
  }

  return true;
};
