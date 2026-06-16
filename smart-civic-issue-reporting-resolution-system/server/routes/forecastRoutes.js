const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const forecastController = require('../controllers/forecastController');

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('admin'));

// Filtered forecast (query params: department, area, category)
router.get('/', forecastController.getFilteredForecast);

// Overall forecast
router.get('/overall', forecastController.getOverallForecast);

// Get distinct areas for filter dropdown
router.get('/areas', forecastController.getAreas);

// Department-specific forecast
router.get('/department/:name', forecastController.getDepartmentForecast);

// Area-specific forecast
router.get('/area/:name', forecastController.getAreaForecast);

// Category-specific forecast (alias for department)
router.get('/category/:name', forecastController.getCategoryForecast);

// Force-refresh all forecasts
router.post('/train', forecastController.triggerTraining);

module.exports = router;
