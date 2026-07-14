import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { toast } from 'react-toastify';
import { utils, writeFileXLSX } from 'xlsx';

const API = process.env.REACT_APP_API_URL;

const links = [
  { path: '/admin',           label: 'Dashboard', icon: '📊' },
  { path: '/admin/faculties', label: 'Faculties', icon: '👨‍🏫' },
  { path: '/admin/students',  label: 'Students',  icon: '👨‍🎓' },
  { path: '/admin/groups',    label: 'Groups',    icon: '👥' },
  { path: '/admin/projects',  label: 'Projects',  icon: '📁' },
  { path: '/admin/monitor',   label: 'Monitor',   icon: '👁️' },
];

const CATEGORIES = [
  'AI / Machine Learning','Web Development','Mobile Application','E-Commerce',
  'Management System','IoT / Hardware','Cybersecurity','Data Analytics',
  'Cloud Computing','Blockchain','Game Development','Healthcare',
  'Education Technology','Finance / Banking','Other',
];

const CATEGORY_COLORS = {
  'AI / Machine Learning':   { bg:'#ede9fe', color:'#5b21b6' },
  'Web Development':         { bg:'#eff6ff', color:'#1d4ed8' },
  'Mobile Application':      { bg:'#f0fdf4', color:'#166534' },
  'E-Commerce':              { bg:'#fef9c3', color:'#854d0e' },
  'Management System':       { bg:'#f0f4ff', color:'#3730a3' },
  'IoT / Hardware':          { bg:'#fef3c7', color:'#92400e' },
  'Cybersecurity':           { bg:'#fee2e2', color:'#991b1b' },
  'Data Analytics':          { bg:'#ecfdf5', color:'#065f46' },
  'Cloud Computing':         { bg:'#e0f2fe', color:'#0369a1' },
  'Blockchain':              { bg:'#fdf4ff', color:'#7e22ce' },
  'Game Development':        { bg:'#fff7ed', color:'#c2410c' },
  'Healthcare':              { bg:'#fdf2f8', color:'#9d174d' },
  'Education Technology':    { bg:'#f0fdf4', color:'#14532d' },
  'Finance / Banking':       { bg:'#fffbeb', color:'#78350f' },
  'Other':                   { bg:'#f3f4f6', color:'#374151' },
};

