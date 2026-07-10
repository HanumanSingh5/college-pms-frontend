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
      <div className="brand">
        <span className="brand-mark">🎓</span>
        <div>
          <h2>{title}</h2>
          <p>College Project Management System</p>
        </div>
      </div>
      <div className="navbar-actions">
        <button onClick={logout} type="button">Logout</button>
      </div>
    </div>
  );
}