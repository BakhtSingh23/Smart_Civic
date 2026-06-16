const mongoose = require('mongoose');

const forecastCacheSchema = new mongoose.Schema({
  cacheKey: { type: String, unique: true, required: true, index: true },
  forecastType: {
    type: String,
    enum: ['overall', 'department', 'area', 'category'],
    required: true,
  },
  filterValue: { type: String, default: 'All' },
  forecastData: {
    tomorrow: {
      predicted: { type: Number, default: 0 },
      lower: { type: Number, default: 0 },
      upper: { type: Number, default: 0 },
    },
    next7Days: {
      predicted: { type: Number, default: 0 },
      lower: { type: Number, default: 0 },
      upper: { type: Number, default: 0 },
    },
    next30Days: {
      predicted: { type: Number, default: 0 },
      lower: { type: Number, default: 0 },
      upper: { type: Number, default: 0 },
    },
    next90Days: {
      predicted: { type: Number, default: 0 },
      lower: { type: Number, default: 0 },
      upper: { type: Number, default: 0 },
    },
    trend: { type: String, enum: ['increasing', 'stable', 'decreasing'], default: 'stable' },
    trendPercentage: { type: Number, default: 0 },
    dailyForecast: [
      {
        date: Date,
        predicted: Number,
        lower: Number,
        upper: Number,
      },
    ],
    departmentBreakdown: [
      {
        name: String,
        predicted: Number,
        trend: { type: String, enum: ['increasing', 'stable', 'decreasing'] },
        trendPercentage: Number,
      },
    ],
    insights: [String],
  },
  historicalData: [
    {
      date: Date,
      count: Number,
    },
  ],
  generatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

// TTL index — MongoDB auto-deletes expired docs
forecastCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports =
  mongoose.models.ForecastCache ||
  mongoose.model('ForecastCache', forecastCacheSchema);
