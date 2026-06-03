import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { toast } from 'react-toastify';

const links = [
  { path: '/admin',           label: 'Dashboard', icon: '📊' },
  { path: '/admin/faculties', label: 'Faculties', icon: '👨‍🏫' },
  { path: '/admin/students',  label: 'Students',  icon: '👨‍🎓' },
  { path: '/admin/groups',    label: 'Groups',    icon: '👥' },
  { path: '/admin/projects',  label: 'Projects',  icon: '📁' },
  { path: '/admin/monitor',   label: 'Monitor',   icon: '👁️' },
];

export default function AdminStudents() {
  const [students, setStudents]               = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showExcelModal, setShowExcelModal]   = useState(false);
  const [showLinkModal, setShowLinkModal]     = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showResetModal, setShowResetModal]   = useState(false);
  const [editing, setEditing]                 = useState(null);
  const [resetStudent, setResetStudent]       = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [resetLoading, setResetLoading]       = useState(false);
  const [inviteEmail, setInviteEmail]         = useState('');
  const [inviteLink, setInviteLink]           = useState('');
  const [excelFile, setExcelFile]             = useState(null);
  const [uploadResults, setUploadResults]     = useState(null);
  const [newPassword, setNewPassword]         = useState('');
  const [searchTerm, setSearchTerm]           = useState('');
  const [editForm, setEditForm] = useState({
    name:'', email:'', password:'', enrollment:'', mobile:'', studentClass:''
  });
  const token = localStorage.getItem('token');
  const h = { headers: { Authorization: 'Bearer ' + token } };

  const load = () => {
    // Use your environment variable template literal instead
await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/add-student`, formData, config);
  };

  useEffect(() => { load(); }, []);

  const generateInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        'http://localhost:5000/api/admin/invite-student',
        { email: inviteEmail }, h
      );
      setInviteLink(res.data.link);
      setShowInviteModal(false);
      setShowLinkModal(true);
      setInviteEmail('');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to generate link');
    } finally {
      setLoading(false);
    }
  };

  const uploadExcel = async (e) => {
    e.preventDefault();
    if (!excelFile) return toast.error('Please select an Excel file');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', excelFile);
      const res = await axios.post(
        'http://localhost:5000/api/admin/upload-students-excel',
        formData,
        { headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'multipart/form-data' } }
      );
      setUploadResults(res.data.results);
      setShowExcelModal(false);
      setShowResultModal(true);
      setExcelFile(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Upload failed');
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
      await axios.put(
        'http://localhost:5000/api/admin/student/' + editing._id,
        editForm, h
      );
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
    if (!newPassword || newPassword.length < 4) {
      return toast.error('Password must be at least 4 characters');
    }
    setResetLoading(true);
    try {
      await axios.put(
        'http://localhost:5000/api/admin/student/' + resetStudent._id,
        {
          name:       resetStudent.name,
          email:      resetStudent.email,
          enrollment: resetStudent.enrollment,
          mobile:     resetStudent.mobile,
          password:   newPassword,
        }, h
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
      await axios.delete('http://localhost:5000/api/admin/student/' + id, h);
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

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h2>Students ({students.length})</h2>
            <div style={{ display:'flex', gap:10 }}>
              <button type="button" className="btn btn-primary"
                onClick={() => setShowInviteModal(true)}>
                + Single Invite
              </button>
              <button type="button" className="btn btn-success"
                onClick={() => setShowExcelModal(true)}>
                📊 Upload Excel
              </button>
            </div>
          </div>

          <div style={{
            background:'#eff6ff', border:'1px solid #bfdbfe',
            borderRadius:10, padding:'12px 18px', marginBottom:16,
            fontSize:13, color:'#1e40af', lineHeight:1.7
          }}>
            <strong>Student Registration:</strong> Send invite link → Student registers with their own password →
            If student forgets password, use <strong>Reset Password</strong> button below.
          </div>

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
                      {searchTerm ? 'No students match your search.' : 'No students yet.'}
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
                    <td style={{ fontSize:13 }}>
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
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
                            border:'none', borderRadius:8, cursor:'pointer',
                            fontWeight:600
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

      {/* Reset Password Modal */}
      {showResetModal && resetStudent && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'white', borderRadius:16, padding:32, width:'100%', maxWidth:440, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ marginBottom:4 }}>🔑 Reset Student Password</h3>
            <p style={{ color:'#666', fontSize:14, marginBottom:20 }}>
              Reset the login password for this student.
            </p>

            <div style={{ background:'#f9fafb', borderRadius:10, padding:'14px 16px', marginBottom:20 }}>
              <div style={{ fontSize:13, marginBottom:6 }}>
                <strong>Student:</strong> {resetStudent.name || 'Not registered yet'}
              </div>
              <div style={{ fontSize:13, marginBottom:6 }}>
                <strong>Email:</strong> {resetStudent.email}
              </div>
              {resetStudent.enrollment && (
                <div style={{ fontSize:13 }}>
                  <strong>Enrollment:</strong> {resetStudent.enrollment}
                </div>
              )}
            </div>

            <form onSubmit={resetPassword}>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="text"
                  placeholder="Enter new password (min 4 characters)"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  autoFocus
                  style={{
                    width:'100%', padding:'10px 14px',
                    border:'1px solid #d1d5db', borderRadius:8,
                    fontSize:14, outline:'none', boxSizing:'border-box'
                  }}
                />
              </div>

              {newPassword.length >= 4 && (
                <div style={{
                  background:'#f0fdf4', border:'1px solid #bbf7d0',
                  borderRadius:10, padding:'14px 16px', marginBottom:16
                }}>
                  <strong style={{ fontSize:13, display:'block', marginBottom:8, color:'#16a34a' }}>
                    📋 New credentials to share with student:
                  </strong>
                  <table style={{ width:'100%', fontSize:13 }}>
                    <tbody>
                      <tr>
                        <td style={{ padding:'4px 0', color:'#555', width:80 }}>Email:</td>
                        <td style={{ padding:'4px 0', fontWeight:700 }}>{resetStudent.email}</td>
                      </tr>
                      <tr>
                        <td style={{ padding:'4px 0', color:'#555' }}>Password:</td>
                        <td style={{ padding:'4px 0' }}>
                          <span style={{
                            background:'#e0e7ff', color:'#3730a3',
                            padding:'4px 12px', borderRadius:6,
                            fontFamily:'monospace', fontWeight:700,
                            fontSize:15, letterSpacing:1
                          }}>
                            {newPassword}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding:'4px 0', color:'#555' }}>Login URL:</td>
                        <td style={{ padding:'4px 0' }}>
                          <a href="http://localhost:3000/login"
                            style={{ color:'#4f46e5', fontSize:12 }}>
                            http://localhost:3000/login
                          </a>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <button type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        'Login URL: http://localhost:3000/login\nEmail: ' + resetStudent.email + '\nPassword: ' + newPassword
                      );
                      toast.success('Credentials copied!');
                    }}
                    style={{
                      marginTop:10, padding:'6px 14px',
                      background:'#4f46e5', color:'white',
                      border:'none', borderRadius:6,
                      cursor:'pointer', fontSize:12, fontWeight:600
                    }}>
                    📋 Copy Credentials
                  </button>
                </div>
              )}

              <div style={{
                background:'#fef9c3', borderRadius:8,
                padding:'10px 14px', marginBottom:16,
                fontSize:12, color:'#854d0e'
              }}>
                ⚠️ After resetting, share the new credentials with the student directly.
                The old password will no longer work.
              </div>

              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" className="btn"
                  onClick={() => { setShowResetModal(false); setNewPassword(''); }}
                  style={{ background:'#e5e7eb' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={resetLoading}>
                  {resetLoading ? 'Resetting...' : '🔑 Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Invite Modal */}
      {showInviteModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'white', borderRadius:16, padding:32, width:'100%', maxWidth:440, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ marginBottom:8 }}>Send Registration Link</h3>
            <p style={{ color:'#666', fontSize:14, marginBottom:20 }}>
              Enter the student's email. A unique registration link will be generated.
            </p>
            <form onSubmit={generateInvite}>
              <div className="form-group">
                <label>Student Email Address</label>
                <input type="email" placeholder="e.g. student@gmail.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  required autoFocus />
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
                <button type="button" onClick={() => setShowInviteModal(false)}
                  style={{ padding:'10px 20px', borderRadius:8, border:'none', background:'#e5e7eb', cursor:'pointer' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Generating...' : 'Generate Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Display Modal */}
      {showLinkModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'white', borderRadius:16, padding:32, width:'100%', maxWidth:500, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:48, marginBottom:8 }}>✅</div>
              <h3>Registration Link Generated!</h3>
            </div>
            <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:'12px 16px', marginBottom:12, fontSize:13, color:'#1e40af' }}>
              Student clicks this link → fills Name, Enrollment, Class → sets their own password → logged in automatically.
            </div>
            <div style={{ background:'#f0f4ff', border:'1px solid #c7d2fe', borderRadius:10, padding:'14px 16px', marginBottom:12, wordBreak:'break-all', fontSize:13, color:'#4f46e5' }}>
              {inviteLink}
            </div>
            <div style={{ background:'#fef9c3', borderRadius:8, padding:'10px 14px', marginBottom:20, fontSize:13, color:'#854d0e' }}>
              ⚠️ Student sets their own password. If they forget it, use the <strong>🔑 Password</strong> button in the table to reset it.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button type="button" className="btn btn-primary" onClick={copyLink} style={{ flex:1, padding:12 }}>
                📋 Copy Link
              </button>
              <button type="button" className="btn" onClick={() => { setShowLinkModal(false); load(); }}
                style={{ flex:1, padding:12, background:'#e5e7eb' }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Upload Modal */}
      {showExcelModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'white', borderRadius:16, padding:32, width:'100%', maxWidth:520, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ marginBottom:8 }}>Upload Excel & Send Registration Emails</h3>
            <p style={{ color:'#666', fontSize:14, marginBottom:16 }}>
              Upload Excel file with student emails. Registration links will be sent automatically.
            </p>
            <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:10, padding:16, marginBottom:16 }}>
              <strong style={{ fontSize:13, display:'block', marginBottom:8 }}>Required Excel format:</strong>
              <table style={{ fontSize:13, borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#4f46e5', color:'white' }}>
                    <th style={{ padding:'6px 12px' }}>Name</th>
                    <th style={{ padding:'6px 12px' }}>Email</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background:'#f0f4ff' }}>
                    <td style={{ padding:'6px 12px', border:'1px solid #e5e7eb' }}>Raj Patel</td>
                    <td style={{ padding:'6px 12px', border:'1px solid #e5e7eb' }}>raj@gmail.com</td>
                  </tr>
                  <tr>
                    <td style={{ padding:'6px 12px', border:'1px solid #e5e7eb' }}>Priya Shah</td>
                    <td style={{ padding:'6px 12px', border:'1px solid #e5e7eb' }}>priya@gmail.com</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <form onSubmit={uploadExcel}>
              <div className="form-group">
                <label>Select Excel File (.xlsx or .xls)</label>
                <input type="file" accept=".xlsx,.xls"
                  onChange={e => setExcelFile(e.target.files[0])}
                  required
                  style={{ width:'100%', padding:'10px 14px', border:'2px dashed #c7d2fe', borderRadius:8, fontSize:14, cursor:'pointer', boxSizing:'border-box', background:'#f8f9ff' }} />
                {excelFile && <p style={{ margin:'6px 0 0', fontSize:13, color:'#4f46e5' }}>Selected: {excelFile.name}</p>}
              </div>
              <div style={{ background:'#fef9c3', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#854d0e' }}>
                Already registered or already invited emails will be skipped automatically.
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" onClick={() => setShowExcelModal(false)}
                  style={{ padding:'10px 20px', borderRadius:8, border:'none', background:'#e5e7eb', cursor:'pointer' }}
                  disabled={loading}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={loading}>
                  {loading ? 'Processing...' : '📊 Upload & Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Results Modal */}
      {showResultModal && uploadResults && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'white', borderRadius:16, padding:32, width:'100%', maxWidth:580, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ marginBottom:20 }}>Upload Results</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
              <div style={{ background:'#f0fdf4', borderRadius:10, padding:14, textAlign:'center' }}>
                <div style={{ fontSize:26, fontWeight:700, color:'#16a34a' }}>{uploadResults.success?.length || 0}</div>
                <div style={{ fontSize:12, color:'#166534', marginTop:4 }}>Emails Sent</div>
              </div>
              <div style={{ background:'#fef9c3', borderRadius:10, padding:14, textAlign:'center' }}>
                <div style={{ fontSize:26, fontWeight:700, color:'#ca8a04' }}>{uploadResults.alreadyInvited?.length || 0}</div>
                <div style={{ fontSize:12, color:'#854d0e', marginTop:4 }}>Already Invited</div>
              </div>
              <div style={{ background:'#fee2e2', borderRadius:10, padding:14, textAlign:'center' }}>
                <div style={{ fontSize:26, fontWeight:700, color:'#dc2626' }}>{uploadResults.alreadyRegistered?.length || 0}</div>
                <div style={{ fontSize:12, color:'#991b1b', marginTop:4 }}>Already Registered</div>
              </div>
              <div style={{ background:'#f3f4f6', borderRadius:10, padding:14, textAlign:'center' }}>
                <div style={{ fontSize:26, fontWeight:700, color:'#6b7280' }}>{uploadResults.failed?.length || 0}</div>
                <div style={{ fontSize:12, color:'#4b5563', marginTop:4 }}>Failed</div>
              </div>
            </div>

            {uploadResults.success?.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <strong style={{ color:'#16a34a', display:'block', marginBottom:8 }}>
                  Emails Sent ({uploadResults.success.length})
                </strong>
                <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:10, maxHeight:120, overflowY:'auto', fontSize:12 }}>
                  {uploadResults.success.map((item, i) => (
                    <div key={i} style={{ padding:'3px 0', borderBottom:'1px solid #dcfce7' }}>
                      {item.name && <strong>{item.name} — </strong>}{item.email}
                      <span style={{ float:'right', color: item.emailSent ? '#16a34a' : '#dc2626' }}>
                        {item.emailSent ? '📧 Sent' : '⚠️ Link only'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploadResults.alreadyRegistered?.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <strong style={{ color:'#dc2626', display:'block', marginBottom:8 }}>
                  Already Registered — Skipped ({uploadResults.alreadyRegistered.length})
                </strong>
                <div style={{ background:'#fee2e2', borderRadius:8, padding:10, fontSize:12, maxHeight:80, overflowY:'auto' }}>
                  {uploadResults.alreadyRegistered.map((item, i) => (
                    <span key={i}>{item.email || item}{i < uploadResults.alreadyRegistered.length - 1 ? ', ' : ''}</span>
                  ))}
                </div>
              </div>
            )}

            <button type="button" className="btn btn-primary"
              onClick={() => { setShowResultModal(false); load(); }}
              style={{ width:'100%', padding:12, marginTop:8 }}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editing && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'white', borderRadius:16, padding:32, width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ marginBottom:20 }}>Edit Student</h3>
            <form onSubmit={saveEdit}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={editForm.email}
                  onChange={e => setEditForm({...editForm, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Enrollment No.</label>
                <input type="text" value={editForm.enrollment}
                  onChange={e => setEditForm({...editForm, enrollment: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Class</label>
                <input type="text" value={editForm.studentClass}
                  onChange={e => setEditForm({...editForm, studentClass: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Mobile No.</label>
                <input type="text" value={editForm.mobile}
                  onChange={e => setEditForm({...editForm, mobile: e.target.value})} />
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
                <button type="button" className="btn"
                  onClick={() => setShowEditModal(false)}
                  style={{ background:'#e5e7eb' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Update Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}