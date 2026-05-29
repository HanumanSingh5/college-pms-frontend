import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ title }) {
  const navigate = useNavigate();
  const name = localStorage.getItem('name');
  const role = localStorage.getItem('role');

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const roleLabel = {
    admin:   '👑 Admin',
    faculty: '👨‍🏫 Faculty',
    student: '👨‍🎓 Student',
  };

  return (
    <div className="navbar">
      <h2>🎓 {title}</h2>
      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
        <span style={{
          background:'rgba(255,255,255,0.2)',
          padding:'4px 12px', borderRadius:20, fontSize:13
        }}>
          {roleLabel[role] || role}
        </span>
        <span style={{ fontSize:14 }}>Welcome, {name}</span>
        <button onClick={logout} type="button">Logout</button>
      </div>
    </div>
  );
}