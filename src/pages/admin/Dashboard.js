import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';

const API = process.env.REACT_APP_API_URL;

const links = [
  { path: '/admin',           label: 'Dashboard', icon: '📊' },
  { path: '/admin/faculties', label: 'Faculties', icon: '👨‍🏫' },
  { path: '/admin/students',  label: 'Students',  icon: '👨‍🎓' },
  { path: '/admin/groups',    label: 'Groups',    icon: '👥' },
  { path: '/admin/projects',  label: 'Projects',  icon: '📁' },
  { path: '/admin/monitor',   label: 'Monitor',   icon: '👁️' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats]       = useState({ faculties:0, students:0, projects:0, tasks:0 });
  const [projects, setProjects] = useState([]);
  const [tab, setTab]           = useState('definitions');
  const [branchFilter, setBranchFilter] = useState('all');
  const token = localStorage.getItem('token');
  const h = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    axios.get(`${API}/api/admin/stats`,    h).then(r => setStats(r.data));
    axios.get(`${API}/api/admin/projects`, h).then(r => setProjects(r.data));
  }, []);

  const tabStyle = (t) => ({
    padding: '10px 20px', border: 'none',
    borderBottom: tab === t ? '3px solid #4f46e5' : '3px solid transparent',
    background: 'none', cursor: 'pointer',
    fontWeight: tab === t ? 600 : 400,
    color: tab === t ? '#4f46e5' : '#666', fontSize: 14,
  });

  const withDefinitions = projects.filter(p => p.definition);

  const branchMapping = {
    '502': 'CE',
    '504': 'IT',
    '509': 'AIML',
    '510': 'CC',
    '511': 'GA',
    '513': 'CSE',
  };

  const getBranch = (enrollment = '') => {
    const match = enrollment && enrollment.toString().match(/502|504|509|510|511|513/);
    return match ? branchMapping[match[0]] : 'Unknown';
  };

  const parseGroupNo = (groupNo = '') => {
    const match = groupNo && groupNo.toString().match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  };

  const compareGroupNo = (a, b) => {
    if (!a.groupNo && !b.groupNo) return 0;
    if (!a.groupNo) return 1;
    if (!b.groupNo) return -1;
    const aNum = parseGroupNo(a.groupNo);
    const bNum = parseGroupNo(b.groupNo);
    if (aNum !== null && bNum !== null) {
      return aNum - bNum || a.groupNo.localeCompare(b.groupNo);
    }
    return a.groupNo.localeCompare(b.groupNo);
  };

  return (
    <div>
      <Navbar title="Admin Panel" />
      <div className="layout">
        <Sidebar links={links} />
        <div className="main-content">

          <div className="stats-grid" style={{ marginBottom:24 }}>
            <div className="stat-card" onClick={() => navigate('/admin/faculties')}
              style={{ cursor:'pointer', transition:'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 20px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
              <h3>{stats.faculties}</h3><p>Total Faculties</p>
            </div>
            <div className="stat-card" onClick={() => navigate('/admin/students')}
              style={{ cursor:'pointer', transition:'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 20px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
              <h3>{stats.students}</h3><p>Total Students</p>
            </div>
            <div className="stat-card" onClick={() => navigate('/admin/projects')}
              style={{ cursor:'pointer', transition:'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 20px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
              <h3>{stats.projects}</h3><p>Total Projects</p>
            </div>
            <div className="stat-card" onClick={() => navigate('/admin/monitor')}
              style={{ cursor:'pointer', transition:'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 20px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
              <h3>{stats.tasks}</h3><p>Total Tasks</p>
            </div>
          </div>

          <div style={{ borderBottom:'1px solid #e5e7eb', marginBottom:20, display:'flex', gap:4, alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', gap:8 }}>
              <button style={tabStyle('definitions')} onClick={() => setTab('definitions')}>
                📝 Student Definitions
                {withDefinitions.length > 0 && (
                  <span style={{
                    background:'#4f46e5', color:'white',
                    borderRadius:'50%', fontSize:11,
                    padding:'1px 6px', marginLeft:6
                  }}>
                    {withDefinitions.length}
                  </span>
                )}
              </button>
            </div>
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <label style={{ fontSize:13, color:'#4b5563', fontWeight:500 }}>Branch:</label>
              <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} style={{ padding:'8px 12px', borderRadius:8, border:'1px solid #d1d5db', fontSize:14 }}>
                <option value="all">All Branches</option>
                <option value="CE">CE</option>
                <option value="IT">IT</option>
                <option value="AIML">AIML</option>
                <option value="CC">CC</option>
                <option value="GA">GA</option>
                <option value="CSE">CSE</option>
              </select>
            </div>
          </div>

          {tab === 'overview' && (
            <div>
              <h3 style={{ marginBottom:16 }}>Recent Projects</h3>
              {projects.length === 0 && (
                <div className="card" style={{ textAlign:'center', color:'#888', padding:32 }}>
                  No projects yet. Go to Projects tab to create one.
                </div>
              )}
              {projects.slice(0,5).map(p => (
                <div className="card" key={p._id}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                        <h4 style={{ margin:0 }}>{p.title || 'Title not set'}</h4>
                        {p.groupNo && (
                          <span style={{
                            background:'#eff6ff', color:'#1d4ed8',
                            padding:'2px 8px', borderRadius:20, fontSize:12
                          }}>
                            Group: {p.groupNo}
                          </span>
                        )}
                        <span className={
                          p.definitionStatus === 'finalized'
                            ? 'badge badge-success'
                            : p.definition
                            ? 'badge badge-info'
                            : 'badge badge-warning'
                        }>
                          {p.definitionStatus === 'finalized'
                            ? 'Finalized'
                            : p.definition
                            ? 'Definition Submitted'
                            : 'Pending'}
                        </span>
                      </div>
                      <p style={{ color:'#888', fontSize:13, margin:0 }}>
                        Faculty: {p.faculty?.name || 'Not assigned'} |
                        Students: {p.students?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'definitions' && (
            <div>
              <p style={{ color:'#888', fontSize:14, marginBottom:16 }}>
                These are project definitions submitted by students.
                Faculty will review and finalize them.
              </p>

              {withDefinitions.filter(p => {
                if (branchFilter === 'all') return true;
                const enrollment = p.students && p.students.length > 0 ? p.students[0].enrollment : '';
                return getBranch(enrollment) === branchFilter;
              }).slice().sort(compareGroupNo).length === 0 && (
                <div className="card" style={{ textAlign:'center', color:'#666', padding:40, display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                  <div style={{ width:92, height:92, borderRadius:20, background:'linear-gradient(135deg,#eef2ff,#e0f2fe)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:44 }}>📝</div>
                  <h3 style={{ margin:0 }}>No Definitions Yet</h3>
                  <p style={{ maxWidth:540 }}>Students will submit concise project definitions here. When finalized, faculty definitions will appear as a single-line preview for quick review.</p>
                  <div style={{ display:'flex', gap:8, marginTop:6 }}>
                    <button className="btn btn-primary" onClick={() => navigate('/admin/projects')}>Create Project</button>
                    <button className="btn" onClick={() => window.scrollTo({ top:0, behavior:'smooth' })} style={{ background:'#eef2ff' }}>Refresh</button>
                  </div>
                </div>
              )}

              {withDefinitions.filter(p => {
                if (branchFilter === 'all') return true;
                const enrollment = p.students && p.students.length > 0 ? p.students[0].enrollment : '';
                return getBranch(enrollment) === branchFilter;
              }).slice().sort(compareGroupNo).map(p => (
                <div className="card" key={p._id}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                        <h3 style={{ margin:0 }}>{p.title || 'Untitled'}</h3>
                        <span style={{
                          background:'#eff6ff', color:'#1d4ed8',
                          padding:'2px 8px', borderRadius:20, fontSize:12
                        }}>
                          Group: {p.groupNo || '-'}
                        </span>
                      </div>
                      <p style={{ color:'#888', fontSize:13, margin:0 }}>
                        Faculty Guide: {p.faculty?.name || 'Not assigned'}
                      </p>
                    </div>
                    <span className={
                      p.definitionStatus === 'finalized'
                        ? 'badge badge-success'
                        : 'badge badge-warning'
                    }>
                      {p.definitionStatus === 'finalized' ? '✅ Finalized' : '⏳ Awaiting Faculty'}
                    </span>
                  </div>

                  <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                    {p.frontend && (
                      <span style={{
                        background:'#eff6ff', color:'#1d4ed8',
                        padding:'3px 10px', borderRadius:6, fontSize:12
                      }}>
                        Frontend: {p.frontend}
                      </span>
                    )}
                    {p.backend && (
                      <span style={{
                        background:'#fef9c3', color:'#854d0e',
                        padding:'3px 10px', borderRadius:6, fontSize:12
                      }}>
                        Backend: {p.backend}
                      </span>
                    )}
                  </div>

                  <div style={{
                    background:'#f9fafb', border:'1px solid #e5e7eb',
                    borderRadius:8, padding:'14px 16px', marginBottom:12
                  }}>
                    <strong style={{ fontSize:13, color:'#555' }}>
                      📄 Student Submitted Definition:
                    </strong>
                    <p style={{ margin:'8px 0 0', color:'#333', lineHeight:1.7, fontSize:14, maxHeight:48, overflow:'hidden' }}>
                      {p.definition}
                    </p>
                  </div>

                  {p.finalDefinition && (
                    <div style={{
                      background:'#f0fdf4', border:'1px solid #bbf7d0',
                      borderRadius:8, padding:'14px 16px'
                    }}>
                      <strong style={{ fontSize:13, color:'#16a34a' }}>
                        ✅ Faculty Finalized Definition:
                      </strong>
                      <p style={{ margin:'8px 0 0', color:'#333', fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }} title={p.finalDefinition}>
                        {p.finalDefinition}
                      </p>
                    </div>
                  )}

                  <div style={{ marginTop:12 }}>
                    <strong style={{ fontSize:13, color:'#555' }}>👥 Students:</strong>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:6 }}>
                      {p.students?.map(s => (
                        <span key={s._id} style={{
                          background:'#f0f4ff', padding:'4px 10px',
                          borderRadius:6, fontSize:12
                        }}>
                          {s.name} ({s.enrollment || s.email})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}