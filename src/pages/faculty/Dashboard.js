import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_URL;

const NAV_LINKS = [
  { path: '/faculty',       label: 'Dashboard',    icon: '🏠' },
  { path: '/faculty/tasks', label: 'Manage Tasks',  icon: '✅' },
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const [stats,    setStats]    = useState({ projects:0, tasks:0, pending:0, completed:0 });
  const [projects, setProjects] = useState([]);
  const [tab,      setTab]      = useState('projects');
  const [sideOpen, setSideOpen] = useState(false);
  const [selectModal,  setSelectModal]  = useState(null);
  const [selectedIdx,  setSelectedIdx]  = useState(0);
  const [finalizing,   setFinalizing]   = useState(false);

  const name  = localStorage.getItem('name')  || 'Faculty';
  const token = localStorage.getItem('token') || '';
  const h     = { headers: { Authorization: 'Bearer ' + token } };

  const load = () => {
    axios.get(`${API}/api/faculty/stats`,    h).then(r => setStats(r.data)).catch(()=>{});
    axios.get(`${API}/api/faculty/projects`, h).then(r => setProjects(r.data)).catch(()=>{});
  };
  useEffect(() => { load(); }, []);

  const logout = () => {
    ['token','role','name','id'].forEach(k => localStorage.removeItem(k));
    navigate('/login');
  };

  const openSelect = (p) => {
    setSelectModal(p);
    const idx = p.selectedDefinition >= 0 ? p.selectedDefinition : 0;
    setSelectedIdx(idx);
  };

  const finalizeDefinition = async (e) => {
    e.preventDefault();
    setFinalizing(true);
    try {
      const selectedDef = selectModal.definitions?.[selectedIdx];
      await axios.put(`${API}/api/faculty/project/${selectModal._id}/select-definition`,
        { selectedIndex: selectedIdx, finalDefinition: selectedDef?.description || '' }, h);
      toast.success('Definition finalized!');
      setSelectModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed');
    } finally { setFinalizing(false); }
  };

  const pendingDefs = projects.filter(p => p.definitions?.length > 0 && p.definitionStatus !== 'finalized').length;

  const STAT_CARDS = [
    { label: 'ASSIGNED PROJECTS', value: stats.projects || 0, icon: '📁', color: '#6366f1', bg: '#ede9fe', onClick: () => setTab('projects') },
    { label: 'TASKS ASSIGNED',    value: stats.tasks    || 0, icon: '✅', color: '#10b981', bg: '#d1fae5', onClick: () => navigate('/faculty/tasks') },
    { label: 'PENDING',           value: stats.pending  || 0, icon: '⏳', color: '#f59e0b', bg: '#fef3c7', onClick: () => navigate('/faculty/tasks') },
    { label: 'COMPLETED',         value: stats.completed|| 0, icon: '🏆', color: '#3b82f6', bg: '#dbeafe', onClick: () => navigate('/faculty/tasks') },
  ];

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f1f5f9', fontFamily:'Inter, system-ui, sans-serif' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 240, minHeight:'100vh', background:'white',
        boxShadow:'2px 0 12px rgba(0,0,0,0.06)',
        display:'flex', flexDirection:'column',
        position:'fixed', left:0, top:0, zIndex:100,
      }}>
        {/* Logo */}
        <div style={{ padding:'28px 24px 20px', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38, height:38, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🎓</div>
            <div>
              <div style={{ fontWeight:700, fontSize:15, color:'#1e1b4b' }}>College PMS</div>
              <div style={{ fontSize:11, color:'#6366f1', fontWeight:600 }}>Faculty Portal</div>
            </div>
          </div>
        </div>

        {/* Profile */}
        <div style={{ padding:'20px 24px', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, color:'white', fontWeight:700, marginBottom:10 }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <div style={{ fontWeight:600, color:'#111', fontSize:14 }}>{name}</div>
          <div style={{ fontSize:12, color:'#6366f1', background:'#ede9fe', padding:'2px 8px', borderRadius:20, display:'inline-block', marginTop:4, fontWeight:600 }}>Faculty</div>
        </div>

        {/* Nav */}
        <nav style={{ padding:'16px 12px', flex:1 }}>
          {NAV_LINKS.map(l => {
            const active = window.location.pathname === l.path;
            return (
              <button key={l.path} onClick={() => navigate(l.path)} type="button"
                style={{
                  width:'100%', display:'flex', alignItems:'center', gap:12,
                  padding:'11px 14px', borderRadius:10, border:'none', cursor:'pointer',
                  background: active ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
                  color: active ? 'white' : '#64748b',
                  fontWeight: active ? 600 : 500, fontSize:14,
                  marginBottom:4, textAlign:'left',
                  transition:'all 0.15s',
                }}>
                <span style={{ fontSize:18 }}>{l.icon}</span>
                {l.label}
                {l.path === '/faculty' && pendingDefs > 0 && !active && (
                  <span style={{ marginLeft:'auto', background:'#ef4444', color:'white', borderRadius:'50%', fontSize:11, width:20, height:20, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>{pendingDefs}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding:'16px 12px', borderTop:'1px solid #f1f5f9' }}>
          <button onClick={logout} type="button"
            style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'none', cursor:'pointer', background:'#fef2f2', color:'#ef4444', fontWeight:600, fontSize:14, display:'flex', alignItems:'center', gap:10 }}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ marginLeft:240, flex:1, padding:'0 0 40px' }}>

        {/* Hero Banner */}
        <div style={{
          background:'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
          padding:'36px 40px', marginBottom:32, position:'relative', overflow:'hidden',
        }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:180, height:180, background:'rgba(255,255,255,0.07)', borderRadius:'50%' }} />
          <div style={{ position:'absolute', bottom:-50, right:80, width:120, height:120, background:'rgba(255,255,255,0.05)', borderRadius:'50%' }} />
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', fontWeight:600, letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>FACULTY PORTAL</div>
          <h1 style={{ margin:'0 0 8px', color:'white', fontSize:28, fontWeight:700 }}>
            {getGreeting()}, {name} 👋
          </h1>
          <p style={{ margin:0, color:'rgba(255,255,255,0.8)', fontSize:15 }}>
            {stats.projects || 0} project group{(stats.projects||0) !== 1 ? 's' : ''} assigned to you
          </p>
        </div>

        <div style={{ padding:'0 40px' }}>

          {/* Stat Cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:20, marginBottom:32 }}>
            {STAT_CARDS.map((c, i) => (
              <div key={i} onClick={c.onClick}
                style={{
                  background:'white', borderRadius:16, padding:24,
                  boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                  cursor:'pointer', transition:'all 0.2s',
                  borderTop:`3px solid ${c.color}`,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.06)'; }}>
                <div style={{ width:44, height:44, background:c.bg, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:16 }}>{c.icon}</div>
                <div style={{ fontSize:32, fontWeight:800, color:c.color, lineHeight:1 }}>{c.value}</div>
                <div style={{ fontSize:12, color:'#94a3b8', fontWeight:600, marginTop:6, letterSpacing:0.5 }}>{c.label}</div>
              </div>
            ))}
          </div>

          {/* Tab Navigation */}
          <div style={{ display:'flex', gap:4, background:'white', borderRadius:12, padding:6, marginBottom:24, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', width:'fit-content' }}>
            {[
              { key:'projects',    label:'📁 My Projects' },
              { key:'students',    label:'👥 Student Details' },
              { key:'definitions', label:`📝 Definitions${pendingDefs > 0 ? ` (${pendingDefs})` : ''}` },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} type="button"
                style={{
                  padding:'9px 20px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
                  background: tab === t.key ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
                  color: tab === t.key ? 'white' : '#64748b',
                  transition:'all 0.15s',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── MY PROJECTS TAB ── */}
          {tab === 'projects' && (
            <div style={{ display:'grid', gap:16 }}>
              {projects.length === 0 && (
                <div style={{ background:'white', borderRadius:16, padding:60, textAlign:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize:64, marginBottom:16 }}>📭</div>
                  <h3 style={{ color:'#111', margin:'0 0 8px' }}>No Projects Assigned Yet</h3>
                  <p style={{ color:'#94a3b8', margin:0 }}>Contact your admin to get project groups assigned.</p>
                </div>
              )}
              {projects.map(p => {
                const isFinalized = p.definitionStatus === 'finalized';
                const isSubmitted = p.definitionStatus === 'submitted';
                return (
                  <div key={p._id} style={{ background:'white', borderRadius:16, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', borderLeft:`4px solid ${isFinalized?'#10b981':isSubmitted?'#6366f1':'#e2e8f0'}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:12 }}>
                          <h3 style={{ margin:0, fontSize:17, color:'#1e1b4b' }}>{p.title || 'Title not set'}</h3>
                          <span style={{ background:'#ede9fe', color:'#6366f1', padding:'3px 12px', borderRadius:20, fontSize:12, fontWeight:700 }}>Group: {p.groupNo || '-'}</span>
                          {isFinalized && <span style={{ background:'#d1fae5', color:'#065f46', padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600 }}>✅ Finalized</span>}
                          {isSubmitted && <span style={{ background:'#dbeafe', color:'#1e40af', padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600 }}>📤 {p.definitions?.length || 0} Submitted</span>}
                          {!isFinalized && !isSubmitted && <span style={{ background:'#fef3c7', color:'#92400e', padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600 }}>⏳ Pending</span>}
                        </div>

                        <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
                          {p.frontend && <span style={{ background:'#eff6ff', color:'#1d4ed8', padding:'4px 12px', borderRadius:8, fontSize:12, fontWeight:500 }}>🖥️ {p.frontend}</span>}
                          {p.backend  && <span style={{ background:'#fef9c3', color:'#854d0e', padding:'4px 12px', borderRadius:8, fontSize:12, fontWeight:500 }}>⚙️ {p.backend}</span>}
                        </div>

                        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom: p.finalDefinition ? 16 : 0 }}>
                          {p.students?.map(s => (
                            <span key={s._id} style={{ background:'#f8fafc', border:'1px solid #e2e8f0', padding:'4px 12px', borderRadius:8, fontSize:12, color:'#475569' }}>
                              👤 {s.name} {s.enrollment ? `(${s.enrollment})` : ''}
                            </span>
                          ))}
                        </div>

                        {p.finalDefinition && (
                          <div style={{ background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', border:'1px solid #86efac', borderRadius:12, padding:'14px 18px' }}>
                            <div style={{ fontSize:12, fontWeight:700, color:'#16a34a', marginBottom:6 }}>✅ FINALIZED DEFINITION</div>
                            <p style={{ margin:0, fontSize:13, color:'#166534', lineHeight:1.7 }}>{p.finalDefinition}</p>
                          </div>
                        )}
                      </div>

                      <div style={{ display:'flex', flexDirection:'column', gap:8, minWidth:140 }}>
                        {isSubmitted && (
                          <button type="button" onClick={() => openSelect(p)}
                            style={{ padding:'10px 16px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', border:'none', borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:13 }}>
                            ✅ Select Definition
                          </button>
                        )}
                        {isFinalized && (
                          <button type="button" onClick={() => openSelect(p)}
                            style={{ padding:'10px 16px', background:'#fef3c7', color:'#92400e', border:'none', borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:13 }}>
                            ✏️ Change Definition
                          </button>
                        )}
                        {!isFinalized && !isSubmitted && (
                          <span style={{ color:'#94a3b8', fontSize:13, textAlign:'center' }}>Waiting for student...</span>
                        )}
                        <button type="button" onClick={() => navigate('/faculty/tasks')}
                          style={{ padding:'10px 16px', background:'#f0f4ff', color:'#6366f1', border:'none', borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:13 }}>
                          📋 View Tasks
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── STUDENT DETAILS TAB ── */}
          {tab === 'students' && (
            <div style={{ background:'white', borderRadius:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', overflow:'hidden' }}>
              <div style={{ padding:'20px 24px', borderBottom:'1px solid #f1f5f9' }}>
                <h3 style={{ margin:0, color:'#1e1b4b' }}>All Students & Team Members</h3>
                <p style={{ margin:'4px 0 0', color:'#94a3b8', fontSize:13 }}>Full team list including members added on the team page</p>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', minWidth:900 }}>
                  <thead>
                    <tr style={{ background:'#f8fafc' }}>
                      {['#','Group','Name','Enrollment','Class','Email','Mobile','Role'].map(col => (
                        <th key={col} style={{ padding:'12px 16px', textAlign:'left', fontSize:12, fontWeight:700, color:'#64748b', letterSpacing:0.5, textTransform:'uppercase' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {projects.flatMap((p, pi) => {
                      const rows = [];
                      let counter = 0;
                      (p.students || []).forEach(s => {
                        counter++;
                        rows.push(
                          <tr key={p._id+s._id+'-l'} style={{ borderBottom:'1px solid #f1f5f9' }}>
                            <td style={{ padding:'14px 16px', fontSize:13, color:'#64748b' }}>{pi*100+counter}</td>
                            <td style={{ padding:'14px 16px' }}><span style={{ background:'#ede9fe', color:'#6366f1', padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:700 }}>{p.groupNo||'-'}</span></td>
                            <td style={{ padding:'14px 16px', fontWeight:600, color:'#1e1b4b', fontSize:14 }}>{s.name}</td>
                            <td style={{ padding:'14px 16px', fontSize:13, color:'#475569', fontFamily:'monospace' }}>{s.enrollment||'-'}</td>
                            <td style={{ padding:'14px 16px', fontSize:13, color:'#475569' }}>{s.studentClass||'-'}</td>
                            <td style={{ padding:'14px 16px', fontSize:13, color:'#475569' }}>{s.email}</td>
                            <td style={{ padding:'14px 16px', fontSize:13, color:'#475569' }}>{s.mobile||'-'}</td>
                            <td style={{ padding:'14px 16px' }}><span style={{ background:'#ede9fe', color:'#5b21b6', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>Team Leader</span></td>
                          </tr>
                        );
                        (s.teamMembers||[]).forEach((tm, ti) => {
                          counter++;
                          rows.push(
                            <tr key={p._id+s._id+'-m'+ti} style={{ borderBottom:'1px solid #f1f5f9', background:'#fafafa' }}>
                              <td style={{ padding:'12px 16px', fontSize:13, color:'#94a3b8' }}>{pi*100+counter}</td>
                              <td style={{ padding:'12px 16px' }}><span style={{ background:'#ede9fe', color:'#6366f1', padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:700 }}>{p.groupNo||'-'}</span></td>
                              <td style={{ padding:'12px 16px', fontSize:13, color:'#374151' }}>{tm.name}</td>
                              <td style={{ padding:'12px 16px', fontSize:13, color:'#6b7280', fontFamily:'monospace' }}>{tm.enrollment||'-'}</td>
                              <td style={{ padding:'12px 16px', fontSize:13, color:'#6b7280' }}>{tm.studentClass||'-'}</td>
                              <td style={{ padding:'12px 16px', fontSize:13, color:'#6b7280' }}>{tm.email}</td>
                              <td style={{ padding:'12px 16px', fontSize:13, color:'#6b7280' }}>{tm.mobile||'-'}</td>
                              <td style={{ padding:'12px 16px' }}><span style={{ background:'#f3f4f6', color:'#6b7280', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600 }}>Member</span></td>
                            </tr>
                          );
                        });
                      });
                      return rows;
                    })}
                    {projects.length === 0 && (
                      <tr><td colSpan="8" style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>No students assigned yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── DEFINITIONS TAB ── */}
          {tab === 'definitions' && (
            <div style={{ display:'grid', gap:20 }}>
              {projects.length === 0 && (
                <div style={{ background:'white', borderRadius:16, padding:60, textAlign:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize:64, marginBottom:16 }}>📝</div>
                  <h3 style={{ color:'#111', margin:0 }}>No Definitions Yet</h3>
                </div>
              )}
              {projects.map(p => (
                <div key={p._id} style={{ background:'white', borderRadius:16, padding:28, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, paddingBottom:16, borderBottom:'1px solid #f1f5f9', flexWrap:'wrap', gap:10 }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                        <h3 style={{ margin:0, color:'#1e1b4b' }}>{p.title || 'Title not set'}</h3>
                        <span style={{ background:'#6366f1', color:'white', padding:'3px 12px', borderRadius:20, fontSize:12, fontWeight:700 }}>{p.groupNo || '-'}</span>
                      </div>
                      <p style={{ margin:0, color:'#94a3b8', fontSize:13 }}>Students: {p.students?.map(s=>s.name).join(', ') || 'None'}</p>
                    </div>
                    <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                      {p.definitionStatus === 'finalized' && <span style={{ background:'#d1fae5', color:'#065f46', padding:'4px 14px', borderRadius:20, fontSize:12, fontWeight:700 }}>✅ Finalized</span>}
                      {p.definitionStatus === 'submitted' && <span style={{ background:'#dbeafe', color:'#1e40af', padding:'4px 14px', borderRadius:20, fontSize:12, fontWeight:700 }}>📤 {p.definitions?.length} Submitted</span>}
                      {p.definitionStatus === 'pending'   && <span style={{ background:'#fef3c7', color:'#92400e', padding:'4px 14px', borderRadius:20, fontSize:12, fontWeight:700 }}>⏳ Pending</span>}
                      {p.definitions?.length > 0 && p.definitionStatus !== 'finalized' && (
                        <button type="button" onClick={() => openSelect(p)}
                          style={{ padding:'9px 18px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', border:'none', borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:13 }}>
                          ✅ Select & Finalize
                        </button>
                      )}
                    </div>
                  </div>

                  {(!p.definitions || p.definitions.length === 0) && (
                    <div style={{ textAlign:'center', color:'#94a3b8', padding:'30px 0', fontSize:14 }}>Students have not submitted definitions yet.</div>
                  )}

                  {/* Show only the selected/finalized definition */}
                  {p.definitionStatus === 'finalized' && p.selectedDefinition >= 0 ? (() => {
                    const sel = p.definitions?.[p.selectedDefinition];
                    return sel ? (
                      <div style={{ border:'2px solid #6366f1', borderRadius:12, padding:20, background:'linear-gradient(135deg,#f0f4ff,#ede9fe)', position:'relative' }}>
                        <div style={{ position:'absolute', top:12, right:12, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700 }}>✅ Selected</div>
                        <div style={{ display:'inline-block', background:'#6366f1', color:'white', padding:'3px 12px', borderRadius:20, fontSize:11, fontWeight:700, marginBottom:10 }}>Definition {p.selectedDefinition+1}</div>
                        <h4 style={{ margin:'0 0 8px', color:'#1e1b4b', fontSize:15 }}>{sel.title}</h4>
                        <p style={{ color:'#475569', fontSize:13, lineHeight:1.8, margin:'0 0 12px' }}>{sel.description}</p>
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                          {sel.frontend && <span style={{ background:'#eff6ff', color:'#1d4ed8', padding:'4px 12px', borderRadius:8, fontSize:12 }}>🖥️ Frontend: {sel.frontend}</span>}
                          {sel.backend  && <span style={{ background:'#fef9c3', color:'#854d0e', padding:'4px 12px', borderRadius:8, fontSize:12 }}>⚙️ Backend: {sel.backend}</span>}
                        </div>
                      </div>
                    ) : null;
                  })() : (
                    /* Not finalized yet — show all submitted definitions for selection */
                    <div style={{ display:'grid', gap:12 }}>
                      {p.definitions?.map((d, i) => (
                        <div key={i} style={{ border:'1px solid #e2e8f0', borderRadius:12, padding:16, background:'#fafafa' }}>
                          <div style={{ display:'inline-block', background:'#e2e8f0', color:'#475569', padding:'3px 12px', borderRadius:20, fontSize:11, fontWeight:700, marginBottom:8 }}>Definition {i+1}</div>
                          <h4 style={{ margin:'0 0 6px', color:'#1e1b4b', fontSize:14 }}>{d.title}</h4>
                          <p style={{ color:'#475569', fontSize:13, lineHeight:1.7, margin:'0 0 10px' }}>{d.description}</p>
                          <div style={{ display:'flex', gap:8 }}>
                            {d.frontend && <span style={{ background:'#eff6ff', color:'#1d4ed8', padding:'3px 10px', borderRadius:8, fontSize:12 }}>🖥️ {d.frontend}</span>}
                            {d.backend  && <span style={{ background:'#fef9c3', color:'#854d0e', padding:'3px 10px', borderRadius:8, fontSize:12 }}>⚙️ {d.backend}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── SELECT DEFINITION MODAL ── */}
      {selectModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(4px)' }}>
          <div style={{ background:'white', borderRadius:20, padding:36, width:'100%', maxWidth:660, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 25px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <h3 style={{ margin:0, color:'#1e1b4b' }}>Select Project Definition</h3>
                <p style={{ margin:'4px 0 0', color:'#94a3b8', fontSize:13 }}>Group: <strong>{selectModal.groupNo}</strong> — choose one definition to finalize</p>
              </div>
              <button type="button" onClick={() => setSelectModal(null)}
                style={{ background:'#f1f5f9', border:'none', borderRadius:10, width:36, height:36, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>
                ✕
              </button>
            </div>
            <form onSubmit={finalizeDefinition}>
              <div style={{ marginBottom:20 }}>
                {selectModal.definitions?.map((d, i) => (
                  <div key={i} onClick={() => { setSelectedIdx(i); }}
                    style={{ border:selectedIdx===i?'2px solid #6366f1':'1px solid #e2e8f0', borderRadius:12, padding:16, marginBottom:10, cursor:'pointer', background:selectedIdx===i?'#f0f4ff':'white', transition:'all 0.15s' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                      <div style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${selectedIdx===i?'#6366f1':'#d1d5db'}`, background:selectedIdx===i?'#6366f1':'white', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {selectedIdx===i && <div style={{ width:8, height:8, borderRadius:'50%', background:'white' }} />}
                      </div>
                      <strong style={{ color:selectedIdx===i?'#6366f1':'#1e1b4b', fontSize:14 }}>Definition {i+1}: {d.title}</strong>
                    </div>
                    <p style={{ color:'#475569', fontSize:13, lineHeight:1.7, margin:'0 0 8px 30px' }}>{d.description}</p>
                    <div style={{ display:'flex', gap:8, marginLeft:30 }}>
                      {d.frontend && <span style={{ background:'#eff6ff', color:'#1d4ed8', padding:'2px 8px', borderRadius:6, fontSize:12 }}>FE: {d.frontend}</span>}
                      {d.backend  && <span style={{ background:'#fef9c3', color:'#854d0e', padding:'2px 8px', borderRadius:6, fontSize:12 }}>BE: {d.backend}</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" onClick={() => setSelectModal(null)}
                  style={{ padding:'11px 24px', borderRadius:10, border:'none', background:'#f1f5f9', color:'#475569', cursor:'pointer', fontWeight:600, fontSize:14 }}>
                  Cancel
                </button>
                <button type="submit" disabled={finalizing}
                  style={{ padding:'11px 24px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', cursor:finalizing?'not-allowed':'pointer', fontWeight:600, fontSize:14, opacity:finalizing?0.7:1 }}>
                  {finalizing ? 'Finalizing...' : '✅ Finalize Definition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}