const pollutionService = require('../services/pollutionService');


exports.getCities = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);

    const { cities, total } = await pollutionService.getMostPollutedCities(page, limit);

    res.json({
      page,
      limit,
      total,
      cities
    });
  } catch (err) {
    console.error('Error in getCities:', err.message);
    res.status(500).json({
      error: true,
      message: 'Failed to retrieve polluted cities',
    });
  }
};