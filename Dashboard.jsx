import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function Dashboard() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const path = isAdmin ? '/api/dashboard/admin' : '/api/dashboard/user';
        const d = await api(path);
        setData(d);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [isAdmin]);

  if (error) return <div className="error-banner">{error}</div>;
  if (!data) return <p style={{ color: 'var(--muted)' }}>Loading dashboard…</p>;

  if (isAdmin) {
    return (
      <div>
        <h1 style={{ marginTop: 0 }}>Admin dashboard</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
          <div className="card">
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Total events</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{data.totalEvents}</div>
          </div>
          <div className="card">
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Confirmed bookings</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{data.totalBookings}</div>
          </div>
          <div className="card">
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Active users</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{data.activeUsers}</div>
          </div>
        </div>
        <h2>Recent bookings</h2>
        <div className="card">
          {data.recentBookings?.length === 0 && <p style={{ color: 'var(--muted)' }}>No bookings yet.</p>}
          {data.recentBookings?.map((b) => (
            <div
              key={b._id}
              style={{ borderBottom: '1px solid var(--surface2)', padding: '0.5rem 0' }}
            >
              <strong>{b.user?.name}</strong> — {b.event?.title} ({b.seats} seats)
            </div>
          ))}
        </div>
        <p>
          <Link to="/admin/events/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Create event
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Your dashboard</h1>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Registered events (confirmed)</div>
        <div style={{ fontSize: '2rem', fontWeight: 700 }}>{data.registeredEvents}</div>
      </div>
      <h2>Booking history</h2>
      {data.bookings?.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No history yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {data.bookings?.map((b) => (
            <div key={b._id} className="card" style={{ padding: '0.75rem 1rem' }}>
              <Link to={`/events/${b.event?._id}`}>
                <strong>{b.event?.title}</strong>
              </Link>
              <span style={{ color: 'var(--muted)', marginLeft: '0.5rem' }}>
                {new Date(b.createdAt).toLocaleDateString()} · {b.seats} seats · {b.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
