import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_URL;

const links = [
  { path: '/admin',           label: 'Dashboard', icon: '📊' },
  { path: '/admin/faculties', label: 'Faculties', icon: '👨‍🏫' },
  { path: '/admin/students',  label: 'Students',  icon: '👨‍🎓' },
  { path: '/admin/groups',    label: 'Groups',    icon: '👥' },
  { path: '/admin/projects',  label: 'Projects',  icon: '📁' },
  { path: '/admin/monitor',   label: 'Monitor',   icon: '👁️' },
];

export default function AdminGroups() {
  const [groups, setGroups]         = useState([]);
  const [faculties, setFaculties]   = useState([]);
  const [tab, setTab]               = useState('groups');
  const [assignModal, setAssignModal]     = useState(null);
  const [editTeamModal, setEditTeamModal] = useState(null);
  const [viewDefs, setViewDefs]           = useState(null);
  const [assignForm, setAssignForm] = useState({ facultyId:'', groupNo:'' });
  const [teamForm, setTeamForm]     = useState([]);
  const [editGroupNo, setEditGroupNo] = useState('');
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const token = localStorage.getItem('token');
  const h = { headers: { Authorization: 'Bearer ' + token } };

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
    axios.get(`${API}/api/admin/student-groups`, h).then(r => setGroups(r.data)).catch(() => {});
    axios.get(`${API}/api/admin/faculties`, h).then(r => setFaculties(r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const openAssign = (group) => {
    setAssignModal(group);
    setAssignForm({ facultyId: group.faculty?._id || '', groupNo: group.groupNo || '' });
  };

  const assignGroup = async (e) => {
    e.preventDefault();
    const normalizedGroupNo = assignForm.groupNo.trim().toUpperCase();
    if (!normalizedGroupNo) return toast.error('Group number is required.');
    setSaving(true);
    try {
      await axios.post(`${API}/api/admin/assign-group`, {
        studentId: assignModal.student._id,
        facultyId: assignForm.facultyId,
        groupNo:   normalizedGroupNo,
      }, h);
      toast.success('Group assigned to faculty!');
      setAssignModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to assign');
    } finally {
      setSaving(false);
    }
  };

  const openEditTeam = (group) => {
    setEditTeamModal(group);
    setEditGroupNo(group.groupNo || '');
    setTeamForm(
      group.teamMembers && group.teamMembers.length > 0
        ? group.teamMembers.map(m => ({ ...m }))
        : [{ name:'', email:'', enrollment:'', mobile:'', studentClass:'' }]
    );
  };

  const saveTeam = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(
        `${API}/api/admin/student/${editTeamModal.student._id}/team`,
        {
          teamMembers: teamForm,
          groupNo: editGroupNo.trim().toUpperCase(),
        }, h
      );
      toast.success('Team updated successfully!');
      setEditTeamModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to update team');
    } finally {
      setSaving(false);
    }
  };

  const updateMember = (i, field, val) => {
    const updated = [...teamForm];
    updated[i][field] = val;
    setTeamForm(updated);
  };

  const addMember = () => {
    if (teamForm.length >= 5) return toast.error('Maximum 5 members allowed');
    setTeamForm([...teamForm, { name:'', email:'', enrollment:'', mobile:'', studentClass:'' }]);
  };

  const removeMember = (i) => setTeamForm(teamForm.filter((_, idx) => idx !== i));

  const tabStyle = (t) => ({
    padding:'10px 20px', border:'none',
    borderBottom: tab === t ? '3px solid #4f46e5' : '3px solid transparent',
    background:'none', cursor:'pointer',
    fontWeight: tab === t ? 600 : 400,
    color: tab === t ? '#4f46e5' : '#666', fontSize:14,
  });

  const thStyle = { padding:'8px 10px', textAlign:'left', border:'1px solid #e5e7eb', background:'#f9fafb', fontWeight:600, fontSize:12, color:'#374151' };
  const tdStyle = { padding:'7px 10px', border:'1px solid #e5e7eb', fontSize:12, color:'#374151' };

  const filtered = groups
    .slice()
    .sort(compareGroupNo)
    .filter(g =>
      (g.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
      g.student?.enrollment?.toLowerCase().includes(search.toLowerCase()) ||
      (g.groupNo || '').toLowerCase().includes(search.toLowerCase())) &&
      (branchFilter === 'all' || getBranch(g.student?.enrollment) === branchFilter)
    );

  const assigned   = filtered.filter(g => g.faculty);
  const unassigned = filtered.filter(g => !g.faculty);
  const displayList = tab === 'groups' ? filtered : tab === 'unassigned' ? unassigned : assigned;

  return (
    <div>
      <Navbar title="Admin Panel" />
      <div className="layout">
        <Sidebar links={links} />
        <div className="main-content">

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div>
              <h2 style={{ margin:0 }}>Project Groups</h2>
              <p style={{ color:'#888', fontSize:14, margin:'4px 0 0' }}>Each student with a team forms a group. Assign groups to faculty.</p>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <span style={{ background:'#fef9c3', color:'#854d0e', padding:'6px 14px', borderRadius:20, fontSize:13, fontWeight:600 }}>{unassigned.length} Unassigned</span>
              <span style={{ background:'#dcfce7', color:'#166534', padding:'6px 14px', borderRadius:20, fontSize:13, fontWeight:600 }}>{assigned.length} Assigned</span>
            </div>
          </div>

          <div style={{ borderBottom:'1px solid #e5e7eb', marginBottom:16, display:'flex', gap:4, flexWrap:'wrap', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
              <button style={tabStyle('groups')}     onClick={() => setTab('groups')}     type="button">All Groups ({groups.length})</button>
              <button style={tabStyle('unassigned')} onClick={() => setTab('unassigned')} type="button">Unassigned ({unassigned.length})</button>
              <button style={tabStyle('assigned')}   onClick={() => setTab('assigned')}   type="button">Assigned ({assigned.length})</button>
            </div>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
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
          </div>

          <input type="text" placeholder="Search by student name, enrollment or group number..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:'100%', padding:'10px 16px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14, marginBottom:16, outline:'none', boxSizing:'border-box' }}
          />

          {displayList.length === 0 && (
            <div className="card" style={{ textAlign:'center', color:'#888', padding:40 }}>
              <div style={{ fontSize:48, marginBottom:12 }}>👥</div>
              <h3>No Groups Found</h3>
              <p>Students need to register and add team members first.</p>
            </div>
          )}

          {displayList.map((g) => (
            <div className="card" key={g.student._id} style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                    {g.groupNo ? (
                      <span style={{ background:'#4f46e5', color:'white', padding:'3px 12px', borderRadius:20, fontSize:13, fontWeight:700 }}>{g.groupNo}</span>
                    ) : (
                      <span style={{ background:'#f3f4f6', color:'#9ca3af', padding:'3px 12px', borderRadius:20, fontSize:13 }}>No Group No.</span>
                    )}
                    <span style={{ fontWeight:600, fontSize:16 }}>{g.student.name}'s Group</span>
                    <span style={{ background:'#eff6ff', color:'#1d4ed8', padding:'2px 10px', borderRadius:20, fontSize:12, fontWeight:600 }}>
                      {getBranch(g.student?.enrollment)}
                    </span>
                    <span style={{ background: g.faculty ? '#dcfce7' : '#fef9c3', color: g.faculty ? '#166534' : '#854d0e', padding:'2px 10px', borderRadius:20, fontSize:12, fontWeight:600 }}>
                      {g.faculty ? 'Assigned to ' + g.faculty.name : 'Not Assigned'}
                    </span>
                    <span style={{
                      background: g.definitionStatus==='finalized'?'#dcfce7': g.definitionStatus==='submitted'?'#dbeafe':'#f3f4f6',
                      color: g.definitionStatus==='finalized'?'#166534': g.definitionStatus==='submitted'?'#1e40af':'#6b7280',
                      padding:'2px 10px', borderRadius:20, fontSize:12, fontWeight:600
                    }}>
                      {g.definitionStatus==='finalized'?'✅ Def Finalized': g.definitionStatus==='submitted'?'📝 Defs Submitted':'⏳ No Definitions'}
                    </span>
                  </div>
                  <p style={{ color:'#888', fontSize:13, margin:0 }}>
                    {g.student.email} | Enrollment: {g.student.enrollment||'-'} | Class: {g.student.studentClass||'-'}
                  </p>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginLeft:16 }}>
                  <button type="button" className="btn btn-primary" onClick={() => openAssign(g)} style={{ fontSize:12, padding:'7px 14px', whiteSpace:'nowrap' }}>
                    {g.faculty ? '✏️ Reassign Faculty' : '➕ Assign to Faculty'}
                  </button>
                  <button type="button" className="btn btn-warning" onClick={() => openEditTeam(g)} style={{ fontSize:12, padding:'7px 14px', whiteSpace:'nowrap' }}>
                    👥 Edit Team
                  </button>
                  {g.definitions && g.definitions.length > 0 && (
                    <button type="button" className="btn btn-success" onClick={() => setViewDefs(g)} style={{ fontSize:12, padding:'7px 14px', whiteSpace:'nowrap' }}>
                      📝 View Definitions ({g.definitions.length})
                    </button>
                  )}
                </div>
              </div>

              {g.teamMembers && g.teamMembers.length > 0 ? (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', minWidth:600 }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>#</th>
                        <th style={thStyle}>Name</th>
                        <th style={thStyle}>Enrollment No.</th>
                        <th style={thStyle}>Email</th>
                        <th style={thStyle}>Mobile</th>
                        <th style={thStyle}>Class</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.teamMembers.map((m, mi) => (
                        <tr key={mi}>
                          <td style={tdStyle}>{mi+1}</td>
                          <td style={tdStyle}><strong>{m.name||'-'}</strong></td>
                          <td style={tdStyle}><span style={{ background:'#eff6ff', color:'#1d4ed8', padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:600 }}>{m.enrollment||'-'}</span></td>
                          <td style={tdStyle}>{m.email||'-'}</td>
                          <td style={tdStyle}>{m.mobile||'-'}</td>
                          <td style={tdStyle}>{m.studentClass||'-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ background:'#f9fafb', borderRadius:8, padding:'12px 16px', fontSize:13, color:'#9ca3af', textAlign:'center' }}>
                  No team members added yet by this student.
                </div>
              )}

              {g.definitions && g.definitions.length > 0 && (
                <div style={{ background:'#f0f4ff', borderRadius:8, padding:'10px 14px', marginTop:10, fontSize:13, color:'#4f46e5', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span>📝 {g.definitions.length} definition(s) submitted by student</span>
                  <button type="button" onClick={() => setViewDefs(g)} style={{ border:'none', background:'none', color:'#4f46e5', cursor:'pointer', fontSize:13, fontWeight:600 }}>
                    View All Definitions →
                  </button>
                </div>
              )}
            </div>
          ))}

        </div>
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'white', borderRadius:16, padding:32, width:'100%', maxWidth:480, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ marginBottom:4 }}>Assign Group to Faculty</h3>
            <p style={{ color:'#666', fontSize:14, marginBottom:20 }}>Student: <strong>{assignModal.student.name}</strong> | Team: <strong>{assignModal.teamMembers?.length||0} members</strong></p>
            <form onSubmit={assignGroup}>
              <div className="form-group">
                <label>Group Number *</label>
                <input type="text" placeholder="e.g. G-01" value={assignForm.groupNo} onChange={e => setAssignForm({...assignForm, groupNo: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Assign to Faculty *</label>
                <select value={assignForm.facultyId} onChange={e => setAssignForm({...assignForm, facultyId: e.target.value})} required>
                  <option value="">-- Select Faculty --</option>
                  {faculties.map(f => <option key={f._id} value={f._id}>{f.name} ({f.email})</option>)}
                </select>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" className="btn" onClick={() => setAssignModal(null)} style={{ background:'#e5e7eb' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Assigning...' : '✅ Assign Group'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Definitions Modal */}
      {viewDefs && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'white', borderRadius:16, padding:32, width:'100%', maxWidth:620, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <h3 style={{ margin:0 }}>Definitions — {viewDefs.student.name}'s Group</h3>
                <p style={{ color:'#888', fontSize:13, margin:'4px 0 0' }}>{viewDefs.definitions?.length} definition(s) submitted</p>
              </div>
              <button type="button" className="btn" onClick={() => setViewDefs(null)} style={{ background:'#e5e7eb' }}>Close</button>
            </div>
            {viewDefs.definitions?.map((d, i) => (
              <div key={i} style={{ border: viewDefs.project?.selectedDefinition===i ? '2px solid #4f46e5' : '1px solid #e5e7eb', borderRadius:12, padding:16, marginBottom:12, background: viewDefs.project?.selectedDefinition===i ? '#f0f4ff' : 'white' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <strong>{d.title}</strong>
                  {viewDefs.project?.selectedDefinition===i && <span style={{ background:'#dcfce7', color:'#166534', padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600 }}>✅ Selected</span>}
                </div>
                <p style={{ color:'#555', fontSize:14, lineHeight:1.7, margin:'0 0 10px' }}>{d.description}</p>
                <div style={{ display:'flex', gap:8 }}>
                  {d.frontend && <span style={{ background:'#eff6ff', color:'#1d4ed8', padding:'3px 10px', borderRadius:6, fontSize:12 }}>Frontend: {d.frontend}</span>}
                  {d.backend  && <span style={{ background:'#fef9c3', color:'#854d0e', padding:'3px 10px', borderRadius:6, fontSize:12 }}>Backend: {d.backend}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {editTeamModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'white', borderRadius:16, padding:32, width:'100%', maxWidth:620, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ marginBottom:4 }}>Edit Team — {editTeamModal.student.name}</h3>
            <p style={{ color:'#888', fontSize:13, marginBottom:20 }}>Add, edit or remove team members for this group. You can also change the group number here.</p>
            <form onSubmit={saveTeam}>
              <div className="form-group">
                <label>Group Number</label>
                <input
                  type="text"
                  placeholder="e.g. G-01"
                  value={editGroupNo}
                  onChange={e => setEditGroupNo(e.target.value)}
                />
              </div>
              {teamForm.map((m, i) => (
                <div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:16, marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <strong style={{ color:'#4f46e5', fontSize:14 }}>Member {i+1}{i===0 && <span style={{ background:'#ede9fe', color:'#5b21b6', fontSize:11, padding:'2px 8px', borderRadius:20, marginLeft:8, fontWeight:400 }}>Primary</span>}</strong>
                    <button type="button" className="btn btn-danger" onClick={() => removeMember(i)} style={{ padding:'4px 10px', fontSize:12 }}>Remove</button>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    {[
                      { f:'name',         l:'Full Name',      p:'e.g. Raj Patel' },
                      { f:'enrollment',   l:'Enrollment No.', p:'e.g. 21CS001' },
                      { f:'email',        l:'Email ID',       p:'e.g. raj@gmail.com' },
                      { f:'mobile',       l:'Mobile Number',  p:'e.g. 9876543210' },
                      { f:'studentClass', l:'Class Name',     p:'e.g. TY-B' },
                    ].map(({ f, l, p }) => (
                      <div key={f}>
                        <label style={{ display:'block', fontSize:12, marginBottom:4, fontWeight:500, color:'#374151' }}>{l}</label>
                        <input type="text" placeholder={p} value={m[f]||''} onChange={e => updateMember(i, f, e.target.value)}
                          style={{ width:'100%', padding:'8px 10px', border:'1px solid #d1d5db', borderRadius:6, fontSize:13, boxSizing:'border-box', outline:'none' }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-primary" onClick={addMember} disabled={teamForm.length>=5} style={{ marginBottom:16, fontSize:13 }}>+ Add Member</button>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" className="btn" onClick={() => setEditTeamModal(null)} style={{ background:'#e5e7eb' }}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={saving}>{saving ? 'Saving...' : '💾 Save Team'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}