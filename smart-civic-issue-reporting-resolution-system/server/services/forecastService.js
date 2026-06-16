/**
 * forecastService.js
 * 
 * Pure Node.js statistical forecasting engine.
 * Uses exponential smoothing + linear regression + day-of-week seasonality
 * to predict future complaint volumes without any Python dependency.
 */

const Complaint = require('../models/Complaint');
const ForecastCache = require('../models/ForecastCache');

const DEPARTMENTS = ['Roads', 'Water', 'Sanitation', 'Electricity', 'Drainage', 'Other'];
const CACHE_TTL_HOURS = 24;
const MIN_DATA_POINTS = 14; // Minimum days of data needed for forecasting

// ─── Utility: Aggregate complaints by day ────────────────────────────────────

async function aggregateDaily(filter = {}) {
  const pipeline = [
    { $match: filter },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ];

  const raw = await Complaint.aggregate(pipeline);
  if (raw.length === 0) return [];

  // Fill gaps with zeros for missing dates
  const firstDate = new Date(raw[0]._id);
  const lastDate = new Date(raw[raw.length - 1]._id);
  const dateMap = {};
  raw.forEach((r) => {
    dateMap[r._id] = r.count;
  });

  const filled = [];
  const cursor = new Date(firstDate);
  while (cursor <= lastDate) {
    const key = cursor.toISOString().split('T')[0];
    filled.push({ date: new Date(key), count: dateMap[key] || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return filled;
}

// ─── Linear Regression ───────────────────────────────────────────────────────

function linearRegression(data) {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumXX += i * i;
  }

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

// ─── Exponential Smoothing ───────────────────────────────────────────────────

function exponentialSmoothing(data, alpha = 0.3) {
  if (data.length === 0) return [];
  const smoothed = [data[0]];
  for (let i = 1; i < data.length; i++) {
    smoothed.push(alpha * data[i] + (1 - alpha) * smoothed[i - 1]);
  }
  return smoothed;
}

// ─── Day-of-Week Seasonality ─────────────────────────────────────────────────

function computeSeasonality(dailyData) {
  // Calculate average count for each day of week (0=Sun, 6=Sat)
  const dayTotals = [0, 0, 0, 0, 0, 0, 0];
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];

  dailyData.forEach((d) => {
    const dow = d.date.getDay();
    dayTotals[dow] += d.count;
    dayCounts[dow]++;
  });

  const overallAvg =
    dailyData.reduce((sum, d) => sum + d.count, 0) / dailyData.length || 1;

  // Seasonal factor = day avg / overall avg
  const factors = dayTotals.map((total, i) => {
    if (dayCounts[i] === 0) return 1;
    return total / dayCounts[i] / overallAvg;
  });

  return factors;
}

// ─── Standard Deviation ──────────────────────────────────────────────────────

function stdDev(arr) {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

// ─── Core Forecasting ────────────────────────────────────────────────────────

function generateForecasts(dailyData, horizonDays = 90) {
  const counts = dailyData.map((d) => d.count);
  const n = counts.length;

  if (n < MIN_DATA_POINTS) {
    return null; // Insufficient data
  }

  // Use last 90 days for recent model, or all data if less
  const recentWindow = Math.min(n, 90);
  const recentCounts = counts.slice(-recentWindow);

  // 1. Linear regression on recent data
  const { slope, intercept } = linearRegression(recentCounts);

  // 2. Exponential smoothing for baseline
  const smoothed = exponentialSmoothing(recentCounts, 0.3);
  const lastSmoothed = smoothed[smoothed.length - 1];

  // 3. Day-of-week seasonality
  const recentData = dailyData.slice(-recentWindow);
  const seasonality = computeSeasonality(recentData);

  // 4. Residual standard deviation for confidence intervals
  const residuals = recentCounts.map(
    (actual, i) => actual - (slope * i + intercept)
  );
  const sigma = stdDev(residuals);

  // 5. Generate daily predictions
  const lastDate = dailyData[dailyData.length - 1].date;
  const dailyForecast = [];

  for (let d = 1; d <= horizonDays; d++) {
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + d);

    const trendComponent = slope * (recentWindow + d - 1) + intercept;
    const baselineBlend = 0.6 * lastSmoothed + 0.4 * trendComponent;
    const dow = futureDate.getDay();
    const seasonalFactor = seasonality[dow];
    const predicted = Math.max(0, Math.round(baselineBlend * seasonalFactor));

    // Confidence interval widens with horizon
    const uncertaintyMultiplier = 1 + 0.02 * d;
    const marginOfError = Math.round(1.96 * sigma * uncertaintyMultiplier);

    dailyForecast.push({
      date: futureDate,
      predicted,
      lower: Math.max(0, predicted - marginOfError),
      upper: predicted + marginOfError,
    });
  }

  // 6. Aggregate summaries
  const sumRange = (start, end) => {
    const slice = dailyForecast.slice(start, end);
    return {
      predicted: slice.reduce((s, d) => s + d.predicted, 0),
      lower: slice.reduce((s, d) => s + d.lower, 0),
      upper: slice.reduce((s, d) => s + d.upper, 0),
    };
  };

  const tomorrow = dailyForecast[0]
    ? { predicted: dailyForecast[0].predicted, lower: dailyForecast[0].lower, upper: dailyForecast[0].upper }
    : { predicted: 0, lower: 0, upper: 0 };

  const next7Days = sumRange(0, 7);
  const next30Days = sumRange(0, 30);
  const next90Days = sumRange(0, Math.min(90, dailyForecast.length));

  // 7. Trend determination
  const recentAvg = recentCounts.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, recentCounts.length);
  const forecastAvg = dailyForecast.slice(0, 7).reduce((s, d) => s + d.predicted, 0) / Math.min(7, dailyForecast.length);
  
  let trend = 'stable';
  let trendPercentage = 0;
  if (recentAvg > 0) {
    trendPercentage = Math.round(((forecastAvg - recentAvg) / recentAvg) * 100);
    if (trendPercentage > 5) trend = 'increasing';
    else if (trendPercentage < -5) trend = 'decreasing';
  }

  return {
    tomorrow,
    next7Days,
    next30Days,
    next90Days,
    trend,
    trendPercentage,
    dailyForecast,
  };
}

// ─── Insight Generation ──────────────────────────────────────────────────────

function generateInsights(overallForecast, departmentForecasts) {
  const insights = [];

  if (!overallForecast) return ['Insufficient historical data for generating insights.'];

  // Overall trend insight
  const trendWord =
    overallForecast.trend === 'increasing'
      ? 'increase'
      : overallForecast.trend === 'decreasing'
        ? 'decrease'
        : 'remain stable';
  const pct = Math.abs(overallForecast.trendPercentage);

  insights.push(
    `Overall complaint volumes are expected to ${trendWord}${pct > 0 ? ` by approximately ${pct}%` : ''} over the next week.`
  );

  // Find department with highest forecast
  if (departmentForecasts && departmentForecasts.length > 0) {
    const sorted = [...departmentForecasts].sort((a, b) => b.predicted - a.predicted);
    const highest = sorted[0];
    if (highest && highest.predicted > 0) {
      insights.push(
        `${highest.name} is expected to receive the highest complaint volume (~${highest.predicted} complaints in the next 7 days).`
      );
    }

    // Find increasing departments
    const increasing = departmentForecasts.filter((d) => d.trend === 'increasing');
    if (increasing.length > 0) {
      const names = increasing.map((d) => d.name).join(', ');
      insights.push(`${names} ${increasing.length === 1 ? 'is' : 'are'} showing an upward trend in complaint volume.`);
    }

    // Find decreasing departments
    const decreasing = departmentForecasts.filter((d) => d.trend === 'decreasing');
    if (decreasing.length > 0) {
      const names = decreasing.map((d) => d.name).join(', ');
      insights.push(`${names} ${decreasing.length === 1 ? 'is' : 'are'} trending downward — a positive indicator.`);
    }
  }

  // Tomorrow insight
  if (overallForecast.tomorrow.predicted > 0) {
    insights.push(
      `Tomorrow's expected volume is ${overallForecast.tomorrow.predicted} complaints (range: ${overallForecast.tomorrow.lower}–${overallForecast.tomorrow.upper}).`
    );
  }

  return insights;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Build a cache key for a given forecast request.
 */
function buildCacheKey(type, filterValue = 'All') {
  return `forecast_${type}_${filterValue}`.toLowerCase().replace(/\s+/g, '_');
}

/**
 * Get or generate an overall forecast (optionally filtered by department / area).
 */
async function getOverallForecast(filters = {}) {
  const { department, area } = filters;
  const filterLabel = department && department !== 'All'
    ? department
    : area && area !== 'All'
      ? `area_${area}`
      : 'All';

  const cacheKey = buildCacheKey('overall', filterLabel);

  // Check cache
  const cached = await ForecastCache.findOne({
    cacheKey,
    expiresAt: { $gt: new Date() },
  });
  if (cached) return cached;

  // Build mongo filter
  const matchFilter = {};
  if (department && department !== 'All') matchFilter.category = department;
  if (area && area !== 'All') matchFilter['location.area'] = area;

  // Aggregate historical data
  const dailyData = await aggregateDaily(matchFilter);

  // Generate overall forecast
  const overallForecast = generateForecasts(dailyData, 90);

  // Generate per-department forecasts
  const departmentBreakdown = [];
  if (!department || department === 'All') {
    for (const dept of DEPARTMENTS) {
      const deptFilter = { ...matchFilter, category: dept };
      const deptDaily = await aggregateDaily(deptFilter);
      const deptForecast = generateForecasts(deptDaily, 7);
      departmentBreakdown.push({
        name: dept,
        predicted: deptForecast ? deptForecast.next7Days.predicted : 0,
        trend: deptForecast ? deptForecast.trend : 'stable',
        trendPercentage: deptForecast ? deptForecast.trendPercentage : 0,
      });
    }
  }

  // Generate insights
  const insights = generateInsights(overallForecast, departmentBreakdown);

  // Build result
  const result = {
    cacheKey,
    forecastType: 'overall',
    filterValue: filterLabel,
    forecastData: {
      tomorrow: overallForecast?.tomorrow || { predicted: 0, lower: 0, upper: 0 },
      next7Days: overallForecast?.next7Days || { predicted: 0, lower: 0, upper: 0 },
      next30Days: overallForecast?.next30Days || { predicted: 0, lower: 0, upper: 0 },
      next90Days: overallForecast?.next90Days || { predicted: 0, lower: 0, upper: 0 },
      trend: overallForecast?.trend || 'stable',
      trendPercentage: overallForecast?.trendPercentage || 0,
      dailyForecast: overallForecast?.dailyForecast || [],
      departmentBreakdown,
      insights,
    },
    historicalData: dailyData,
    generatedAt: new Date(),
    expiresAt: new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000),
  };

  // Save to cache (upsert)
  await ForecastCache.findOneAndUpdate({ cacheKey }, result, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });

  return result;
}

