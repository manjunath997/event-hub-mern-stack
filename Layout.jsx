import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navStyle = { display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' };
const linkStyle = ({ isActive }) => ({
  color: isActive ? 'var(--accent)' : 'var(--muted)',
  textDecoration: 'none',
  fontWeight: 600,
});

export function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();

  return (
    <>
      <header
        style={{
          borderBottom: '1px solid var(--surface2)',
          background: 'var(--surface)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.25rem',
            gap: '1rem',
          }}
        >
          <Link to="/" style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>
            EventHub
          </Link>
          <nav style={navStyle}>
            <NavLink to="/events" style={linkStyle}>
              Events
            </NavLink>
            {user && (
              <>
                <NavLink to="/bookings" style={linkStyle}>
                  My bookings
                </NavLink>
                <NavLink to="/dashboard" style={linkStyle}>
                  Dashboard
                </NavLink>
                {isAdmin && (
                  <NavLink to="/admin/events/new" style={linkStyle}>
                    New event
                  </NavLink>
                )}
              </>
            )}
            {!user ? (
              <>
                <NavLink to="/login" style={linkStyle}>
                  Login
                </NavLink>
                <Link to="/register" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                  Sign up
                </Link>
              </>
            ) : (
              <>
                <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-user'}`}>
                  {user.role}
                </span>
                <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{user.name}</span>
                <button type="button" className="btn btn-ghost" onClick={logout}>
                  Log out
                </button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="container" style={{ padding: '1.5rem 1.25rem 3rem' }}>
        {children}
      </main>
    </>
  );
}
