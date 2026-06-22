import React, { useEffect, useState } from 'react';
import axios from 'axios';
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

const MIN_WORDS = 50;
const emptyDef = { title:'', description:'', frontend:'', backend:'' };

const countWords = (text) =>
  text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

export default function StudentDefinition() {
  const [project,     setProject]     = useState(null);
  const [definitions, setDefinitions] = useState([{ ...emptyDef }]);
  const [submitting,  setSubmitting]  = useState(false);
  const token = localStorage.getItem('token');
  const h = { headers: { Authorization: `Bearer ${token}` } };

  const load = () => {
    axios.get(`${API}/api/student/project`, h).then(r => {
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
      const d   = definitions[i];
      const num = i + 1;

      if (!d.title.trim())
        return toast.error(`Definition ${num}: Project Title is required`);

      if (!d.frontend.trim())
        return toast.error(`Definition ${num}: Frontend Technology is required`);

      if (!d.backend.trim())
        return toast.error(`Definition ${num}: Backend Technology is required`);

      if (!d.description.trim())
        return toast.error(`Definition ${num}: Project Description is required`);

      const words = countWords(d.description);
      if (words < MIN_WORDS)
        return toast.error(`Definition ${num}: Description must be at least ${MIN_WORDS} words (currently ${words} word${words !== 1 ? 's' : ''})`);
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/api/student/submit-definitions`, { definitions }, h);
      toast.success('Definitions submitted successfully!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  // ── NO PROJECT ──
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

  // ── FINALIZED VIEW ──
  if (project.definitionStatus === 'finalized') {
    return (
      <div>
        <Navbar title="Student Portal" />
        <div className="layout">
          <Sidebar links={links} />
          <div className="main-content">
            <h2 style={{ marginBottom:20 }}>Project Definitions</h2>
            <div style={{ background:'linear-gradient(135deg, #16a34a, #15803d)', borderRadius:16, padding:'24px 28px', marginBottom:24, color:'white', textAlign:'center' }}>
              <div style={{ fontSize:48, marginBottom:8 }}>🎉</div>
              <h2 style={{ margin:'0 0 8px', color:'white' }}>Definition Finalized!</h2>
              <p style={{ margin:0, opacity:0.9 }}>Your faculty has selected and finalized the project definition.</p>
            </div>
            {project.finalDefinition && (
              <div style={{ background:'white', border:'3px solid #16a34a', borderRadius:16, padding:24, marginBottom:20, boxShadow:'0 4px 20px rgba(22,163,74,0.15)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                  <span style={{ fontSize:24 }}>✅</span>
                  <h3 style={{ margin:0, color:'#16a34a' }}>Your Final Project Definition</h3>
                </div>
                <p style={{ color:'#333', fontSize:15, lineHeight:1.8, margin:0 }}>{project.finalDefinition}</p>
              </div>
            )}
            <h3 style={{ marginBottom:16, color:'#555' }}>All Your Submitted Definitions:</h3>
            {project.definitions?.map((d, i) => (
              <div key={i} style={{ border:project.selectedDefinition===i?'2px solid #16a34a':'1px solid #e5e7eb', borderRadius:12, padding:20, marginBottom:12, background:project.selectedDefinition===i?'#f0fdf4':'#fafafa', position:'relative' }}>
                {project.selectedDefinition===i && (
                  <div style={{ position:'absolute', top:12, right:12, background:'#16a34a', color:'white', padding:'4px 14px', borderRadius:20, fontSize:12, fontWeight:700 }}>✅ Selected by Faculty</div>
                )}
                <div style={{ display:'inline-block', background:project.selectedDefinition===i?'#16a34a':'#e5e7eb', color:project.selectedDefinition===i?'white':'#6b7280', padding:'3px 12px', borderRadius:20, fontSize:12, fontWeight:700, marginBottom:10 }}>Definition {i+1}</div>
                <h4 style={{ margin:'0 0 8px', color:project.selectedDefinition===i?'#15803d':'#374151' }}>{d.title}</h4>
                <p style={{ color:'#555', fontSize:14, lineHeight:1.7, margin:'0 0 10px' }}>{d.description}</p>
                <div style={{ display:'flex', gap:8 }}>
                  {d.frontend&&<span style={{ background:'#eff6ff', color:'#1d4ed8', padding:'3px 10px', borderRadius:6, fontSize:12 }}>Frontend: {d.frontend}</span>}
                  {d.backend&&<span style={{ background:'#fef9c3', color:'#854d0e', padding:'3px 10px', borderRadius:6, fontSize:12 }}>Backend: {d.backend}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── SUBMIT FORM ──
  return (
    <div>
      <Navbar title="Student Portal" />
      <div className="layout">
        <Sidebar links={links} />
        <div className="main-content">

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div>
              <h2 style={{ margin:0 }}>Project Definitions</h2>
              <p style={{ color:'#888', fontSize:14, margin:'4px 0 0' }}>Submit up to 5 project ideas. Faculty will select and finalize one.</p>
            </div>
            <button type="button" className="btn btn-primary" onClick={addDef} disabled={definitions.length >= 5}>
              + Add Definition
            </button>
          </div>

          {project.definitionStatus === 'submitted' && (
            <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:'12px 16px', marginBottom:20, fontSize:13, color:'#1e40af' }}>
              📤 <strong>Submitted!</strong> Your definitions are under review by faculty. You can still update them until faculty finalizes.
            </div>
          )}

          <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'12px 16px', marginBottom:20, fontSize:13, color:'#166534' }}>
            <strong>Instructions:</strong> All fields are required. Description must be at least <strong>{MIN_WORDS} words</strong>. Add up to 5 different project ideas — Faculty will review all and finalize one.
          </div>

          <form onSubmit={submit}>
            {definitions.map((def, i) => {
              const wordCount  = countWords(def.description);
              const wordOk     = wordCount >= MIN_WORDS;
              const wordColor  = wordCount === 0 ? '#94a3b8' : wordOk ? '#16a34a' : '#dc2626';
              const wordBg     = wordCount === 0 ? '#f1f5f9' : wordOk ? '#d1fae5' : '#fee2e2';
              const progress   = Math.min(100, Math.round((wordCount / MIN_WORDS) * 100));

              return (
                <div key={i} className="card" style={{ marginBottom:20, border: '1px solid #e5e7eb' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <h4 style={{ margin:0, color:'#4f46e5' }}>
                      📄 Definition {i + 1}
                      {i === 0 && definitions.length > 1 && (
                        <span style={{ background:'#ede9fe', color:'#5b21b6', fontSize:11, padding:'2px 8px', borderRadius:20, marginLeft:8, fontWeight:400 }}>Primary</span>
                      )}
                    </h4>
                    {definitions.length > 1 && (
                      <button type="button" className="btn btn-danger" onClick={() => removeDef(i)} style={{ padding:'4px 10px', fontSize:12 }}>Remove</button>
                    )}
                  </div>

                  {/* Project Title */}
                  <div style={{ marginBottom:14 }}>
                    <label style={{ display:'block', marginBottom:4, fontSize:13, fontWeight:600 }}>
                      Project Title *
                    </label>
                    <input type="text"
                      placeholder="e.g. Online Library Management System"
                      value={def.title}
                      onChange={e => updateDef(i, 'title', e.target.value)}
                      required
                      style={{
                        width:'100%', padding:'10px 12px',
                        border: def.title.trim() ? '1px solid #10b981' : '1px solid #d1d5db',
                        borderRadius:8, fontSize:14, boxSizing:'border-box', outline:'none'
                      }} />
                    {!def.title.trim() && (
                      <p style={{ color:'#dc2626', fontSize:11, margin:'3px 0 0' }}>⚠️ Required</p>
                    )}
                  </div>

                  {/* Frontend + Backend */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                    <div>
                      <label style={{ display:'block', marginBottom:4, fontSize:13, fontWeight:600 }}>
                        Frontend Technology *
                      </label>
                      <input type="text"
                        placeholder="e.g. React, HTML/CSS"
                        value={def.frontend}
                        onChange={e => updateDef(i, 'frontend', e.target.value)}
                        required
                        style={{
                          width:'100%', padding:'10px 12px',
                          border: def.frontend.trim() ? '1px solid #10b981' : '1px solid #d1d5db',
                          borderRadius:8, fontSize:14, boxSizing:'border-box', outline:'none'
                        }} />
                      {!def.frontend.trim() && (
                        <p style={{ color:'#dc2626', fontSize:11, margin:'3px 0 0' }}>⚠️ Required</p>
                      )}
                    </div>
                    <div>
                      <label style={{ display:'block', marginBottom:4, fontSize:13, fontWeight:600 }}>
                        Backend Technology *
                      </label>
                      <input type="text"
                        placeholder="e.g. Node.js, Django"
                        value={def.backend}
                        onChange={e => updateDef(i, 'backend', e.target.value)}
                        required
                        style={{
                          width:'100%', padding:'10px 12px',
                          border: def.backend.trim() ? '1px solid #10b981' : '1px solid #d1d5db',
                          borderRadius:8, fontSize:14, boxSizing:'border-box', outline:'none'
                        }} />
                      {!def.backend.trim() && (
                        <p style={{ color:'#dc2626', fontSize:11, margin:'3px 0 0' }}>⚠️ Required</p>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                      <label style={{ fontSize:13, fontWeight:600 }}>
                        Project Description * <span style={{ color:'#6b7280', fontWeight:400 }}>(minimum {MIN_WORDS} words)</span>
                      </label>
                      <span style={{ background: wordBg, color: wordColor, fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>
                        {wordCount} / {MIN_WORDS} words {wordOk ? '✅' : ''}
                      </span>
                    </div>

                    <textarea rows="5"
                      placeholder={`Describe your project in detail — what problem it solves, main features, target users, technologies used... (minimum ${MIN_WORDS} words)`}
                      value={def.description}
                      onChange={e => updateDef(i, 'description', e.target.value)}
                      required
                      style={{
                        width:'100%', padding:'10px 12px',
                        border: def.description && !wordOk ? '1px solid #dc2626' : wordOk ? '1px solid #10b981' : '1px solid #d1d5db',
                        borderRadius:8, fontSize:14, lineHeight:1.7,
                        boxSizing:'border-box', outline:'none', resize:'vertical'
                      }} />

                    {/* Word count progress bar */}
                    <div style={{ marginTop:6 }}>
                      <div style={{ height:4, background:'#e5e7eb', borderRadius:4, overflow:'hidden' }}>
                        <div style={{
                          height:'100%', borderRadius:4, transition:'width 0.3s, background 0.3s',
                          width:`${progress}%`,
                          background: progress < 50 ? '#ef4444' : progress < 80 ? '#f59e0b' : '#10b981'
                        }} />
                      </div>
                      {def.description && !wordOk && (
                        <p style={{ color:'#dc2626', fontSize:11, margin:'4px 0 0' }}>
                          ⚠️ Need {MIN_WORDS - wordCount} more word{MIN_WORDS - wordCount !== 1 ? 's' : ''} to meet the minimum requirement
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
              {definitions.length < 5 && (
                <button type="button" className="btn btn-primary" onClick={addDef} style={{ padding:'10px 20px' }}>
                  + Add Another
                </button>
              )}
              <button type="submit" className="btn btn-success" disabled={submitting} style={{ padding:'10px 28px', fontSize:15 }}>
                {submitting ? 'Submitting...' : '📤 Submit Definitions'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}