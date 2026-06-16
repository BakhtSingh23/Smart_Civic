import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { http } from '../../api/http';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { FiDownload, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import AssignComplaint from './AssignComplaint';

export default function AllComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '', category: '', priority: '', department: '', search: '', isDuplicate: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const [assignModal, setAssignModal] = useState({ isOpen: false, complaint: null });

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ ...filters, page, limit: 15 }).toString();
      const res = await http.get(`/admin/complaints?${query}`);
      if (res.data.success) {
        setComplaints(res.data.data.complaints);
        setTotal(res.data.data.total);
        setTotalPages(res.data.data.totalPages);
      }
    } catch (err) {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [filters, page]);

  const handleExport = () => {
    if (complaints.length === 0) return toast.info('No data to export');

    // Build dynamic header info
    const deptLabel = filters.department ? `${filters.department} Department` : 'All Departments';
    const statusLabel = filters.status ? ` | Status: ${filters.status}` : '';
    const categoryLabel = filters.category ? ` | Category: ${filters.category}` : '';

    // Determine date range from complaints data
    const dates = complaints.map(c => new Date(c.createdAt)).sort((a, b) => a - b);
    const fromDate = format(dates[0], 'MMM d, yyyy');
    const toDate = format(dates[dates.length - 1], 'MMM d, yyyy');

    // Header rows with branding
    const brandingRows = [
      'SmartCivic — Civic Issue Reporting & Resolution System',
      '',
      `"Complaints Report — ${deptLabel}${statusLabel}${categoryLabel}"`,
      `"Period: ${fromDate} to ${toDate}"`,
      `"Generated on: ${format(new Date(), 'MMM d, yyyy \'at\' h:mm a')}"`,
      '',
    ];

    const headers = ['Complaint ID', 'Title', 'Category', 'Priority', 'Status', 'Department', 'Citizen', 'Date'];
    const dataRows = complaints.map(c => [
      c.complaintId,
      `"${c.title.replace(/"/g, '""')}"`,
      c.category,
      c.priority,
      c.status,
      c.assignedDepartment || 'N/A',
      `"${c.citizen?.name || 'Unknown'}"`,
      format(new Date(c.createdAt), 'yyyy-MM-dd')
    ].join(','));

    // Footer rows
    const footerRows = [
      '',
      '',
      `"© 2026 SmartCivic — Digitally generated complaints report"`,
      `"Total Records: ${complaints.length}"`,
    ];

    const csvContent = [
      ...brandingRows,
      headers.join(','),
      ...dataRows,
      ...footerRows,
    ].join('\n');

    // Add BOM for proper Excel encoding
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SmartCivic_Complaints_${filters.department || 'All'}_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully');
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">All Complaints</h1>
        <div className="flex gap-3">
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${showFilters ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
            <FiFilter /> Filters
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-medium transition-colors">
            <FiDownload /> Export CSV
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-in fade-in slide-in-from-top-4">
          <input type="text" placeholder="Search ID/Title..." className="border border-slate-200 rounded p-2 text-sm outline-none focus:border-indigo-500" value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
          <select className="border border-slate-200 rounded p-2 text-sm outline-none" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
            <option value="rejected">Rejected</option>
          </select>
          <select className="border border-slate-200 rounded p-2 text-sm outline-none" value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
            <option value="">All Categories</option>
            <option value="Roads">Roads</option>
            <option value="Water">Water</option>
            <option value="Sanitation">Sanitation</option>
            <option value="Electricity">Electricity</option>
            <option value="Drainage">Drainage</option>
            <option value="Street Lights">Street Lights</option>
            <option value="Public Health">Public Health</option>
            <option value="Parks">Parks</option>
          </select>
          <select className="border border-slate-200 rounded p-2 text-sm outline-none" value={filters.priority} onChange={e => setFilters({...filters, priority: e.target.value})}>
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <select className="border border-slate-200 rounded p-2 text-sm outline-none" value={filters.department} onChange={e => setFilters({...filters, department: e.target.value})}>
            <option value="">All Departments</option>
            <option value="Roads">Roads</option>
            <option value="Water">Water</option>
            <option value="Sanitation">Sanitation</option>
            <option value="Electricity">Electricity</option>
            <option value="Drainage">Drainage</option>
            <option value="Street Lights">Street Lights</option>
            <option value="Public Health">Public Health</option>
            <option value="Parks">Parks</option>
          </select>
          <select className="border border-slate-200 rounded p-2 text-sm outline-none" value={filters.isDuplicate} onChange={e => setFilters({...filters, isDuplicate: e.target.value})}>
            <option value="">All Types</option>
            <option value="false">Primary</option>
            <option value="true">Duplicate</option>
          </select>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500 uppercase tracking-wider">
                <th className="p-4 font-medium">ID</th>
                <th className="p-4 font-medium">Citizen</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Priority</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Department</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr><td colSpan="8" className="p-8 text-center text-slate-500">Loading...</td></tr>
              ) : complaints.length === 0 ? (
                <tr><td colSpan="8" className="p-8 text-center text-slate-500">No complaints found.</td></tr>
              ) : (
                complaints.map(c => (
                  <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-900"><Link to={`/admin/complaints/${c._id}`} className="text-blue-600 hover:underline">{c.complaintId}</Link></td>
                    <td className="p-4 text-slate-600">
                      {c.citizen?.name}
                      {c.source === 'chatbot' && <span className="ml-2 bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">💬 Chat</span>}
                    </td>
                    <td className="p-4"><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">{c.category}</span></td>
                    <td className="p-4"><span className={`px-2 py-1 rounded text-xs uppercase ${c.priority==='urgent'?'bg-red-100 text-red-700':c.priority==='high'?'bg-orange-100 text-orange-700':'bg-blue-100 text-blue-700'}`}>{c.priority}</span></td>
                    <td className="p-4"><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs capitalize">{c.status}</span></td>
                    <td className="p-4 text-slate-600">{c.assignedDepartment || '-'}</td>
                    <td className="p-4 text-slate-500 whitespace-nowrap">{format(new Date(c.createdAt), 'MMM d, yyyy')}</td>
                    <td className="p-4 text-right">
                      {c.status === 'verified' && (
                        <button onClick={() => setAssignModal({ isOpen: true, complaint: c })} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                          Assign Dept
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-sm text-slate-500">Showing page {page} of {totalPages} ({total} total)</div>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="p-2 border border-slate-200 rounded disabled:opacity-50 hover:bg-slate-50"><FiChevronLeft /></button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p+1)} className="p-2 border border-slate-200 rounded disabled:opacity-50 hover:bg-slate-50"><FiChevronRight /></button>
            </div>
          </div>
        )}
      </div>

      <AssignComplaint 
        isOpen={assignModal.isOpen} 
        onClose={() => setAssignModal({ isOpen: false, complaint: null })} 
        complaint={assignModal.complaint}
        onSuccess={fetchComplaints}
      />

    </div>
  );
}
