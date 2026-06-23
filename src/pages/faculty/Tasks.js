import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_URL;

const links = [
  { path: '/faculty',       label: 'Dashboard',   icon: '📊' },
  { path: '/faculty/tasks', label: 'Manage Tasks', icon: '✅' },
];

const PHASES = [
  { value: 'phase1', label: 'Phase 1 — Abstract' },
  { value: 'phase2', label: 'Phase 2 — Introduction & Literature Review' },
  { value: 'phase3', label: 'Phase 3 — System Design' },
  { value: 'phase4', label: 'Phase 4 — Implementation' },
  { value: 'phase5', label: 'Phase 5 — Testing & Results' },
  { value: 'phase6', label: 'Phase 6 — Final Report & Presentation' },
];

export default function FacultyTasks() {
  const location = useLocation();
  const [tasks, setTasks]         = useState([]);
  const [lateTasks, setLateTasks] = useState([]);
  const [projects, setProjects]   = useState([]);
  const [tab, setTab]             = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [viewTask, setViewTask]   = useState(null);
  const [previewUrl, setPreviewUrl]   = useState(null);
  const [previewName, setPreviewName] = useState('');
  const [filterPhase, setFilterPhase] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState({ title:'', description:'', phase:'', projectId:'', dueDate:'' });
  const [editForm, setEditForm] = useState({ title:'', description:'', dueDate:'', status:'' });
  const token = localStorage.getItem('token');
  const h = { headers: { Authorization: 'Bearer ' + token } };

  const load = () => {
    axios.get(`${API}/api/faculty/tasks`,            h).then(r => setTasks(r.data));
    axios.get(`${API}/api/faculty/late-submissions`, h).then(r => setLateTasks(r.data));
    axios.get(`${API}/api/faculty/projects`,         h).then(r => setProjects(r.data));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const incoming = location.state?.statusFilter;
    if (incoming) {
      setTab('all');
      setFilterStatus(incoming);
    }
  }, [location.state]);

  const openModal = () => {
    setForm({ title:'', description:'', phase:'', projectId:'', dueDate:'' });
    setShowModal(true);
  };

  const openEdit = (task) => {
    setEditModal(task);
    setEditForm({
      title:       task.title       || '',
      description: task.description || '',
      dueDate:     task.dueDate ? task.dueDate.split('T')[0] : '',
      status:      task.status      || 'pending',
    });
  };

  const createTask = async (e) => {
    e.preventDefault();
    if (!form.dueDate) return toast.error('Due date is required');
    try {
      await axios.post(`${API}/api/faculty/task`, form, h);
      toast.success('Task assigned!');
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed');
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/api/faculty/task/${editModal._id}`, editForm, h);
      toast.success('Task updated!');
      setEditModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed');
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    await axios.delete(`${API}/api/faculty/task/${id}`, h);
    toast.success('Deleted');
    load();
  };

  const toggleUpload = async (task) => {
    try {
      const res = await axios.put(
        `${API}/api/faculty/task/${task._id}/enable-upload`,
        { enabled: !task.uploadEnabled }, h
      );
      toast.success(res.data.msg);
      load();
    } catch { toast.error('Failed to update upload status'); }
  };

  const statusColor = {
    pending:       'badge-warning',
    'in-progress': 'badge-info',
    completed:     'badge-success',
    late:          'badge-danger',
  };

  const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date();

  const phaseFiltered = filterPhase === 'all' ? tasks : tasks.filter(t => t.phase === filterPhase);
  const filtered = phaseFiltered.filter(t => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'completed') return t.status === 'completed';
    if (filterStatus === 'pending') return t.status !== 'completed';
    return true;
  });

  const grouped = {};
  filtered.forEach(t => {
    const key = t.project?._id || 'unknown';
    if (!grouped[key]) grouped[key] = { project: t.project, tasks: [] };
    grouped[key].tasks.push(t);
  });

  const pillTab = (t) => ({
    padding: '8px 18px',
    border: tab === t ? 'none' : '1px solid #e7ebee',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    background: tab === t ? '#0e9f8e' : 'white',
    color: tab === t ? 'white' : '#555',
    display: 'inline-flex', alignItems: 'center', gap: 6,
  });

  const chip = (active, color = '#0e9f8e') => ({
    padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:600,
    border: active ? 'none' : '1px solid #e7ebee', cursor:'pointer',
    background: active ? color : 'white', color: active ? 'white' : '#555',
  });

  return (
    <div>
      <Navbar title="Faculty Portal" />
      <div className="layout">
        <Sidebar links={links} />
        <div className="main-content">

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h2>Manage Tasks</h2>
            <button className="btn btn-primary" onClick={openModal} type="button">+ Assign New Task</button>
          </div>

          <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
            <button style={pillTab('all')}  onClick={() => setTab('all')}  type="button">All Tasks ({tasks.length})</button>
            <button style={pillTab('late')} onClick={() => setTab('late')} type="button">
              ⚠️ Late Submissions
              {lateTasks.length > 0 && <span style={{ background:'#ef4444', color:'white', borderRadius:'50%', fontSize:11, padding:'1px 6px' }}>{lateTasks.length}</span>}
            </button>
          </div>

          {tab === 'all' && (
            <>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 }}>
                <button type="button" onClick={() => setFilterStatus('all')} style={chip(filterStatus==='all', '#16a34a')}>All Status</button>
                <button type="button" onClick={() => setFilterStatus('pending')} style={chip(filterStatus==='pending', '#16a34a')}>⏳ Pending</button>
                <button type="button" onClick={() => setFilterStatus('completed')} style={chip(filterStatus==='completed', '#16a34a')}>✅ Completed</button>
              </div>

              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
                <button type="button" onClick={() => setFilterPhase('all')} style={chip(filterPhase==='all')}>All Phases</button>
                {PHASES.map(p => (
                  <button key={p.value} type="button" onClick={() => setFilterPhase(p.value)} style={chip(filterPhase===p.value)}>
                    {p.label.split('—')[0].trim()}
                  </button>
                ))}
              </div>

              {Object.keys(grouped).length === 0 && (
                <div className="card" style={{ textAlign:'center', color:'#888', padding:40 }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
                  <h3>No Tasks Found</h3>
                  <p>Try a different filter, or click "+ Assign New Task" to assign one.</p>
                </div>
              )}

              {Object.values(grouped).map(({ project, tasks: ptasks }) => (
                <div key={project?._id} style={{ marginBottom:24 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    <h3 style={{ margin:0 }}>{project?.title || 'Unknown'}</h3>
                    <span style={{ background:'#0e9f8e', color:'white', padding:'2px 10px', borderRadius:20, fontSize:12, fontWeight:700 }}>{project?.groupNo || '-'}</span>
                  </div>

                  {ptasks.map(t => (
                    <div key={t._id} className="card" style={{
                      marginBottom:10,
                      borderLeft: t.status==='late'?'4px solid #ef4444': t.status==='completed'?'4px solid #16a34a': isOverdue(t.dueDate)?'4px solid #f97316':'4px solid #e7ebee'
                    }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                            {t.phase && <span style={{ background:'#f0fbf9', color:'#0e9f8e', padding:'2px 10px', borderRadius:20, fontSize:12, fontWeight:600 }}>{PHASES.find(p=>p.value===t.phase)?.label||t.phase}</span>}
                            <span className={'badge '+(statusColor[t.status]||'badge-warning')}>{t.status==='late'?'⚠️ Late':t.status}</span>
                            {isOverdue(t.dueDate)&&t.status!=='completed'&&<span style={{ background:'#fee2e2', color:'#dc2626', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600 }}>OVERDUE</span>}
                            <span style={{ background:t.uploadEnabled?'#f0fdf4':'#fef3c7', color:t.uploadEnabled?'#16a34a':'#92400e', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600 }}>{t.uploadEnabled?'🔓 Upload ON':'🔒 Upload OFF'}</span>
                          </div>
                          <h4 style={{ margin:'0 0 4px' }}>{t.title}</h4>
                          <p style={{ color:'#666', fontSize:13, marginBottom:8 }}>{t.description}</p>
                          <div style={{ display:'flex', gap:16, fontSize:12, color:'#888', flexWrap:'wrap' }}>
                            <span style={{ color:isOverdue(t.dueDate)&&t.status!=='completed'?'#dc2626':'#888', fontWeight:isOverdue(t.dueDate)&&t.status!=='completed'?600:400 }}>
                              📅 Due: {t.dueDate?new Date(t.dueDate).toLocaleDateString():'No date'}{isOverdue(t.dueDate)&&t.status!=='completed'&&' ⚠️'}
                            </span>
                            <span>👥 {t.assignedTo?.map(s=>s.name).join(', ')}</span>
                            <span>📎 {t.submissions?.length||0} submission(s)</span>
                          </div>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:6, marginLeft:16 }}>
                          {t.submissions?.length>0&&<button type="button" className="btn btn-success" onClick={() => setViewTask(t)} style={{ padding:'5px 10px', fontSize:12 }}>👁️ View</button>}
                          <button type="button" className="btn btn-warning" onClick={() => openEdit(t)} style={{ padding:'5px 10px', fontSize:12 }}>✏️ Edit</button>
                          <button type="button" onClick={() => toggleUpload(t)} style={{ padding:'5px 10px', fontSize:12, borderRadius:8, cursor:'pointer', fontWeight:600, border:'none', background:t.uploadEnabled?'#fef3c7':'#f0fdf4', color:t.uploadEnabled?'#92400e':'#16a34a' }}>{t.uploadEnabled?'🔒 Block Upload':'🔓 Enable Upload'}</button>
                          <button type="button" className="btn btn-danger" onClick={() => deleteTask(t._id)} style={{ padding:'5px 10px', fontSize:12 }}>🗑️ Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}

          {tab === 'late' && (
            <div>
              {lateTasks.length === 0 ? (
                <div className="card" style={{ textAlign:'center', color:'#888', padding:40 }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
                  <h3>No Late Submissions!</h3>
                  <p>All tasks are on time.</p>
                </div>
              ) : (
                <>
                  <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:10, padding:'12px 16px', marginBottom:16, fontSize:13, color:'#dc2626' }}>
                    ⚠️ <strong>{lateTasks.length} task(s)</strong> have passed their due date.
                  </div>
                  <div className="card" style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', minWidth:800 }}>
                      <thead>
                        <tr style={{ background:'#fef2f2' }}>
                          {['#','Group No.','Task','Students','Due Date','Days Late','Upload','Action'].map(h => (
                            <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:13, color:'#dc2626', background:'#fef2f2' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {lateTasks.map((t, i) => {
                          const daysLate = t.dueDate ? Math.ceil((new Date()-new Date(t.dueDate))/(1000*60*60*24)) : 0;
                          return (
                            <tr key={t._id} style={{ borderBottom:'1px solid #fee2e2', background:'#fff5f5' }}>
                              <td style={{ padding:'10px 12px', fontSize:13 }}>{i+1}</td>
                              <td style={{ padding:'10px 12px' }}><span style={{ background:'#0e9f8e', color:'white', padding:'2px 10px', borderRadius:20, fontSize:12, fontWeight:700 }}>{t.project?.groupNo||'-'}</span></td>
                              <td style={{ padding:'10px 12px' }}><strong style={{ fontSize:13 }}>{t.title}</strong><br/><small style={{ color:'#888' }}>{t.phase||'No phase'}</small></td>
                              <td style={{ padding:'10px 12px', fontSize:13 }}>{t.assignedTo?.map(s=>s.name).join(', ')}</td>
                              <td style={{ padding:'10px 12px', fontSize:13, color:'#dc2626', fontWeight:600 }}>{t.dueDate?new Date(t.dueDate).toLocaleDateString():'-'}</td>
                              <td style={{ padding:'10px 12px' }}><span style={{ background:'#fee2e2', color:'#dc2626', padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:700 }}>{daysLate} day{daysLate!==1?'s':''} late</span></td>
                              <td style={{ padding:'10px 12px' }}><span style={{ background:t.uploadEnabled?'#f0fdf4':'#fef3c7', color:t.uploadEnabled?'#16a34a':'#92400e', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600 }}>{t.uploadEnabled?'🔓 Enabled':'🔒 Blocked'}</span></td>
                              <td style={{ padding:'10px 12px' }}><button type="button" onClick={() => toggleUpload(t)} style={{ padding:'5px 12px', fontSize:12, borderRadius:6, cursor:'pointer', fontWeight:600, border:'none', background:t.uploadEnabled?'#fef3c7':'#f0fdf4', color:t.uploadEnabled?'#92400e':'#16a34a' }}>{t.uploadEnabled?'🔒 Block':'🔓 Enable'}</button></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Create Task Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth:520, maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ marginBottom:20 }}>Assign Task to Project Group</h3>
            <form onSubmit={createTask}>
              <div className="form-group">
                <label>Select Project Group *</label>
                <select value={form.projectId} onChange={e => setForm({...form, projectId:e.target.value})} required>
                  <option value="">-- Select Project Group --</option>
                  {projects.filter(p=>p.definitionStatus==='finalized').map(p => (
                    <option key={p._id} value={p._id}>[{p.groupNo||'-'}] {p.title||'Untitled'} ({p.students?.length||0} students)</option>
                  ))}
                </select>
                {projects.filter(p=>p.definitionStatus==='finalized').length===0&&<p style={{ color:'#dc2626', fontSize:12, marginTop:4 }}>No finalized projects. Please finalize a definition first.</p>}
              </div>
              <div className="form-group">
                <label>Project Phase *</label>
                <select value={form.phase} onChange={e => setForm({...form, phase:e.target.value})} required>
                  <option value="">-- Select Phase --</option>
                  {PHASES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Task Title *</label><input type="text" placeholder="e.g. Submit Abstract Document" value={form.title} onChange={e => setForm({...form, title:e.target.value})} required /></div>
              <div className="form-group"><label>Task Description *</label><textarea rows="3" placeholder="What students need to submit..." value={form.description} onChange={e => setForm({...form, description:e.target.value})} required style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid #d1d5db', fontSize:14 }} /></div>
              <div className="form-group">
                <label>Due Date * (Required)</label>
                <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate:e.target.value})} min={new Date().toISOString().split('T')[0]} required />
                <small style={{ color:'#888', fontSize:12 }}>Tasks past due date auto-blocked for upload.</small>
              </div>
              {form.projectId && (
                <div style={{ background:'#f0fbf9', padding:'10px 14px', borderRadius:10, marginBottom:16, fontSize:13 }}>
                  <strong>Assigned to:</strong>
                  <div style={{ marginTop:4 }}>
                    {projects.find(p=>p._id===form.projectId)?.students?.map(s => (
                      <span key={s._id} style={{ display:'inline-block', background:'white', padding:'2px 8px', borderRadius:20, fontSize:12, margin:'2px 4px 2px 0', border:'1px solid #99e3da' }}>{s.name}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ background:'#e5e7eb' }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 style={{ marginBottom:20 }}>Edit Task</h3>
            <form onSubmit={saveEdit}>
              <div className="form-group"><label>Task Title</label><input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title:e.target.value})} required /></div>
              <div className="form-group"><label>Description</label><textarea rows="3" value={editForm.description} onChange={e => setEditForm({...editForm, description:e.target.value})} style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid #d1d5db', fontSize:14 }} /></div>
              <div className="form-group"><label>Due Date</label><input type="date" value={editForm.dueDate} onChange={e => setEditForm({...editForm, dueDate:e.target.value})} /></div>
              <div className="form-group">
                <label>Status</label>
                <select value={editForm.status} onChange={e => setEditForm({...editForm, status:e.target.value})}>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="late">Late</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setEditModal(null)} style={{ background:'#e5e7eb' }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Submissions Modal */}
      {viewTask && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth:580, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ margin:0 }}>{viewTask.title} — Submissions</h3>
              <button type="button" className="btn" onClick={() => setViewTask(null)} style={{ background:'#e5e7eb' }}>Close</button>
            </div>
            {viewTask.submissions?.length === 0 ? (
              <p style={{ textAlign:'center', color:'#888' }}>No submissions yet</p>
            ) : (
              viewTask.submissions.map((sub, i) => (
                <div key={i} style={{ border:'1px solid #e7ebee', borderRadius:10, padding:16, marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <strong>{sub.student?.name||'Student'}</strong>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      {sub.isLate&&<span className="badge badge-danger">Late</span>}
                      <span style={{ color:'#888', fontSize:12 }}>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {sub.comment&&<p style={{ color:'#555', fontSize:13, marginBottom:8 }}>{sub.comment}</p>}
                  {(sub.document || sub.fileUrl) && (() => {
                    const rawUrl = sub.document || sub.fileUrl || '';
                    const dlName = (sub.student?.name || 'student').replace(/\s+/g,'_') + '_' + rawUrl.split('/').pop();
                    return (
                      <div style={{ display:'flex', gap:10 }}>
                        <button
                          type="button"
                          onClick={() => { setPreviewUrl(rawUrl); setPreviewName(dlName); }}
                          className="btn"
                          style={{ padding:'6px 14px', fontSize:13, background:'#e3f7f4', color:'#0b4f47' }}
                        >
                          👁️ Preview
                        </button>
                        <a href={`${API}/api/faculty/download?url=${encodeURIComponent(rawUrl)}&name=${encodeURIComponent(dlName)}`}
                          target="_blank" rel="noreferrer"
                          className="btn btn-primary"
                          style={{ padding:'6px 14px', fontSize:13 }}>
                          📥 Download
                        </a>
                      </div>
                    );
                  })()}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Preview modal — shows the file in an iframe before downloading */}
      {previewUrl && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000 }}>
          <div style={{ background:'white', borderRadius:16, padding:20, width:'92%', maxWidth:900, height:'88vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <h3 style={{ margin:0, fontSize:16 }}>👁️ Preview — {previewName}</h3>
              <div style={{ display:'flex', gap:10 }}>
                <a
                  href={`${API}/api/faculty/download?url=${encodeURIComponent(previewUrl)}&name=${encodeURIComponent(previewName)}`}
                  target="_blank" rel="noreferrer"
                  className="btn btn-primary" style={{ padding:'6px 14px', fontSize:13 }}
                >
                  📥 Download
                </a>
                <button type="button" className="btn" onClick={() => setPreviewUrl(null)} style={{ background:'#e5e7eb' }}>Close</button>
              </div>
            </div>
            <iframe
              src={previewUrl}
              title="Submission preview"
              style={{ flex:1, width:'100%', border:'1px solid #e5e7eb', borderRadius:8 }}
            />
          </div>
        </div>
      )}

    </div>
  );
}