import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function Register() {
  const { token }  = useParams();
  const navigate   = useNavigate();
  const [invite, setInvite] = useState(null);
  const [error, setError]   = useState('');
  const [form, setForm]     = useState({
    name:         '',
    password:     '',
    enrollment:   '',
    studentClass: '',
    mobile:       '',
  });

  useEffect(() => {
    axios.get(`http://localhost:5000/api/auth/invite/${token}`)
      .then(res => {
        if (res.data.role === 'faculty') {
          setError('Faculty accounts are created by admin. Contact your administrator for login credentials.');
          return;
        }
        setInvite(res.data);
      })
      .catch(() => setError('Invalid or expired registration link.'));
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `http://localhost:5000/api/auth/register/${token}`,
        form
      );
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role',  res.data.role);
      localStorage.setItem('name',  res.data.name);
      localStorage.setItem('id',    res.data.id);
      toast.success('Registration successful!');
      navigate('/student');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Registration failed');
    }
  };

  return (
    <div className="login-page">
      <div className="login-box" style={{ maxWidth:460 }}>
        <h2>🎓 Student Registration</h2>
        <p style={{ textAlign:'center', color:'#888', marginBottom:20 }}>
          College Project Management System
        </p>

        {error && (
          <div style={{
            background:'#fee2e2', color:'#dc2626',
            padding:'12px 16px', borderRadius:8,
            marginBottom:16, fontSize:14, textAlign:'center'
          }}>
            ⚠️ {error}
          </div>
        )}

        {!error && !invite && (
          <p style={{ textAlign:'center', color:'#888' }}>
            Verifying your invite link...
          </p>
        )}

        {invite && (
          <>
            <div style={{
              background:'#f0fdf4', color:'#16a34a',
              padding:'10px 14px', borderRadius:8,
              marginBottom:20, fontSize:13, textAlign:'center'
            }}>
              ✅ Registering as Student — {invite.email}
            </div>

            <form onSubmit={submit}>
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" placeholder="Enter your full name"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  required />
              </div>

              <div className="form-group">
                <label>Enrollment Number *</label>
                <input type="text" placeholder="e.g. 21CS001"
                  value={form.enrollment}
                  onChange={e => setForm({...form, enrollment: e.target.value})}
                  required />
              </div>

              <div className="form-group">
                <label>Class *</label>
                <input type="text" placeholder="e.g. TY-B, SY-A"
                  value={form.studentClass}
                  onChange={e => setForm({...form, studentClass: e.target.value})}
                  required />
              </div>

              <div className="form-group">
                <label>Mobile Number</label>
                <input type="text" placeholder="e.g. 9876543210"
                  value={form.mobile}
                  onChange={e => setForm({...form, mobile: e.target.value})}
                  maxLength={10} />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input type="text" value={invite.email} disabled
                  style={{ background:'#f9fafb', color:'#888' }} />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input type="password" placeholder="Create a strong password"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  required />
              </div>

              <button className="btn btn-primary"
                style={{ width:'100%', marginTop:8, padding:12 }}
                type="submit">
                Create My Account
              </button>
            </form>

            <p style={{ textAlign:'center', marginTop:16, fontSize:13, color:'#888' }}>
              Already registered?{' '}
              <a href="/login" style={{ color:'#4f46e5' }}>Login here</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}