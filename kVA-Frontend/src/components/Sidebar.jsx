import React from 'react';
import './Sidebar.css';
import img from '../assets/img.jpeg';
import { Link } from "react-router-dom";

const Sidebar = () => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/' },
    { id: 'student-form', label: 'Add Student', icon: '👤', path: '/student-form' },
    { id: 'all-students', label: 'All Students', icon: '👥', path: '/all-students' },
    { id: 'student-details', label: 'Student Details', icon: '📋', path: '/student-details' },
    { id: 'attendance', label: 'Attendance', icon: '📅', path: '/attendance' },
    { id: 'performance', label: 'Performance', icon: '📈', path: '/performance' },
    { id: 'fee-payments', label: 'Fee Payments', icon: '💰', path: '/fee-payments' },
    { id: 'management', label: 'Management', icon: '👨‍💼', path: '/management' },
    // { id: 'student-analysis', label: 'Student Analysis', icon: '📊', path: '/student-analysis' }
  ];

  return (
    <div className="sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="logo">
          {/* Logo Image with Link to Dashboard */}
          <Link to="/">
            <img 
              src={img} 
              alt="Keshav's Veda Academy Logo" 
              className="logo-image" 
              style={{ 
                width: '80px', 
                height: '80px',
                borderRadius: '50%',
                objectFit: 'cover',
                cursor: 'pointer'
              }} 
            />
          </Link>
          
          {/* Academy Name Text Beside Logo */}
          <div className="logo-text">
            {/* Keshav's on top */}
            <span style={{
              fontStyle: 'italic',
              fontSize: '16px',
              lineHeight: '18px',
              display: 'block'
            }}>
              Keshav's
            </span>

            {/* VEDA ACADEMY below in uppercase */}
            <span style={{
              textTransform: 'uppercase',
              fontWeight: 'bold',
              fontSize: '18px',
              fontStyle: 'italic',
              marginTop: '2px',
              display: 'block'
            }}>
              VEDA ACADEMY
            </span>
          </div>
        </div>
      </div>

      {/* Sidebar Navigation Menu */}
      <nav className="sidebar-nav">
        {/* Map through menuItems to create navigation links */}
        {menuItems.map((item) => (
          <Link 
            to={item.path} 
            key={item.id} 
            className="nav-item"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            {/* Menu Item Icon */}
            <span className="nav-icon">{item.icon}</span>
            
            {/* Menu Item Label */}
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;