import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';

const links = [
  { path: '/student',            label: 'Dashboard',    icon: '📊' },
  { path: '/student/team',       label: 'My Team',      icon: '👥' },
  { path: '/student/definition', label: 'Definitions',  icon: '📝' },
  { path: '/student/tasks',      label: 'My Tasks',     icon: '✅' },
];

export default function StudentDashboard() {
  const [stats, setStats]     = useState({});
  const [project, setProject] = useState(null);
  const [profile, setProfile] = useState(null);
  const token = localStorage.getItem('token');
  const h = { headers: { Authorization: `Bearer ${token}` } };
  const navigate = useNavigate();
  const projectInfoRef = useRef(null);

  const load = () => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/student/stats`,   h).then(r => setStats(r.data));
    axios.get(`${process.env.REACT_APP_API_URL}/api/student/project`, h).then(r => setProject(r.data));
    axios.get(`${process.env.REACT_APP_API_URL}/api/student/profile`, h).then(r => setProfile(r.data));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  const statusBadge = (status) => {
    if (status === 'finalized') return { bg:'#f0fdf4', color:'#16a34a', text:'✅ Finalized by Faculty' };
    if (status === 'submitted') return { bg:'#eff6ff', color:'#1d4ed8', text:'📤 Submitted — Awaiting Faculty' };
    return { bg:'#fef9c3', color:'#854d0e', text:'⏳ Not Submitted Yet' };
  };

  const badge = statusBadge(stats.definitionStatus);

  // Card click handlers — each card jumps to the page (or section) it summarizes.
  const goToProjectInfo = () => {
    if (project && projectInfoRef.current) {
      projectInfoRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // If no project is assigned yet there's nothing to navigate to.
  };
  const goToDefinitions = () => navigate('/student/definition');
  const goToTasks = (statusFilter) => navigate('/student/tasks', { state: { statusFilter } });

  return (
    <div>
      <Navbar title="Student Portal" />
      <div className="layout">
        <Sidebar links={links} />
        <div className="main-content">

          {/* Welcome */}
          <div style={{
            background:'linear-gradient(135deg,#4f46e5,#7c3aed)',
            borderRadius:12, padding:'20px 24px',
            color:'white', marginBottom:24,
            display:'flex', justifyContent:'space-between', alignItems:'center'
          }}>
            <div>
              <h2 style={{ margin:0, fontSize:22 }}>
                Welcome, {profile?.name || 'Student'}! 👋
              </h2>
              <p style={{ margin:'4px 0 0', opacity:0.85, fontSize:14 }}>
                {profile?.enrollment && 'Enrollment: ' + profile.enrollment + ' | '}
                {profile?.studentClass && 'Class: ' + profile.studentClass}
              </p>
            </div>
            <div style={{ textAlign:'right', fontSize:13, opacity:0.85 }}>
              {project && (
                <>
                  <div>Group: <strong>{project.groupNo || 'Not assigned'}</strong></div>
                  <div>Faculty: <strong>{project.faculty?.name || 'Not assigned'}</strong></div>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="stats-grid" style={{ marginBottom:24 }}>
            <div
              className="stat-card"
              onClick={goToProjectInfo}
              role="button"
              tabIndex={0}
              style={{ cursor: project ? 'pointer' : 'default' }}
              title={project ? 'View project details' : 'No project assigned yet'}
            >
              <h3 style={{ fontSize:20, color: project ? '#16a34a' : '#dc2626' }}>
                {project ? '✅' : '❌'}
              </h3>
              <p>Project {project ? 'Assigned' : 'Not Assigned'}</p>
            </div>
            <div
              className="stat-card"
              onClick={goToDefinitions}
              role="button"
              tabIndex={0}
              style={{ cursor:'pointer' }}
              title="View / submit project definitions"
            >
              <h3 style={{ fontSize:14, color: badge.color }}>
                {stats.definitionStatus === 'finalized' ? '✅' :
                 stats.definitionStatus === 'submitted' ? '📤' : '⏳'}
              </h3>
              <p>Definition: {stats.definitionStatus || 'pending'}</p>
            </div>
            <div
              className="stat-card"
              onClick={() => goToTasks('all')}
              role="button"
              tabIndex={0}
              style={{ cursor:'pointer' }}
              title="View all my tasks"
            >
              <h3>{stats.tasks || 0}</h3>
              <p>Total Tasks</p>
            </div>
            <div
              className="stat-card"
              onClick={() => goToTasks('completed')}
              role="button"
              tabIndex={0}
              style={{ cursor:'pointer' }}
              title="View completed tasks"
            >
              <h3>{stats.completed || 0}</h3>
              <p>Completed</p>
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
            <a href="/student/team" style={{ textDecoration:'none' }}>
              <div style={{
                background:'white', borderRadius:12, padding:20,
                border:'1px solid #e5e7eb', cursor:'pointer',
                display:'flex', alignItems:'center', gap:16
              }}>
                <div style={{
                  width:48, height:48, background:'#eff6ff',
                  borderRadius:10, display:'flex', alignItems:'center',
                  justifyContent:'center', fontSize:24
                }}>👥</div>
                <div>
                  <h4 style={{ margin:0, color:'#111' }}>My Team</h4>
                  <p style={{ margin:'4px 0 0', fontSize:13, color:'#888' }}>
                    {profile?.teamMembers?.length > 0
                      ? profile.teamMembers.length + ' team members added'
                      : 'Add your team members'}
                  </p>
                </div>
              </div>
            </a>
            <a href="/student/definition" style={{ textDecoration:'none' }}>
              <div style={{
                background:'white', borderRadius:12, padding:20,
                border:'1px solid #e5e7eb', cursor:'pointer',
                display:'flex', alignItems:'center', gap:16
              }}>
                <div style={{
                  width:48, height:48, background:'#f0fdf4',
                  borderRadius:10, display:'flex', alignItems:'center',
                  justifyContent:'center', fontSize:24
                }}>📝</div>
                <div>
                  <h4 style={{ margin:0, color:'#111' }}>Project Definitions</h4>
                  <p style={{ margin:'4px 0 0', fontSize:13, color:'#888' }}>
                    {stats.definitionsCount > 0
                      ? stats.definitionsCount + ' definition(s) submitted'
                      : 'Submit up to 5 definitions'}
                  </p>
                </div>
              </div>
            </a>
          </div>

          {/* Project Info */}
          {project ? (
            <div className="card" ref={projectInfoRef}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                <div>
                  <h3 style={{ margin:'0 0 4px' }}>
                    {project.title || 'Project Title Not Set'}
                  </h3>
                  <span style={{
                    background:'#eff6ff', color:'#1d4ed8',
                    padding:'2px 10px', borderRadius:20, fontSize:12
                  }}>
                    Group: {project.groupNo || '-'}
                  </span>
                </div>
                <span style={{
                  background: badge.bg, color: badge.color,
                  padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600
                }}>
                  {badge.text}
                </span>
              </div>

              {/* FIXED: Only show faculty NAME, email is hidden */}
              {project.faculty && (
                <div style={{
                  background:'#f9fafb', padding:'10px 16px',
                  borderRadius:8, marginBottom:12, fontSize:14
                }}>
                  👨‍🏫 <strong>Faculty Guide:</strong> {project.faculty.name}
                </div>
              )}

              {project.finalDefinition && (
                <div style={{
                  background:'#f0fdf4', border:'1px solid #bbf7d0',
                  borderRadius:8, padding:'14px 16px'
                }}>
                  <strong style={{ color:'#16a34a' }}>✅ Finalized Definition:</strong>
                  <p style={{ margin:'8px 0 0', color:'#333', lineHeight:1.7 }}>
                    {project.finalDefinition}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ textAlign:'center', padding:40, color:'#888' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
              <h3>No Project Assigned Yet</h3>
              <p>The administrator will assign you to a project group.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}