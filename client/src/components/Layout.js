import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, CreditCard, ArrowLeftRight, List, LogOut } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">N</div>
            <span className="logo-text">NovBank</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <span className="nav-label">Menu</span>
          <NavLink to="/dashboard" className={({isActive}) => `nav-item${isActive ? ' active' : ''}`}>
            <LayoutDashboard size={16} /> Dashboard
          </NavLink>
          <NavLink to="/accounts" className={({isActive}) => `nav-item${isActive ? ' active' : ''}`}>
            <CreditCard size={16} /> Accounts
          </NavLink>
          <NavLink to="/transactions" className={({isActive}) => `nav-item${isActive ? ' active' : ''}`}>
            <List size={16} /> Transactions
          </NavLink>
          <NavLink to="/transfer" className={({isActive}) => `nav-item${isActive ? ' active' : ''}`}>
            <ArrowLeftRight size={16} /> Transfer
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <button className="nav-item" onClick={handleLogout} style={{color:'#ef4444', marginTop:4}}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
