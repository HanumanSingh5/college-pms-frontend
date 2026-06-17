import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_URL;

const links = [
  { path: '/admin',           label: 'Dashboard', icon: '📊' },
  { path: '/admin/faculties', label: 'Faculties', icon: '👨‍🏫' },
  { path: '/admin/students',  label: 'Students',  icon: '👨‍🎓' },
  { path: '/admin/groups',    label: 'Groups',    icon: '👥' },
  { path: '/admin/projects',  label: 'Projects',  icon: '📁' },
  { path: '/admin/monitor',   label: 'Monitor',   icon: '👁️' },
];

export default function AdminFaculties() {
  const [faculties, setFaculties]       = useState([]);
  const [showModal, setShowModal]       = useState(false);
  const [showCredModal, setShowCredModal] = useState(false);
  const [newCredentials, setNewCredentials] = useState(null);
  const [editing, setEditing]           = useState(null);
  const [loading, setLoading]           = useState(false);
  const [copied, setCopied]             = useState(false);
  const [form, setForm]                 = useState({ name: '', email: '', password: '' });
  const token = localStorage.getItem('token');
  const h = { headers: { Authorization: `Bearer ${token}` } };

  const load = () => {
    axios.get(`${API}/api/admin/faculties`, h)
      .then(res => setFaculties(res.data))
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '' });
    setShowModal(true);
  };

  const openEdit = (f) => {
    setEditing(f);
    setForm({ name: f.name, email: f.email, password: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      if (editing) {
        await axios.put(`${API}/api/admin/faculty/${editing._id}`, form, h);
        toast.success('Faculty updated successfully!');
        setShowModal(false);
        setForm({ name: '', email: '', password: '' });
        load();
      } else {
        const res = await axios.post(`${API}/api/admin/faculty`, form, h);
        setShowModal(false);
        setForm({ name: '', email: '', password: '' });
        load();
        // Show credentials popup
        setNewCredentials(res.data.credentials);
        setCopied(false);
        setShowCredModal(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to save faculty');
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this faculty member?')) return;
    try {
      await axios.delete(`${API}/api/admin/faculty/${id}`, h);
      toast.success('Faculty removed');
      load();
    } catch {
      toast.error('Failed to remove faculty');
    }
  };

  const copyCredentials = () => {
    if (!newCredentials) return;
    const text = `College PMS — Faculty Login\nEmail: ${newCredentials.email}\nPassword: ${newCredentials.password}\nLogin: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Credentials copied!');
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div>
      <Navbar title="Admin Panel" />
      <div className="layout">
        <Sidebar links={links} />
        <div className="main-content">

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2>Faculties</h2>
            <button className="btn btn-primary" onClick={openCreate} type="button">
              + Add Faculty
            </button>
          </div>

          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {faculties.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#888', padding: 32 }}>
                      No faculties yet. Click "+ Add Faculty" to create one.
                    </td>
                  </tr>
                )}
                {faculties.map((f, i) => (
                  <tr key={f._id}>
                    <td>{i + 1}</td>
                    <td><strong>{f.name}</strong></td>
                    <td>{f.email}</td>
                    <td><span className="badge badge-success">Active</span></td>
                    <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" className="btn btn-warning"
                          onClick={() => openEdit(f)}
                          style={{ padding: '6px 12px', fontSize: 12 }}>
                          Edit
                        </button>
                        <button type="button" className="btn btn-danger"
                          onClick={() => remove(f._id)}
                          style={{ padding: '6px 12px', fontSize: 12 }}>
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* Create / Edit Faculty Modal */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative', zIndex: 10000 }}>
            <h3 style={{ marginBottom: 16 }}>
              {editing ? 'Edit Faculty' : 'Add Faculty Account'}
            </h3>

            <div style={{ background: editing ? '#fef9c3' : '#eff6ff', color: editing ? '#854d0e' : '#1d4ed8', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, lineHeight: 1.5 }}>
              {editing
                ? '✏️ Update faculty details. Leave password blank to keep existing.'
                : '🔐 After creating, credentials will be shown on screen. Share them with the faculty manually.'}
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Full Name</label>
                <input type="text" placeholder="e.g. Dr. Rajesh Sharma"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Email Address (Login ID)</label>
                <input type="email" placeholder="e.g. rajesh@college.edu"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
                  {editing ? 'New Password (leave blank to keep)' : 'Password'}
                </label>
                <input type="text"
                  placeholder={editing ? 'Leave blank to keep current' : 'Set a password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required={!editing}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#e5e7eb', cursor: 'pointer', fontSize: 14 }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: loading ? '#a5b4fc' : '#4f46e5', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600 }}>
                  {loading ? 'Creating...' : editing ? 'Update Faculty' : 'Create Faculty Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credentials Display Modal */}
      {showCredModal && newCredentials && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
              <h3 style={{ margin: 0, color: '#111' }}>Faculty Created!</h3>
              <p style={{ color: '#666', fontSize: 13, margin: '6px 0 0' }}>
                Share these login credentials with the faculty manually.
              </p>
            </div>

            <div style={{ background: '#f0f4ff', border: '2px solid #c7d2fe', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e0e7ff' }}>
                <p style={{ margin: 0, fontSize: 11, color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Login URL</p>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#4f46e5', fontWeight: 600 }}>
                  {window.location.origin}/login
                </p>
              </div>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e0e7ff' }}>
                <p style={{ margin: 0, fontSize: 11, color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Email</p>
                <p style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 700, color: '#1e1b4b', fontFamily: 'monospace' }}>
                  {newCredentials.email}
                </p>
              </div>
              <div style={{ padding: '14px 20px' }}>
                <p style={{ margin: 0, fontSize: 11, color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Password</p>
                <p style={{ margin: '6px 0 0' }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#1e1b4b', background: '#e0e7ff', padding: '6px 16px', borderRadius: 8, fontFamily: 'monospace', letterSpacing: 2 }}>
                    {newCredentials.password}
                  </span>
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={copyCredentials}
                style={{ flex: 1, padding: '12px 0', borderRadius: 8, border: 'none', background: copied ? '#16a34a' : '#4f46e5', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                {copied ? '✅ Copied!' : '📋 Copy Credentials'}
              </button>
              <button type="button" onClick={() => setShowCredModal(false)}
                style={{ flex: 1, padding: '12px 0', borderRadius: 8, border: 'none', background: '#e5e7eb', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