/**
 * Get forecast for a specific department.
 */
async function getDepartmentForecast(departmentName) {
  const cacheKey = buildCacheKey('department', departmentName);

  const cached = await ForecastCache.findOne({
    cacheKey,
    expiresAt: { $gt: new Date() },
  });
  if (cached) return cached;

  const dailyData = await aggregateDaily({ category: departmentName });
  const forecast = generateForecasts(dailyData, 90);
  const insights = generateInsights(forecast, []);

  const result = {
    cacheKey,
    forecastType: 'department',
    filterValue: departmentName,
    forecastData: {
      tomorrow: forecast?.tomorrow || { predicted: 0, lower: 0, upper: 0 },
      next7Days: forecast?.next7Days || { predicted: 0, lower: 0, upper: 0 },
      next30Days: forecast?.next30Days || { predicted: 0, lower: 0, upper: 0 },
      next90Days: forecast?.next90Days || { predicted: 0, lower: 0, upper: 0 },
      trend: forecast?.trend || 'stable',
      trendPercentage: forecast?.trendPercentage || 0,
      dailyForecast: forecast?.dailyForecast || [],
      departmentBreakdown: [],
      insights,
    },
    historicalData: dailyData,
    generatedAt: new Date(),
    expiresAt: new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000),
  };

  await ForecastCache.findOneAndUpdate({ cacheKey }, result, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });

  return result;
}

