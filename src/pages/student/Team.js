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

const emptyMember = { name:'', email:'', enrollment:'', mobile:'', studentClass:'' };

export default function StudentTeam() {
  const [profile, setProfile]   = useState(null);
  const [members, setMembers]   = useState([{ ...emptyMember }]);
  const [saving, setSaving]     = useState(false);
  const token = localStorage.getItem('token');
  const h = { headers: { Authorization: `Bearer ${token}` } };

  const load = () => {
    axios.get('http://localhost:5000/api/student/profile', h).then(r => {
      setProfile(r.data);
      if (r.data.teamMembers && r.data.teamMembers.length > 0) {
        setMembers(r.data.teamMembers);
      }
    });
  };

  useEffect(() => { load(); }, []);

  const addMember = () => {
    if (members.length >= 5) return toast.error('Maximum 5 team members allowed');
    setMembers([...members, { ...emptyMember }]);
  };

  const removeMember = (i) => {
    if (members.length === 1) return toast.error('At least one team member required');
    setMembers(members.filter((_, idx) => idx !== i));
  };

  const updateMember = (i, field, value) => {
    const updated = [...members];
    updated[i][field] = value;
    setMembers(updated);
  };

  const save = async (e) => {
    e.preventDefault();
    // Validate all members have name and enrollment
    for (let i = 0; i < members.length; i++) {
      if (!members[i].name || !members[i].enrollment) {
        return toast.error('Member ' + (i+1) + ': Name and Enrollment are required');
      }
    }
    setSaving(true);
    try {
      await axios.put('http://localhost:5000/api/student/profile', {
        name:         profile.name,
        mobile:       profile.mobile,
        studentClass: profile.studentClass,
        teamMembers:  members,
      }, h);
      toast.success('Team members saved successfully!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Navbar title="Student Portal" />
      <div className="layout">
        <Sidebar links={links} />
        <div className="main-content">

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div>
              <h2 style={{ margin:0 }}>My Team Members</h2>
              <p style={{ color:'#888', fontSize:14, margin:'4px 0 0' }}>
                Add details of all students in your project group
              </p>
            </div>
            <button type="button" className="btn btn-primary"
              onClick={addMember}
              disabled={members.length >= 5}>
              + Add Member
            </button>
          </div>

          <div style={{
            background:'#eff6ff', border:'1px solid #bfdbfe',
            borderRadius:10, padding:'12px 16px', marginBottom:20,
            fontSize:13, color:'#1e40af'
          }}>
            Add all team members including yourself. Maximum 5 members per group.
            All fields except Mobile are required.
          </div>

          <form onSubmit={save}>
            {members.map((member, i) => (
              <div key={i} className="card" style={{ marginBottom:16 }}>
                <div style={{
                  display:'flex', justifyContent:'space-between',
                  alignItems:'center', marginBottom:16
                }}>
                  <h4 style={{ margin:0, color:'#4f46e5' }}>
                    👤 Member {i + 1}
                    {i === 0 && (
                      <span style={{
                        background:'#ede9fe', color:'#5b21b6',
                        fontSize:11, padding:'2px 8px', borderRadius:20,
                        marginLeft:8, fontWeight:400
                      }}>
                        You
                      </span>
                    )}
                  </h4>
                  {members.length > 1 && (
                    <button type="button" className="btn btn-danger"
                      onClick={() => removeMember(i)}
                      style={{ padding:'4px 10px', fontSize:12 }}>
                      Remove
                    </button>
                  )}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label style={{ display:'block', marginBottom:4, fontSize:13, fontWeight:500 }}>
                      Full Name *
                    </label>
                    <input type="text" placeholder="e.g. Raj Patel"
                      value={member.name}
                      onChange={e => updateMember(i, 'name', e.target.value)}
                      required
                      style={{
                        width:'100%', padding:'9px 12px',
                        border:'1px solid #d1d5db', borderRadius:8,
                        fontSize:14, boxSizing:'border-box'
                      }} />
                  </div>
                  <div>
                    <label style={{ display:'block', marginBottom:4, fontSize:13, fontWeight:500 }}>
                      Enrollment Number *
                    </label>
                    <input type="text" placeholder="e.g. 21CS001"
                      value={member.enrollment}
                      onChange={e => updateMember(i, 'enrollment', e.target.value)}
                      required
                      style={{
                        width:'100%', padding:'9px 12px',
                        border:'1px solid #d1d5db', borderRadius:8,
                        fontSize:14, boxSizing:'border-box'
                      }} />
                  </div>
                  <div>
                    <label style={{ display:'block', marginBottom:4, fontSize:13, fontWeight:500 }}>
                      Email ID *
                    </label>
                    <input type="email" placeholder="e.g. raj@gmail.com"
                      value={member.email}
                      onChange={e => updateMember(i, 'email', e.target.value)}
                      required
                      style={{
                        width:'100%', padding:'9px 12px',
                        border:'1px solid #d1d5db', borderRadius:8,
                        fontSize:14, boxSizing:'border-box'
                      }} />
                  </div>
                  <div>
                    <label style={{ display:'block', marginBottom:4, fontSize:13, fontWeight:500 }}>
                      Mobile Number
                    </label>
                    <input type="text" placeholder="e.g. 9876543210"
                      value={member.mobile}
                      onChange={e => updateMember(i, 'mobile', e.target.value)}
                      maxLength={10}
                      style={{
                        width:'100%', padding:'9px 12px',
                        border:'1px solid #d1d5db', borderRadius:8,
                        fontSize:14, boxSizing:'border-box'
                      }} />
                  </div>
                  <div>
                    <label style={{ display:'block', marginBottom:4, fontSize:13, fontWeight:500 }}>
                      Class Name *
                    </label>
                    <input type="text" placeholder="e.g. TY-B, SY-A"
                      value={member.studentClass}
                      onChange={e => updateMember(i, 'studentClass', e.target.value)}
                      required
                      style={{
                        width:'100%', padding:'9px 12px',
                        border:'1px solid #d1d5db', borderRadius:8,
                        fontSize:14, boxSizing:'border-box'
                      }} />
                  </div>
                </div>
              </div>
            ))}

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
              <button type="button" className="btn btn-primary"
                onClick={addMember} disabled={members.length >= 5}
                style={{ padding:'10px 20px' }}>
                + Add Another Member
              </button>
              <button type="submit" className="btn btn-success"
                disabled={saving} style={{ padding:'10px 24px' }}>
                {saving ? 'Saving...' : '💾 Save Team Members'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}