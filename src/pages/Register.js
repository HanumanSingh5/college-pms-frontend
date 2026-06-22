import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const isValidEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!re.test(email)) return false;
  const lower = email.toLowerCase();
  if (lower.startsWith('test@') || lower.startsWith('abc@') || lower.startsWith('xyz@') || lower.startsWith('a@'))
    return false;
  return true;
};
const isValidMobile     = (mobile)     => /^[6-9]\d{9}$/.test(mobile);
const isValidEnrollment = (enrollment) => /^\d{14}$/.test(enrollment);

const CLASS_OPTIONS = ['CE', 'IT', 'AIML', 'CC', 'GA', 'CSE'];

// Auto-detect class from enrollment number digits at position 6-8 (0-indexed)
// Example: 24012250210001 → substr(6,3) = "502" → CE
const CLASS_CODE_MAP = {
  '502': 'CE',
  '504': 'IT',
  '509': 'AIML',
  '510': 'CC',
  '511': 'GA',
  '513': 'CSE',
};

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  const checks = {
    length:    password.length >= 8,
    upper:     /[A-Z]/.test(password),
    lower:     /[a-z]/.test(password),
    number:    /[0-9]/.test(password),
    special:   /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    longEnough: password.length >= 12,
  };
  if (checks.length)    score++;
  if (checks.upper)     score++;
  if (checks.lower)     score++;
  if (checks.number)    score++;
  if (checks.special)   score++;
  if (checks.longEnough) score++;

  if (score <= 2) return { score, label: 'Weak',   color: '#ef4444', bg: '#fee2e2', checks };
  if (score <= 3) return { score, label: 'Fair',   color: '#f59e0b', bg: '#fef3c7', checks };
  if (score <= 4) return { score, label: 'Good',   color: '#3b82f6', bg: '#dbeafe', checks };
  return              { score, label: 'Strong', color: '#10b981', bg: '#d1fae5', checks };
};

const isStrongPassword = (password) => {
  // Must be: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  return password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
};

const detectClassFromEnrollment = (enrollment) => {
  if (enrollment.length >= 9) {
    const code = enrollment.substring(6, 9);
    return CLASS_CODE_MAP[code] || '';
  }
  return '';
};