export default function AdminProjects() {
  const [projects, setProjects]     = useState([]);
  const [faculties, setFaculties]   = useState([]);
  const [students, setStudents]     = useState([]);
  const [showModal, setShowModal]   = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [branchFilter, setBranchFilter] = useState('all');
  const [form, setForm] = useState({
    title:'', description:'', definition:'', category:'',
    faculty:'', students:[], groupNo:'', frontend:'', backend:''
  });
  const token = localStorage.getItem('token');
  const h = { headers: { Authorization: 'Bearer ' + token } };

  const recategorize = async () => {
    try {
      const res = await axios.post(`${API}/api/admin/recategorize-projects`, {}, h);
      toast.success(res.data.msg);
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to re-categorize');
    }
  };

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

  const load = () => {
    axios.get(`${API}/api/admin/projects`,  h).then(r => setProjects(r.data)).catch(()=>{});
    axios.get(`${API}/api/admin/faculties`, h).then(r => setFaculties(r.data)).catch(()=>{});
    axios.get(`${API}/api/admin/students`,  h).then(r => setStudents(r.data)).catch(()=>{});
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditProject(null);
    setForm({ title:'', description:'', definition:'', category:'', faculty:'', students:[], groupNo:'', frontend:'', backend:'' });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditProject(p);
    setForm({
      title:       p.title       || '',
      description: p.description || '',
      definition:  p.definition  || '',
      category:    p.category    || '',
      faculty:     p.faculty?._id || '',
      students:    p.students?.map(s => s._id) || [],
      groupNo:     p.groupNo     || '',
      frontend:    p.frontend    || '',
      backend:     p.backend     || '',
    });
    setShowModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editProject) {
        await axios.put(`${API}/api/admin/project/${editProject._id}`, form, h);
        toast.success('Project updated!');
      } else {
        await axios.post(`${API}/api/admin/project`, form, h);
        toast.success('Project created!');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await axios.delete(`${API}/api/admin/project/${id}`, h);
      toast.success('Deleted');
      load();
    } catch { toast.error('Failed'); }
  };

  const toggleStudent = (id) => {
    setForm(f => ({
      ...f,
      students: f.students.includes(id) ? f.students.filter(s => s !== id) : [...f.students, id]
    }));
  };

  const usedCategories = ['All', ...Array.from(new Set(projects.map(p => p.category || 'Other').filter(Boolean)))];
  const filteredByCategory = activeCategory === 'All' ? projects : projects.filter(p => (p.category||'Other') === activeCategory);
  const filtered = filteredByCategory.filter(p => {
    if (branchFilter === 'all') return true;
    // determine branch from first student enrollment if available
    const enrollment = p.students && p.students.length > 0 ? p.students[0].enrollment : '';
    return getBranch(enrollment) === branchFilter;
  }).slice().sort(compareGroupNo);

  const buildRows = () => {
    const rows = [];
    let srNo = 1;
    filtered.forEach(p => {
      const allMembers = [];
      if (p.students && p.students.length > 0) {
        p.students.forEach(s => {
          allMembers.push({ name:s.name, enrollment:s.enrollment||'-', email:s.email, mobile:s.mobile||'-', cls:s.studentClass||'-', isMain:true });
          (s.teamMembers||[]).forEach(m => {
            allMembers.push({ name:m.name||'-', enrollment:m.enrollment||'-', email:m.email||'-', mobile:m.mobile||'-', cls:m.studentClass||'-', isMain:false });
          });
        });
      }
      if (allMembers.length === 0) {
        rows.push({ srNo:srNo++, groupNo:p.groupNo||'-', name:'-', enrollment:'-', email:'-', mobile:'-', cls:'-', title:p.title||'-', category:p.category||'-', frontend:p.frontend||'-', backend:p.backend||'-', faculty:p.faculty?.name||'-', projectId:p._id, project:p, isFirst:true, rowSpan:1 });
      } else {
        allMembers.forEach((m, mi) => {
          rows.push({ srNo:mi===0?srNo++:null, groupNo:p.groupNo||'-', name:m.name, enrollment:m.enrollment, email:m.email, mobile:m.mobile, cls:m.cls, title:p.title||'-', category:p.category||'-', frontend:p.frontend||'-', backend:p.backend||'-', faculty:p.faculty?.name||'-', projectId:p._id, project:p, isFirst:mi===0, isMain:m.isMain, rowSpan:allMembers.length });
        });
      }
    });
    return rows;
  };

  const rows = buildRows();
  const exportRows = rows.map((row) => ({
    'Sr.': row.srNo || '',
    'Group No.': row.groupNo,
    'Category': row.category,
    'Enrollment No.': row.enrollment,
    'Name': row.name,
    'Role': row.isMain ? 'Leader' : 'Member',
    'Email': row.email,
    'Mobile': row.mobile,
    'Class': row.cls,
    'Project Title': row.title,
    'Frontend': row.frontend,
    'Backend': row.backend,
    'Faculty Guide': row.faculty,
  }));

  const downloadProjectsExcel = () => {
    if (exportRows.length === 0) {
      toast.info('No projects available to download.');
      return;
    }
    const worksheet = utils.json_to_sheet(exportRows);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Projects');
    writeFileXLSX(workbook, 'admin-projects.xlsx');
  };

  const thStyle = { padding:'10px 10px', textAlign:'left', fontWeight:600, fontSize:12, color:'#374151', borderBottom:'2px solid #e5e7eb', whiteSpace:'nowrap', background:'#f9fafb' };
  const tdStyle = { padding:'9px 10px', fontSize:12, color:'#374151', verticalAlign:'middle', borderBottom:'1px solid #f0f0f0' };

  return (
    <div>
      <Navbar title="Admin Panel" />
      <div className="layout">
        <Sidebar links={links} />
        <div className="main-content">

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
            <h2 style={{ margin:0 }}>Projects ({projects.length})</h2>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <button type="button" className="btn btn-secondary" onClick={downloadProjectsExcel}>Download Excel</button>
              <button type="button" className="btn btn-primary" onClick={openCreate}>+ New Project</button>
            </div>
          </div>

          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:16 }}>
            {usedCategories.map(cat => {
              const count = cat==='All' ? projects.length : projects.filter(p=>(p.category||'Other')===cat).length;
              const colorInfo = CATEGORY_COLORS[cat]||CATEGORY_COLORS['Other'];
              return (
                <button key={cat} type="button" onClick={() => setActiveCategory(cat)}
                  style={{ padding:'6px 14px', borderRadius:20, fontSize:12, cursor:'pointer', fontWeight:activeCategory===cat?700:500, border:activeCategory===cat?'2px solid #4f46e5':'1px solid #e5e7eb', background:activeCategory===cat?'#4f46e5':colorInfo.bg, color:activeCategory===cat?'white':colorInfo.color }}>
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:12 }}>
            <label style={{ fontSize:13, color:'#4b5563', fontWeight:500 }}>Branch:</label>
            <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} style={{ padding:'10px 14px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14, outline:'none' }}>
              <option value="all">All Branches</option>
              <option value="CE">CE</option>
              <option value="IT">IT</option>
              <option value="AIML">AIML</option>
              <option value="CC">CC</option>
              <option value="GA">GA</option>
              <option value="CSE">CSE</option>
            </select>
          </div>

          {activeCategory==='All' && projects.length>0 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:10, marginBottom:20 }}>
              {CATEGORIES.filter(cat => projects.some(p=>(p.category||'Other')===cat)).map(cat => {
                const count = projects.filter(p=>(p.category||'Other')===cat).length;
                const colorInfo = CATEGORY_COLORS[cat]||CATEGORY_COLORS['Other'];
                return (
                  <div key={cat} onClick={() => setActiveCategory(cat)}
                    style={{ background:colorInfo.bg, borderRadius:10, padding:'14px 16px', cursor:'pointer', border:'1px solid '+colorInfo.color+'33' }}>
                    <div style={{ fontSize:22, fontWeight:700, color:colorInfo.color }}>{count}</div>
                    <div style={{ fontSize:12, color:colorInfo.color, marginTop:2, fontWeight:500 }}>{cat}</div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="card" style={{ overflowX:'auto' }}>
            <table style={{ minWidth:1300, borderCollapse:'collapse', width:'100%' }}>
              <thead>
                <tr>
                  {['Sr.','Group No.','Category','Enrollment No.','Name','Email','Mobile','Class','Project Title','Frontend','Backend','Faculty Guide','Actions'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length===0 && (
                  <tr><td colSpan="13" style={{ textAlign:'center', color:'#888', padding:32 }}>{activeCategory==='All'?'No projects yet.':'No projects in this category.'}</td></tr>
                )}
                {rows.map((row, i) => {
                  const catColor = CATEGORY_COLORS[row.category]||CATEGORY_COLORS['Other'];
                  return (
                    <tr key={row.projectId+'-'+i} style={{ background:row.isMain===false?'#fafafa':'white', borderBottom:row.isFirst&&i>0?'2px solid #d1d5db':'1px solid #f0f0f0' }}>
                      <td style={tdStyle}>{row.srNo&&<span style={{ fontWeight:700, color:'#4f46e5' }}>{row.srNo}</span>}</td>
                      <td style={tdStyle}>{row.isFirst&&<span style={{ background:'#4f46e5', color:'white', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>{row.groupNo}</span>}</td>
                      <td style={tdStyle}>{row.isFirst&&row.category!=='-'&&<span style={{ background:catColor.bg, color:catColor.color, padding:'3px 8px', borderRadius:6, fontSize:11, fontWeight:600 }}>{row.category}</span>}</td>
                      <td style={tdStyle}><span style={{ background:row.isMain===false?'#f3f4f6':'#eff6ff', color:row.isMain===false?'#6b7280':'#1d4ed8', padding:'2px 6px', borderRadius:4, fontSize:11, fontWeight:600 }}>{row.enrollment}</span></td>
                      <td style={tdStyle}><strong>{row.name}</strong>{row.isMain===false&&<span style={{ background:'#f3f4f6', color:'#6b7280', fontSize:10, padding:'1px 5px', borderRadius:8, marginLeft:4 }}>member</span>}</td>
                      <td style={{ ...tdStyle, fontSize:11 }}>{row.email}</td>
                      <td style={tdStyle}>{row.mobile}</td>
                      <td style={tdStyle}>{row.cls}</td>
                      <td style={tdStyle}>{row.isFirst&&<strong style={{ fontSize:12 }}>{row.title}</strong>}</td>
                      <td style={tdStyle}>{row.isFirst&&row.frontend!=='-'&&<span style={{ background:'#eff6ff', color:'#1d4ed8', padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:600 }}>{row.frontend}</span>}{row.isFirst&&row.frontend==='-'&&<span style={{ color:'#aaa', fontSize:11 }}>-</span>}</td>
                      <td style={tdStyle}>{row.isFirst&&row.backend!=='-'&&<span style={{ background:'#fef9c3', color:'#854d0e', padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:600 }}>{row.backend}</span>}{row.isFirst&&row.backend==='-'&&<span style={{ color:'#aaa', fontSize:11 }}>-</span>}</td>
                      <td style={tdStyle}>{row.isFirst&&<span style={{ fontSize:12 }}>{row.faculty}</span>}</td>
                      <td style={tdStyle}>{row.isFirst&&<div style={{ display:'flex', gap:4 }}><button type="button" className="btn btn-warning" onClick={() => openEdit(row.project)} style={{ padding:'4px 8px', fontSize:11 }}>Edit</button><button type="button" className="btn btn-danger" onClick={() => remove(row.projectId)} style={{ padding:'4px 8px', fontSize:11 }}>Delete</button></div>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'white', borderRadius:16, padding:32, width:'100%', maxWidth:580, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ marginBottom:20 }}>{editProject ? 'Edit Project' : 'Create New Project'}</h3>
            <form onSubmit={save}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div className="form-group">
                  <label>Group No. *</label>
                  <input type="text" placeholder="e.g. G-01" value={form.groupNo} onChange={e => setForm({...form, groupNo:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select value={form.category} onChange={e => setForm({...form, category:e.target.value})} required>
                    <option value="">-- Select Category --</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group"><label>Project Title</label><input type="text" placeholder="Enter project title" value={form.title} onChange={e => setForm({...form, title:e.target.value})} /></div>
              <div className="form-group"><label>Description</label><textarea rows="2" placeholder="Brief description" value={form.description} onChange={e => setForm({...form, description:e.target.value})} style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid #d1d5db', fontSize:14 }} /></div>
              <div className="form-group"><label>Project Definition</label><textarea rows="3" placeholder="Detailed definition" value={form.definition} onChange={e => setForm({...form, definition:e.target.value})} style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid #d1d5db', fontSize:14 }} /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div className="form-group"><label>Frontend</label><input type="text" placeholder="e.g. React" value={form.frontend} onChange={e => setForm({...form, frontend:e.target.value})} /></div>
                <div className="form-group"><label>Backend</label><input type="text" placeholder="e.g. Node.js" value={form.backend} onChange={e => setForm({...form, backend:e.target.value})} /></div>
              </div>
              <div className="form-group">
                <label>Faculty Guide</label>
                <select value={form.faculty} onChange={e => setForm({...form, faculty:e.target.value})}>
                  <option value="">-- Select Faculty --</option>
                  {faculties.map(f => <option key={f._id} value={f._id}>{f.name} ({f.email})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Assign Students</label>
                <div style={{ border:'1px solid #d1d5db', borderRadius:8, padding:10, maxHeight:160, overflowY:'auto' }}>
                  {students.length===0 && <p style={{ color:'#888', fontSize:13, margin:0 }}>No students yet</p>}
                  {students.map(s => (
                    <label key={s._id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, cursor:'pointer', fontSize:13 }}>
                      <input type="checkbox" checked={form.students.includes(s._id)} onChange={() => toggleStudent(s._id)} />
                      <strong>{s.name}</strong>
                      <span style={{ color:'#888', fontSize:12 }}>{s.enrollment?'('+s.enrollment+')':'('+s.email+')'}</span>
                      {s.teamMembers?.length>0&&<span style={{ background:'#eff6ff', color:'#1d4ed8', fontSize:10, padding:'1px 6px', borderRadius:10 }}>+{s.teamMembers.length} members</span>}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ background:'#e5e7eb' }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editProject ? 'Update' : 'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}