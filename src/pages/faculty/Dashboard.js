import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_URL;

const links = [
  { path: '/faculty',       label: 'Dashboard',    icon: '📊' },
  { path: '/faculty/tasks', label: 'Manage Tasks',  icon: '✅' },
];

/* ─── design tokens ─── */
const C = {
  indigo:    '#4f46e5',
  indigoL:   '#6366f1',
  indigoXL:  '#818cf8',
  indigoBg:  '#eef2ff',
  emerald:   '#059669',
  emeraldBg: '#ecfdf5',
  amber:     '#d97706',
  amberBg:   '#fffbeb',
  rose:      '#e11d48',
  roseBg:    '#fff1f2',
  slate900:  '#0f172a',
  slate700:  '#334155',
  slate500:  '#64748b',
  slate300:  '#cbd5e1',
  slate100:  '#f1f5f9',
  slate50:   '#f8fafc',
  white:     '#ffffff',
};

const badge = (status) => {
  if (status === 'finalized') return { bg: C.emeraldBg, color: C.emerald, text: '✅ Finalized' };
  if (status === 'submitted') return { bg: C.indigoBg,  color: C.indigo,  text: '📤 Awaiting Review' };
  return { bg: C.amberBg, color: C.amber, text: '⏳ Pending' };
};

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
    axios.get(`${API}/api/faculty/stats`,    h).then(r => setStats(r.data)).catch(() => {});
    axios.get(`${API}/api/faculty/projects`, h).then(r => setProjects(r.data)).catch(() => {});
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
      toast.success('Definition finalized!');
      setSelectModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed');
    } finally {
      setFinalizing(false);
    }
  };

  const pendingDefs = projects.filter(p => p.definitions?.length > 0 && p.definitionStatus !== 'finalized').length;

  return (
    <div style={{ background: C.slate50, minHeight: '100vh' }}>
      <Navbar title="Faculty Portal" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .faculty-layout { display:flex; }

        /* ── stat cards ── */
        .stat-card-new {
          background: ${C.white};
          border-radius: 16px;
          padding: 24px;
          flex: 1;
          border: 1px solid ${C.slate100};
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
          overflow: hidden;
        }
        .stat-card-new:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(79,70,229,0.1);
        }
        .stat-card-new::before {
          content:'';
          position:absolute;
          top:0; left:0; right:0;
          height:3px;
          background: linear-gradient(90deg, ${C.indigo}, ${C.indigoXL});
        }
        .stat-number {
          font-size: 36px;
          font-weight: 800;
          color: ${C.indigo};
          line-height: 1;
          margin-bottom: 6px;
          font-family: 'Inter', sans-serif;
        }
        .stat-label {
          font-size: 13px;
          color: ${C.slate500};
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* ── tabs ── */
        .tab-bar {
          display: flex;
          gap: 4px;
          background: ${C.white};
          border-radius: 12px;
          padding: 4px;
          border: 1px solid ${C.slate100};
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          width: fit-content;
          margin-bottom: 24px;
        }
        .tab-btn {
          padding: 9px 20px;
          border: none;
          border-radius: 9px;
          background: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: ${C.slate500};
          transition: all 0.18s;
          font-family: 'Inter', sans-serif;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .tab-btn.active {
          background: ${C.indigo};
          color: ${C.white};
          box-shadow: 0 4px 12px rgba(79,70,229,0.3);
        }
        .tab-btn:not(.active):hover {
          background: ${C.slate100};
          color: ${C.slate700};
        }

        /* ── project cards ── */
        .project-card {
          background: ${C.white};
          border-radius: 16px;
          border: 1px solid ${C.slate100};
          padding: 24px;
          margin-bottom: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          transition: box-shadow 0.2s;
        }
        .project-card:hover {
          box-shadow: 0 6px 20px rgba(0,0,0,0.08);
        }
        .project-title {
          font-size: 18px;
          font-weight: 700;
          color: ${C.slate900};
          margin: 0 0 10px;
          font-family: 'Inter', sans-serif;
        }
        .group-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: ${C.indigoBg};
          color: ${C.indigo};
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          margin-right: 8px;
        }
        .tech-chip {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          margin-right: 6px;
          margin-bottom: 4px;
        }
        .student-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: ${C.slate100};
          color: ${C.slate700};
          padding: 5px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          margin: 3px 4px 3px 0;
        }

        /* ── buttons ── */
        .btn-primary-new {
          background: linear-gradient(135deg, ${C.indigo}, ${C.indigoL});
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          box-shadow: 0 4px 12px rgba(79,70,229,0.3);
          transition: all 0.18s;
          white-space: nowrap;
        }
        .btn-primary-new:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(79,70,229,0.4);
        }
        .btn-warning-new {
          background: ${C.amberBg};
          color: ${C.amber};
          border: 1px solid #fde68a;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          transition: all 0.15s;
        }
        .btn-warning-new:hover { background: #fef3c7; }

        /* ── definition cards ── */
        .def-card {
          border: 2px solid ${C.slate100};
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: all 0.18s;
          background: ${C.white};
        }
        .def-card:hover { border-color: ${C.indigoXL}; background: ${C.indigoBg}; }
        .def-card.selected {
          border-color: ${C.indigo};
          background: ${C.indigoBg};
          box-shadow: 0 0 0 4px rgba(79,70,229,0.1);
        }

        /* ── finalized box ── */
        .finalized-box {
          background: linear-gradient(135deg, #ecfdf5, #d1fae5);
          border: 2px solid #6ee7b7;
          border-radius: 14px;
          padding: 18px 20px;
          margin-top: 14px;
        }

        /* ── table ── */
        .modern-table {
          width: 100%;
          border-collapse: collapse;
          font-family: 'Inter', sans-serif;
        }
        .modern-table th {
          background: ${C.slate50};
          color: ${C.slate500};
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 12px 16px;
          text-align: left;
          border-bottom: 2px solid ${C.slate100};
        }
        .modern-table td {
          padding: 14px 16px;
          font-size: 13px;
          color: ${C.slate700};
          border-bottom: 1px solid ${C.slate50};
          vertical-align: middle;
        }
        .modern-table tr:hover td { background: ${C.slate50}; }

        /* ── empty state ── */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: ${C.slate500};
        }
        .empty-icon { font-size: 56px; margin-bottom: 16px; opacity: 0.6; }

        /* ── modal ── */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.6);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999;
          padding: 20px;
        }
        .modal-box {
          background: ${C.white};
          border-radius: 20px;
          padding: 32px;
          width: 100%; max-width: 660px;
          max-height: 90vh; overflow-y: auto;
          box-shadow: 0 25px 60px rgba(0,0,0,0.25);
        }
        .modal-title {
          font-size: 20px; font-weight: 800;
          color: ${C.slate900};
          margin: 0 0 4px;
          font-family: 'Inter', sans-serif;
        }
        .modal-subtitle { color: ${C.slate500}; font-size: 14px; margin-bottom: 24px; }

        /* ── section header ── */
        .section-header {
          font-size: 20px;
          font-weight: 800;
          color: ${C.slate900};
          margin: 0 0 20px;
          font-family: 'Inter', sans-serif;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .section-header::after {
          content: '';
          flex: 1;
          height: 2px;
          background: linear-gradient(90deg, ${C.indigo}22, transparent);
          border-radius: 2px;
        }
      `}</style>

      <div className="faculty-layout">
        <Sidebar links={links} />

        <div className="main-content" style={{ padding: '28px 32px', flex: 1 }}>

          {/* ── Welcome Banner ── */}
          <div style={{
            background: `linear-gradient(135deg, ${C.indigo} 0%, #7c3aed 100%)`,
            borderRadius: 20,
            padding: '24px 32px',
            marginBottom: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 10px 30px rgba(79,70,229,0.3)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position:'absolute', top:-30, right:-30, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
            <div style={{ position:'absolute', bottom:-40, right:100, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
            <div>
              <div style={{ color:'rgba(255,255,255,0.7)', fontSize:13, fontWeight:500, marginBottom:4, letterSpacing:'0.05em', textTransform:'uppercase' }}>Faculty Portal</div>
              <div style={{ color:'white', fontSize:26, fontWeight:800, fontFamily:'Inter,sans-serif', marginBottom:6 }}>
                Good day, {localStorage.getItem('name') || 'Professor'} 👋
              </div>
              <div style={{ color:'rgba(255,255,255,0.75)', fontSize:14 }}>
                {projects.length} project group{projects.length !== 1 ? 's' : ''} assigned to you
              </div>
            </div>
            {pendingDefs > 0 && (
              <div style={{ background:'rgba(255,255,255,0.15)', borderRadius:14, padding:'14px 20px', textAlign:'center', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.2)' }}>
                <div style={{ color:'white', fontSize:28, fontWeight:800 }}>{pendingDefs}</div>
                <div style={{ color:'rgba(255,255,255,0.8)', fontSize:12, fontWeight:600 }}>Definitions<br/>Need Review</div>
              </div>
            )}
          </div>

          {/* ── Stats Grid ── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
            {[
              { label:'Assigned Projects', value: stats.projects || 0, icon:'📁' },
              { label:'Tasks Assigned',    value: stats.tasks    || 0, icon:'✅' },
              { label:'Pending',           value: stats.pending  || 0, icon:'⏳' },
              { label:'Completed',         value: stats.completed|| 0, icon:'🏆' },
            ].map((s, i) => (
              <div key={i} className="stat-card-new">
                <div style={{ fontSize:24, marginBottom:8 }}>{s.icon}</div>
                <div className="stat-number">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Tabs ── */}
          <div className="tab-bar">
            {[
              { key:'projects',    label:'My Projects',     icon:'📁' },
              { key:'students',    label:'Student Details', icon:'👥' },
              { key:'definitions', label:'Definitions',     icon:'📝', badge: pendingDefs },
            ].map(t => (
              <button key={t.key} type="button"
                className={`tab-btn ${tab === t.key ? 'active' : ''}`}
                onClick={() => setTab(t.key)}>
                {t.icon} {t.label}
                {t.badge > 0 && (
                  <span style={{
                    background: tab === t.key ? 'rgba(255,255,255,0.3)' : C.rose,
                    color: 'white',
                    borderRadius: '50%',
                    fontSize: 11,
                    width: 20, height: 20,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}>{t.badge}</span>
                )}
              </button>
            ))}
          </div>

          {/* ══════════ TAB: MY PROJECTS ══════════ */}
          {tab === 'projects' && (
            <div>
              <div className="section-header">My Project Groups</div>

              {projects.length === 0 && (
                <div className="project-card">
                  <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <h3 style={{ color: C.slate700, margin:'0 0 8px' }}>No Projects Assigned Yet</h3>
                    <p style={{ color: C.slate500, margin:0 }}>The administrator will assign student groups to you.</p>
                  </div>
                </div>
              )}

              {projects.map(p => {
                const b = badge(p.definitionStatus);
                return (
                  <div className="project-card" key={p._id}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
                      <div style={{ flex:1 }}>
                        {/* Title row */}
                        <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:8, marginBottom:12 }}>
                          <h3 className="project-title" style={{ margin:0 }}>
                            {p.title || 'Title not set'}
                          </h3>
                          <span className="group-chip">🏷 {p.groupNo || '—'}</span>
                          <span style={{ background: b.bg, color: b.color, padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700 }}>
                            {b.text}
                          </span>
                        </div>

                        {/* Tech stack */}
                        {(p.frontend || p.backend) && (
                          <div style={{ marginBottom:12 }}>
                            {p.frontend && (
                              <span className="tech-chip" style={{ background:'#eff6ff', color:'#1d4ed8' }}>
                                🖥 {p.frontend}
                              </span>
                            )}
                            {p.backend && (
                              <span className="tech-chip" style={{ background: C.amberBg, color: C.amber }}>
                                ⚙️ {p.backend}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Students */}
                        <div style={{ display:'flex', flexWrap:'wrap' }}>
                          {p.students?.map(s => (
                            <span key={s._id} className="student-chip">
                              👤 {s.name}
                              {s.enrollment && <span style={{ color: C.slate500, fontSize:11 }}>({s.enrollment})</span>}
                            </span>
                          ))}
                        </div>

                        {/* Finalized definition */}
                        {p.finalDefinition && (
                          <div className="finalized-box">
                            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                              <span style={{ fontSize:16 }}>✅</span>
                              <strong style={{ color: C.emerald, fontSize:13 }}>Finalized Definition</strong>
                            </div>
                            <p style={{ margin:0, color: C.slate700, fontSize:14, lineHeight:1.7 }}>
                              {p.finalDefinition}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action button */}
                      <div>
                        {p.definitionStatus === 'submitted' && (
                          <button className="btn-primary-new" type="button" onClick={() => openSelectModal(p)}>
                            ✅ Select Definition
                          </button>
                        )}
                        {p.definitionStatus === 'finalized' && (
                          <button className="btn-warning-new" type="button" onClick={() => openSelectModal(p)}>
                            ✏️ Change Definition
                          </button>
                        )}
                        {p.definitionStatus === 'pending' && (
                          <span style={{ color: C.slate400, fontSize:13 }}>Waiting for student…</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ══════════ TAB: STUDENT DETAILS ══════════ */}
          {tab === 'students' && (
            <div>
              <div className="section-header">Student Details</div>
              <div style={{ background: C.white, borderRadius:16, border:`1px solid ${C.slate100}`, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Group</th>
                      <th>Name</th>
                      <th>Enrollment</th>
                      <th>Class</th>
                      <th>Email</th>
                      <th>Mobile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.flatMap((p, pi) =>
                      (p.students || []).map((s, si) => (
                        <tr key={p._id + s._id}>
                          <td style={{ color: C.slate400, fontWeight:500 }}>{pi * 10 + si + 1}</td>
                          <td>
                            <span className="group-chip" style={{ fontSize:11 }}>{p.groupNo || '—'}</span>
                          </td>
                          <td><strong style={{ color: C.slate900 }}>{s.name}</strong></td>
                          <td>
                            {s.enrollment
                              ? <span style={{ background: C.indigoBg, color: C.indigo, padding:'3px 8px', borderRadius:6, fontSize:12, fontWeight:600 }}>{s.enrollment}</span>
                              : <span style={{ color: C.slate300 }}>—</span>
                            }
                          </td>
                          <td>{s.studentClass || <span style={{ color: C.slate300 }}>—</span>}</td>
                          <td style={{ fontSize:12, color: C.slate500 }}>{s.email}</td>
                          <td>{s.mobile || <span style={{ color: C.slate300 }}>—</span>}</td>
                        </tr>
                      ))
                    )}
                    {projects.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign:'center', color: C.slate400, padding:32 }}>
                          No students assigned yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════ TAB: DEFINITIONS ══════════ */}
          {tab === 'definitions' && (
            <div>
              <div className="section-header">Project Definitions</div>

              {projects.length === 0 && (
                <div className="project-card">
                  <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    <h3 style={{ color: C.slate700, margin:'0 0 8px' }}>No Projects Assigned</h3>
                  </div>
                </div>
              )}

              {projects.map(p => {
                const b = badge(p.definitionStatus);
                return (
                  <div className="project-card" key={p._id} style={{ marginBottom:20 }}>
                    {/* Header */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, paddingBottom:16, borderBottom:`1px solid ${C.slate100}` }}>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <h3 className="project-title" style={{ margin:0, fontSize:16 }}>{p.title || 'Title not set'}</h3>
                          <span className="group-chip">{p.groupNo || '—'}</span>
                        </div>
                        <div style={{ color: C.slate500, fontSize:13 }}>
                          Students: {p.students?.map(s => s.name).join(', ') || 'None'}
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ background: b.bg, color: b.color, padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:700 }}>{b.text}</span>
                        {p.definitions?.length > 0 && p.definitionStatus !== 'finalized' && (
                          <button className="btn-primary-new" type="button" onClick={() => openSelectModal(p)}>
                            ✅ Finalize
                          </button>
                        )}
                      </div>
                    </div>

                    {/* No definitions yet */}
                    {(!p.definitions || p.definitions.length === 0) && (
                      <div style={{ textAlign:'center', color: C.slate400, padding:'20px 0', fontSize:14 }}>
                        Students haven't submitted definitions yet.
                      </div>
                    )}

                    {/* Definitions list */}
                    {p.definitions?.map((d, i) => (
                      <div key={i} style={{
                        border: `2px solid ${p.selectedDefinition === i ? C.indigo : C.slate100}`,
                        borderRadius: 14,
                        padding: 18,
                        marginBottom: 10,
                        background: p.selectedDefinition === i ? C.indigoBg : C.white,
                        position: 'relative',
                      }}>
                        {p.selectedDefinition === i && (
                          <span style={{ position:'absolute', top:12, right:12, background: C.indigo, color:'white', padding:'3px 12px', borderRadius:20, fontSize:11, fontWeight:700 }}>
                            ✅ Selected
                          </span>
                        )}
                        <div style={{ display:'inline-block', background: p.selectedDefinition === i ? C.indigo : C.slate100, color: p.selectedDefinition === i ? 'white' : C.slate500, padding:'2px 12px', borderRadius:20, fontSize:11, fontWeight:700, marginBottom:10 }}>
                          Definition {i + 1}
                        </div>
                        <h4 style={{ margin:'0 0 8px', color: C.slate900, fontSize:15, fontWeight:700 }}>{d.title}</h4>
                        <p style={{ color: C.slate600, fontSize:14, lineHeight:1.7, margin:'0 0 12px' }}>{d.description}</p>
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                          {d.frontend && <span className="tech-chip" style={{ background:'#eff6ff', color:'#1d4ed8' }}>🖥 {d.frontend}</span>}
                          {d.backend  && <span className="tech-chip" style={{ background: C.amberBg, color: C.amber }}>⚙️ {d.backend}</span>}
                        </div>
                      </div>
                    ))}

                    {/* Final definition */}
                    {p.finalDefinition && (
                      <div className="finalized-box">
                        <strong style={{ color: C.emerald, fontSize:13, display:'block', marginBottom:8 }}>✅ Finalized Definition</strong>
                        <p style={{ margin:0, color: C.slate700, fontSize:14, lineHeight:1.7 }}>{p.finalDefinition}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* ══════════ SELECT DEFINITION MODAL ══════════ */}
      {selectModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="modal-title">Select Project Definition</h3>
            <p className="modal-subtitle">
              Group <strong>{selectModal.groupNo}</strong> — Choose one definition to finalize.
            </p>

            <form onSubmit={finalizeDefinition}>
              <div style={{ marginBottom:20 }}>
                {selectModal.definitions?.map((d, i) => (
                  <div key={i}
                    className={`def-card ${selectedIdx === i ? 'selected' : ''}`}
                    onClick={() => onSelectDef(i)}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                      <input type="radio" name="defChoice"
                        checked={selectedIdx === i}
                        onChange={() => onSelectDef(i)}
                        style={{ accentColor: C.indigo, width:16, height:16 }} />
                      <strong style={{ color: selectedIdx === i ? C.indigo : C.slate900, fontSize:15 }}>
                        Definition {i+1}: {d.title}
                      </strong>
                    </div>
                    <p style={{ color: C.slate500, fontSize:13, lineHeight:1.7, margin:'0 0 8px 26px' }}>{d.description}</p>
                    <div style={{ marginLeft:26, display:'flex', gap:8 }}>
                      {d.frontend && <span className="tech-chip" style={{ background:'#eff6ff', color:'#1d4ed8' }}>FE: {d.frontend}</span>}
                      {d.backend  && <span className="tech-chip" style={{ background: C.amberBg, color: C.amber }}>BE: {d.backend}</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={{ display:'block', marginBottom:8, fontWeight:600, color: C.slate700, fontSize:14 }}>
                  Final Definition <span style={{ color: C.slate400, fontWeight:400 }}>(you can edit before saving)</span>
                </label>
                <textarea rows="5"
                  value={editedDef}
                  onChange={e => setEditedDef(e.target.value)}
                  required
                  style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:`2px solid ${C.slate200}`, fontSize:14, lineHeight:1.6, outline:'none', boxSizing:'border-box', fontFamily:'Inter,sans-serif', resize:'vertical', transition:'border-color 0.15s' }}
                  onFocus={e => e.target.style.borderColor = C.indigo}
                  onBlur={e => e.target.style.borderColor = C.slate200}
                />
              </div>

              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button"
                  onClick={() => setSelectModal(null)}
                  style={{ padding:'11px 24px', borderRadius:10, border:`1px solid ${C.slate200}`, background: C.white, cursor:'pointer', fontSize:14, fontWeight:600, color: C.slate700 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-new" disabled={finalizing}
                  style={{ padding:'11px 28px', fontSize:14 }}>
                  {finalizing ? 'Finalizing…' : '✅ Finalize & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}