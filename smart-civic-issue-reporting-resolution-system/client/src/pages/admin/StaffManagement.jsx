import React, { useState, useEffect } from 'react';
import { http } from '../../api/http';
import { toast } from 'react-toastify';
import { FiCheckCircle, FiXCircle, FiUserPlus } from 'react-icons/fi';
import Modal from '../../components/ui/Modal';

export default function StaffManagement() {
  const [tab, setTab] = useState('officers');
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'officer', department: '', employeeId: '' });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await http.get(`/admin/${tab}`);
      if (res.data.success) {
        setStaff(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [tab]);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await http.post('/admin/staff', form);
      if (res.data.success) {
        toast.success(`Account created. Staff can login with these credentials.`);
        setAddModalOpen(false);
        setForm({ name: '', email: '', password: '', phone: '', role: tab === 'officers' ? 'officer' : 'worker', department: '', employeeId: '' });
        fetchStaff();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create account');
    }
  };

  const toggleActive = async (user) => {
    if (!window.confirm(`Are you sure you want to ${user.isActive ? 'deactivate' : 'activate'} ${user.name}?`)) return;
    try {
      const res = await http.patch(`/admin/users/${user._id}/toggle-active`, {});
      if (res.data.success) {
        toast.success(`${user.name} is now ${!user.isActive ? 'Active' : 'Inactive'}`);
        fetchStaff();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Toggle failed');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Staff Management</h1>
        <button 
          onClick={() => { setForm(prev => ({...prev, role: tab === 'officers' ? 'officer' : 'worker'})); setAddModalOpen(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <FiUserPlus /> Add New {tab === 'officers' ? 'Officer' : 'Worker'}
        </button>
      </div>

      <div className="flex border-b border-slate-200">
        <button 
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${tab === 'officers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setTab('officers')}
        >
          Officers
        </button>
        <button 
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${tab === 'workers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setTab('workers')}
        >
          Workers
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Employee ID</th>
              <th className="p-4 font-medium">Department</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="6" className="p-8 text-center text-slate-500">Loading...</td></tr>
            ) : staff.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-slate-500">No {tab} found.</td></tr>
            ) : (
              staff.map(s => (
                <tr key={s._id} className={`${!s.isActive ? 'bg-slate-50/50 grayscale opacity-75' : 'hover:bg-slate-50'} transition-all`}>
                  <td className="p-4 font-medium text-slate-900">{s.name}</td>
                  <td className="p-4 text-slate-600 font-mono text-xs">{s.employeeId}</td>
                  <td className="p-4"><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">{s.department}</span></td>
                  <td className="p-4 text-slate-600">{s.email}</td>
                  <td className="p-4">
                    {s.isActive ? 
                      <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-max"><FiCheckCircle /> Active</span> : 
                      <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded w-max"><FiXCircle /> Inactive</span>
                    }
                  </td>
                  <td className="p-4 flex gap-3">
                    <button onClick={() => toggleActive(s)} className="text-blue-600 hover:text-blue-800 font-medium">Toggle Active</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title={`Add New ${tab === 'officers' ? 'Officer' : 'Worker'}`}>
        <form onSubmit={handleAddStaff} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input type="text" required className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID</label>
              <input type="text" required className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" required className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input type="text" required className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
              <select required className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                <option value="">Select Department</option>
                <option value="Roads">Roads</option>
                <option value="Water">Water</option>
                <option value="Sanitation">Sanitation</option>
                <option value="Electricity">Electricity</option>
                <option value="Drainage">Drainage</option>
                {tab === 'workers' && <option value="General">General</option>}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password</label>
              <input type="text" required className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-medium py-2 rounded hover:bg-blue-700 transition-colors mt-4">
            Create Account
          </button>
        </form>
      </Modal>

    </div>
  );
}
