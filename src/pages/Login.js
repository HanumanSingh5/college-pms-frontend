import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function Login() {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, form);

      // Clear any old data first
      localStorage.clear();

      // Save new login data
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role',  res.data.role);
      localStorage.setItem('name',  res.data.name);
      localStorage.setItem('id',    res.data.id);

      toast.success('Login successful!');

      // Redirect based on role
      if (res.data.role === 'admin')   navigate('/admin');
      if (res.data.role === 'faculty') navigate('/faculty');
      if (res.data.role === 'student') navigate('/student');

    } catch (err) {
      toast.error(err.response?.data?.msg || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="brand">
          <span className="brand-mark">🎓</span>
          <div>
            <h2>College PMS</h2>
            <div className="subtitle">Project Management System</div>
          </div>
        </div>
        <div className="intro">
          <strong>Welcome back</strong>
          Sign in to continue managing projects, tasks, and teams.
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              required
            />
          </div>
          <button
            className="btn btn-primary"
            style={{ width:'100%', padding:12, marginTop:8 }}
            type="submit"
            disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}