export default function Register() {
  const { token } = useParams();
  const navigate  = useNavigate();
  const [valid, setValid]   = useState(false);
  const [error, setError]   = useState('');
  const [form, setForm]     = useState({
    name:            '',
    email:           '',
    password:        '',
    confirmPassword: '',
    enrollment:      '',
    studentClass:    '',
    mobile:          '',
  });

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/auth/invite/${token}`)
      .then(res => {
        if (res.data.role === 'faculty') {
          setError('Faculty accounts are created by admin. Contact your administrator for login credentials.');
          return;
        }
        setValid(true);
      })
      .catch(() => setError('Invalid or expired registration link.'));
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();

    if (!form.name.trim())
      return toast.error('Full name is required');

    if (!form.email.trim() || !isValidEmail(form.email))
      return toast.error('Enter a valid, real email address');

    if (!form.enrollment.trim())
      return toast.error('Enrollment number is required');

    if (!isValidEnrollment(form.enrollment.trim()))
      return toast.error('Enrollment number must contain only digits (max 14 numbers)');

    if (!form.studentClass.trim())
      return toast.error('Please select your class');

    if (!form.mobile.trim())
      return toast.error('Mobile number is required');

    if (!isValidMobile(form.mobile))
      return toast.error('Enter a valid 10-digit mobile number (must start with 6, 7, 8 or 9)');

    if (!form.password)
      return toast.error('Password is required');

    if (!isStrongPassword(form.password))
      return toast.error('Password must be at least 8 characters with uppercase, lowercase, number and special character');

    if (form.password !== form.confirmPassword)
      return toast.error('Passwords do not match');

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/register/${token}`,
        {
          name:         form.name,
          email:        form.email,
          password:     form.password,
          enrollment:   form.enrollment,
          studentClass: form.studentClass,
          mobile:       form.mobile,
        }
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
      <div className="login-box" style={{ maxWidth: 460 }}>
        <h2>🎓 Student Registration</h2>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: 20 }}>
          College Project Management System
        </p>

        {error && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14, textAlign: 'center' }}>
            ⚠️ {error}
          </div>
        )}

        {!error && !valid && (
          <p style={{ textAlign: 'center', color: '#888' }}>
            Verifying your registration link...
          </p>
        )}

        {valid && (
          <form onSubmit={submit}>

            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" placeholder="Enter your full name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input type="email" placeholder="Enter your email address"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                style={{ border: form.email && !isValidEmail(form.email) ? '1px solid #dc2626' : '' }} />
              {form.email && !isValidEmail(form.email) && (
                <p style={{ color: '#dc2626', fontSize: 11, margin: '3px 0 0' }}>
                  ⚠️ Enter a valid, real email address
                </p>
              )}
            </div>

            <div className="form-group">
              <label>Enrollment Number * (exactly 14 digits)</label>
              <input type="text" placeholder="Enter exactly 14 digits"
                value={form.enrollment}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 14);
                  const detectedClass = detectClassFromEnrollment(val);
                  setForm({ ...form, enrollment: val, studentClass: detectedClass || form.studentClass });
                }}
                maxLength={14}
                required
                style={{ border: form.enrollment && !isValidEnrollment(form.enrollment) ? '1px solid #dc2626' : '' }} />
              {form.enrollment && !isValidEnrollment(form.enrollment) && (
                <p style={{ color: '#dc2626', fontSize: 11, margin: '3px 0 0' }}>
                  ⚠️ Enrollment number must be exactly 14 digits
                </p>
              )}
            </div>

            <div className="form-group">
              <label>Class *
                {form.enrollment.length >= 9 && detectClassFromEnrollment(form.enrollment) && (
                  <span style={{ marginLeft: 8, background: '#d1fae5', color: '#065f46', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                    ✅ Auto-detected from enrollment
                  </span>
                )}
              </label>
              <select
                value={form.studentClass}
                onChange={e => setForm({ ...form, studentClass: e.target.value })}
                required
                style={{ width: '100%', padding: '10px 14px', border: form.studentClass ? '1px solid #10b981' : '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: form.studentClass ? '#f0fdf4' : 'white', fontWeight: form.studentClass ? 600 : 400 }}>
                <option value="">-- Select Class --</option>
                {CLASS_OPTIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {form.enrollment.length >= 9 && !detectClassFromEnrollment(form.enrollment) && (
                <p style={{ color: '#f59e0b', fontSize: 11, margin: '3px 0 0' }}>
                  ⚠️ Class code not recognized — please select manually
                </p>
              )}
            </div>

            <div className="form-group">
              <label>Mobile Number * (10 digits)</label>
              <input type="text" placeholder="e.g. 9876543210"
                value={form.mobile}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  setForm({ ...form, mobile: val });
                }}
                maxLength={10}
                required
                style={{ border: form.mobile && !isValidMobile(form.mobile) ? '1px solid #dc2626' : '' }} />
              {form.mobile && !isValidMobile(form.mobile) && (
                <p style={{ color: '#dc2626', fontSize: 11, margin: '3px 0 0' }}>
                  ⚠️ Must be 10 digits starting with 6, 7, 8 or 9
                </p>
              )}
            </div>

            <div className="form-group">
              <label>Password *</label>
              <input type="password" placeholder="Min 8 chars, uppercase, lowercase, number, special char"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                style={{ border: form.password && !isStrongPassword(form.password) ? '1px solid #ef4444' : form.password && isStrongPassword(form.password) ? '1px solid #10b981' : '' }} />

              {/* Password Strength Meter */}
              {form.password && (() => {
                const strength = getPasswordStrength(form.password);
                return (
                  <div style={{ marginTop: 8 }}>
                    {/* Strength bar */}
                    <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                      {[1,2,3,4,5,6].map(i => (
                        <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= strength.score ? strength.color : '#e5e7eb', transition: 'background 0.2s' }} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: strength.color }}>{strength.label} Password</span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{strength.score}/6</span>
                    </div>
                    {/* Checklist */}
                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                      {[
                        { key: 'length',    label: 'At least 8 characters' },
                        { key: 'upper',     label: 'One uppercase letter (A-Z)' },
                        { key: 'lower',     label: 'One lowercase letter (a-z)' },
                        { key: 'number',    label: 'One number (0-9)' },
                        { key: 'special',   label: 'One special character (!@#...)' },
                        { key: 'longEnough',label: '12+ characters (bonus)' },
                      ].map(c => (
                        <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                          <span style={{ color: strength.checks?.[c.key] ? '#10b981' : '#d1d5db', fontWeight: 700, fontSize: 14 }}>
                            {strength.checks?.[c.key] ? '✓' : '○'}
                          </span>
                          <span style={{ color: strength.checks?.[c.key] ? '#065f46' : '#94a3b8' }}>{c.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="form-group">
              <label>Confirm Password *</label>
              <input type="password" placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                required
                style={{ border: form.confirmPassword && form.password !== form.confirmPassword ? '1px solid #dc2626' : form.confirmPassword && form.password === form.confirmPassword ? '1px solid #10b981' : '' }} />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p style={{ color: '#dc2626', fontSize: 11, margin: '3px 0 0' }}>
                  ⚠️ Passwords do not match
                </p>
              )}
              {form.confirmPassword && form.password === form.confirmPassword && (
                <p style={{ color: '#10b981', fontSize: 11, margin: '3px 0 0' }}>
                  ✅ Passwords match
                </p>
              )}
            </div>

            <button className="btn btn-primary"
              style={{ width: '100%', marginTop: 8, padding: 12 }}
              type="submit">
              Create My Account
            </button>

            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#888' }}>
              Already registered?{' '}
              <a href="/login" style={{ color: '#4f46e5' }}>Login here</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
