"""
forecaster.py — Core forecasting logic using Facebook Prophet.
Connects to MongoDB, aggregates complaint data, trains Prophet models,
and returns structured forecasts with confidence intervals.
"""

import os
import logging
from datetime import datetime, timedelta
# pyrefly: ignore [missing-import]
from pymongo import MongoClient
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

MONGO_URI = os.environ.get(
    'MONGO_URI',
    'mongodb+srv://SmartCivicUser:SmartCivicUser@cluster0.lpfqact.mongodb.net/CivicPulse?appName=Cluster0'
)
DEPARTMENTS = ['Roads', 'Water', 'Sanitation', 'Electricity', 'Drainage', 'Other']
MIN_DATA_POINTS = 14

# Lazy-load Prophet to allow graceful failure
_prophet_available = None

def _check_prophet():
    global _prophet_available
    if _prophet_available is None:
        try:
            from prophet import Prophet
            _prophet_available = True
        except ImportError:
            logger.warning("Prophet not installed. Using fallback statistical method.")
            _prophet_available = False
    return _prophet_available


def get_db():
    client = MongoClient(MONGO_URI)
    return client.get_default_database()


def aggregate_daily(match_filter=None):
    """Aggregate complaints by day, filling missing dates with zeros."""
    db = get_db()
    pipeline = []
    if match_filter:
        pipeline.append({'$match': match_filter})
    pipeline.extend([
        {'$group': {
            '_id': {'$dateToString': {'format': '%Y-%m-%d', 'date': '$createdAt'}},
            'count': {'$sum': 1}
        }},
        {'$match': {'_id': {'$ne': None}}},
        {'$sort': {'_id': 1}}
    ])

    raw = list(db.complaints.aggregate(pipeline))
    if not raw:
        return pd.DataFrame(columns=['ds', 'y'])

    date_map = {r['_id']: r['count'] for r in raw}
    first_date = datetime.strptime(raw[0]['_id'], '%Y-%m-%d')
    last_date = datetime.strptime(raw[-1]['_id'], '%Y-%m-%d')

    dates = []
    cursor = first_date
    while cursor <= last_date:
        key = cursor.strftime('%Y-%m-%d')
        dates.append({'ds': cursor, 'y': date_map.get(key, 0)})
        cursor += timedelta(days=1)

    return pd.DataFrame(dates)


def forecast_with_prophet(df, periods=90):
    """Train Prophet model and generate forecasts."""
    if not _check_prophet():
        return forecast_fallback(df, periods)

    from prophet import Prophet

    if len(df) < MIN_DATA_POINTS:
        return None

    model = Prophet(
        yearly_seasonality=False,
        weekly_seasonality=True,
        daily_seasonality=False,
        changepoint_prior_scale=0.05,
    )
    model.fit(df)

    future = model.make_future_dataframe(periods=periods)
    prediction = model.predict(future)

    # Extract only future dates
    last_historical = df['ds'].max()
    future_pred = prediction[prediction['ds'] > last_historical].copy()

    daily_forecast = []
    for _, row in future_pred.iterrows():
        daily_forecast.append({
            'date': row['ds'].isoformat(),
            'predicted': max(0, int(round(row['yhat']))),
            'lower': max(0, int(round(row['yhat_lower']))),
            'upper': max(0, int(round(row['yhat_upper']))),
        })

    return daily_forecast


def forecast_fallback(df, periods=90):
    """Simple statistical fallback when Prophet is unavailable."""
    if len(df) < MIN_DATA_POINTS:
        return None

    values = df['y'].values
    n = len(values)

    # Linear regression
    x = np.arange(n)
    coeffs = np.polyfit(x, values, 1)
    slope, intercept = coeffs[0], coeffs[1]

    # Day-of-week seasonality
    df_temp = df.copy()
    df_temp['dow'] = df_temp['ds'].dt.dayofweek
    dow_avg = df_temp.groupby('dow')['y'].mean()
    overall_avg = values.mean() if values.mean() > 0 else 1
    seasonal_factors = {dow: avg / overall_avg for dow, avg in dow_avg.items()}

    # Exponential smoothing
    alpha = 0.3
    smoothed = [values[0]]
    for i in range(1, n):
        smoothed.append(alpha * values[i] + (1 - alpha) * smoothed[-1])
    last_smooth = smoothed[-1]

    # Residual std
    residuals = values - (slope * x + intercept)
    sigma = np.std(residuals, ddof=1) if n > 1 else 0

    last_date = df['ds'].max()
    daily_forecast = []
    for d in range(1, periods + 1):
        future_date = last_date + timedelta(days=d)
        trend_val = slope * (n + d - 1) + intercept
        baseline = 0.6 * last_smooth + 0.4 * trend_val
        dow = future_date.weekday()
        factor = seasonal_factors.get(dow, 1.0)
        predicted = max(0, int(round(baseline * factor)))
        margin = int(round(1.96 * sigma * (1 + 0.02 * d)))
        daily_forecast.append({
            'date': future_date.isoformat(),
            'predicted': predicted,
            'lower': max(0, predicted - margin),
            'upper': predicted + margin,
        })

    return daily_forecast


