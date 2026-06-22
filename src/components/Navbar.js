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
    admin:   'Admin',
    faculty: 'Faculty',
    student: 'Student',
  };

  const initial = (name || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="navbar">
      <h2 style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{
          display:'inline-flex', alignItems:'center', justifyContent:'center',
          width:30, height:30, borderRadius:9, fontSize:16,
          background:'linear-gradient(135deg,#0e9f8e,#14b8a6)', color:'white'
        }}>🎓</span>
        {title}
      </h2>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <span style={{
          background:'#e3f7f4',
          color:'#0b4f47',
          padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:600
        }}>
          {roleLabel[role] || role}
        </span>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:34, height:34, borderRadius:'50%',
            background:'linear-gradient(135deg,#14b8a6,#0b4f47)',
            color:'white', display:'flex', alignItems:'center', justifyContent:'center',
            fontWeight:700, fontSize:14
          }}>
            {initial}
          </div>
          <span style={{ fontSize:14, color:'#1f2937', fontWeight:500 }}>{name}</span>
        </div>
        <button onClick={logout} type="button">Logout</button>
      </div>
    </div>
  );
}