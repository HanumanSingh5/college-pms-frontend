import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';

const links = [
  { path: '/admin',           label: 'Dashboard', icon: '📊' },
  { path: '/admin/faculties', label: 'Faculties', icon: '👨‍🏫' },
  { path: '/admin/students',  label: 'Students',  icon: '👨‍🎓' },
  { path: '/admin/groups',    label: 'Groups',    icon: '👥' },
  { path: '/admin/projects',  label: 'Projects',  icon: '📁' },
  { path: '/admin/monitor',   label: 'Monitor',   icon: '👁️' },
];

export default function AdminDashboard() {
  const [stats, setStats]       = useState({ faculties:0, students:0, projects:0, tasks:0 });
  const [projects, setProjects] = useState([]);
  const [tab, setTab]           = useState('overview');
  const token = localStorage.getItem('token');
  const h = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    axios.get('http://localhost:5000/api/admin/stats',    h).then(r => setStats(r.data));
    axios.get('http://localhost:5000/api/admin/projects', h).then(r => setProjects(r.data));
  }, []);

  const tabStyle = (t) => ({
    padding: '10px 20px', border: 'none',
    borderBottom: tab === t ? '3px solid #4f46e5' : '3px solid transparent',
    background: 'none', cursor: 'pointer',
    fontWeight: tab === t ? 600 : 400,
    color: tab === t ? '#4f46e5' : '#666', fontSize: 14,
  });

  // Projects with student submitted definitions
  const withDefinitions = projects.filter(p => p.definition);

  return (
    <div>
      <Navbar title="Admin Panel" />
      <div className="layout">
        <Sidebar links={links} />
        <div className="main-content">

          {/* Stats */}
          <div className="stats-grid" style={{ marginBottom:24 }}>
            <div className="stat-card"><h3>{stats.faculties}</h3><p>Total Faculties</p></div>
            <div className="stat-card"><h3>{stats.students}</h3><p>Total Students</p></div>
            <div className="stat-card"><h3>{stats.projects}</h3><p>Total Projects</p></div>
            <div className="stat-card"><h3>{stats.tasks}</h3><p>Total Tasks</p></div>
          </div>

          {/* Tabs */}
          <div style={{ borderBottom:'1px solid #e5e7eb', marginBottom:20, display:'flex', gap:4 }}>
            <button style={tabStyle('overview')} onClick={() => setTab('overview')}>
              📊 Overview
            </button>
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

          {/* Tab: Overview */}
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

          {/* Tab: Student Definitions */}
          {tab === 'definitions' && (
            <div>
              <p style={{ color:'#888', fontSize:14, marginBottom:16 }}>
                These are project definitions submitted by students.
                Faculty will review and finalize them.
              </p>

              {withDefinitions.length === 0 && (
                <div className="card" style={{ textAlign:'center', color:'#888', padding:40 }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
                  <h3>No Definitions Submitted Yet</h3>
                  <p>Students will submit their project definitions after logging in.</p>
                </div>
              )}

              {withDefinitions.map(p => (
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

                  {/* Tech Stack */}
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

                  {/* Student Definition */}
                  <div style={{
                    background:'#f9fafb', border:'1px solid #e5e7eb',
                    borderRadius:8, padding:'14px 16px', marginBottom:12
                  }}>
                    <strong style={{ fontSize:13, color:'#555' }}>
                      📄 Student Submitted Definition:
                    </strong>
                    <p style={{ margin:'8px 0 0', color:'#333', lineHeight:1.7, fontSize:14 }}>
                      {p.definition}
                    </p>
                  </div>

                  {/* Final Definition if set */}
                  {p.finalDefinition && (
                    <div style={{
                      background:'#f0fdf4', border:'1px solid #bbf7d0',
                      borderRadius:8, padding:'14px 16px'
                    }}>
                      <strong style={{ fontSize:13, color:'#16a34a' }}>
                        ✅ Faculty Finalized Definition:
                      </strong>
                      <p style={{ margin:'8px 0 0', color:'#333', lineHeight:1.7, fontSize:14 }}>
                        {p.finalDefinition}
                      </p>
                    </div>
                  )}

                  {/* Students in this group */}
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