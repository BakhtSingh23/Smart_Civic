"""
app.py — Flask microservice for AI complaint forecasting.
Runs on port 5001 alongside the Node.js server.
"""

import os
import logging
# pyrefly: ignore [missing-import]
from flask import Flask, request, jsonify
from flask_cors import CORS
from forecaster import (
    get_overall_forecast,
    get_distinct_areas,
    DEPARTMENTS,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)


@app.route('/api/forecast/overall', methods=['GET'])
def overall_forecast():
    try:
        department = request.args.get('department', 'All')
        area = request.args.get('area', 'All')
        result = get_overall_forecast(department=department, area=area)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        logger.error(f"overall_forecast error: {e}", exc_info=True)
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/forecast/department/<name>', methods=['GET'])
def department_forecast(name):
    try:
        if name not in DEPARTMENTS:
            return jsonify({
                'success': False,
                'message': f'Invalid department. Must be one of: {", ".join(DEPARTMENTS)}'
            }), 400
        result = get_overall_forecast(department=name)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        logger.error(f"department_forecast error: {e}", exc_info=True)
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/forecast/area/<name>', methods=['GET'])
def area_forecast(name):
    try:
        result = get_overall_forecast(area=name)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        logger.error(f"area_forecast error: {e}", exc_info=True)
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/forecast/category/<name>', methods=['GET'])
def category_forecast(name):
    try:
        result = get_overall_forecast(department=name)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        logger.error(f"category_forecast error: {e}", exc_info=True)
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/forecast', methods=['GET'])
def filtered_forecast():
    try:
        department = request.args.get('department', 'All')
        area = request.args.get('area', 'All')
        category = request.args.get('category')
        dept = department if department != 'All' else (category or 'All')
        result = get_overall_forecast(department=dept, area=area)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        logger.error(f"filtered_forecast error: {e}", exc_info=True)
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/forecast/areas', methods=['GET'])
def areas():
    try:
        area_list = get_distinct_areas()
        return jsonify({'success': True, 'data': area_list})
    except Exception as e:
        logger.error(f"areas error: {e}", exc_info=True)
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'ok': True, 'service': 'forecast-service'})


if __name__ == '__main__':
    port = int(os.environ.get('FORECAST_PORT', 5001))
    logger.info(f"Forecast service starting on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
