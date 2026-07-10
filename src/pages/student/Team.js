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

// VALIDATION HELPERS
// Stricter email check: rejects things like "ABC@gmail.com" only if format is wrong,
// but real validity (does the mailbox exist) can only be confirmed by sending mail —
// so we validate format + common domain typos here.
const isValidEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!re.test(email)) return false;
  // block obviously fake placeholder patterns
  const lower = email.toLowerCase();
  if (lower.startsWith('test@') || lower.startsWith('abc@') || lower.startsWith('xyz@') || lower.startsWith('a@'))
    return false;
  return true;
};
const isValidMobile = (mobile) => /^[6-9]\d{9}$/.test(mobile);
const isValidEnrollment = (enrollment) => /^\d{14}$/.test(enrollment);

export default function StudentTeam() {
  const [profile, setProfile]   = useState(null);
  const [members, setMembers]   = useState([{ ...emptyMember }]);
  const [saving, setSaving]     = useState(false);
  const [locked, setLocked]     = useState(false);
  const token = localStorage.getItem('token');
  const h = { headers: { Authorization: `Bearer ${token}` } };

  const load = () => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/student/profile`, h).then(r => {
      setProfile(r.data);
      if (r.data.teamMembers && r.data.teamMembers.length > 0) {
        setMembers(r.data.teamMembers);
      }
      setLocked(!!r.data.teamLocked);
    });
  };

  // When a student has no existing team, pre-fill the first member with their own profile
  useEffect(() => {
    if (!profile) return;
    if (!profile.teamMembers || profile.teamMembers.length === 0) {
      const selfMember = {
        name: profile.name || '',
        email: profile.email || '',
        enrollment: profile.enrollment || '',
        mobile: profile.mobile || '',
        studentClass: profile.studentClass || '',
      };
      setMembers(current => {
        // if the current members are default empty or only emptyMember, replace with selfMember
        if (!current || (current.length === 1 && Object.values(current[0]).every(v => !v))) {
          return [selfMember];
        }
        return current;
      });
    }
  }, [profile]);

  useEffect(() => { load(); }, []);

  const addMember = () => {
    if (locked) return;
    if (members.length >= 7) return toast.error('Maximum 7 team members allowed');
    setMembers([...members, { ...emptyMember }]);
  };

  const removeMember = (i) => {
    if (locked) return;
    if (members.length === 1) return toast.error('At least one team member required');
    setMembers(members.filter((_, idx) => idx !== i));
  };

  const updateMember = (i, field, value) => {
    if (locked) return;
    const updated = [...members];
    updated[i][field] = value;
    setMembers(updated);
  };

  // Find duplicates within the current form (client-side, instant feedback)
  const findDuplicateFields = () => {
    const emailCount = {}, mobileCount = {}, enrollCount = {}, nameCount = {};
    members.forEach(m => {
      const e = (m.email || '').trim().toLowerCase();
      const mo = (m.mobile || '').trim();
      const en = (m.enrollment || '').trim().toUpperCase();
      const n = (m.name || '').trim().toLowerCase();
      if (e)  emailCount[e]  = (emailCount[e]  || 0) + 1;
      if (mo) mobileCount[mo] = (mobileCount[mo] || 0) + 1;
      if (en) enrollCount[en] = (enrollCount[en] || 0) + 1;
      if (n)  nameCount[n]   = (nameCount[n]   || 0) + 1;
    });
    return { emailCount, mobileCount, enrollCount, nameCount };
  };

  const dupes = findDuplicateFields();
  const isDupField = (countObj, value, type) => {
    const key = type === 'email' ? value.trim().toLowerCase()
              : type === 'enrollment' ? value.trim().toUpperCase()
              : type === 'name' ? value.trim().toLowerCase()
              : value.trim();
    return key && countObj[key] > 1;
  };

  const save = async (e) => {
    e.preventDefault();
    if (locked) return;

    // CLIENT-SIDE VALIDATION for each member
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      const num = i + 1;

      if (!m.name.trim())
        return toast.error(`Member ${num}: Full name is required`);

      if (!m.enrollment.trim())
        return toast.error(`Member ${num}: Enrollment number is required`);

      if (!isValidEnrollment(m.enrollment.trim()))
        return toast.error(`Member ${num}: Enrollment number must contain only digits (max 14 numbers)`);

      if (!m.email.trim())
        return toast.error(`Member ${num}: Email is required`);

      if (!isValidEmail(m.email))
        return toast.error(`Member ${num}: Enter a valid, real email address`);

      if (!m.mobile.trim())
        return toast.error(`Member ${num}: Mobile number is required`);

      if (!isValidMobile(m.mobile))
        return toast.error(`Member ${num}: Enter a valid 10-digit Indian mobile number (starts with 6-9)`);

      if (!m.studentClass.trim())
        return toast.error(`Member ${num}: Class name is required`);
    }

    // CLIENT-SIDE duplicate check within the team
    if (Object.values(dupes.emailCount).some(c => c > 1))
      return toast.error('Duplicate email found — each member must have a unique email');
    if (Object.values(dupes.mobileCount).some(c => c > 1))
      return toast.error('Duplicate mobile number found — each member must have a unique number');
    if (Object.values(dupes.enrollCount).some(c => c > 1))
      return toast.error('Duplicate enrollment number found — each member must be unique');
    if (Object.values(dupes.nameCount).some(c => c > 1))
      return toast.error('Duplicate name found — each member must have a different name');

    if (!window.confirm(
      'Once saved, your team list will be LOCKED and you will NOT be able to edit or remove members yourself. ' +
      'Only your admin can make changes after this. Continue?'
    )) return;

    setSaving(true);
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/student/profile`, {
        name:         profile.name,
        mobile:       profile.mobile,
        studentClass: profile.studentClass,
        teamMembers:  members,
      }, h);
      toast.success('Team members saved and locked!');
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
                    {!locked && (
                      <button type="button" className="btn btn-primary"
                        onClick={addMember}
                        disabled={members.length >= 7}>
                        + Add Member
                      </button>
                    )}
          </div>

          {locked ? (
            <div style={{
              background:'#fef9c3', border:'1px solid #fde047',
              borderRadius:10, padding:'12px 16px', marginBottom:20,
              fontSize:13, color:'#854d0e'
            }}>
              🔒 <strong>Team Locked.</strong> Your team has already been saved and cannot be edited or removed by you.
              If you need to make changes, please contact your admin.
            </div>
          ) : (
            <div style={{
              background:'#eff6ff', border:'1px solid #bfdbfe',
              borderRadius:10, padding:'12px 16px', marginBottom:20,
              fontSize:13, color:'#1e40af'
            }}>
              ℹ️ All fields are required. Mobile must be a valid 10-digit Indian number (starts with 6, 7, 8 or 9).
              Email, mobile, enrollment and name must be <strong>unique</strong> for every member.
              <br />⚠️ Once you click <strong>Save</strong>, the team list is <strong>locked permanently</strong> — only admin can edit it afterward.
            </div>
          )}

          <form onSubmit={save}>
            {members.map((member, i) => {
              const emailDup = isDupField(dupes.emailCount, member.email, 'email');
              const mobileDup = isDupField(dupes.mobileCount, member.mobile, 'mobile');
              const enrollDup = isDupField(dupes.enrollCount, member.enrollment, 'enrollment');
              const nameDup = isDupField(dupes.nameCount, member.name, 'name');

              return (
                <div key={i} className="card" style={{ marginBottom:16, opacity: locked ? 0.85 : 1 }}>
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
                      {locked && (
                        <span style={{
                          background:'#fef9c3', color:'#854d0e',
                          fontSize:11, padding:'2px 8px', borderRadius:20,
                          marginLeft:8, fontWeight:400
                        }}>
                          🔒 Locked
                        </span>
                      )}
                    </h4>
                    {!locked && members.length > 1 && (
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
                        disabled={locked}
                        style={{
                          width:'100%', padding:'9px 12px',
                          border: nameDup ? '1px solid #dc2626' : '1px solid #d1d5db',
                          borderRadius:8, fontSize:14, boxSizing:'border-box',
                          background: locked ? '#f9fafb' : 'white'
                        }} />
                      {nameDup && (
                        <p style={{ color:'#dc2626', fontSize:11, margin:'3px 0 0' }}>
                          ⚠️ Duplicate name in your team
                        </p>
                      )}
                    </div>
                    <div>
                      <label style={{ display:'block', marginBottom:4, fontSize:13, fontWeight:500 }}>
                        Enrollment Number * (exactly 14 digits)
                      </label>
                      <input type="text" placeholder="e.g. 24012250910002"
                        value={member.enrollment}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 14);
                          updateMember(i, 'enrollment', val);
                        }}
                        maxLength={14}
                        required
                        disabled={locked}
                        style={{
                          width:'100%', padding:'9px 12px',
                          border: (member.enrollment && !isValidEnrollment(member.enrollment)) || enrollDup ? '1px solid #dc2626' : '1px solid #d1d5db',
                          borderRadius:8, fontSize:14, boxSizing:'border-box',
                          background: locked ? '#f9fafb' : 'white'
                        }} />
                      {member.enrollment && !isValidEnrollment(member.enrollment) && (
                        <p style={{ color:'#dc2626', fontSize:11, margin:'3px 0 0' }}>
                          ⚠️ Must be exactly 14 digits
                        </p>
                      )}
                      {enrollDup && (
                        <p style={{ color:'#dc2626', fontSize:11, margin:'3px 0 0' }}>
                          ⚠️ Duplicate enrollment in your team
                        </p>
                      )}
                    </div>
                    <div>
                      <label style={{ display:'block', marginBottom:4, fontSize:13, fontWeight:500 }}>
                        Email ID *
                      </label>
                      <input type="email" placeholder="e.g. raj.patel123@gmail.com"
                        value={member.email}
                        onChange={e => updateMember(i, 'email', e.target.value)}
                        required
                        disabled={locked}
                        style={{
                          width:'100%', padding:'9px 12px',
                          border: (member.email && !isValidEmail(member.email)) || emailDup ? '1px solid #dc2626' : '1px solid #d1d5db',
                          borderRadius:8, fontSize:14, boxSizing:'border-box',
                          background: locked ? '#f9fafb' : 'white'
                        }} />
                      {member.email && !isValidEmail(member.email) && (
                        <p style={{ color:'#dc2626', fontSize:11, margin:'3px 0 0' }}>
                          ⚠️ Enter a valid, real email address
                        </p>
                      )}
                      {emailDup && (
                        <p style={{ color:'#dc2626', fontSize:11, margin:'3px 0 0' }}>
                          ⚠️ Duplicate email in your team
                        </p>
                      )}
                    </div>
                    <div>
                      <label style={{ display:'block', marginBottom:4, fontSize:13, fontWeight:500 }}>
                        Mobile Number * (10 digits)
                      </label>
                      <input type="text" placeholder="e.g. 9876543210"
                        value={member.mobile}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          updateMember(i, 'mobile', val);
                        }}
                        maxLength={10}
                        required
                        disabled={locked}
                        style={{
                          width:'100%', padding:'9px 12px',
                          border: (member.mobile && !isValidMobile(member.mobile)) || mobileDup ? '1px solid #dc2626' : '1px solid #d1d5db',
                          borderRadius:8, fontSize:14, boxSizing:'border-box',
                          background: locked ? '#f9fafb' : 'white'
                        }} />
                      {member.mobile && !isValidMobile(member.mobile) && (
                        <p style={{ color:'#dc2626', fontSize:11, margin:'3px 0 0' }}>
                          ⚠️ Must be 10 digits starting with 6, 7, 8 or 9
                        </p>
                      )}
                      {mobileDup && (
                        <p style={{ color:'#dc2626', fontSize:11, margin:'3px 0 0' }}>
                          ⚠️ Duplicate mobile number in your team
                        </p>
                      )}
                    </div>
                    <div>
                      <label style={{ display:'block', marginBottom:4, fontSize:13, fontWeight:500 }}>
                        Class Name *
                      </label>
                      <input type="text" placeholder="e.g. TY-B, SY-A"
                        value={member.studentClass}
                        onChange={e => updateMember(i, 'studentClass', e.target.value)}
                        required
                        disabled={locked}
                        style={{
                          width:'100%', padding:'9px 12px',
                          border:'1px solid #d1d5db', borderRadius:8,
                          fontSize:14, boxSizing:'border-box',
                          background: locked ? '#f9fafb' : 'white'
                        }} />
                    </div>
                  </div>
                </div>
              );
            })}

                {!locked && (
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
                <button type="button" className="btn btn-primary"
                  onClick={addMember} disabled={members.length >= 7}
                  style={{ padding:'10px 20px' }}>
                  + Add Another Member
                </button>
                <button type="submit" className="btn btn-success"
                  disabled={saving} style={{ padding:'10px 24px' }}>
                  {saving ? 'Saving...' : '💾 Save Team Members (Locks after save)'}
                </button>
              </div>
            )}
          </form>

        </div>
      </div>
    </div>
  );
}
