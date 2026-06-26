import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_URL;

const NAV_LINKS = [
  { path: '/faculty',       label: 'Dashboard',   icon: '🏠' },
  { path: '/faculty/tasks', label: 'Manage Tasks', icon: '✅' },
];

const PHASES = [
  { value:'phase1', label:'Phase 1 — Abstract' },
  { value:'phase2', label:'Phase 2 — Introduction & Literature Review' },
  { value:'phase3', label:'Phase 3 — System Design' },
  { value:'phase4', label:'Phase 4 — Implementation' },
  { value:'phase5', label:'Phase 5 — Testing & Results' },
  { value:'phase6', label:'Phase 6 — Final Report & Presentation' },
];

export default function FacultyTasks() {
  const navigate = useNavigate();
  const [tasks,      setTasks]      = useState([]);
  const [lateTasks,  setLateTasks]  = useState([]);
  const [projects,   setProjects]   = useState([]);
  const [tab,        setTab]        = useState('all');
  const [filterPhase, setFilterPhase] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal,  setShowModal]  = useState(false);
  const [editModal,  setEditModal]  = useState(null);
  const [viewTask,   setViewTask]   = useState(null);
  const [feedbackText, setFeedbackText] = useState({});   // { studentId: 'text' }
  const [sendingFeedback, setSendingFeedback] = useState({});
  const [remarks,    setRemarks]    = useState({});  // { submissionIndex: text }
  const [savingRemark, setSavingRemark] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null); // URL to preview in modal
  const [form,       setForm]       = useState({ title:'', description:'', phase:'', projectId:'', dueDate:'' });
  const [editForm,   setEditForm]   = useState({ title:'', description:'', dueDate:'', status:'' });

  const name  = localStorage.getItem('name')  || 'Faculty';
  const token = localStorage.getItem('token') || '';
  const h = { headers: { Authorization: 'Bearer ' + token } };

  const load = () => {
    axios.get(`${API}/api/faculty/tasks`,            h).then(r => setTasks(r.data)).catch(()=>{});
    axios.get(`${API}/api/faculty/late-submissions`, h).then(r => setLateTasks(r.data)).catch(()=>{});
    axios.get(`${API}/api/faculty/projects`,         h).then(r => setProjects(r.data)).catch(()=>{});
  };
  useEffect(() => { load(); }, []);

  const logout = () => {
    ['token','role','name','id'].forEach(k => localStorage.removeItem(k));
    navigate('/login');
  };

  const createTask = async (e) => {
    e.preventDefault();
    if (!form.dueDate) return toast.error('Due date is required');
    try {
      await axios.post(`${API}/api/faculty/task`, form, h);
      toast.success('Task assigned!');
      setShowModal(false);
      setForm({ title:'', description:'', phase:'', projectId:'', dueDate:'' });
      load();
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed'); }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/api/faculty/task/${editModal._id}`, editForm, h);
      toast.success('Task updated!');
      setEditModal(null);
      load();
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed'); }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    await axios.delete(`${API}/api/faculty/task/${id}`, h);
    toast.success('Deleted');
    load();
  };

  const saveRemark = async (taskId, subIndex) => {
    setSavingRemark(subIndex);
    try {
      await axios.put(
        `${API}/api/faculty/task/${taskId}/remark/${subIndex}`,
        { remark: remarks[subIndex] || '' }, h
      );
      toast.success('Feedback saved!');
      load();
    } catch { toast.error('Failed to save feedback'); }
    finally { setSavingRemark(null); }
  };

  const sendFeedback = async (taskId, studentId) => {
    const text = (feedbackText[studentId] || '').trim();
    if (!text) return toast.error('Please write a feedback message first');
    setSendingFeedback(prev => ({ ...prev, [studentId]: true }));
    try {
      await axios.put(`${API}/api/faculty/task/${taskId}/submission/${studentId}/feedback`, { feedback: text }, h);
      toast.success('Feedback sent to student!');
      setFeedbackText(prev => ({ ...prev, [studentId]: '' }));
      load();
      // refresh viewTask with updated data
      const res = await axios.get(`${API}/api/faculty/tasks`, h);
      const updated = res.data.find(t => t._id === taskId);
      if (updated) setViewTask(updated);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to send feedback');
    } finally {
      setSendingFeedback(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const toggleUpload = async (task) => {
    try {
      const res = await axios.put(`${API}/api/faculty/task/${task._id}/enable-upload`, { enabled: !task.uploadEnabled }, h);
      toast.success(res.data.msg);
      load();
    } catch { toast.error('Failed'); }
  };

  const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date();

  let filtered = tasks;
  if (filterPhase  !== 'all') filtered = filtered.filter(t => t.phase === filterPhase);
  if (filterStatus !== 'all') filtered = filtered.filter(t => t.status === filterStatus);

  const grouped = {};
  filtered.forEach(t => {
    const key = t.project?._id || 'unknown';
    if (!grouped[key]) grouped[key] = { project:t.project, tasks:[] };
    grouped[key].tasks.push(t);
  });

  const statusConfig = {
    'pending':     { bg:'#fef3c7', color:'#92400e', label:'Pending' },
    'in-progress': { bg:'#dbeafe', color:'#1e40af', label:'In Progress' },
    'completed':   { bg:'#d1fae5', color:'#065f46', label:'Completed' },
    'late':        { bg:'#fee2e2', color:'#991b1b', label:'⚠️ Late' },
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f1f5f9', fontFamily:'Inter, system-ui, sans-serif' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width:240, minHeight:'100vh', background:'white', boxShadow:'2px 0 12px rgba(0,0,0,0.06)', display:'flex', flexDirection:'column', position:'fixed', left:0, top:0, zIndex:100 }}>
        <div style={{ padding:'28px 24px 20px', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38, height:38, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🎓</div>
            <div>
              <div style={{ fontWeight:700, fontSize:15, color:'#1e1b4b' }}>College PMS</div>
              <div style={{ fontSize:11, color:'#6366f1', fontWeight:600 }}>Faculty Portal</div>
            </div>
          </div>
        </div>
        <div style={{ padding:'20px 24px', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, color:'white', fontWeight:700, marginBottom:10 }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <div style={{ fontWeight:600, color:'#111', fontSize:14 }}>{name}</div>
          <div style={{ fontSize:12, color:'#6366f1', background:'#ede9fe', padding:'2px 8px', borderRadius:20, display:'inline-block', marginTop:4, fontWeight:600 }}>Faculty</div>
        </div>
        <nav style={{ padding:'16px 12px', flex:1 }}>
          {NAV_LINKS.map(l => {
            const active = window.location.pathname === l.path;
            return (
              <button key={l.path} onClick={() => navigate(l.path)} type="button"
                style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:10, border:'none', cursor:'pointer', background:active?'linear-gradient(135deg,#6366f1,#8b5cf6)':'transparent', color:active?'white':'#64748b', fontWeight:active?600:500, fontSize:14, marginBottom:4, textAlign:'left' }}>
                <span style={{ fontSize:18 }}>{l.icon}</span>{l.label}
              </button>
            );
          })}
        </nav>
        <div style={{ padding:'16px 12px', borderTop:'1px solid #f1f5f9' }}>
          <button onClick={logout} type="button"
            style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'none', cursor:'pointer', background:'#fef2f2', color:'#ef4444', fontWeight:600, fontSize:14, display:'flex', alignItems:'center', gap:10 }}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ marginLeft:240, flex:1, padding:'36px 40px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
          <div>
            <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:'#1e1b4b' }}>Manage Tasks</h1>
            <p style={{ margin:'4px 0 0', color:'#94a3b8', fontSize:14 }}>{tasks.length} total task{tasks.length!==1?'s':''} assigned</p>
          </div>
          <button type="button" onClick={() => setShowModal(true)}
            style={{ padding:'12px 24px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', border:'none', borderRadius:12, cursor:'pointer', fontWeight:700, fontSize:14, boxShadow:'0 4px 14px rgba(99,102,241,0.35)' }}>
            + Assign New Task
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, background:'white', borderRadius:12, padding:6, marginBottom:24, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', width:'fit-content' }}>
          {[
            { key:'all',  label:`All Tasks (${tasks.length})` },
            { key:'late', label:`⚠️ Late Submissions${lateTasks.length>0?` (${lateTasks.length})`:''}`},
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} type="button"
              style={{ padding:'9px 20px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background:tab===t.key?'linear-gradient(135deg,#6366f1,#8b5cf6)':'transparent', color:tab===t.key?'white':'#64748b', transition:'all 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'all' && (
          <>
            {/* Filters */}
            <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {['all','pending','in-progress','completed','late'].map(s => (
                  <button key={s} type="button" onClick={() => setFilterStatus(s)}
                    style={{ padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600, border:'none', cursor:'pointer', background:filterStatus===s?'#1e1b4b':'white', color:filterStatus===s?'white':'#64748b', boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
                    {s==='all'?'All Status':s.charAt(0).toUpperCase()+s.slice(1).replace('-',' ')}
                  </button>
                ))}
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <button type="button" onClick={() => setFilterPhase('all')}
                  style={{ padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600, border:'none', cursor:'pointer', background:filterPhase==='all'?'#6366f1':'white', color:filterPhase==='all'?'white':'#64748b', boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
                  All Phases
                </button>
                {PHASES.map(p => (
                  <button key={p.value} type="button" onClick={() => setFilterPhase(p.value)}
                    style={{ padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600, border:'none', cursor:'pointer', background:filterPhase===p.value?'#6366f1':'white', color:filterPhase===p.value?'white':'#64748b', boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
                    {p.label.split('—')[0].trim()}
                  </button>
                ))}
              </div>
            </div>

            {Object.keys(grouped).length === 0 && (
              <div style={{ background:'white', borderRadius:16, padding:60, textAlign:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize:64, marginBottom:16 }}>📋</div>
                <h3 style={{ color:'#1e1b4b', margin:'0 0 8px' }}>No Tasks Yet</h3>
                <p style={{ color:'#94a3b8', margin:'0 0 20px' }}>Click "+ Assign New Task" to get started.</p>
                <button type="button" onClick={() => setShowModal(true)}
                  style={{ padding:'12px 24px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', border:'none', borderRadius:12, cursor:'pointer', fontWeight:700, fontSize:14 }}>
                  + Assign New Task
                </button>
              </div>
            )}

            {Object.values(grouped).map(({ project, tasks: ptasks }) => (
              <div key={project?._id} style={{ marginBottom:28 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <h3 style={{ margin:0, color:'#1e1b4b', fontSize:16 }}>{project?.title || 'Unknown'}</h3>
                  <span style={{ background:'#6366f1', color:'white', padding:'3px 12px', borderRadius:20, fontSize:12, fontWeight:700 }}>{project?.groupNo || '-'}</span>
                  <span style={{ color:'#94a3b8', fontSize:13 }}>{ptasks.length} task{ptasks.length!==1?'s':''}</span>
                </div>
                <div style={{ display:'grid', gap:12 }}>
                  {ptasks.map(t => {
                    const sc = statusConfig[t.status] || statusConfig['pending'];
                    const overdue = isOverdue(t.dueDate) && t.status !== 'completed';
                    return (
                      <div key={t._id} style={{ background:'white', borderRadius:14, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', borderLeft:`4px solid ${t.status==='late'?'#ef4444':t.status==='completed'?'#10b981':overdue?'#f59e0b':'#6366f1'}` }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16 }}>
                          <div style={{ flex:1 }}>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10, alignItems:'center' }}>
                              {t.phase && <span style={{ background:'#ede9fe', color:'#5b21b6', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600 }}>{PHASES.find(p=>p.value===t.phase)?.label||t.phase}</span>}
                              <span style={{ background:sc.bg, color:sc.color, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>{sc.label}</span>
                              {overdue && <span style={{ background:'#fee2e2', color:'#dc2626', padding:'3px 8px', borderRadius:20, fontSize:11, fontWeight:700 }}>OVERDUE</span>}
                              <span style={{ background:t.uploadEnabled?'#d1fae5':'#fef3c7', color:t.uploadEnabled?'#065f46':'#92400e', padding:'3px 8px', borderRadius:20, fontSize:11, fontWeight:600 }}>{t.uploadEnabled?'🔓 Upload ON':'🔒 Upload OFF'}</span>
                            </div>
                            <h4 style={{ margin:'0 0 6px', color:'#1e1b4b', fontSize:15 }}>{t.title}</h4>
                            <p style={{ color:'#64748b', fontSize:13, margin:'0 0 10px', lineHeight:1.6 }}>{t.description}</p>
                            <div style={{ display:'flex', gap:16, fontSize:12, color:'#94a3b8', flexWrap:'wrap' }}>
                              <span style={{ color:overdue?'#dc2626':'#94a3b8', fontWeight:overdue?700:400 }}>📅 Due: {t.dueDate?new Date(t.dueDate).toLocaleDateString():'No date'}{overdue?' ⚠️':''}</span>
                              <span>👥 {t.assignedTo?.map(s=>s.name).join(', ')}</span>
                              <span>📎 {t.submissions?.length||0} submission(s)</span>
                            </div>
                          </div>
                          <div style={{ display:'flex', flexDirection:'column', gap:8, minWidth:130 }}>
                            {t.submissions?.length > 0 && (
                              <button type="button" onClick={() => setViewTask(t)}
                                style={{ padding:'8px 14px', background:'#d1fae5', color:'#065f46', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:12 }}>
                                👁️ View
                              </button>
                            )}
                            <button type="button" onClick={() => { setEditModal(t); setEditForm({ title:t.title||'', description:t.description||'', dueDate:t.dueDate?t.dueDate.split('T')[0]:'', status:t.status||'pending' }); }}
                              style={{ padding:'8px 14px', background:'#fef3c7', color:'#92400e', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:12 }}>
                              ✏️ Edit
                            </button>
                            <button type="button" onClick={() => toggleUpload(t)}
                              style={{ padding:'8px 14px', background:t.uploadEnabled?'#fef3c7':'#d1fae5', color:t.uploadEnabled?'#92400e':'#065f46', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:12 }}>
                              {t.uploadEnabled?'🔒 Block':'🔓 Enable'}
                            </button>
                            <button type="button" onClick={() => deleteTask(t._id)}
                              style={{ padding:'8px 14px', background:'#fee2e2', color:'#991b1b', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:12 }}>
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'late' && (
          <div>
            {lateTasks.length === 0 ? (
              <div style={{ background:'white', borderRadius:16, padding:60, textAlign:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize:64, marginBottom:16 }}>✅</div>
                <h3 style={{ color:'#1e1b4b', margin:0 }}>No Late Submissions!</h3>
                <p style={{ color:'#94a3b8', marginTop:8 }}>All tasks are on time.</p>
              </div>
            ) : (
              <>
                <div style={{ background:'linear-gradient(135deg,#fee2e2,#fecaca)', border:'1px solid #fca5a5', borderRadius:12, padding:'14px 20px', marginBottom:20, fontSize:13, color:'#991b1b', fontWeight:600 }}>
                  ⚠️ {lateTasks.length} task(s) have passed their due date.
                </div>
                <div style={{ background:'white', borderRadius:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', overflow:'hidden' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', minWidth:800 }}>
                    <thead>
                      <tr style={{ background:'#fef2f2' }}>
                        {['#','Group','Task','Students','Due Date','Days Late','Upload','Action'].map(col => (
                          <th key={col} style={{ padding:'14px 16px', textAlign:'left', fontSize:12, fontWeight:700, color:'#991b1b', letterSpacing:0.5, textTransform:'uppercase' }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lateTasks.map((t, i) => {
                        const daysLate = t.dueDate ? Math.ceil((new Date()-new Date(t.dueDate))/(1000*60*60*24)) : 0;
                        return (
                          <tr key={t._id} style={{ borderBottom:'1px solid #fee2e2' }}>
                            <td style={{ padding:'14px 16px', fontSize:13, color:'#64748b' }}>{i+1}</td>
                            <td style={{ padding:'14px 16px' }}><span style={{ background:'#6366f1', color:'white', padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:700 }}>{t.project?.groupNo||'-'}</span></td>
                            <td style={{ padding:'14px 16px' }}><strong style={{ fontSize:13, color:'#1e1b4b' }}>{t.title}</strong><br/><small style={{ color:'#94a3b8' }}>{t.phase||''}</small></td>
                            <td style={{ padding:'14px 16px', fontSize:13, color:'#475569' }}>{t.assignedTo?.map(s=>s.name).join(', ')}</td>
                            <td style={{ padding:'14px 16px', fontSize:13, color:'#dc2626', fontWeight:700 }}>{t.dueDate?new Date(t.dueDate).toLocaleDateString():'-'}</td>
                            <td style={{ padding:'14px 16px' }}><span style={{ background:'#fee2e2', color:'#dc2626', padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700 }}>{daysLate}d late</span></td>
                            <td style={{ padding:'14px 16px' }}><span style={{ background:t.uploadEnabled?'#d1fae5':'#fef3c7', color:t.uploadEnabled?'#065f46':'#92400e', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600 }}>{t.uploadEnabled?'🔓 Enabled':'🔒 Blocked'}</span></td>
                            <td style={{ padding:'14px 16px' }}><button type="button" onClick={() => toggleUpload(t)} style={{ padding:'7px 14px', fontSize:12, borderRadius:8, cursor:'pointer', fontWeight:600, border:'none', background:t.uploadEnabled?'#fef3c7':'#d1fae5', color:t.uploadEnabled?'#92400e':'#065f46' }}>{t.uploadEnabled?'🔒 Block':'🔓 Enable'}</button></td>
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
      </main>

      {/* ── CREATE TASK MODAL ── */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(4px)' }}>
          <div style={{ background:'white', borderRadius:20, padding:36, width:'100%', maxWidth:540, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 25px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <h3 style={{ margin:0, color:'#1e1b4b', fontSize:18 }}>Assign New Task</h3>
              <button type="button" onClick={() => setShowModal(false)} style={{ background:'#f1f5f9', border:'none', borderRadius:10, width:36, height:36, cursor:'pointer', fontSize:18 }}>✕</button>
            </div>
            <form onSubmit={createTask}>
              {[
                { label:'Select Project Group *', type:'select', field:'projectId',
                  options: projects.filter(p=>p.definitionStatus==='finalized').map(p => ({ value:p._id, label:`[${p.groupNo||'-'}] ${p.title||'Untitled'} (${p.students?.length||0} students)` })),
                  placeholder:'-- Select Project Group --' },
                { label:'Project Phase *', type:'select', field:'phase',
                  options: PHASES.map(p => ({ value:p.value, label:p.label })),
                  placeholder:'-- Select Phase --' },
              ].map(f => (
                <div key={f.field} style={{ marginBottom:18 }}>
                  <label style={{ display:'block', marginBottom:6, fontWeight:600, color:'#374151', fontSize:13 }}>{f.label}</label>
                  <select value={form[f.field]} onChange={e => setForm({...form,[f.field]:e.target.value})} required
                    style={{ width:'100%', padding:'11px 14px', border:'1px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', background:'white', boxSizing:'border-box' }}>
                    <option value="">{f.placeholder}</option>
                    {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  {f.field === 'projectId' && projects.filter(p=>p.definitionStatus==='finalized').length === 0 && (
                    <p style={{ color:'#dc2626', fontSize:12, margin:'4px 0 0' }}>No finalized projects. Please finalize a definition first.</p>
                  )}
                </div>
              ))}
              {[
                { label:'Task Title *', field:'title', placeholder:'e.g. Submit Abstract Document' },
              ].map(f => (
                <div key={f.field} style={{ marginBottom:18 }}>
                  <label style={{ display:'block', marginBottom:6, fontWeight:600, color:'#374151', fontSize:13 }}>{f.label}</label>
                  <input type="text" placeholder={f.placeholder} value={form[f.field]} onChange={e => setForm({...form,[f.field]:e.target.value})} required
                    style={{ width:'100%', padding:'11px 14px', border:'1px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box' }} />
                </div>
              ))}
              <div style={{ marginBottom:18 }}>
                <label style={{ display:'block', marginBottom:6, fontWeight:600, color:'#374151', fontSize:13 }}>Task Description *</label>
                <textarea rows="3" placeholder="What students need to submit..." value={form.description} onChange={e => setForm({...form,description:e.target.value})} required
                  style={{ width:'100%', padding:'11px 14px', border:'1px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', resize:'vertical', boxSizing:'border-box' }} />
              </div>
              <div style={{ marginBottom:24 }}>
                <label style={{ display:'block', marginBottom:6, fontWeight:600, color:'#374151', fontSize:13 }}>Due Date *</label>
                <input type="date" value={form.dueDate} onChange={e => setForm({...form,dueDate:e.target.value})} min={new Date().toISOString().split('T')[0]} required
                  style={{ width:'100%', padding:'11px 14px', border:'1px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box' }} />
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding:'11px 24px', borderRadius:10, border:'none', background:'#f1f5f9', color:'#475569', cursor:'pointer', fontWeight:600 }}>Cancel</button>
                <button type="submit" style={{ padding:'11px 24px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', cursor:'pointer', fontWeight:700 }}>Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT TASK MODAL ── */}
      {editModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(4px)' }}>
          <div style={{ background:'white', borderRadius:20, padding:36, width:'100%', maxWidth:480, boxShadow:'0 25px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <h3 style={{ margin:0, color:'#1e1b4b' }}>Edit Task</h3>
              <button type="button" onClick={() => setEditModal(null)} style={{ background:'#f1f5f9', border:'none', borderRadius:10, width:36, height:36, cursor:'pointer', fontSize:18 }}>✕</button>
            </div>
            <form onSubmit={saveEdit}>
              {[
                { label:'Task Title', field:'title', type:'text' },
              ].map(f => (
                <div key={f.field} style={{ marginBottom:18 }}>
                  <label style={{ display:'block', marginBottom:6, fontWeight:600, color:'#374151', fontSize:13 }}>{f.label}</label>
                  <input type={f.type} value={editForm[f.field]} onChange={e => setEditForm({...editForm,[f.field]:e.target.value})} required
                    style={{ width:'100%', padding:'11px 14px', border:'1px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box' }} />
                </div>
              ))}
              <div style={{ marginBottom:18 }}>
                <label style={{ display:'block', marginBottom:6, fontWeight:600, color:'#374151', fontSize:13 }}>Description</label>
                <textarea rows="3" value={editForm.description} onChange={e => setEditForm({...editForm,description:e.target.value})
                } style={{ width:'100%', padding:'11px 14px', border:'1px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', resize:'vertical', boxSizing:'border-box' }} />
              </div>
              <div style={{ marginBottom:18 }}>
                <label style={{ display:'block', marginBottom:6, fontWeight:600, color:'#374151', fontSize:13 }}>Due Date</label>
                <input type="date" value={editForm.dueDate} onChange={e => setEditForm({...editForm,dueDate:e.target.value})}
                  style={{ width:'100%', padding:'11px 14px', border:'1px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box' }} />
              </div>
              <div style={{ marginBottom:24 }}>
                <label style={{ display:'block', marginBottom:6, fontWeight:600, color:'#374151', fontSize:13 }}>Status</label>
                <select value={editForm.status} onChange={e => setEditForm({...editForm,status:e.target.value})}
                  style={{ width:'100%', padding:'11px 14px', border:'1px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', background:'white', boxSizing:'border-box' }}>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="late">Late</option>
                </select>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" onClick={() => setEditModal(null)} style={{ padding:'11px 24px', borderRadius:10, border:'none', background:'#f1f5f9', color:'#475569', cursor:'pointer', fontWeight:600 }}>Cancel</button>
                <button type="submit" style={{ padding:'11px 24px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', cursor:'pointer', fontWeight:700 }}>Update Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VIEW SUBMISSIONS MODAL ── */}
      {viewTask && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(4px)' }}>
          <div style={{ background:'white', borderRadius:20, padding:36, width:'100%', maxWidth:580, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 25px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <div>
                <h3 style={{ margin:0, color:'#1e1b4b' }}>{viewTask.title}</h3>
                <p style={{ margin:'4px 0 0', color:'#94a3b8', fontSize:13 }}>Submissions ({viewTask.submissions?.length || 0})</p>
              </div>
              <button type="button" onClick={() => setViewTask(null)} style={{ background:'#f1f5f9', border:'none', borderRadius:10, width:36, height:36, cursor:'pointer', fontSize:18 }}>✕</button>
            </div>
            {viewTask.submissions?.length === 0 ? (
              <div style={{ textAlign:'center', color:'#94a3b8', padding:40 }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
                No submissions yet
              </div>
            ) : (
              viewTask.submissions.map((sub, i) => (
                <div key={i} style={{ border:'1px solid #e2e8f0', borderRadius:14, padding:20, marginBottom:16 }}>
                  {/* Header */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:16 }}>
                        {(sub.student?.name||'S').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight:700, color:'#1e1b4b', fontSize:14 }}>{sub.student?.name || 'Student'}</div>
                        <div style={{ fontSize:12, color:'#94a3b8' }}>Submitted: {new Date(sub.submittedAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      {sub.isLate && <span style={{ background:'#fee2e2', color:'#dc2626', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>⚠️ Late</span>}
                      {sub.facultyRemark && <span style={{ background:'#fef3c7', color:'#92400e', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>💬 Feedback Given</span>}
                    </div>
                  </div>

                  {/* Student comment */}
                  {sub.comment && (
                    <div style={{ background:'#f8fafc', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:13, color:'#475569', lineHeight:1.6 }}>
                      <span style={{ fontWeight:600, color:'#374151' }}>Student note: </span>{sub.comment}
                    </div>
                  )}

                  {/* Download */}
                  {(sub.document || sub.fileUrl) && (() => {
                    const rawUrl = (sub.document || sub.fileUrl || '').replace('/image/upload/', '/raw/upload/');
                    const dlName = (sub.student?.name||'student').replace(/\s+/g,'_') + '_' + rawUrl.split('/').pop();
                    const previewUrl = `${API}/api/faculty/download?url=${encodeURIComponent(rawUrl)}&name=${encodeURIComponent(dlName)}&preview=1`;
                    const downloadUrl = `${API}/api/faculty/download?url=${encodeURIComponent(rawUrl)}&name=${encodeURIComponent(dlName)}`;
                    return (
                      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
                        <button type="button" onClick={() => setPdfPreview(previewUrl)}
                          style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', background:'#eff6ff', color:'#1d4ed8', border:'1px solid #bfdbfe', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                          👁️ Preview PDF
                        </button>
                        <a href={downloadUrl} target="_blank" rel="noreferrer"
                          style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', borderRadius:8, fontSize:13, fontWeight:600, textDecoration:'none' }}>
                          📥 Download Submission
                        </a>
                      </div>
                    );
                  })()}

                  {/* Faculty Feedback Section */}
                  <div style={{ borderTop:'1px solid #f1f5f9', paddingTop:14 }}>
                    <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#374151', marginBottom:8 }}>
                      💬 Faculty Feedback / Change Request
                      {sub.remarkAt && <span style={{ fontSize:11, color:'#94a3b8', fontWeight:400, marginLeft:8 }}>Last updated: {new Date(sub.remarkAt).toLocaleDateString()}</span>}
                    </label>

                    {/* Show existing remark if any */}
                    {sub.facultyRemark && remarks[i] === undefined && (
                      <div style={{ background:'#fef9c3', border:'1px solid #fde68a', borderRadius:8, padding:'10px 14px', marginBottom:10, fontSize:13, color:'#78350f', lineHeight:1.6 }}>
                        {sub.facultyRemark}
                      </div>
                    )}

                    <textarea
                      rows="3"
                      placeholder="Write feedback or change request for the student (e.g. 'Please revise the introduction section and resubmit')..."
                      value={remarks[i] !== undefined ? remarks[i] : (sub.facultyRemark || '')}
                      onChange={e => setRemarks(prev => ({ ...prev, [i]: e.target.value }))}
                      style={{ width:'100%', padding:'10px 14px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13, lineHeight:1.6, resize:'vertical', outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}
                    />
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
                      <p style={{ margin:0, fontSize:11, color:'#94a3b8' }}>
                        Student will see this feedback on their Tasks page.
                      </p>
                      <button type="button"
                        onClick={() => saveRemark(viewTask._id, i)}
                        disabled={savingRemark === i}
                        style={{ padding:'8px 18px', background: savingRemark===i ? '#a5b4fc' : 'linear-gradient(135deg,#f59e0b,#d97706)', color:'white', border:'none', borderRadius:8, cursor: savingRemark===i ? 'not-allowed' : 'pointer', fontWeight:700, fontSize:13 }}>
                        {savingRemark === i ? 'Saving...' : sub.facultyRemark ? '✏️ Update Feedback' : '💬 Send Feedback'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {/* PDF Preview Modal */}
      {pdfPreview && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'white', borderRadius:12, width:'90vw', height:'90vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 20px', borderBottom:'1px solid #e7ebee' }}>
              <strong style={{ fontSize:15 }}>📄 PDF Preview</strong>
              <button type="button" onClick={() => setPdfPreview(null)}
                style={{ background:'#f1f5f9', border:'none', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontWeight:600, fontSize:13 }}>
                ✕ Close
              </button>
            </div>
            <iframe
              src={pdfPreview}
              title="PDF Preview"
              style={{ flex:1, border:'none', width:'100%' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}