import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_URL;

const links = [
  { path: '/faculty',       label: 'Dashboard',   icon: '📊' },
  { path: '/faculty/tasks', label: 'Manage Tasks', icon: '✅' },
];

export default function FacultyDashboard() {
  const [stats, setStats]       = useState({});
  const [projects, setProjects] = useState([]);
  const [tab, setTab]           = useState('projects');
  const [selectModal, setSelectModal] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [editedDef, setEditedDef]     = useState('');
  const [finalizing, setFinalizing]   = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedAttendanceProject, setSelectedAttendanceProject] = useState('');
  const [attendanceDrafts, setAttendanceDrafts] = useState({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const token = localStorage.getItem('token');
  const name  = localStorage.getItem('name') || 'Faculty';
  const h = { headers: { Authorization: 'Bearer ' + token } };
  const navigate = useNavigate();

  const load = () => {
    axios.get(`${API}/api/faculty/stats`,    h).then(r => setStats(r.data));
    axios.get(`${API}/api/faculty/projects`, h).then(r => setProjects(r.data));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (tab === 'attendance' && projects.length > 0 && !selectedAttendanceProject) {
      setSelectedAttendanceProject(projects[0]._id);
    }
  }, [tab, projects, selectedAttendanceProject]);

  useEffect(() => {
    if (tab === 'attendance' && selectedAttendanceProject) {
      const loadAttendance = async () => {
        try {
          const res = await axios.get(`${API}/api/faculty/attendance/${selectedAttendanceProject}?date=${attendanceDate}`, h);
          const draft = {};
          (res.data.project?.students || []).forEach((student) => {
            draft[student._id] = res.data.attendance?.[student._id] || 'absent';
          });
          setAttendanceDrafts(prev => ({ ...prev, [selectedAttendanceProject]: draft }));
        } catch (err) {
          console.log('Attendance load error', err.message);
        }
      };
      loadAttendance();
    }
  }, [tab, selectedAttendanceProject, attendanceDate, h]);

  const openSelectModal = (project) => {
    setSelectModal(project);
    const idx = project.selectedDefinition >= 0 ? project.selectedDefinition : 0;
    setSelectedIdx(idx);
    setEditedDef(project.finalDefinition || project.definitions?.[idx]?.description || '');
  };

  const onSelectDef = (idx) => {
    setSelectedIdx(idx);
    setEditedDef(selectModal.definitions[idx]?.description || '');
  };

  const finalizeDefinition = async (e) => {
    e.preventDefault();
    setFinalizing(true);
    try {
      await axios.put(
        `${API}/api/faculty/project/${selectModal._id}/select-definition`,
        { selectedIndex: selectedIdx, finalDefinition: editedDef }, h
      );
      toast.success('Definition finalized! Students can now see it.');
      setSelectModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed');
    } finally {
      setFinalizing(false);
    }
  };

  // Pill-style tabs (replacing the old underline tabs) to match the new look
  const pillTab = (t) => ({
    padding: '8px 18px',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    background: tab === t ? '#0e9f8e' : 'white',
    color: tab === t ? 'white' : '#555',
    border: tab === t ? 'none' : '1px solid #e7ebee',
    transition: '0.15s',
  });

  const goToProjects = () => setTab('projects');
  const goToTasks = (status) => navigate('/faculty/tasks', { state: { statusFilter: status } });

  const updateAttendanceStatus = (studentId, status) => {
    setAttendanceDrafts(prev => ({
      ...prev,
      [selectedAttendanceProject]: {
        ...(prev[selectedAttendanceProject] || {}),
        [studentId]: status,
      },
    }));
  };

  const saveAttendance = async () => {
    if (!selectedAttendanceProject) return;
    setSavingAttendance(true);
    try {
      const entries = Object.entries(attendanceDrafts[selectedAttendanceProject] || {}).map(([studentId, status]) => ({ studentId, status }));
      await axios.put(`${API}/api/faculty/attendance/${selectedAttendanceProject}`, { date: attendanceDate, entries }, h);
      toast.success('Attendance saved');
    } catch (err) {
      const message = err.response?.data?.msg || err.message || 'Could not save attendance';
      toast.error(message);
      console.error('Attendance save failed:', err.response?.data || err);
    } finally {
      setSavingAttendance(false);
    }
  };

  const statCards = [
    { icon: '📁', value: stats.projects || 0, label: 'Assigned Projects', onClick: goToProjects, accent: '#0e9f8e' },
    { icon: '✅', value: stats.tasks    || 0, label: 'Tasks Assigned',    onClick: () => goToTasks('all'),       accent: '#2563eb' },
    { icon: '⏳', value: stats.pending  || 0, label: 'Pending',           onClick: () => goToTasks('pending'),   accent: '#d97706' },
    { icon: '🏆', value: stats.completed|| 0, label: 'Completed',         onClick: () => goToTasks('completed'), accent: '#16a34a' },
  ];

  return (
    <div>
      <Navbar title="Faculty Portal" />
      <div className="layout">
        <Sidebar links={links} />
        <div className="main-content">

          {/* Signature hero banner */}
          <div style={{
            background: 'linear-gradient(135deg,#0b4f47,#0e9f8e)',
            borderRadius: 18,
            padding: '26px 30px',
            color: 'white',
            marginBottom: 24,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position:'absolute', top:-40, right:-40, width:180, height:180,
              borderRadius:'50%', background:'rgba(255,255,255,0.08)'
            }} />
            <div style={{
              position:'absolute', bottom:-60, right:60, width:140, height:140,
              borderRadius:'50%', background:'rgba(255,255,255,0.06)'
            }} />
            <p style={{ margin:0, fontSize:12, letterSpacing:'0.08em', opacity:0.75, fontWeight:600, textTransform:'uppercase' }}>Faculty Portal</p>
            <h2 style={{ margin:'6px 0 4px', fontSize:24 }}>Good day, {name} 👋</h2>
            <p style={{ margin:0, opacity:0.85, fontSize:14 }}>
              {stats.projects || 0} project group{stats.projects === 1 ? '' : 's'} assigned to you
            </p>
          </div>

          {/* Stat cards — clickable, icon-led */}
          <div className="stats-grid" style={{ marginBottom:24 }}>
            {statCards.map((c) => (
              <div
                key={c.label}
                className="stat-card"
                onClick={c.onClick}
                role="button"
                tabIndex={0}
                style={{ cursor:'pointer', textAlign:'left', display:'flex', flexDirection:'column', gap:10 }}
              >
                <div style={{
                  width:38, height:38, borderRadius:10,
                  background: c.accent + '1a',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:18
                }}>
                  {c.icon}
                </div>
                <div>
                  <h3 style={{ color: c.accent, margin:0 }}>{c.value}</h3>
                  <p style={{ margin:'2px 0 0' }}>{c.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pill tabs */}
          <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
            <button style={pillTab('projects')}    onClick={() => setTab('projects')}    type="button">📁 My Projects</button>
            <button style={pillTab('students')}    onClick={() => setTab('students')}    type="button">👥 Student Details</button>
            <button style={pillTab('attendance')}  onClick={() => setTab('attendance')}  type="button">🗓️ Attendance</button>
            <button style={{ ...pillTab('definitions'), display:'inline-flex', alignItems:'center', gap:6 }} onClick={() => setTab('definitions')} type="button">
              📝 Definitions
              {projects.filter(p=>p.definitions?.length>0&&p.definitionStatus!=='finalized').length>0&&(
                <span style={{ background:'#ef4444', color:'white', borderRadius:'50%', fontSize:11, padding:'1px 6px' }}>
                  {projects.filter(p=>p.definitions?.length>0&&p.definitionStatus!=='finalized').length}
                </span>
              )}
            </button>
          </div>

          {tab==='projects' && (
            <div>
              {projects.length===0&&<div className="card" style={{ textAlign:'center', color:'#888', padding:40 }}><div style={{ fontSize:48, marginBottom:12 }}>📭</div><h3>No Projects Assigned Yet</h3></div>}
              {projects.map(p => (
                <div className="card" key={p._id} style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, flexWrap:'wrap' }}>
                        <h3 style={{ margin:0 }}>{p.title||'Title not set'}</h3>
                        <span style={{ background:'#e3f7f4', color:'#0b4f47', padding:'2px 10px', borderRadius:20, fontSize:12 }}>Group: {p.groupNo||'-'}</span>
                        <span className={p.definitionStatus==='finalized'?'badge badge-success':p.definitionStatus==='submitted'?'badge badge-info':'badge badge-warning'}>
                          {p.definitionStatus==='finalized'?'✅ Finalized':p.definitionStatus==='submitted'?'📤 '+(p.definitions?.length||0)+' Definitions Submitted':'⏳ Pending'}
                        </span>
                      </div>
                      <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
                        {p.frontend&&<span style={{ background:'#eff6ff', color:'#1d4ed8', padding:'2px 10px', borderRadius:6, fontSize:12 }}>Frontend: {p.frontend}</span>}
                        {p.backend&&<span style={{ background:'#fef9c3', color:'#854d0e', padding:'2px 10px', borderRadius:6, fontSize:12 }}>Backend: {p.backend}</span>}
                      </div>
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                        {p.students?.map(s => <span key={s._id} style={{ background:'#f0fbf9', padding:'3px 10px', borderRadius:6, fontSize:12 }}>{s.name} ({s.enrollment||'-'})</span>)}
                      </div>
                    </div>
                    <div style={{ marginLeft:16 }}>
                      {p.definitionStatus==='submitted'&&<button className="btn btn-primary" type="button" onClick={() => openSelectModal(p)} style={{ whiteSpace:'nowrap' }}>✅ Select Definition</button>}
                      {p.definitionStatus==='finalized'&&<button className="btn btn-warning" type="button" onClick={() => openSelectModal(p)} style={{ whiteSpace:'nowrap', fontSize:12 }}>✏️ Change</button>}
                      {p.definitionStatus==='pending'&&<span style={{ color:'#aaa', fontSize:13 }}>Waiting for student...</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab==='students' && (
            <div className="card" style={{ overflowX:'auto' }}>
              <table style={{ minWidth:900 }}>
                <thead><tr><th>#</th><th>Group</th><th>Name</th><th>Enrollment</th><th>Class</th><th>Email</th><th>Mobile</th><th>Role</th></tr></thead>
                <tbody>
                  {projects.flatMap((p, pi) => {
                    const rows = [];
                    let counter = 0;
                    (p.students || []).forEach((s) => {
                      counter++;
                      rows.push(
                        <tr key={p._id + s._id + '-leader'}>
                          <td>{pi * 100 + counter}</td>
                          <td><span style={{ background:'#e3f7f4', color:'#0b4f47', padding:'2px 8px', borderRadius:20, fontSize:12 }}>{p.groupNo || '-'}</span></td>
                          <td><strong>{s.name}</strong></td>
                          <td>{s.enrollment || '-'}</td>
                          <td>{s.studentClass || '-'}</td>
                          <td style={{ fontSize:13 }}>{s.email}</td>
                          <td>{s.mobile || '-'}</td>
                          <td><span style={{ background:'#ede9fe', color:'#5b21b6', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600 }}>Team Leader</span></td>
                        </tr>
                      );
                      (s.teamMembers || []).forEach((tm, ti) => {
                        counter++;
                        rows.push(
                          <tr key={p._id + s._id + '-tm-' + ti} style={{ background:'#fafafa' }}>
                            <td>{pi * 100 + counter}</td>
                            <td><span style={{ background:'#e3f7f4', color:'#0b4f47', padding:'2px 8px', borderRadius:20, fontSize:12 }}>{p.groupNo || '-'}</span></td>
                            <td>{tm.name}</td>
                            <td>{tm.enrollment || '-'}</td>
                            <td>{tm.studentClass || '-'}</td>
                            <td style={{ fontSize:13 }}>{tm.email}</td>
                            <td>{tm.mobile || '-'}</td>
                            <td><span style={{ background:'#f3f4f6', color:'#555', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600 }}>Member</span></td>
                          </tr>
                        );
                      });
                    });
                    return rows;
                  })}
                  {projects.length===0 && <tr><td colSpan="8" style={{ textAlign:'center', color:'#888', padding:24 }}>No students</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {tab==='attendance' && (
            <div className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap', marginBottom:16 }}>
                <div>
                  <h3 style={{ margin:0 }}>Mark Attendance</h3>
                  <p style={{ margin:'4px 0 0', color:'#6b7280', fontSize:13 }}>Faculty can update attendance for each group. Students can only view it.</p>
                </div>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                  <select value={selectedAttendanceProject} onChange={(e) => setSelectedAttendanceProject(e.target.value)} style={{ padding:'8px 10px', borderRadius:8, border:'1px solid #d1d5db' }}>
                    {projects.map((project) => (
                      <option key={project._id} value={project._id}>{project.groupNo || '-'} - {project.title || 'Untitled'}</option>
                    ))}
                  </select>
                  <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} style={{ padding:'8px 10px', borderRadius:8, border:'1px solid #d1d5db' }} />
                </div>
              </div>

              {selectedAttendanceProject && (
                <>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', minWidth:640 }}>
                      <thead>
                        <tr style={{ background:'#f9fafb' }}>
                          <th style={{ textAlign:'left', padding:'10px 12px' }}>Student</th>
                          <th style={{ textAlign:'left', padding:'10px 12px' }}>Enrollment</th>
                          <th style={{ textAlign:'left', padding:'10px 12px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(projects.find((p) => p._id === selectedAttendanceProject)?.students || []).map((student) => (
                          <tr key={student._id}>
                            <td style={{ padding:'10px 12px' }}>{student.name}</td>
                            <td style={{ padding:'10px 12px' }}>{student.enrollment || '-'}</td>
                            <td style={{ padding:'10px 12px' }}>
                              <select
                                value={attendanceDrafts[selectedAttendanceProject]?.[student._id] || 'absent'}
                                onChange={(e) => updateAttendanceStatus(student._id, e.target.value)}
                                style={{ padding:'8px 10px', borderRadius:8, border:'1px solid #d1d5db', minWidth:140 }}
                              >
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                                <option value="late">Late</option>
                                <option value="excused">Excused</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
                    <button className="btn btn-primary" type="button" onClick={saveAttendance} disabled={savingAttendance}>
                      {savingAttendance ? 'Saving...' : '💾 Save Attendance'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {tab==='definitions' && (
            <div>
              {projects.length===0&&<div className="card" style={{ textAlign:'center', color:'#888', padding:40 }}><div style={{ fontSize:48, marginBottom:12 }}>📝</div><h3>No Projects Assigned</h3></div>}
              {projects.map(p => (
                <div className="card" key={p._id} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                      <h3 style={{ margin:0, fontSize:16 }}>{p.title||'Title not set'}</h3>
                      <span style={{ background:'#0e9f8e', color:'white', padding:'2px 10px', borderRadius:20, fontSize:12, fontWeight:700 }}>{p.groupNo||'No Group'}</span>
                      <span className={p.definitionStatus==='finalized'?'badge badge-success':p.definitionStatus==='submitted'?'badge badge-info':'badge badge-warning'}>
                        {p.definitionStatus==='finalized'?'✅ Finalized':p.definitionStatus==='submitted'?'📤 Submitted':'⏳ Pending'}
                      </span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      {p.definitions?.length>0&&p.definitionStatus!=='finalized'&&<button className="btn btn-primary" type="button" onClick={() => openSelectModal(p)}>✅ Select & Finalize</button>}
                      {p.definitionStatus==='finalized'&&<button className="btn btn-warning" type="button" onClick={() => openSelectModal(p)} style={{ fontSize:12 }}>✏️ Change</button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {selectModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth:640, maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ marginBottom:4 }}>Select Project Definition</h3>
            <p style={{ color:'#888', fontSize:13, marginBottom:20 }}>Group: <strong>{selectModal.groupNo}</strong> | Choose one definition to finalize for this group.</p>
            <form onSubmit={finalizeDefinition}>
              <div style={{ marginBottom:20 }}>
                {selectModal.definitions?.map((d, i) => (
                  <div key={i} onClick={() => onSelectDef(i)}
                    style={{ border:selectedIdx===i?'2px solid #0e9f8e':'1px solid #e7ebee', borderRadius:10, padding:16, marginBottom:10, cursor:'pointer', background:selectedIdx===i?'#f0fbf9':'white' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                      <input type="radio" name="defChoice" checked={selectedIdx===i} onChange={() => onSelectDef(i)} style={{ accentColor:'#0e9f8e', width:16, height:16 }} />
                      <strong style={{ color:selectedIdx===i?'#0e9f8e':'#111', fontSize:15 }}>Definition {i+1}: {d.title}</strong>
                    </div>
                    <p style={{ color:'#555', fontSize:13, lineHeight:1.7, margin:'0 0 8px 26px' }}>{d.description}</p>
                    <div style={{ display:'flex', gap:8, marginLeft:26 }}>
                      {d.frontend&&<span style={{ background:'#eff6ff', color:'#1d4ed8', padding:'2px 8px', borderRadius:6, fontSize:12 }}>FE: {d.frontend}</span>}
                      {d.backend&&<span style={{ background:'#fef9c3', color:'#854d0e', padding:'2px 8px', borderRadius:6, fontSize:12 }}>BE: {d.backend}</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="form-group">
                <label>Final Definition (you can edit before saving)</label>
                <textarea rows="5" value={editedDef} onChange={e => setEditedDef(e.target.value)} required style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid #d1d5db', fontSize:14, lineHeight:1.6 }} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setSelectModal(null)} style={{ background:'#e5e7eb' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={finalizing}>{finalizing?'Finalizing...':'✅ Finalize & Notify Students'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}