def build_forecast_response(daily_forecast, historical_df):
    """Build the structured forecast response from daily predictions."""
    if daily_forecast is None:
        return {
            'insufficient_data': True,
            'message': f'Need at least {MIN_DATA_POINTS} days of data for forecasting.',
        }

    def sum_range(start, end):
        sl = daily_forecast[start:end]
        return {
            'predicted': sum(d['predicted'] for d in sl),
            'lower': sum(d['lower'] for d in sl),
            'upper': sum(d['upper'] for d in sl),
        }

    tomorrow = daily_forecast[0] if daily_forecast else {'predicted': 0, 'lower': 0, 'upper': 0}
    next7 = sum_range(0, 7)
    next30 = sum_range(0, 30)
    next90 = sum_range(0, min(90, len(daily_forecast)))

    # Trend
    recent_values = historical_df['y'].tail(7).values
    recent_avg = recent_values.mean() if len(recent_values) > 0 else 0
    forecast_avg = np.mean([d['predicted'] for d in daily_forecast[:7]]) if daily_forecast else 0

    trend_pct = 0
    if recent_avg > 0:
        trend_pct = int(round(((forecast_avg - recent_avg) / recent_avg) * 100))

    trend = 'stable'
    if trend_pct > 5:
        trend = 'increasing'
    elif trend_pct < -5:
        trend = 'decreasing'

    historical = [
        {'date': row['ds'].isoformat(), 'count': int(row['y'])}
        for _, row in historical_df.iterrows()
    ]

    return {
        'tomorrow': tomorrow,
        'next7Days': next7,
        'next30Days': next30,
        'next90Days': next90,
        'trend': trend,
        'trendPercentage': trend_pct,
        'dailyForecast': daily_forecast,
        'historical': historical,
    }


def get_overall_forecast(department=None, area=None):
    """Generate overall forecast, optionally filtered."""
    match_filter = {}
    if department and department != 'All':
        match_filter['category'] = department
    if area and area != 'All':
        match_filter['location.area'] = area

    df = aggregate_daily(match_filter if match_filter else None)
    daily = forecast_with_prophet(df, 90)
    result = build_forecast_response(daily, df)

    # Department breakdown
    if not department or department == 'All':
        dept_breakdown = []
        for dept in DEPARTMENTS:
            dept_filter = dict(match_filter)
            dept_filter['category'] = dept
            dept_df = aggregate_daily(dept_filter)
            dept_daily = forecast_with_prophet(dept_df, 7)
            if dept_daily:
                pred_7 = int(sum(d['predicted'] for d in dept_daily[:7]))
                recent = dept_df['y'].tail(7).values
                r_avg = recent.mean() if len(recent) > 0 else 0
                f_avg = np.mean([d['predicted'] for d in dept_daily[:7]])
                pct = int(round(((f_avg - r_avg) / r_avg) * 100)) if r_avg > 0 else 0
                t = 'increasing' if pct > 5 else ('decreasing' if pct < -5 else 'stable')
                dept_breakdown.append({
                    'name': dept,
                    'predicted': pred_7,
                    'trend': t,
                    'trendPercentage': pct,
                })
            else:
                dept_breakdown.append({
                    'name': dept,
                    'predicted': 0,
                    'trend': 'stable',
                    'trendPercentage': 0,
                })
        result['departmentBreakdown'] = dept_breakdown

    # Insights
    result['insights'] = generate_insights(result)

    return result


def generate_insights(forecast_data):
    """Generate natural language insights from forecast results."""
    insights = []

    if forecast_data.get('insufficient_data'):
        return ['Insufficient historical data for generating insights.']

    trend = forecast_data.get('trend', 'stable')
    pct = abs(forecast_data.get('trendPercentage', 0))
    action = 'increase' if trend == 'increasing' else ('decrease' if trend == 'decreasing' else 'remain stable')

    insights.append(
        f"Overall complaint volumes are expected to {action}"
        + (f" by approximately {pct}%" if pct > 0 else "")
        + " over the next week."
    )

    dept_breakdown = forecast_data.get('departmentBreakdown', [])
    if dept_breakdown:
        sorted_depts = sorted(dept_breakdown, key=lambda d: d['predicted'], reverse=True)
        if sorted_depts and sorted_depts[0]['predicted'] > 0:
            top = sorted_depts[0]
            insights.append(
                f"{top['name']} is expected to receive the highest complaint volume "
                f"(~{top['predicted']} complaints in the next 7 days)."
            )

        increasing = [d for d in dept_breakdown if d['trend'] == 'increasing']
        if increasing:
            names = ', '.join(d['name'] for d in increasing)
            verb = 'is' if len(increasing) == 1 else 'are'
            insights.append(f"{names} {verb} showing an upward trend in complaint volume.")

        decreasing = [d for d in dept_breakdown if d['trend'] == 'decreasing']
        if decreasing:
            names = ', '.join(d['name'] for d in decreasing)
            verb = 'is' if len(decreasing) == 1 else 'are'
            insights.append(f"{names} {verb} trending downward — a positive indicator.")

    tomorrow = forecast_data.get('tomorrow', {})
    if tomorrow.get('predicted', 0) > 0:
        insights.append(
            f"Tomorrow's expected volume is {tomorrow['predicted']} complaints "
            f"(range: {tomorrow.get('lower', 0)}–{tomorrow.get('upper', 0)})."
        )

    return insights


def get_distinct_areas():
    """Fetch distinct location.area values from complaints."""
    db = get_db()
    areas = db.complaints.distinct('location.area', {
        'location.area': {'$exists': True, '$nin': [None, '']}
    })
    return sorted([a for a in areas if a])
