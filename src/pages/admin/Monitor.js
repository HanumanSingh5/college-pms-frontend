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

const PHASES = [
  { value: 'phase1', label: 'Phase 1 — Abstract' },
  { value: 'phase2', label: 'Phase 2 — Introduction & Literature Review' },
  { value: 'phase3', label: 'Phase 3 — System Design' },
  { value: 'phase4', label: 'Phase 4 — Implementation' },
  { value: 'phase5', label: 'Phase 5 — Testing & Results' },
  { value: 'phase6', label: 'Phase 6 — Final Report & Presentation' },
];

export default function AdminMonitor() {
  const [tasks, setTasks]       = useState([]);
  const [projects, setProjects] = useState([]);
  const [tab, setTab]           = useState('all');
  const [filter, setFilter]     = useState('all');
  const [showAddModal, setShowAddModal]   = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [addForm, setAddForm] = useState({
    title:'', description:'', phase:'', projectId:'', dueDate:''
  });
  const token = localStorage.getItem('token');
  const h = { headers: { Authorization: 'Bearer ' + token } };

  const load = () => {
    axios.get('http://localhost:5000/api/admin/all-tasks', h).then(r => setTasks(r.data)).catch(() => {});
    axios.get('http://localhost:5000/api/admin/projects',  h).then(r => setProjects(r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const addTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/admin/task', addForm, h);
      toast.success('Task created!');
      setShowAddModal(false);
      setAddForm({ title:'', description:'', phase:'', projectId:'', dueDate:'' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed');
    }
  };

  const updateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.put('http://localhost:5000/api/admin/task/' + showEditModal._id, showEditModal, h);
      toast.success('Task updated!');
      setShowEditModal(null);
      load();
    } catch { toast.error('Failed to update'); }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await axios.delete('http://localhost:5000/api/admin/task/' + id, h);
      toast.success('Deleted');
      load();
    } catch { toast.error('Failed'); }
  };

  const markComplete = async (id) => {
    try {
      await axios.put('http://localhost:5000/api/admin/task/' + id, { status: 'completed' }, h);
      toast.success('Marked as completed!');
      load();
    } catch { toast.error('Failed'); }
  };

  const toggleUpload = async (id, currentState) => {
    try {
      const res = await axios.put(
        'http://localhost:5000/api/admin/task/' + id + '/enable-upload',
        { enabled: !currentState }, h
      );
      toast.success(res.data.msg);
      load();
    } catch { toast.error('Failed to update upload'); }
  };

  const statusColor = {
    pending:       'badge-warning',
    'in-progress': 'badge-info',
    completed:     'badge-success',
    late:          'badge-danger',
  };

  const filtered    = tasks.filter(t => filter === 'all' ? true : t.status === filter);
  const lateTasks   = tasks.filter(t => t.status === 'late');
  const blockedCount = tasks.filter(t => !t.uploadEnabled && t.status !== 'completed').length;

  const tabStyle = (t) => ({
    padding:'10px 20px', border:'none',
    borderBottom: tab === t ? '3px solid #4f46e5' : '3px solid transparent',
    background:'none', cursor:'pointer',
    fontWeight: tab === t ? 600 : 400,
    color: tab === t ? '#4f46e5' : '#666', fontSize:14,
  });

  return (
    <div>
      <Navbar title="Admin Panel" />
      <div className="layout">
        <Sidebar links={links} />
        <div className="main-content">

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h2>Task Monitor</h2>
            <button type="button" className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              + Assign New Task
            </button>
          </div>

          {/* Stats */}
          <div className="stats-grid" style={{ marginBottom:24 }}>
            <div className="stat-card"><h3>{tasks.length}</h3><p>Total Tasks</p></div>
            <div className="stat-card"><h3>{tasks.filter(t => t.status==='pending').length}</h3><p>Pending</p></div>
            <div className="stat-card"><h3>{tasks.filter(t => t.status==='completed').length}</h3><p>Completed</p></div>
            <div className="stat-card"><h3 style={{ color:'#dc2626' }}>{lateTasks.length}</h3><p>Late</p></div>
            <div className="stat-card"><h3 style={{ color:'#92400e' }}>{blockedCount}</h3><p>Upload Blocked</p></div>
          </div>

          {/* Tabs */}
          <div style={{ borderBottom:'1px solid #e5e7eb', marginBottom:20, display:'flex', gap:4 }}>
            <button style={tabStyle('all')} onClick={() => setTab('all')} type="button">
              All Tasks ({tasks.length})
            </button>
            <button style={tabStyle('late')} onClick={() => setTab('late')} type="button">
              ⚠️ Late Submissions
              {lateTasks.length > 0 && (
                <span style={{ background:'#ef4444', color:'white', borderRadius:'50%', fontSize:11, padding:'1px 6px', marginLeft:6 }}>
                  {lateTasks.length}
                </span>
              )}
            </button>
            <button style={tabStyle('blocked')} onClick={() => setTab('blocked')} type="button">
              🔒 Upload Blocked
              {blockedCount > 0 && (
                <span style={{ background:'#f97316', color:'white', borderRadius:'50%', fontSize:11, padding:'1px 6px', marginLeft:6 }}>
                  {blockedCount}
                </span>
              )}
            </button>
          </div>

          {/* All Tasks Tab */}
          {tab === 'all' && (
            <>
              <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
                {['all','pending','in-progress','completed','late'].map(f => (
                  <button key={f} type="button" onClick={() => setFilter(f)}
                    style={{
                      padding:'7px 16px', fontSize:13, borderRadius:8, cursor:'pointer',
                      background: filter===f ? '#4f46e5' : 'white',
                      color: filter===f ? 'white' : '#555',
                      border: '1px solid #d1d5db', fontWeight: filter===f ? 600 : 400,
                    }}>
                    {f.charAt(0).toUpperCase() + f.slice(1)} ({tasks.filter(t => f==='all'?true:t.status===f).length})
                  </button>
                ))}
              </div>

              <div className="card" style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', minWidth:1000 }}>
                  <thead>
                    <tr style={{ background:'#f9fafb' }}>
                      <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13 }}>#</th>
                      <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13 }}>Task</th>
                      <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13 }}>Group</th>
                      <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13 }}>Faculty</th>
                      <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13 }}>Students</th>
                      <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13 }}>Due Date</th>
                      <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13 }}>Status</th>
                      <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13 }}>Upload</th>
                      <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr><td colSpan="9" style={{ textAlign:'center', color:'#888', padding:32 }}>No tasks found</td></tr>
                    )}
                    {filtered.map((t, i) => (
                      <tr key={t._id} style={{ borderBottom:'1px solid #f0f0f0', background: t.status==='late'?'#fff5f5':'white' }}>
                        <td style={{ padding:'10px 12px', fontSize:13 }}>{i+1}</td>
                        <td style={{ padding:'10px 12px' }}>
                          <strong style={{ fontSize:13 }}>{t.title}</strong><br/>
                          <small style={{ color:'#888' }}>{t.phase || '-'}</small>
                        </td>
                        <td style={{ padding:'10px 12px' }}>
                          <span style={{ background:'#4f46e5', color:'white', padding:'2px 8px', borderRadius:20, fontSize:12, fontWeight:700 }}>
                            {t.project?.groupNo || '-'}
                          </span><br/>
                          <small style={{ color:'#888', fontSize:11 }}>{t.project?.title}</small>
                        </td>
                        <td style={{ padding:'10px 12px', fontSize:13 }}>{t.assignedBy?.name || 'Admin'}</td>
                        <td style={{ padding:'10px 12px', fontSize:12, color:'#555' }}>
                          {t.assignedTo?.map(s => s.name).join(', ')}
                        </td>
                        <td style={{ padding:'10px 12px', fontSize:13, color: t.status==='late'?'#dc2626':'#374151', fontWeight: t.status==='late'?600:400 }}>
                          {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}
                        </td>
                        <td style={{ padding:'10px 12px' }}>
                          <span className={'badge ' + (statusColor[t.status]||'badge-warning')}>
                            {t.status==='late'?'⚠️ Late':t.status}
                          </span>
                        </td>
                        <td style={{ padding:'10px 12px' }}>
                          <span style={{
                            background: t.uploadEnabled ? '#f0fdf4' : '#fef3c7',
                            color: t.uploadEnabled ? '#16a34a' : '#92400e',
                            padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600
                          }}>
                            {t.uploadEnabled ? '🔓 ON' : '🔒 OFF'}
                          </span>
                        </td>
                        <td style={{ padding:'10px 12px' }}>
                          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                            {t.status !== 'completed' && (
                              <button type="button" className="btn btn-success"
                                onClick={() => markComplete(t._id)}
                                style={{ padding:'4px 8px', fontSize:11 }}>✅</button>
                            )}
                            <button type="button"
                              onClick={() => toggleUpload(t._id, t.uploadEnabled)}
                              style={{
                                padding:'4px 8px', fontSize:11, borderRadius:6, cursor:'pointer', border:'none', fontWeight:600,
                                background: t.uploadEnabled ? '#fef3c7' : '#f0fdf4',
                                color: t.uploadEnabled ? '#92400e' : '#16a34a',
                              }}>
                              {t.uploadEnabled ? '🔒' : '🔓'}
                            </button>
                            <button type="button" className="btn btn-warning"
                              onClick={() => setShowEditModal({...t, dueDate: t.dueDate ? t.dueDate.split('T')[0] : ''})}
                              style={{ padding:'4px 8px', fontSize:11 }}>✏️</button>
                            <button type="button" className="btn btn-danger"
                              onClick={() => deleteTask(t._id)}
                              style={{ padding:'4px 8px', fontSize:11 }}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Late Submissions Tab */}
          {tab === 'late' && (
            <div>
              {lateTasks.length === 0 ? (
                <div className="card" style={{ textAlign:'center', color:'#888', padding:40 }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
                  <h3>No Late Submissions!</h3>
                </div>
              ) : (
                <div className="card" style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', minWidth:800 }}>
                    <thead>
                      <tr style={{ background:'#fef2f2' }}>
                        <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13, color:'#dc2626' }}>#</th>
                        <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13, color:'#dc2626' }}>Group</th>
                        <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13, color:'#dc2626' }}>Task</th>
                        <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13, color:'#dc2626' }}>Faculty</th>
                        <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13, color:'#dc2626' }}>Due Date</th>
                        <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13, color:'#dc2626' }}>Days Late</th>
                        <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13, color:'#dc2626' }}>Upload</th>
                        <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13, color:'#dc2626' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lateTasks.map((t, i) => {
                        const daysLate = t.dueDate ? Math.ceil((new Date()-new Date(t.dueDate))/(1000*60*60*24)) : 0;
                        return (
                          <tr key={t._id} style={{ borderBottom:'1px solid #fee2e2', background:'#fff5f5' }}>
                            <td style={{ padding:'10px 12px' }}>{i+1}</td>
                            <td style={{ padding:'10px 12px' }}>
                              <span style={{ background:'#4f46e5', color:'white', padding:'2px 8px', borderRadius:20, fontSize:12, fontWeight:700 }}>
                                {t.project?.groupNo || '-'}
                              </span>
                            </td>
                            <td style={{ padding:'10px 12px' }}><strong style={{ fontSize:13 }}>{t.title}</strong></td>
                            <td style={{ padding:'10px 12px', fontSize:13 }}>{t.assignedBy?.name || 'Admin'}</td>
                            <td style={{ padding:'10px 12px', fontSize:13, color:'#dc2626', fontWeight:600 }}>
                              {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}
                            </td>
                            <td style={{ padding:'10px 12px' }}>
                              <span style={{ background:'#fee2e2', color:'#dc2626', padding:'3px 8px', borderRadius:20, fontSize:12, fontWeight:700 }}>
                                {daysLate} day{daysLate!==1?'s':''} late
                              </span>
                            </td>
                            <td style={{ padding:'10px 12px' }}>
                              <span style={{
                                background: t.uploadEnabled ? '#f0fdf4' : '#fef3c7',
                                color: t.uploadEnabled ? '#16a34a' : '#92400e',
                                padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600
                              }}>
                                {t.uploadEnabled ? '🔓 Enabled' : '🔒 Blocked'}
                              </span>
                            </td>
                            <td style={{ padding:'10px 12px' }}>
                              <button type="button"
                                onClick={() => toggleUpload(t._id, t.uploadEnabled)}
                                style={{
                                  padding:'5px 12px', fontSize:12, borderRadius:6, cursor:'pointer', border:'none', fontWeight:600,
                                  background: t.uploadEnabled ? '#fef3c7' : '#f0fdf4',
                                  color: t.uploadEnabled ? '#92400e' : '#16a34a',
                                }}>
                                {t.uploadEnabled ? '🔒 Block Upload' : '🔓 Enable Upload'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Upload Blocked Tab */}
          {tab === 'blocked' && (
            <div>
              {blockedCount === 0 ? (
                <div className="card" style={{ textAlign:'center', color:'#888', padding:40 }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>🔓</div>
                  <h3>No Blocked Uploads</h3>
                  <p>All tasks have upload enabled.</p>
                </div>
              ) : (
                <div className="card" style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', minWidth:800 }}>
                    <thead>
                      <tr style={{ background:'#fffbeb' }}>
                        <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13, color:'#92400e' }}>#</th>
                        <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13, color:'#92400e' }}>Group</th>
                        <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13, color:'#92400e' }}>Task</th>
                        <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13, color:'#92400e' }}>Students</th>
                        <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13, color:'#92400e' }}>Due Date</th>
                        <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13, color:'#92400e' }}>Status</th>
                        <th style={{ padding:'10px 12px', textAlign:'left', fontSize:13, color:'#92400e' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.filter(t => !t.uploadEnabled && t.status !== 'completed').map((t, i) => (
                        <tr key={t._id} style={{ borderBottom:'1px solid #fef3c7', background:'#fffbeb' }}>
                          <td style={{ padding:'10px 12px' }}>{i+1}</td>
                          <td style={{ padding:'10px 12px' }}>
                            <span style={{ background:'#4f46e5', color:'white', padding:'2px 8px', borderRadius:20, fontSize:12, fontWeight:700 }}>
                              {t.project?.groupNo || '-'}
                            </span>
                          </td>
                          <td style={{ padding:'10px 12px' }}><strong style={{ fontSize:13 }}>{t.title}</strong></td>
                          <td style={{ padding:'10px 12px', fontSize:12 }}>{t.assignedTo?.map(s => s.name).join(', ')}</td>
                          <td style={{ padding:'10px 12px', fontSize:13, color:'#dc2626', fontWeight:600 }}>
                            {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}
                          </td>
                          <td style={{ padding:'10px 12px' }}>
                            <span className={'badge ' + (statusColor[t.status]||'badge-warning')}>
                              {t.status==='late'?'⚠️ Late':t.status}
                            </span>
                          </td>
                          <td style={{ padding:'10px 12px' }}>
                            <button type="button"
                              onClick={() => toggleUpload(t._id, t.uploadEnabled)}
                              style={{ padding:'6px 14px', fontSize:12, borderRadius:6, cursor:'pointer', border:'none', fontWeight:600, background:'#f0fdf4', color:'#16a34a' }}>
                              🔓 Enable Upload
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'white', borderRadius:16, padding:32, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ marginBottom:20 }}>Assign New Task (Admin)</h3>
            <form onSubmit={addTask}>
              <div className="form-group">
                <label>Select Project Group *</label>
                <select value={addForm.projectId} onChange={e => setAddForm({...addForm, projectId: e.target.value})} required>
                  <option value="">-- Select Project --</option>
                  {projects.map(p => (
                    <option key={p._id} value={p._id}>
                      [{p.groupNo||'-'}] {p.title||'Untitled'} — Faculty: {p.faculty?.name||'None'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Phase</label>
                <select value={addForm.phase} onChange={e => setAddForm({...addForm, phase: e.target.value})}>
                  <option value="">-- Select Phase --</option>
                  {PHASES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Task Title *</label>
                <input type="text" placeholder="Enter task title"
                  value={addForm.title} onChange={e => setAddForm({...addForm, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea rows="3" placeholder="Task description"
                  value={addForm.description} onChange={e => setAddForm({...addForm, description: e.target.value})}
                  required style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid #d1d5db', fontSize:14 }} />
              </div>
              <div className="form-group">
                <label>Due Date *</label>
                <input type="date" value={addForm.dueDate}
                  onChange={e => setAddForm({...addForm, dueDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]} required />
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" className="btn" onClick={() => setShowAddModal(false)} style={{ background:'#e5e7eb' }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'white', borderRadius:16, padding:32, width:'100%', maxWidth:480, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ marginBottom:20 }}>Edit Task</h3>
            <form onSubmit={updateTask}>
              <div className="form-group">
                <label>Task Title</label>
                <input type="text" value={showEditModal.title}
                  onChange={e => setShowEditModal({...showEditModal, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows="3" value={showEditModal.description}
                  onChange={e => setShowEditModal({...showEditModal, description: e.target.value})}
                  style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid #d1d5db', fontSize:14 }} />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={showEditModal.dueDate}
                  onChange={e => setShowEditModal({...showEditModal, dueDate: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={showEditModal.status}
                  onChange={e => setShowEditModal({...showEditModal, status: e.target.value})}>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="late">Late</option>
                </select>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
                <button type="button" className="btn" onClick={() => setShowEditModal(null)} style={{ background:'#e5e7eb' }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}