/**
 * Get forecast for a specific area (ward-equivalent).
 */
async function getAreaForecast(areaName) {
  const cacheKey = buildCacheKey('area', areaName);

  const cached = await ForecastCache.findOne({
    cacheKey,
    expiresAt: { $gt: new Date() },
  });
  if (cached) return cached;

  const dailyData = await aggregateDaily({ 'location.area': areaName });
  const forecast = generateForecasts(dailyData, 90);
  const insights = generateInsights(forecast, []);

  const result = {
    cacheKey,
    forecastType: 'area',
    filterValue: areaName,
    forecastData: {
      tomorrow: forecast?.tomorrow || { predicted: 0, lower: 0, upper: 0 },
      next7Days: forecast?.next7Days || { predicted: 0, lower: 0, upper: 0 },
      next30Days: forecast?.next30Days || { predicted: 0, lower: 0, upper: 0 },
      next90Days: forecast?.next90Days || { predicted: 0, lower: 0, upper: 0 },
      trend: forecast?.trend || 'stable',
      trendPercentage: forecast?.trendPercentage || 0,
      dailyForecast: forecast?.dailyForecast || [],
      departmentBreakdown: [],
      insights,
    },
    historicalData: dailyData,
    generatedAt: new Date(),
    expiresAt: new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000),
  };

  await ForecastCache.findOneAndUpdate({ cacheKey }, result, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });

  return result;
}

/**
 * Get distinct areas from complaint data.
 */
async function getDistinctAreas() {
  const areas = await Complaint.distinct('location.area', {
    'location.area': { $exists: true, $ne: null, $ne: '' },
  });
  return areas.filter(Boolean).sort();
}

/**
 * Force-refresh all cached forecasts.
 */
async function refreshAllForecasts() {
  await ForecastCache.deleteMany({});
  // Re-generate overall
  await getOverallForecast({});
  // Re-generate per department
  for (const dept of DEPARTMENTS) {
    await getDepartmentForecast(dept);
  }
  return { message: 'All forecasts refreshed successfully' };
}

module.exports = {
  getOverallForecast,
  getDepartmentForecast,
  getAreaForecast,
  getDistinctAreas,
  refreshAllForecasts,
  DEPARTMENTS,
  MIN_DATA_POINTS,
};
