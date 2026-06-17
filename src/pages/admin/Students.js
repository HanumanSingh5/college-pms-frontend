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

export default function AdminStudents() {
  const [students, setStudents]           = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [editing, setEditing]             = useState(null);
  const [resetStudent, setResetStudent]   = useState(null);
  const [loading, setLoading]             = useState(false);
  const [resetLoading, setResetLoading]   = useState(false);
  const [inviteLink, setInviteLink]       = useState('');
  const [newPassword, setNewPassword]     = useState('');
  const [searchTerm, setSearchTerm]       = useState('');
  const [editForm, setEditForm] = useState({
    name:'', email:'', password:'', enrollment:'', mobile:'', studentClass:''
  });
  const token = localStorage.getItem('token');
  const h = { headers: { Authorization: 'Bearer ' + token } };
  const LIVE_URL = 'https://college-pms-frontend.vercel.app';

  const load = () => {
    axios.get(`${API}/api/admin/students`, h)
      .then(res => setStudents(res.data))
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);

  // Generate link WITHOUT email — student fills their own details
  const generateInvite = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/admin/invite-student`, {}, h);
      const fixedLink = res.data.link
        ? res.data.link.replace('http://localhost:3000', LIVE_URL)
        : res.data.link;
      setInviteLink(fixedLink);
      setShowInviteModal(false);
      setShowLinkModal(true);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to generate link');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Link copied!');
  };

  const openEdit = (s) => {
    setEditing(s);
    setEditForm({
      name:         s.name         || '',
      email:        s.email        || '',
      password:     '',
      enrollment:   s.enrollment   || '',
      mobile:       s.mobile       || '',
      studentClass: s.studentClass || '',
    });
    setShowEditModal(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API}/api/admin/student/${editing._id}`, editForm, h);
      toast.success('Student updated!');
      setShowEditModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const openReset = (s) => {
    setResetStudent(s);
    setNewPassword('');
    setShowResetModal(true);
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4)
      return toast.error('Password must be at least 4 characters');
    setResetLoading(true);
    try {
      await axios.put(
        `${API}/api/admin/student/${resetStudent._id}`,
        { name: resetStudent.name, email: resetStudent.email, enrollment: resetStudent.enrollment, mobile: resetStudent.mobile, password: newPassword }, h
      );
      toast.success('Password reset successfully!');
      setShowResetModal(false);
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this student?')) return;
    try {
      await axios.delete(`${API}/api/admin/student/${id}`, h);
      toast.success('Student removed');
      load();
    } catch {
      toast.error('Failed to remove');
    }
  };

  const filtered = students.filter(s =>
    (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.enrollment || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.studentClass || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <Navbar title="Admin Panel" />
      <div className="layout">
        <Sidebar links={links} />
        <div className="main-content">

          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h2>Students ({students.length})</h2>
            <button type="button" className="btn btn-primary"
              onClick={() => setShowInviteModal(true)}>
              + Generate Registration Link
            </button>
          </div>

          {/* Info banner */}
          <div style={{
            background:'#eff6ff', border:'1px solid #bfdbfe',
            borderRadius:10, padding:'12px 18px', marginBottom:16,
            fontSize:13, color:'#1e40af', lineHeight:1.7
          }}>
            <strong>How it works:</strong> Click "Generate Registration Link" →
            Copy the link → Share it with the student (WhatsApp/Email) →
            Student opens the link and fills their own Name, Email, Enrollment, Class &amp; Password.
            If student forgets password, use <strong>🔑 Password</strong> button below.
          </div>

          {/* Search */}
          <input type="text"
            placeholder="Search by name, email, enrollment or class..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width:'100%', padding:'10px 16px',
              border:'1px solid #d1d5db', borderRadius:8,
              fontSize:14, marginBottom:16,
              outline:'none', boxSizing:'border-box'
            }}
          />

          {/* Table */}
          <div className="card" style={{ overflowX:'auto' }}>
            <table style={{ minWidth:1000 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Enrollment No.</th>
                  <th>Class</th>
                  <th>Mobile</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ textAlign:'center', color:'#888', padding:32 }}>
                      {searchTerm ? 'No students match your search.' : 'No students yet. Generate a link and share it!'}
                    </td>
                  </tr>
                )}
                {filtered.map((s, i) => (
                  <tr key={s._id}>
                    <td>{i + 1}</td>
                    <td><strong>{s.name || '—'}</strong></td>
                    <td style={{ fontSize:13 }}>{s.email}</td>
                    <td>
                      {s.enrollment
                        ? <span style={{ background:'#eff6ff', color:'#1d4ed8', padding:'3px 8px', borderRadius:6, fontSize:12, fontWeight:600 }}>{s.enrollment}</span>
                        : <span style={{ color:'#aaa', fontSize:12 }}>—</span>
                      }
                    </td>
                    <td>{s.studentClass || <span style={{ color:'#aaa' }}>—</span>}</td>
                    <td>{s.mobile || <span style={{ color:'#aaa' }}>—</span>}</td>
                    <td>
                      <span className={s.isVerified ? 'badge badge-success' : 'badge badge-warning'}>
                        {s.isVerified ? 'Registered' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ fontSize:13 }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        <button type="button" className="btn btn-warning"
                          onClick={() => openEdit(s)}
                          style={{ padding:'5px 10px', fontSize:12 }}>
                          Edit
                        </button>
                        <button type="button"
                          onClick={() => openReset(s)}
                          style={{
                            padding:'5px 10px', fontSize:12,
                            background:'#6366f1', color:'white',
                            border:'none', borderRadius:8, cursor:'pointer', fontWeight:600
                          }}>
                          🔑 Password
                        </button>
                        <button type="button" className="btn btn-danger"
                          onClick={() => remove(s._id)}
                          style={{ padding:'5px 10px', fontSize:12 }}>
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

      {/* ── Invite Confirmation Modal ── */}
      {showInviteModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'white', borderRadius:16, padding:32, width:'100%', maxWidth:460, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:48, marginBottom:8 }}>🔗</div>
              <h3 style={{ margin:0 }}>Generate Registration Link</h3>
            </div>
            <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:'14px 16px', marginBottom:20, fontSize:13, color:'#1e40af', lineHeight:1.7 }}>
              A unique one-time registration link will be created.<br/>
              <strong>Share it with the student</strong> — they will open the link
              and fill in their own Email, Name, Enrollment, Class and set their Password.
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button type="button"
                onClick={() => setShowInviteModal(false)}
                style={{ padding:'10px 20px', borderRadius:8, border:'none', background:'#e5e7eb', cursor:'pointer', fontSize:14 }}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary"
                disabled={loading} onClick={generateInvite}
                style={{ padding:'10px 24px', fontSize:14 }}>
                {loading ? 'Generating...' : '🔗 Generate Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Link Display Modal ── */}
      {showLinkModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'white', borderRadius:16, padding:32, width:'100%', maxWidth:520, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:48, marginBottom:8 }}>✅</div>
              <h3 style={{ margin:0 }}>Registration Link Ready!</h3>
            </div>

            <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:'12px 16px', marginBottom:12, fontSize:13, color:'#1e40af', lineHeight:1.7 }}>
              📤 Share this link with the student via <strong>WhatsApp, Email or any message</strong>.<br/>
              Student opens it → fills Name, Email, Enrollment, Class → sets Password → account created!
            </div>

            {/* Link box */}
            <div style={{ background:'#f0f4ff', border:'2px solid #c7d2fe', borderRadius:10, padding:'14px 16px', marginBottom:16, wordBreak:'break-all', fontSize:13, color:'#4f46e5', fontWeight:500 }}>
              {inviteLink}
            </div>

            <div style={{ background:'#fef9c3', borderRadius:8, padding:'10px 14px', marginBottom:20, fontSize:13, color:'#854d0e' }}>
              ⚠️ This link can only be used <strong>once</strong>. Generate a new link for each student.
              If student forgets password later, use <strong>🔑 Password</strong> button in the table.
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button type="button" className="btn btn-primary"
                onClick={copyLink} style={{ flex:1, padding:12, fontSize:14 }}>
                📋 Copy Link
              </button>
              <button type="button" className="btn"
                onClick={() => { setShowLinkModal(false); load(); }}
                style={{ flex:1, padding:12, background:'#e5e7eb', fontSize:14 }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ── */}
      {showResetModal && resetStudent && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'white', borderRadius:16, padding:32, width:'100%', maxWidth:440, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ marginBottom:4 }}>🔑 Reset Student Password</h3>
            <p style={{ color:'#666', fontSize:14, marginBottom:20 }}>Reset the login password for this student.</p>

            <div style={{ background:'#f9fafb', borderRadius:10, padding:'14px 16px', marginBottom:20 }}>
              <div style={{ fontSize:13, marginBottom:6 }}><strong>Student:</strong> {resetStudent.name || 'Not registered yet'}</div>
              <div style={{ fontSize:13, marginBottom:6 }}><strong>Email:</strong> {resetStudent.email}</div>
              {resetStudent.enrollment && <div style={{ fontSize:13 }}><strong>Enrollment:</strong> {resetStudent.enrollment}</div>}
            </div>

            <form onSubmit={resetPassword}>
              <div className="form-group">
                <label>New Password</label>
                <input type="text"
                  placeholder="Enter new password (min 4 characters)"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required autoFocus
                  style={{ width:'100%', padding:'10px 14px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box' }}
                />
              </div>

              {newPassword.length >= 4 && (
                <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'14px 16px', marginBottom:16 }}>
                  <strong style={{ fontSize:13, display:'block', marginBottom:8, color:'#16a34a' }}>📋 Credentials to share:</strong>
                  <div style={{ fontSize:13 }}>
                    <div style={{ marginBottom:4 }}>Email: <strong>{resetStudent.email}</strong></div>
                    <div style={{ marginBottom:8 }}>Password: <span style={{ background:'#e0e7ff', color:'#3730a3', padding:'4px 12px', borderRadius:6, fontFamily:'monospace', fontWeight:700 }}>{newPassword}</span></div>
                    <div>Login: <a href={LIVE_URL+'/login'} style={{ color:'#4f46e5', fontSize:12 }}>{LIVE_URL}/login</a></div>
                  </div>
                  <button type="button"
                    onClick={() => { navigator.clipboard.writeText('Login: '+LIVE_URL+'/login\nEmail: '+resetStudent.email+'\nPassword: '+newPassword); toast.success('Copied!'); }}
                    style={{ marginTop:10, padding:'6px 14px', background:'#4f46e5', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:600 }}>
                    📋 Copy Credentials
                  </button>
                </div>
              )}

              <div style={{ background:'#fef9c3', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12, color:'#854d0e' }}>
                ⚠️ Share new credentials with student. Old password will stop working.
              </div>

              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" className="btn"
                  onClick={() => { setShowResetModal(false); setNewPassword(''); }}
                  style={{ background:'#e5e7eb' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={resetLoading}>
                  {resetLoading ? 'Resetting...' : '🔑 Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {showEditModal && editing && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'white', borderRadius:16, padding:32, width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ marginBottom:20 }}>Edit Student</h3>
            <form onSubmit={saveEdit}>
              <div className="form-group"><label>Full Name</label><input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name:e.target.value})} /></div>
              <div className="form-group"><label>Email</label><input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email:e.target.value})} /></div>
              <div className="form-group"><label>Enrollment No.</label><input type="text" value={editForm.enrollment} onChange={e => setEditForm({...editForm, enrollment:e.target.value})} /></div>
              <div className="form-group"><label>Class</label><input type="text" value={editForm.studentClass} onChange={e => setEditForm({...editForm, studentClass:e.target.value})} /></div>
              <div className="form-group"><label>Mobile No.</label><input type="text" value={editForm.mobile} onChange={e => setEditForm({...editForm, mobile:e.target.value})} /></div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
                <button type="button" className="btn" onClick={() => setShowEditModal(false)} style={{ background:'#e5e7eb' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Update Student'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}