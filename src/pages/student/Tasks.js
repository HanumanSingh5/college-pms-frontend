import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_URL;

const links = [
  { path: '/student',            label: 'Dashboard',   icon: '📊' },
  { path: '/student/team',       label: 'My Team',     icon: '👥' },
  { path: '/student/definition', label: 'Definitions', icon: '📝' },
  { path: '/student/tasks',      label: 'My Tasks',    icon: '✅' },
];

const PHASES = [
  { value: 'phase1', label: 'Phase 1 — Abstract' },
  { value: 'phase2', label: 'Phase 2 — Introduction & Literature Review' },
  { value: 'phase3', label: 'Phase 3 — System Design' },
  { value: 'phase4', label: 'Phase 4 — Implementation' },
  { value: 'phase5', label: 'Phase 5 — Testing & Results' },
  { value: 'phase6', label: 'Phase 6 — Final Report & Presentation' },
];

export default function StudentTasks() {
  const location = useLocation();
  const [tasks, setTasks]               = useState([]);
  const [uploadingId, setUploadingId]   = useState(null);
  const [comment, setComment]           = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentTask, setCurrentTask]   = useState(null);
  // 'all' | 'pending' | 'completed' — set from Dashboard stat-card clicks via navigation state
  const [filterStatus, setFilterStatus] = useState('all');
  const token     = localStorage.getItem('token');
  const studentId = localStorage.getItem('id');
  const h = { headers: { Authorization: 'Bearer ' + token } };

  const load = () => {
    axios.get(`${API}/api/student/tasks`, h).then(r => setTasks(r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  // Pick up the status filter passed from the Dashboard's stat cards
  useEffect(() => {
    const incoming = location.state?.statusFilter;
    if (incoming) setFilterStatus(incoming); // 'all' | 'pending' | 'completed'
  }, [location.state]);

  const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date();

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${API}/api/student/task/${id}/status`, { status }, h);
      toast.success('Status updated!');
      load();
    } catch { toast.error('Failed to update status'); }
  };

  const openUpload = (task) => {
    setCurrentTask(task);
    setComment('');
    setSelectedFile(null);
    setShowUploadModal(true);
  };

  const submitUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return toast.error('Please select a file');
    setUploadingId(currentTask._id);
    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('comment', comment);
    try {
      const res = await axios.post(
        `${API}/api/student/task/${currentTask._id}/upload`,
        formData,
        { headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'multipart/form-data' } }
      );
      if (res.data.isLate) {
        toast.warning('Submitted as late submission!');
      } else {
        toast.success('Task submitted successfully!');
      }
      setShowUploadModal(false);
      load();
    } catch (err) {
      if (err.response?.data?.uploadBlocked) {
        toast.error('Upload blocked! Your due date has passed. Contact faculty or admin to enable upload.');
      } else {
        toast.error(err.response?.data?.msg || 'Upload failed');
      }
    } finally {
      setUploadingId(null);
    }
  };

  const statusColor = {
    pending:       'badge-warning',
    'in-progress': 'badge-info',
    completed:     'badge-success',
    late:          'badge-danger',
  };

  // Apply status filter before grouping by phase
  // (pending bucket = anything not yet completed, matching faculty-side logic)
  const filteredTasks = tasks.filter(t => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'completed') return t.status === 'completed';
    if (filterStatus === 'pending') return t.status !== 'completed';
    return true;
  });

  const grouped = {};
  PHASES.forEach(p => { grouped[p.value] = []; });
  filteredTasks.forEach(t => {
    if (t.phase && grouped[t.phase] !== undefined) {
      grouped[t.phase].push(t);
    } else {
      if (!grouped['other']) grouped['other'] = [];
      grouped['other'].push(t);
    }
  });

  const canUpload = (task) => {
    const mySubmission = task.submissions?.find(s => s.student?._id===studentId || s.student===studentId);
    if (mySubmission) return false;
    if (!task.uploadEnabled) return false;
    return true;
  };

  const getUploadBlockReason = (task) => {
    const mySubmission = task.submissions?.find(s => s.student?._id===studentId || s.student===studentId);
    if (mySubmission) return null;
    if (!task.uploadEnabled && isOverdue(task.dueDate)) return 'blocked';
    if (!task.uploadEnabled) return 'disabled';
    return null;
  };

  const statusFilterStyle = (s) => ({
    padding:'6px 14px', borderRadius:8, fontSize:12, border:'1px solid #d1d5db', cursor:'pointer',
    background: filterStatus === s ? '#16a34a' : 'white',
    color: filterStatus === s ? 'white' : '#555',
  });

  return (
    <div>
      <Navbar title="Student Portal" />
      <div className="layout">
        <Sidebar links={links} />
        <div className="main-content">
          <h2 style={{ marginBottom:16 }}>My Tasks</h2>

          {/* Status filter (Pending / Completed / All) — driven by Dashboard stat-card clicks, also clickable here */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
            <button type="button" onClick={() => setFilterStatus('all')} style={statusFilterStyle('all')}>All Status</button>
            <button type="button" onClick={() => setFilterStatus('pending')} style={statusFilterStyle('pending')}>⏳ Pending</button>
            <button type="button" onClick={() => setFilterStatus('completed')} style={statusFilterStyle('completed')}>✅ Completed</button>
          </div>

          {filteredTasks.length===0 && (
            <div className="card" style={{ textAlign:'center', color:'#888', padding:40 }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
              <h3>No Tasks Found</h3>
              <p>{tasks.length===0 ? 'Your faculty will assign tasks to your group.' : 'Try a different filter above.'}</p>
            </div>
          )}

          {PHASES.map(phase => {
            const phaseTasks = grouped[phase.value] || [];
            if (phaseTasks.length === 0) return null;
            return (
              <div key={phase.value} style={{ marginBottom:28 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, padding:'8px 16px', background:'#f0f4ff', borderRadius:8, borderLeft:'4px solid #4f46e5' }}>
                  <h3 style={{ margin:0, color:'#4f46e5', fontSize:15 }}>{phase.label}</h3>
                  <span style={{ background:'#4f46e5', color:'white', padding:'2px 8px', borderRadius:20, fontSize:12 }}>{phaseTasks.length} task(s)</span>
                </div>

                {phaseTasks.map(t => {
                  const mySubmission = t.submissions?.find(s => s.student?._id===studentId || s.student===studentId);
                  const overdue      = isOverdue(t.dueDate);
                  const blockReason  = getUploadBlockReason(t);
                  const uploadAllowed = canUpload(t);

                  return (
                    <div key={t._id} className="card" style={{
                      marginBottom:12,
                      borderLeft: t.status==='late'?'4px solid #ef4444': t.status==='completed'?'4px solid #16a34a': overdue?'4px solid #f97316':'4px solid #e5e7eb'
                    }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                            <h4 style={{ margin:0 }}>{t.title}</h4>
                            <span className={'badge '+(statusColor[t.status]||'badge-warning')}>{t.status==='late'?'⚠️ Late':t.status}</span>
                            {overdue&&t.status!=='completed'&&<span style={{ background:'#fee2e2', color:'#dc2626', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600 }}>OVERDUE</span>}
                            {!t.uploadEnabled&&!mySubmission&&<span style={{ background:'#fef3c7', color:'#92400e', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600 }}>🔒 UPLOAD BLOCKED</span>}
                          </div>

                          <p style={{ color:'#666', fontSize:13, marginBottom:8 }}>{t.description}</p>

                          <div style={{ display:'flex', gap:16, fontSize:12, color:'#888', flexWrap:'wrap' }}>
                            <span style={{ color:overdue&&t.status!=='completed'?'#dc2626':'#888', fontWeight:overdue&&t.status!=='completed'?600:400 }}>
                              📅 Due: {t.dueDate?new Date(t.dueDate).toLocaleDateString():'No date'}{overdue&&t.status!=='completed'&&' ⚠️'}
                            </span>
                            <span>👨‍🏫 {t.assignedBy?.name}</span>
                            <span>📁 {t.project?.title}</span>
                          </div>

                          {blockReason==='blocked'&&(
                            <div style={{ background:'#fef3c7', border:'1px solid #fcd34d', borderRadius:8, padding:'10px 14px', marginTop:10, fontSize:13, color:'#92400e' }}>
                              🔒 <strong>Upload Blocked:</strong> This task is past its due date. Your faculty or admin needs to enable upload before you can submit.
                            </div>
                          )}
                          {blockReason==='disabled'&&(
                            <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:8, padding:'10px 14px', marginTop:10, fontSize:13, color:'#dc2626' }}>
                              🔒 <strong>Upload Disabled:</strong> Your faculty or admin has disabled upload for this task.
                            </div>
                          )}

                          {mySubmission&&(
                            <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'10px 14px', marginTop:10, fontSize:13 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                                <strong style={{ color:'#16a34a' }}>✅ Submitted</strong>
                                {mySubmission.isLate&&<span className="badge badge-danger">Late Submission</span>}
                                <span style={{ color:'#888' }}>on {new Date(mySubmission.submittedAt).toLocaleDateString()}</span>
                              </div>
                              {mySubmission.comment&&<p style={{ margin:'4px 0', color:'#555' }}>{mySubmission.comment}</p>}
                              {(() => {
                                const rawUrl = mySubmission.document || mySubmission.fileUrl || '';
                                const dlUrl = `${API}/api/student/download?url=${encodeURIComponent(rawUrl)}&name=${encodeURIComponent('my_submission_' + rawUrl.split('/').pop())}`;
                                return (
                                  <a href={dlUrl}
                                    target="_blank" rel="noreferrer"
                                    style={{ color:'#4f46e5', fontSize:12 }}>
                                    📄 View my submission
                                  </a>
                                );
                              })()}
                            </div>
                          )}
                        </div>

                        <div style={{ display:'flex', flexDirection:'column', gap:8, marginLeft:16 }}>
                          {t.status==='pending'&&!overdue&&(
                            <button type="button" className="btn btn-warning" onClick={() => updateStatus(t._id,'in-progress')} style={{ fontSize:12, padding:'6px 12px' }}>▶ Start</button>
                          )}
                          {uploadAllowed&&(
                            <button type="button" className="btn btn-primary" onClick={() => openUpload(t)} disabled={uploadingId===t._id} style={{ fontSize:12, padding:'6px 12px' }}>📤 Submit</button>
                          )}
                          {!uploadAllowed&&!mySubmission&&blockReason&&(
                            <div style={{ background:'#f3f4f6', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 12px', fontSize:11, color:'#6b7280', textAlign:'center', maxWidth:100 }}>🔒 Blocked</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

        </div>
      </div>

      {showUploadModal && currentTask && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'white', borderRadius:16, padding:32, width:'100%', maxWidth:480, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ marginBottom:8 }}>📤 Submit Task</h3>
            <p style={{ color:'#888', fontSize:13, marginBottom:20 }}>{currentTask.title}</p>
            {isOverdue(currentTask.dueDate)&&(
              <div style={{ background:'#fef3c7', border:'1px solid #fcd34d', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#92400e' }}>
                ⚠️ This task is past due date. It will be marked as a <strong>late submission</strong>.
              </div>
            )}
            <form onSubmit={submitUpload}>
              <div className="form-group">
                <label>Upload Document *</label>
                <input type="file" accept=".pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx,.zip,.txt" onChange={e => setSelectedFile(e.target.files[0])} required style={{ width:'100%', padding:'10px 14px', border:'2px dashed #c7d2fe', borderRadius:8, fontSize:14, cursor:'pointer', boxSizing:'border-box' }} />
                <small style={{ color:'#888', fontSize:12 }}>PDF, Word, Excel, PPT, ZIP accepted</small>
              </div>
              <div className="form-group">
                <label>Comment (optional)</label>
                <textarea rows="3" placeholder="Add notes about your submission..." value={comment} onChange={e => setComment(e.target.value)} style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid #d1d5db', fontSize:14 }} />
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:16 }}>
                <button type="button" className="btn" onClick={() => setShowUploadModal(false)} style={{ background:'#e5e7eb' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={uploadingId===currentTask._id}>
                  {uploadingId===currentTask._id?'Uploading...':'📤 Submit Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}