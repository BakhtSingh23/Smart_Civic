import React, { useState, useEffect, useRef } from 'react';
import { http } from '../../api/http';
import { toast } from 'react-toastify';
import { parseISO, format } from 'date-fns';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { FiDownload, FiStar, FiActivity, FiClock, FiFileText } from 'react-icons/fi';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const COLORS = {
  Roads: '#F59E0B',
  Water: '#3B82F6',
  Sanitation: '#10B981',
  Electricity: '#F97316',
  Drainage: '#8B5CF6',
  Other: '#6B7280'
};

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff7300'];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30days'); // 7days, 30days, 90days, custom
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [department, setDepartment] = useState('All');
  
  const reportRef = useRef(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let query = `period=${period}&department=${department}`;
      if (period === 'custom' && dateRange.from && dateRange.to) {
        query += `&dateFrom=${dateRange.from}&dateTo=${dateRange.to}`;
      }
      
      const res = await http.get(`/admin/analytics?${query}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'custom' || (dateRange.from && dateRange.to)) {
      fetchAnalytics();
    }
  }, [period, dateRange, department]);

  const getDateRangeLabel = () => {
    const now = new Date();
    if (period === 'custom' && dateRange.from && dateRange.to) {
      return `${format(new Date(dateRange.from), 'MMM d, yyyy')} to ${format(new Date(dateRange.to), 'MMM d, yyyy')}`;
    }
    const days = period === '7days' ? 7 : period === '90days' ? 90 : 30;
    const from = new Date(now);
    from.setDate(from.getDate() - days);
    return `${format(from, 'MMM d, yyyy')} to ${format(now, 'MMM d, yyyy')}`;
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();

      // ── Header: Logo + SmartCivic branding ──
      const headerY = 10;
      // Load logo
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
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.text('SmartCivic', 14 + logoSize + 4, headerY + 7);

      // Tagline
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.text('Civic Issue Reporting & Resolution', 14 + logoSize + 4, headerY + 11);

      // Separator line
      pdf.setDrawColor(226, 232, 240); // slate-200
      pdf.setLineWidth(0.5);
      pdf.line(14, headerY + 16, pdfWidth - 14, headerY + 16);

      // ── Dynamic Title ──
      const deptLabel = department === 'All' ? 'All Departments' : `${department} Dept`;
      const titleText = `Analytics Report — ${deptLabel}`;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(30, 41, 59); // slate-800
      pdf.text(titleText, 14, headerY + 24);

      // Date range subtitle
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text(getDateRangeLabel(), 14, headerY + 30);

      // Generated on
      pdf.setFontSize(7);
      pdf.setTextColor(148, 163, 184); // slate-400
      pdf.text(`Generated on ${format(new Date(), 'MMM d, yyyy \'at\' h:mm a')}`, pdfWidth - 14, headerY + 30, { align: 'right' });

      // ── Report content ──
      const contentStartY = headerY + 36;
      const availableHeight = pdfPageHeight - contentStartY - 18; // leave space for footer
      const contentImgHeight = (canvas.height * (pdfWidth - 28)) / canvas.width;

      if (contentImgHeight <= availableHeight) {
        pdf.addImage(imgData, 'PNG', 14, contentStartY, pdfWidth - 28, contentImgHeight);
      } else {
        // Scale to fit within available space
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

      pdf.save(`SmartCivic_Analytics_${department}_${format(new Date(), 'yyyyMMdd')}.pdf`);
      toast.success('Report downloaded successfully');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to generate PDF');
    }
  };

  if (loading && !data) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Analytics...</div>;

  const trendData = data?.complaintsTrend?.map(d => ({ name: format(parseISO(d.date), 'MMM d'), count: d.count })) || [];
  const statusData = data ? Object.entries(data.statusDistribution).map(([name, value]) => ({ name, value })) : [];
  const categoryData = data ? Object.entries(data.categoryBreakdown).map(([name, value]) => ({ name, value, fill: COLORS[name] || COLORS.Other })) : [];
  const locationData = data?.topLocations?.map(d => ({ name: d._id, count: d.count })) || [];
  
  const deptArray = data ? Object.entries(data.departmentPerformance).map(([name, stats]) => ({ name, ...stats })) : [];

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Analytics & Reports</h1>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {['7days', '30days', '90days', 'custom'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${period === p ? 'bg-white shadow-sm text-slate-800' : 'text-slate-600 hover:text-slate-800'}`}
              >
                {p === '7days' ? '7 Days' : p === '30days' ? '30 Days' : p === '90days' ? '90 Days' : 'Custom'}
              </button>
            ))}
          </div>

          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-indigo-500 bg-white"
          >
            <option value="All">All Departments</option>
            {Object.keys(COLORS).map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" className="border border-slate-200 rounded p-1.5 text-sm outline-none focus:border-indigo-500" value={dateRange.from} onChange={e => setDateRange({...dateRange, from: e.target.value})} />
              <span className="text-slate-400">-</span>
              <input type="date" className="border border-slate-200 rounded p-1.5 text-sm outline-none focus:border-indigo-500" value={dateRange.to} onChange={e => setDateRange({...dateRange, to: e.target.value})} />
            </div>
          )}

          <button onClick={handleExportPDF} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
            <FiDownload /> Export PDF
          </button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-6 bg-slate-50 p-4 -m-4 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 text-slate-600 mb-2"><FiFileText /> <span className="font-medium">Total Complaints</span></div>
            <div className="text-3xl font-bold text-slate-800">{data?.totalComplaintsInPeriod}</div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 text-slate-600 mb-2"><FiActivity /> <span className="font-medium">Resolution Rate</span></div>
            <div className="text-3xl font-bold text-slate-800">{data?.resolutionRate}%</div>
            <div className="text-xs text-slate-500 mt-1">Within 7 days SLA</div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 text-slate-600 mb-2"><FiClock /> <span className="font-medium">Avg Resolution Time</span></div>
            <div className="text-3xl font-bold text-slate-800">{data?.avgResolutionTime} <span className="text-lg text-slate-500 font-normal">days</span></div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 text-slate-600 mb-2"><FiStar className="text-amber-500" /> <span className="font-medium">Citizen Satisfaction</span></div>
            <div className="text-3xl font-bold text-slate-800">{data?.citizenSatisfaction?.rating} <span className="text-lg text-slate-500 font-normal">/ 5</span></div>
            <div className="text-xs text-slate-500 mt-1">Based on {data?.citizenSatisfaction?.count} reviews</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4">Complaints Over Time</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4">Complaints by Status</h3>
            <div className="h-64 flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {statusData.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600 capitalize">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Department Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-4 font-medium">Department</th>
                  <th className="p-4 font-medium">Assigned</th>
                  <th className="p-4 font-medium">Resolved</th>
                  <th className="p-4 font-medium">Pending</th>
                  <th className="p-4 font-medium">Avg Time</th>
                  <th className="p-4 font-medium w-1/4">Resolution Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deptArray.map(dept => {
                  const resolvedRate = dept.assigned ? (dept.resolved / dept.assigned) * 100 : 0;
                  const barColor = resolvedRate > 80 ? 'bg-emerald-500' : resolvedRate > 50 ? 'bg-amber-400' : 'bg-rose-500';
                  
                  return (
                    <tr key={dept.name}>
                      <td className="p-4 font-medium text-slate-800 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[dept.name] || COLORS.Other }}></span>
                        {dept.name}
                      </td>
                      <td className="p-4">{dept.assigned}</td>
                      <td className="p-4">{dept.resolved}</td>
                      <td className="p-4 text-amber-600">{dept.pendingCount}</td>
                      <td className="p-4">{dept.avgTime} days</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${barColor}`} style={{ width: `${resolvedRate}%` }}></div>
                          </div>
                          <span className="text-xs text-slate-500 w-10">{Math.round(resolvedRate)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4">Category Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569' }} width={80} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4">Top 5 Issue Locations</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationData} margin={{ top: 0, right: 0, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-30} textAnchor="end" height={60} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-xl">
            <div className="text-sm font-medium text-indigo-800 mb-1">Duplicate Rate</div>
            <div className="text-indigo-900 font-semibold">{data?.duplicateRate}% of complaints were identified as duplicates.</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-xl">
            <div className="text-sm font-medium text-emerald-800 mb-1">Worker Efficiency</div>
            <div className="text-emerald-900 font-semibold">{data?.workerCompletionRate}% task completion rate across all field workers.</div>
          </div>
          <div className="bg-amber-50 border border-amber-100 p-5 rounded-xl">
            <div className="text-sm font-medium text-amber-800 mb-1">Highest Volume</div>
            <div className="text-amber-900 font-semibold">{categoryData.length > 0 ? [...categoryData].sort((a,b) => b.value - a.value)[0]?.name || 'N/A' : 'N/A'} received the most complaints.</div>
          </div>
        </div>

      </div>
    </div>
  );
}
