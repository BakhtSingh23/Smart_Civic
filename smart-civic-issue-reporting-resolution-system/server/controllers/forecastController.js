const forecastService = require('../services/forecastService');

// GET /api/forecast/overall
exports.getOverallForecast = async (req, res) => {
  try {
    const { department, area } = req.query;
    const result = await forecastService.getOverallForecast({ department, area });

    res.json({
      success: true,
      data: {
        forecast: result.forecastData,
        historical: result.historicalData,
        generatedAt: result.generatedAt,
      },
    });
  } catch (error) {
    console.error('getOverallForecast error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate forecast' });
  }
};

// GET /api/forecast/department/:name
exports.getDepartmentForecast = async (req, res) => {
  try {
    const { name } = req.params;
    if (!forecastService.DEPARTMENTS.includes(name)) {
      return res.status(400).json({
        success: false,
        message: `Invalid department. Must be one of: ${forecastService.DEPARTMENTS.join(', ')}`,
      });
    }

    const result = await forecastService.getDepartmentForecast(name);

    res.json({
      success: true,
      data: {
        forecast: result.forecastData,
        historical: result.historicalData,
        generatedAt: result.generatedAt,
      },
    });
  } catch (error) {
    console.error('getDepartmentForecast error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate department forecast' });
  }
};

// GET /api/forecast/area/:name
exports.getAreaForecast = async (req, res) => {
  try {
    const { name } = req.params;
    const result = await forecastService.getAreaForecast(decodeURIComponent(name));

    res.json({
      success: true,
      data: {
        forecast: result.forecastData,
        historical: result.historicalData,
        generatedAt: result.generatedAt,
      },
    });
  } catch (error) {
    console.error('getAreaForecast error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate area forecast' });
  }
};

// GET /api/forecast/category/:name  (alias for department)
exports.getCategoryForecast = async (req, res) => {
  try {
    const { name } = req.params;
    const result = await forecastService.getDepartmentForecast(decodeURIComponent(name));

    res.json({
      success: true,
      data: {
        forecast: result.forecastData,
        historical: result.historicalData,
        generatedAt: result.generatedAt,
      },
    });
  } catch (error) {
    console.error('getCategoryForecast error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate category forecast' });
  }
};

// GET /api/forecast  (filtered)
exports.getFilteredForecast = async (req, res) => {
  try {
    const { department, area, category } = req.query;
    // Category is an alias for department in our schema
    const dept = department || category;

    const result = await forecastService.getOverallForecast({
      department: dept,
      area,
    });

    res.json({
      success: true,
      data: {
        forecast: result.forecastData,
        historical: result.historicalData,
        generatedAt: result.generatedAt,
      },
    });
  } catch (error) {
    console.error('getFilteredForecast error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate filtered forecast' });
  }
};

// POST /api/forecast/train
exports.triggerTraining = async (req, res) => {
  try {
    const result = await forecastService.refreshAllForecasts();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('triggerTraining error:', error);
    res.status(500).json({ success: false, message: 'Failed to refresh forecasts' });
  }
};

// GET /api/forecast/areas
exports.getAreas = async (req, res) => {
  try {
    const areas = await forecastService.getDistinctAreas();
    res.json({ success: true, data: areas });
  } catch (error) {
    console.error('getAreas error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch areas' });
  }
};
