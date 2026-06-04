import React, { useEffect, useState } from 'react';
import axios from 'axios';
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
  const token = localStorage.getItem('token');
  const h = { headers: { Authorization: 'Bearer ' + token } };

  const load = () => {
    axios.get(`${API}/api/faculty/stats`,    h).then(r => setStats(r.data));
    axios.get(`${API}/api/faculty/projects`, h).then(r => setProjects(r.data));
  };

  useEffect(() => { load(); }, []);

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

  const tabStyle = (t) => ({
    padding:'10px 20px', border:'none',
    borderBottom: tab===t ? '3px solid #4f46e5' : '3px solid transparent',
    background:'none', cursor:'pointer',
    fontWeight: tab===t ? 600 : 400,
    color: tab===t ? '#4f46e5' : '#666', fontSize:14,
  });

  return (
    <div>
      <Navbar title="Faculty Portal" />
      <div className="layout">
        <Sidebar links={links} />
        <div className="main-content">

          <div className="stats-grid" style={{ marginBottom:24 }}>
            <div className="stat-card"><h3>{stats.projects||0}</h3><p>Assigned Projects</p></div>
            <div className="stat-card"><h3>{stats.tasks||0}</h3><p>Tasks Assigned</p></div>
            <div className="stat-card"><h3>{stats.pending||0}</h3><p>Pending</p></div>
            <div className="stat-card"><h3>{stats.completed||0}</h3><p>Completed</p></div>
          </div>

          <div style={{ borderBottom:'1px solid #e5e7eb', marginBottom:20, display:'flex', gap:4 }}>
            <button style={tabStyle('projects')}    onClick={() => setTab('projects')}    type="button">📁 My Projects</button>
            <button style={tabStyle('students')}    onClick={() => setTab('students')}    type="button">👥 Student Details</button>
            <button style={tabStyle('definitions')} onClick={() => setTab('definitions')} type="button">
              📝 Definitions
              {projects.filter(p=>p.definitions?.length>0&&p.definitionStatus!=='finalized').length>0&&(
                <span style={{ background:'#ef4444', color:'white', borderRadius:'50%', fontSize:11, padding:'1px 6px', marginLeft:6 }}>
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
                        <span style={{ background:'#eff6ff', color:'#1d4ed8', padding:'2px 10px', borderRadius:20, fontSize:12 }}>Group: {p.groupNo||'-'}</span>
                        <span className={p.definitionStatus==='finalized'?'badge badge-success':p.definitionStatus==='submitted'?'badge badge-info':'badge badge-warning'}>
                          {p.definitionStatus==='finalized'?'✅ Finalized':p.definitionStatus==='submitted'?'📤 '+(p.definitions?.length||0)+' Definitions Submitted':'⏳ Pending'}
                        </span>
                      </div>
                      <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
                        {p.frontend&&<span style={{ background:'#eff6ff', color:'#1d4ed8', padding:'2px 10px', borderRadius:6, fontSize:12 }}>Frontend: {p.frontend}</span>}
                        {p.backend&&<span style={{ background:'#fef9c3', color:'#854d0e', padding:'2px 10px', borderRadius:6, fontSize:12 }}>Backend: {p.backend}</span>}
                      </div>
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                        {p.students?.map(s => <span key={s._id} style={{ background:'#f0f4ff', padding:'3px 10px', borderRadius:6, fontSize:12 }}>{s.name} ({s.enrollment||'-'})</span>)}
                      </div>
                      {p.finalDefinition&&(
                        <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'10px 14px', marginTop:12 }}>
                          <strong style={{ fontSize:13, color:'#16a34a' }}>✅ Finalized Definition:</strong>
                          <p style={{ margin:'6px 0 0', fontSize:13, color:'#444', lineHeight:1.6 }}>{p.finalDefinition}</p>
                        </div>
                      )}
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
              <table style={{ minWidth:800 }}>
                <thead><tr><th>#</th><th>Group</th><th>Name</th><th>Enrollment</th><th>Class</th><th>Email</th><th>Mobile</th></tr></thead>
                <tbody>
                  {projects.flatMap((p, pi) =>
                    (p.students||[]).map((s, si) => (
                      <tr key={p._id+s._id}>
                        <td>{pi*10+si+1}</td>
                        <td><span style={{ background:'#eff6ff', color:'#1d4ed8', padding:'2px 8px', borderRadius:20, fontSize:12 }}>{p.groupNo||'-'}</span></td>
                        <td><strong>{s.name}</strong></td>
                        <td>{s.enrollment||'-'}</td>
                        <td>{s.studentClass||'-'}</td>
                        <td style={{ fontSize:13 }}>{s.email}</td>
                        <td>{s.mobile||'-'}</td>
                      </tr>
                    ))
                  )}
                  {projects.length===0&&<tr><td colSpan="7" style={{ textAlign:'center', color:'#888', padding:24 }}>No students</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {tab==='definitions' && (
            <div>
              {projects.length===0&&<div className="card" style={{ textAlign:'center', color:'#888', padding:40 }}><div style={{ fontSize:48, marginBottom:12 }}>📝</div><h3>No Projects Assigned</h3></div>}
              {projects.map(p => (
                <div className="card" key={p._id} style={{ marginBottom:20 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, paddingBottom:12, borderBottom:'1px solid #e5e7eb' }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                        <h3 style={{ margin:0 }}>{p.title||'Title not set'}</h3>
                        <span style={{ background:'#4f46e5', color:'white', padding:'2px 10px', borderRadius:20, fontSize:12, fontWeight:700 }}>{p.groupNo||'No Group'}</span>
                      </div>
                      <p style={{ color:'#888', fontSize:13, margin:0 }}>Students: {p.students?.map(s=>s.name).join(', ')||'None'}</p>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span className={p.definitionStatus==='finalized'?'badge badge-success':p.definitionStatus==='submitted'?'badge badge-info':'badge badge-warning'}>
                        {p.definitionStatus==='finalized'?'✅ Finalized':p.definitionStatus==='submitted'?'📤 Submitted':'⏳ Pending'}
                      </span>
                      {p.definitions?.length>0&&p.definitionStatus!=='finalized'&&<button className="btn btn-primary" type="button" onClick={() => openSelectModal(p)}>✅ Select & Finalize</button>}
                    </div>
                  </div>

                  {(!p.definitions||p.definitions.length===0)&&<div style={{ textAlign:'center', color:'#aaa', padding:'20px 0', fontSize:14 }}>Students have not submitted definitions yet.</div>}

                  {p.definitions?.map((d, i) => (
                    <div key={i} style={{ border:p.selectedDefinition===i?'2px solid #4f46e5':'1px solid #e5e7eb', borderRadius:12, padding:20, marginBottom:12, background:p.selectedDefinition===i?'#f0f4ff':'white', position:'relative' }}>
                      {p.selectedDefinition===i&&<div style={{ position:'absolute', top:12, right:12, background:'#4f46e5', color:'white', padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700 }}>✅ Selected</div>}
                      <div style={{ display:'inline-block', background:p.selectedDefinition===i?'#4f46e5':'#f3f4f6', color:p.selectedDefinition===i?'white':'#6b7280', padding:'3px 12px', borderRadius:20, fontSize:12, fontWeight:700, marginBottom:10 }}>Definition {i+1}</div>
                      <h4 style={{ margin:'0 0 8px', color:'#111', fontSize:16 }}>{d.title}</h4>
                      <p style={{ color:'#444', fontSize:14, lineHeight:1.7, margin:'0 0 12px' }}>{d.description}</p>
                      <div style={{ display:'flex', gap:8 }}>
                        {d.frontend&&<span style={{ background:'#eff6ff', color:'#1d4ed8', padding:'4px 12px', borderRadius:6, fontSize:13 }}>🖥️ Frontend: {d.frontend}</span>}
                        {d.backend&&<span style={{ background:'#fef9c3', color:'#854d0e', padding:'4px 12px', borderRadius:6, fontSize:13 }}>⚙️ Backend: {d.backend}</span>}
                      </div>
                    </div>
                  ))}

                  {p.finalDefinition&&(
                    <div style={{ background:'#f0fdf4', border:'2px solid #16a34a', borderRadius:10, padding:16, marginTop:8 }}>
                      <strong style={{ color:'#16a34a', fontSize:14 }}>✅ Your Finalized Definition:</strong>
                      <p style={{ margin:'8px 0 0', color:'#333', fontSize:14, lineHeight:1.7 }}>{p.finalDefinition}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {selectModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'white', borderRadius:16, padding:32, width:'100%', maxWidth:640, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ marginBottom:4 }}>Select Project Definition</h3>
            <p style={{ color:'#888', fontSize:13, marginBottom:20 }}>Group: <strong>{selectModal.groupNo}</strong> | Choose one definition to finalize for this group.</p>
            <form onSubmit={finalizeDefinition}>
              <div style={{ marginBottom:20 }}>
                {selectModal.definitions?.map((d, i) => (
                  <div key={i} onClick={() => onSelectDef(i)}
                    style={{ border:selectedIdx===i?'2px solid #4f46e5':'1px solid #e5e7eb', borderRadius:10, padding:16, marginBottom:10, cursor:'pointer', background:selectedIdx===i?'#f0f4ff':'white' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                      <input type="radio" name="defChoice" checked={selectedIdx===i} onChange={() => onSelectDef(i)} style={{ accentColor:'#4f46e5', width:16, height:16 }} />
                      <strong style={{ color:selectedIdx===i?'#4f46e5':'#111', fontSize:15 }}>Definition {i+1}: {d.title}</strong>
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
                <textarea rows="5" value={editedDef} onChange={e => setEditedDef(e.target.value)} required style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid #d1d5db', fontSize:14, lineHeight:1.6 }} />
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:16 }}>
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