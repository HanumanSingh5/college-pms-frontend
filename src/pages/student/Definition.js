import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { toast } from 'react-toastify';

const links = [
  { path: '/student',            label: 'Dashboard',   icon: '📊' },
  { path: '/student/team',       label: 'My Team',     icon: '👥' },
  { path: '/student/definition', label: 'Definitions', icon: '📝' },
  { path: '/student/tasks',      label: 'My Tasks',    icon: '✅' },
];

const emptyDef = { title:'', description:'', frontend:'', backend:'' };

export default function StudentDefinition() {
  const [project, setProject]       = useState(null);
  const [definitions, setDefinitions] = useState([{ ...emptyDef }]);
  const [submitting, setSubmitting] = useState(false);
  const token = localStorage.getItem('token');
  const h = { headers: { Authorization: `Bearer ${token}` } };

  const load = () => {
    axios.get('http://localhost:5000/api/student/project', h).then(r => {
      setProject(r.data);
      if (r.data?.definitions?.length > 0) {
        setDefinitions(r.data.definitions.map(d => ({
          title:       d.title       || '',
          description: d.description || '',
          frontend:    d.frontend    || '',
          backend:     d.backend     || '',
        })));
      }
    });
  };

  useEffect(() => { load(); }, []);

  const addDef = () => {
    if (definitions.length >= 5) return toast.error('Maximum 5 definitions allowed');
    setDefinitions([...definitions, { ...emptyDef }]);
  };

  const removeDef = (i) => {
    if (definitions.length === 1) return toast.error('At least one definition required');
    setDefinitions(definitions.filter((_, idx) => idx !== i));
  };

  const updateDef = (i, field, value) => {
    const updated = [...definitions];
    updated[i][field] = value;
    setDefinitions(updated);
  };

  const submit = async (e) => {
    e.preventDefault();
    for (let i = 0; i < definitions.length; i++) {
      if (!definitions[i].title || !definitions[i].description) {
        return toast.error('Definition ' + (i+1) + ': Title and Description are required');
      }
    }
    setSubmitting(true);
    try {
      await axios.post(
        'http://localhost:5000/api/student/submit-definitions',
        { definitions }, h
      );
      toast.success('Definitions submitted successfully!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (!project) {
    return (
      <div>
        <Navbar title="Student Portal" />
        <div className="layout">
          <Sidebar links={links} />
          <div className="main-content">
            <div className="card" style={{ textAlign:'center', padding:40, color:'#888' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
              <h3>No Project Assigned Yet</h3>
              <p>You need to be assigned to a project group first. Contact your administrator.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (project.definitionStatus === 'finalized') {
  return (
    <div>
      <Navbar title="Student Portal" />
      <div className="layout">
        <Sidebar links={links} />
        <div className="main-content">
          <h2 style={{ marginBottom:20 }}>Project Definitions</h2>

          {/* Big success banner */}
          <div style={{
            background:'linear-gradient(135deg, #16a34a, #15803d)',
            borderRadius:16, padding:'24px 28px', marginBottom:24,
            color:'white', textAlign:'center'
          }}>
            <div style={{ fontSize:48, marginBottom:8 }}>🎉</div>
            <h2 style={{ margin:'0 0 8px', color:'white' }}>Definition Finalized!</h2>
            <p style={{ margin:0, opacity:0.9 }}>
              Your faculty has selected and finalized the project definition.
              You can now start working on your project!
            </p>
          </div>

          {/* Finalized definition */}
          {project.finalDefinition && (
            <div style={{
              background:'white', border:'3px solid #16a34a',
              borderRadius:16, padding:24, marginBottom:20,
              boxShadow:'0 4px 20px rgba(22,163,74,0.15)'
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <span style={{ fontSize:24 }}>✅</span>
                <h3 style={{ margin:0, color:'#16a34a' }}>Your Final Project Definition</h3>
              </div>
              <p style={{ color:'#333', fontSize:15, lineHeight:1.8, margin:0 }}>
                {project.finalDefinition}
              </p>
            </div>
          )}

          {/* All definitions with selected one highlighted */}
          <h3 style={{ marginBottom:16, color:'#555' }}>All Your Submitted Definitions:</h3>
          {project.definitions?.map((d, i) => (
            <div key={i} style={{
              border: project.selectedDefinition === i ? '2px solid #16a34a' : '1px solid #e5e7eb',
              borderRadius:12, padding:20, marginBottom:12,
              background: project.selectedDefinition === i ? '#f0fdf4' : '#fafafa',
              position:'relative'
            }}>
              {project.selectedDefinition === i && (
                <div style={{
                  position:'absolute', top:12, right:12,
                  background:'#16a34a', color:'white',
                  padding:'4px 14px', borderRadius:20,
                  fontSize:12, fontWeight:700
                }}>
                  ✅ Selected by Faculty
                </div>
              )}

              <div style={{
                display:'inline-block',
                background: project.selectedDefinition === i ? '#16a34a' : '#e5e7eb',
                color: project.selectedDefinition === i ? 'white' : '#6b7280',
                padding:'3px 12px', borderRadius:20,
                fontSize:12, fontWeight:700, marginBottom:10
              }}>
                Definition {i + 1}
              </div>

              <h4 style={{
                margin:'0 0 8px',
                color: project.selectedDefinition === i ? '#15803d' : '#374151'
              }}>
                {d.title}
              </h4>

              <p style={{ color:'#555', fontSize:14, lineHeight:1.7, margin:'0 0 10px' }}>
                {d.description}
              </p>

              <div style={{ display:'flex', gap:8 }}>
                {d.frontend && (
                  <span style={{ background:'#eff6ff', color:'#1d4ed8', padding:'3px 10px', borderRadius:6, fontSize:12 }}>
                    Frontend: {d.frontend}
                  </span>
                )}
                {d.backend && (
                  <span style={{ background:'#fef9c3', color:'#854d0e', padding:'3px 10px', borderRadius:6, fontSize:12 }}>
                    Backend: {d.backend}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

  return (
    <div>
      <Navbar title="Student Portal" />
      <div className="layout">
        <Sidebar links={links} />
        <div className="main-content">

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div>
              <h2 style={{ margin:0 }}>Project Definitions</h2>
              <p style={{ color:'#888', fontSize:14, margin:'4px 0 0' }}>
                Submit up to 5 project ideas. Faculty will select and finalize one.
              </p>
            </div>
            <button type="button" className="btn btn-primary"
              onClick={addDef} disabled={definitions.length >= 5}>
              + Add Definition
            </button>
          </div>

          {/* Status */}
          {project.definitionStatus === 'submitted' && (
            <div style={{
              background:'#eff6ff', border:'1px solid #bfdbfe',
              borderRadius:10, padding:'12px 16px', marginBottom:20,
              fontSize:13, color:'#1e40af'
            }}>
              📤 <strong>Submitted!</strong> Your definitions are under review by faculty.
              You can still update them until faculty finalizes.
            </div>
          )}

          <div style={{
            background:'#f0fdf4', border:'1px solid #bbf7d0',
            borderRadius:10, padding:'12px 16px', marginBottom:20,
            fontSize:13, color:'#166534'
          }}>
            <strong>Instructions:</strong> Add up to 5 different project ideas.
            Each definition should have a clear title and description.
            Faculty will review all definitions and finalize one.
          </div>

          <form onSubmit={submit}>
            {definitions.map((def, i) => (
              <div key={i} className="card" style={{ marginBottom:16 }}>
                <div style={{
                  display:'flex', justifyContent:'space-between',
                  alignItems:'center', marginBottom:16
                }}>
                  <h4 style={{ margin:0, color:'#4f46e5' }}>
                    📄 Definition {i + 1}
                    {i === 0 && definitions.length > 1 && (
                      <span style={{
                        background:'#ede9fe', color:'#5b21b6',
                        fontSize:11, padding:'2px 8px', borderRadius:20,
                        marginLeft:8, fontWeight:400
                      }}>
                        Primary
                      </span>
                    )}
                  </h4>
                  {definitions.length > 1 && (
                    <button type="button" className="btn btn-danger"
                      onClick={() => removeDef(i)}
                      style={{ padding:'4px 10px', fontSize:12 }}>
                      Remove
                    </button>
                  )}
                </div>

                <div style={{ marginBottom:12 }}>
                  <label style={{ display:'block', marginBottom:4, fontSize:13, fontWeight:500 }}>
                    Project Title *
                  </label>
                  <input type="text"
                    placeholder="e.g. Online Library Management System"
                    value={def.title}
                    onChange={e => updateDef(i, 'title', e.target.value)}
                    required
                    style={{
                      width:'100%', padding:'9px 12px',
                      border:'1px solid #d1d5db', borderRadius:8,
                      fontSize:14, boxSizing:'border-box'
                    }} />
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                  <div>
                    <label style={{ display:'block', marginBottom:4, fontSize:13, fontWeight:500 }}>
                      Frontend Technology
                    </label>
                    <input type="text"
                      placeholder="e.g. React, HTML/CSS, Angular"
                      value={def.frontend}
                      onChange={e => updateDef(i, 'frontend', e.target.value)}
                      style={{
                        width:'100%', padding:'9px 12px',
                        border:'1px solid #d1d5db', borderRadius:8,
                        fontSize:14, boxSizing:'border-box'
                      }} />
                  </div>
                  <div>
                    <label style={{ display:'block', marginBottom:4, fontSize:13, fontWeight:500 }}>
                      Backend Technology
                    </label>
                    <input type="text"
                      placeholder="e.g. Node.js, Django, PHP"
                      value={def.backend}
                      onChange={e => updateDef(i, 'backend', e.target.value)}
                      style={{
                        width:'100%', padding:'9px 12px',
                        border:'1px solid #d1d5db', borderRadius:8,
                        fontSize:14, boxSizing:'border-box'
                      }} />
                  </div>
                </div>

                <div>
                  <label style={{ display:'block', marginBottom:4, fontSize:13, fontWeight:500 }}>
                    Project Description *
                  </label>
                  <textarea rows="4"
                    placeholder="Describe your project in detail — what problem it solves, main features, target users, and how it will be built..."
                    value={def.description}
                    onChange={e => updateDef(i, 'description', e.target.value)}
                    required
                    style={{
                      width:'100%', padding:'9px 12px',
                      border:'1px solid #d1d5db', borderRadius:8,
                      fontSize:14, lineHeight:1.6, boxSizing:'border-box'
                    }} />
                </div>
              </div>
            ))}

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              {definitions.length < 5 && (
                <button type="button" className="btn btn-primary"
                  onClick={addDef} style={{ padding:'10px 20px' }}>
                  + Add Another
                </button>
              )}
              <button type="submit" className="btn btn-success"
                disabled={submitting} style={{ padding:'10px 28px', fontSize:15 }}>
                {submitting ? 'Submitting...' : '📤 Submit Definitions'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}