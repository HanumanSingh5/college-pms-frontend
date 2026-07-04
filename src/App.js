import React, { useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


import Login            from './pages/Login';
import Register         from './pages/Register';
import AdminDashboard   from './pages/admin/Dashboard';
import AdminFaculties   from './pages/admin/Faculties';
import AdminStudents    from './pages/admin/Students';
import AdminProjects    from './pages/admin/Projects';
import AdminMonitor     from './pages/admin/Monitor';
import FacultyDashboard from './pages/faculty/Dashboard';
import FacultyTasks     from './pages/faculty/Tasks';
import StudentDashboard from './pages/student/Dashboard';
import StudentTeam      from './pages/student/Team';
import StudentDefinition from './pages/student/Definition';
import StudentTasks     from './pages/student/Tasks';
import AdminGroups from './pages/admin/Groups';

function PrivateRoute({ children, allowedRole }) {
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');
  if (!token) return <Navigate to="/login" replace />;
  if (allowedRole && role !== allowedRole) {
    if (role === 'admin')   return <Navigate to="/admin"   replace />;
    if (role === 'faculty') return <Navigate to="/faculty" replace />;
    if (role === 'student') return <Navigate to="/student" replace />;
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RoleRedirect() {
  const role = localStorage.getItem('role');
  if (role === 'admin')   return <Navigate to="/admin"   replace />;
  if (role === 'faculty') return <Navigate to="/faculty" replace />;
  if (role === 'student') return <Navigate to="/student" replace />;
  return <Navigate to="/login" replace />;
}

function LogoutOnInactivity({ children }) {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes

  const logout = useCallback(() => {
    localStorage.clear();
    toast.info('Session expired due to inactivity. Please login again.');
    navigate('/login');
  }, [navigate]);

  const resetTimer = useCallback(() => {
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');
    if (role !== 'student' || !token) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const currentToken = localStorage.getItem('token');
      const currentRole = localStorage.getItem('role');
      if (currentToken && currentRole === 'student') logout();
    }, INACTIVITY_MS);
  }, [logout]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [resetTimer]);

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
      <LogoutOnInactivity>
        <Routes>
          <Route path="/login"           element={<Login />} />
          <Route path="/register/:token" element={<Register />} />

        <Route path="/admin" element={
          <PrivateRoute allowedRole="admin"><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/faculties" element={
          <PrivateRoute allowedRole="admin"><AdminFaculties /></PrivateRoute>} />
        <Route path="/admin/students" element={
          <PrivateRoute allowedRole="admin"><AdminStudents /></PrivateRoute>} />
        <Route path="/admin/projects" element={
          <PrivateRoute allowedRole="admin"><AdminProjects /></PrivateRoute>} />
        <Route path="/admin/monitor" element={
          <PrivateRoute allowedRole="admin"><AdminMonitor /></PrivateRoute>} />

        <Route path="/faculty" element={
          <PrivateRoute allowedRole="faculty"><FacultyDashboard /></PrivateRoute>} />
        <Route path="/faculty/tasks" element={
          <PrivateRoute allowedRole="faculty"><FacultyTasks /></PrivateRoute>} />

        <Route path="/student" element={
          <PrivateRoute allowedRole="student"><StudentDashboard /></PrivateRoute>} />
        <Route path="/student/team" element={
          <PrivateRoute allowedRole="student"><StudentTeam /></PrivateRoute>} />
        <Route path="/student/definition" element={
          <PrivateRoute allowedRole="student"><StudentDefinition /></PrivateRoute>} />
        <Route path="/student/tasks" element={
          <PrivateRoute allowedRole="student"><StudentTasks /></PrivateRoute>} />
          <Route path="/admin/groups" element={
  <PrivateRoute allowedRole="admin"><AdminGroups /></PrivateRoute>
} />

        <Route path="*" element={<RoleRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}