import React, { useState, useEffect, useRef, useCallback } from 'react';
import { http } from '../../api/http';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine, Legend,
  ComposedChart, Line
} from 'recharts';
import {
  FiTrendingUp, FiTrendingDown, FiMinus, FiDownload,
  FiRefreshCw, FiActivity, FiClock, FiTarget, FiZap,
  FiAlertTriangle, FiInfo
} from 'react-icons/fi';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const DEPT_COLORS = {
  Roads: '#F59E0B',
  Water: '#3B82F6',
  Sanitation: '#10B981',
  Electricity: '#F97316',
  Drainage: '#8B5CF6',
  Other: '#6B7280',
};

const DEPARTMENTS = ['Roads', 'Water', 'Sanitation', 'Electricity', 'Drainage', 'Other'];

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-white/10 animate-pulse">
      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
      <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
      <div className="h-3 w-32 bg-slate-100 dark:bg-slate-700/50 rounded" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-white/10 animate-pulse">
      <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded mb-6" />
      <div className="h-72 bg-slate-100 dark:bg-slate-700/30 rounded-xl" />
    </div>
  );
}

// ─── Trend Icon ──────────────────────────────────────────────────────────────

function TrendBadge({ trend, percentage }) {
  const config = {
    increasing: {
      icon: <FiTrendingUp className="w-4 h-4" />,
      label: 'Increasing',
      bg: 'bg-rose-50 dark:bg-rose-500/10',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-200 dark:border-rose-500/20',
    },
    stable: {
      icon: <FiMinus className="w-4 h-4" />,
      label: 'Stable',
      bg: 'bg-blue-50 dark:bg-blue-500/10',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-500/20',
    },
    decreasing: {
      icon: <FiTrendingDown className="w-4 h-4" />,
      label: 'Decreasing',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-500/20',
    },
  };

  const c = config[trend] || config.stable;
  const pct = Math.abs(percentage || 0);

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      {c.icon}
      {c.label}{pct > 0 ? ` ${pct}%` : ''}
    </span>
  );
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function ForecastTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 shadow-xl rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700 text-sm">
      <p className="font-medium text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-slate-500 dark:text-slate-400">
          <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-semibold text-slate-800 dark:text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Forecasting() {
  const [forecast, setForecast] = useState(null);
  const [historical, setHistorical] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [department, setDepartment] = useState('All');
  const [area, setArea] = useState('All');
  const [areas, setAreas] = useState([]);
  const [horizon, setHorizon] = useState(30);
  const [generatedAt, setGeneratedAt] = useState(null);

  const reportRef = useRef(null);

  // Fetch areas on mount
  useEffect(() => {
    http.get('/forecast/areas')
      .then(res => {
        if (res.data.success) setAreas(res.data.data || []);
      })
      .catch(() => {});
  }, []);

  // Fetch forecast data
  const fetchForecast = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (department !== 'All') params.append('department', department);
      if (area !== 'All') params.append('area', area);

      const res = await http.get(`/forecast/overall?${params.toString()}`);
      if (res.data.success) {
        setForecast(res.data.data.forecast);
        setHistorical(res.data.data.historical || []);
        setGeneratedAt(res.data.data.generatedAt);
      }
    } catch (err) {
      toast.error('Failed to load forecast data');
    } finally {
      setLoading(false);
    }
  }, [department, area]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  // Force refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await http.post('/forecast/train');
      toast.success('Forecasts refreshed');
      await fetchForecast();
    } catch {
      toast.error('Failed to refresh forecasts');
    } finally {
      setRefreshing(false);
    }
  };

  // Export PDF
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();

      // ── Header: Logo + SmartCivic branding ──
      const headerY = 10;
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
        logoImg.src = '/assets/logo.png';
      });
      const logoSize = 12;
      pdf.addImage(logoImg, 'PNG', 14, headerY, logoSize, logoSize);

      // Brand name
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(15, 23, 42);
      pdf.text('SmartCivic', 14 + logoSize + 4, headerY + 7);

      // Tagline
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text('Civic Issue Reporting & Resolution', 14 + logoSize + 4, headerY + 11);

      // Separator line
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.5);
      pdf.line(14, headerY + 16, pdfWidth - 14, headerY + 16);

      // ── Dynamic Title ──
      const deptLabel = department === 'All' ? 'All Departments' : `${department} Dept`;
      const areaLabel = area === 'All' ? '' : ` | ${area}`;
      const titleText = `AI Forecast Report — ${deptLabel}${areaLabel}`;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(30, 41, 59);
      pdf.text(titleText, 14, headerY + 24);

      // Subtitle
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`${horizon}-Day Forecast Horizon`, 14, headerY + 30);

      // Generated timestamp
      pdf.setFontSize(7);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`Generated on ${format(new Date(), 'MMM d, yyyy \'at\' h:mm a')}`, pdfWidth - 14, headerY + 30, { align: 'right' });

      // ── Report content ──
      const contentStartY = headerY + 36;
      const availableHeight = pdfPageHeight - contentStartY - 18;
      const contentImgHeight = (canvas.height * (pdfWidth - 28)) / canvas.width;

      if (contentImgHeight <= availableHeight) {
        pdf.addImage(imgData, 'PNG', 14, contentStartY, pdfWidth - 28, contentImgHeight);
      } else {
        const scale = availableHeight / contentImgHeight;
        const scaledWidth = (pdfWidth - 28) * scale;
        const scaledHeight = contentImgHeight * scale;
        pdf.addImage(imgData, 'PNG', 14, contentStartY, scaledWidth, scaledHeight);
      }

      // ── Footer ──
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.line(14, pdfPageHeight - 14, pdfWidth - 14, pdfPageHeight - 14);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(148, 163, 184);
      pdf.text('© 2026 SmartCivic — Digitally generated report', 14, pdfPageHeight - 9);
      pdf.text('smartcivic.in', pdfWidth - 14, pdfPageHeight - 9, { align: 'right' });

      pdf.save(`SmartCivic_AI_Forecast_${department}_${format(new Date(), 'yyyyMMdd')}.pdf`);
      toast.success('Report exported successfully');
    } catch {
      toast.error('Failed to export PDF');
    }
  };

  // ─── Build chart data ───────────────────────────────────────────────────

  const buildTrendChartData = () => {
    if (!forecast) return [];

    // Historical portion (last N days matching horizon)
    const histSlice = (historical || []).slice(-horizon);
    const histPoints = histSlice.map(d => ({
      name: format(new Date(d.date), 'MMM d'),
      actual: d.count,
      forecast: null,
      lower: null,
      upper: null,
    }));

    // Forecast portion
    const forecastSlice = (forecast.dailyForecast || []).slice(0, horizon);
    const forecastPoints = forecastSlice.map(d => ({
      name: format(new Date(d.date), 'MMM d'),
      actual: null,
      forecast: d.predicted,
      lower: d.lower,
      upper: d.upper,
    }));

    // Bridge: last historical point connects to first forecast
    if (histPoints.length > 0 && forecastPoints.length > 0) {
      const lastHist = histPoints[histPoints.length - 1];
      lastHist.forecast = lastHist.actual;
    }

    return [...histPoints, ...forecastPoints];
  };

  const buildDeptChartData = () => {
    if (!forecast?.departmentBreakdown) return [];
    return [...forecast.departmentBreakdown]
      .sort((a, b) => b.predicted - a.predicted)
      .map(d => ({
        ...d,
        fill: DEPT_COLORS[d.name] || DEPT_COLORS.Other,
      }));
  };

  const trendData = buildTrendChartData();
  const deptData = buildDeptChartData();
  const insights = forecast?.insights || [];
  const insufficientData = forecast?.insufficient_data;

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-[1440px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-2 rounded-xl">
              <FiZap className="w-5 h-5" />
            </span>
            AI Forecast & Predictions
          </h1>
          {generatedAt && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Last updated: {format(new Date(generatedAt), 'MMM d, yyyy h:mm a')}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Department Filter */}
          <select
            id="forecast-dept-filter"
            value={department}
            onChange={e => setDepartment(e.target.value)}
            className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
          >
            <option value="All">All Departments</option>
            {DEPARTMENTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Area Filter */}
          <select
            id="forecast-area-filter"
            value={area}
            onChange={e => setArea(e.target.value)}
            className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
          >
            <option value="All">All Areas</option>
            {areas.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {/* Horizon Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {[7, 30, 90].map(h => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  horizon === h
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {h}d
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {/* Export */}
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all"
          >
            <FiDownload className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && !forecast && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
          <SkeletonChart />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonChart />
            <SkeletonChart />
          </div>
        </div>
      )}

      {/* Insufficient Data Notice */}
      {!loading && insufficientData && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-8 text-center">
          <FiAlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-300 mb-2">Insufficient Data for Forecasting</h3>
          <p className="text-amber-700 dark:text-amber-400 text-sm max-w-md mx-auto">
            At least 14 days of complaint data is needed to generate reliable forecasts.
            The system will automatically start forecasting once enough data is available.
          </p>
        </div>
      )}

      {/* Main Content */}
      {!loading && forecast && !insufficientData && (
        <div ref={reportRef} className="space-y-6">

          {/* ── Forecast Summary Cards ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Tomorrow */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full" />
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-3">
                <FiTarget className="w-4 h-4" />
                <span className="text-sm font-medium">Tomorrow</span>
              </div>
              <div className="text-3xl font-bold text-slate-800 dark:text-white mb-1">
                {forecast.tomorrow?.predicted ?? 0}
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500">
                Range: {forecast.tomorrow?.lower ?? 0} – {forecast.tomorrow?.upper ?? 0}
              </div>
            </div>

            {/* Next 7 Days */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full" />
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-3">
                <FiActivity className="w-4 h-4" />
                <span className="text-sm font-medium">Next 7 Days</span>
              </div>
              <div className="text-3xl font-bold text-slate-800 dark:text-white mb-1">
                {forecast.next7Days?.predicted?.toLocaleString() ?? 0}
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500">
                Range: {forecast.next7Days?.lower?.toLocaleString() ?? 0} – {forecast.next7Days?.upper?.toLocaleString() ?? 0}
              </div>
            </div>

            {/* Next 30 Days */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full" />
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-3">
                <FiClock className="w-4 h-4" />
                <span className="text-sm font-medium">Next 30 Days</span>
              </div>
              <div className="text-3xl font-bold text-slate-800 dark:text-white mb-1">
                {forecast.next30Days?.predicted?.toLocaleString() ?? 0}
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500">
                Range: {forecast.next30Days?.lower?.toLocaleString() ?? 0} – {forecast.next30Days?.upper?.toLocaleString() ?? 0}
              </div>
            </div>

            {/* Trend Card */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-3">
                <FiTrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Overall Trend</span>
              </div>
              <div className="mb-2">
                <TrendBadge trend={forecast.trend} percentage={forecast.trendPercentage} />
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Next 90 days: {forecast.next90Days?.predicted?.toLocaleString() ?? 0} expected
              </div>
            </div>
          </div>

          {/* ── Forecast Trend Graph ───────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-slate-800 dark:text-white text-lg">
                Complaint Volume Forecast
              </h3>
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-indigo-500 rounded" />
                  Historical
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-purple-500 rounded" style={{ borderTop: '2px dashed #8b5cf6' }} />
                  Forecast
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-3 bg-purple-100 dark:bg-purple-500/20 rounded" />
                  Confidence
                </span>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    interval={Math.max(Math.floor(trendData.length / 10), 1)}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip content={<ForecastTooltip />} />

                  {/* Confidence band */}
                  <Area
                    type="monotone"
                    dataKey="upper"
                    stroke="none"
                    fill="none"
                    name="Upper Bound"
                    hide
                  />
                  <Area
                    type="monotone"
                    dataKey="lower"
                    stroke="none"
                    fill="#8b5cf6"
                    fillOpacity={0.08}
                    name="Confidence Band"
                  />

                  {/* Historical line */}
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#gradActual)"
                    fillOpacity={1}
                    name="Actual"
                    connectNulls={false}
                    dot={false}
                    activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 0 }}
                  />

                  {/* Forecast line */}
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    strokeDasharray="8 4"
                    dot={false}
                    activeDot={{ r: 5, fill: '#8b5cf6', strokeWidth: 0 }}
                    name="Forecast"
                    connectNulls={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Department Forecast + Insights ─────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Workload Forecast */}
            {deptData.length > 0 && (
              <div className="bg-white dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 shadow-sm">
                <h3 className="font-semibold text-slate-800 dark:text-white mb-5">
                  Department Workload Forecast
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-normal ml-2">(Next 7 days)</span>
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={deptData}
                      layout="vertical"
                      margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#475569' }}
                        width={85}
                      />
                      <Tooltip
                        content={<ForecastTooltip />}
                        cursor={{ fill: 'rgba(99,102,241,0.04)' }}
                      />
                      <Bar dataKey="predicted" name="Predicted" radius={[0, 6, 6, 0]} barSize={22}>
                        {deptData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Department Trends */}
                <div className="mt-4 space-y-2">
                  {deptData.map(dept => (
                    <div key={dept.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dept.fill }} />
                        {dept.name}
                      </span>
                      <TrendBadge trend={dept.trend} percentage={dept.trendPercentage} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Insights Panel */}
            <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-500/5 dark:via-slate-800/60 dark:to-purple-500/5 backdrop-blur-xl rounded-2xl p-6 border border-indigo-100 dark:border-indigo-500/10 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-1.5 rounded-lg">
                  <FiZap className="w-4 h-4" />
                </span>
                <h3 className="font-semibold text-slate-800 dark:text-white">AI-Generated Insights</h3>
              </div>

              {insights.length === 0 ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/5">
                  <FiInfo className="w-5 h-5 text-slate-400 shrink-0" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Insights will appear once enough data is available for analysis.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {insights.map((insight, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 p-3.5 rounded-xl bg-white/70 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/5 hover:border-indigo-200 dark:hover:border-indigo-500/20 transition-colors"
                    >
                      <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {insight}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/5">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Confidence</div>
                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">95%</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">Prediction interval</div>
                </div>
                <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/5">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Data Points</div>
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {historical.length}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">Days of training data</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Area Hotspots ──────────────────────────────────────────────── */}
          {forecast.departmentBreakdown && forecast.departmentBreakdown.length > 0 && department === 'All' && (
            <div className="bg-white dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 shadow-sm">
              <h3 className="font-semibold text-slate-800 dark:text-white mb-2">
                Resource Allocation Recommendation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                Based on predicted complaint volumes for the next 7 days
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...forecast.departmentBreakdown]
                  .sort((a, b) => b.predicted - a.predicted)
                  .map((dept, idx) => {
                    const maxPred = Math.max(...forecast.departmentBreakdown.map(d => d.predicted), 1);
                    const percentage = Math.round((dept.predicted / maxPred) * 100);
                    const needsAttention = dept.trend === 'increasing';
                    return (
                      <div
                        key={dept.name}
                        className={`p-4 rounded-xl border transition-all ${
                          needsAttention
                            ? 'border-rose-200 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5'
                            : 'border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: DEPT_COLORS[dept.name] || DEPT_COLORS.Other }}
                            />
                            <span className="font-medium text-sm text-slate-800 dark:text-white">
                              {dept.name}
                            </span>
                          </span>
                          <TrendBadge trend={dept.trend} percentage={dept.trendPercentage} />
                        </div>
                        <div className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                          {dept.predicted}
                          <span className="text-sm text-slate-400 dark:text-slate-500 font-normal ml-1">
                            predicted
                          </span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: DEPT_COLORS[dept.name] || DEPT_COLORS.Other,
                            }}
                          />
                        </div>
                        {needsAttention && (
                          <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 flex items-center gap-1">
                            <FiAlertTriangle className="w-3 h-3" />
                            May require additional resources
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
