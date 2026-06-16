import React, { useEffect, useState } from 'react';
import axios from '../../api/axios';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get('/citizen/profile').then((res) => {
      setUser(res.data.data.user);
      setName(res.data.data.user.name || '');
      setPhone(res.data.data.user.phone || '');
    }).catch(() => {});
  }, []);

  const save = () => {
    setLoading(true);
    axios.put('/citizen/profile', { name, phone }).then((res) => {
      setUser(res.data.data.user);
      setEditing(false);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  const changePassword = (e) => {
    e.preventDefault();
    const form = e.target;
    const currentPassword = form.currentPassword.value;
    const newPassword = form.newPassword.value;
    const confirm = form.confirmNewPassword.value;
    if (newPassword !== confirm) return alert('Passwords do not match');
    axios.post('/auth/change-password', { currentPassword, newPassword }).then(() => alert('Password changed')).catch((err) => alert('Failed to change password'));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-3xl">{user ? user.name?.split(' ').map(n=>n[0]).join('').slice(0,2) : 'U'}</div>
        <div>
          <div className="text-xl font-semibold">{user?.name}</div>
          <div className="text-sm text-gray-500">{user?.email} • {user?.role}</div>
          <div className="text-sm text-gray-400">Member since {user ? new Date(user.createdAt).toLocaleDateString() : ''}</div>
        </div>
      </div>

      <section className="bg-white border rounded p-4">
        <h3 className="font-semibold mb-3">Profile</h3>
        {editing ? (
          <div className="space-y-3">
            <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full border rounded p-2" />
            <input value={phone} onChange={(e)=>setPhone(e.target.value)} className="w-full border rounded p-2" />
            <div className="flex space-x-2">
              <button onClick={save} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
              <button onClick={()=>setEditing(false)} className="px-4 py-2 border rounded">Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-sm text-gray-600">Full Name</div>
            <div className="mb-2">{user?.name}</div>
            <div className="text-sm text-gray-600">Phone</div>
            <div className="mb-2">{user?.phone || '—'}</div>
            <div className="text-sm text-gray-600">Email</div>
            <div className="mb-2">{user?.email}</div>
            <div className="mt-3">
              <button onClick={()=>setEditing(true)} className="px-3 py-2 border rounded">Edit Profile</button>
            </div>
          </div>
        )}
      </section>

      <section className="bg-white border rounded p-4">
        <h3 className="font-semibold mb-3">Change Password</h3>
        <form onSubmit={changePassword} className="space-y-3">
          <input name="currentPassword" type="password" placeholder="Current Password" className="w-full border rounded p-2" required />
          <input name="newPassword" type="password" placeholder="New Password" className="w-full border rounded p-2" required />
          <input name="confirmNewPassword" type="password" placeholder="Confirm New Password" className="w-full border rounded p-2" required />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Change Password</button>
        </form>
      </section>

      <section className="bg-white border rounded p-4">
        <h3 className="font-semibold mb-3">My Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 border rounded">
            <div className="text-sm text-gray-500">Total Complaints</div>
            <div className="text-xl font-semibold">—</div>
          </div>
          <div className="p-3 border rounded">
            <div className="text-sm text-gray-500">Issues Resolved</div>
            <div className="text-xl font-semibold">—</div>
          </div>
          <div className="p-3 border rounded">
            <div className="text-sm text-gray-500">Duplicate Complaints</div>
            <div className="text-xl font-semibold">—</div>
          </div>
          <div className="p-3 border rounded">
            <div className="text-sm text-gray-500">Feedback Given</div>
            <div className="text-xl font-semibold">—</div>
          </div>
        </div>
      </section>

      <section className="bg-white border rounded p-4">
        <h3 className="font-semibold mb-3">Danger Zone</h3>
        <button onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }} className="px-4 py-2 border rounded text-red-600">Logout</button>
      </section>
    </div>
  );
}
