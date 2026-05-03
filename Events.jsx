import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [location, setLocation] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setError('');
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (location.trim()) params.set('location', location.trim());
      if (dateFrom) params.set('dateFrom', new Date(dateFrom).toISOString());
      if (dateTo) params.set('dateTo', new Date(dateTo).toISOString());
      const qs = params.toString();
      const data = await api(`/api/events${qs ? `?${qs}` : ''}`);
      setEvents(data.events || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Browse events</h1>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Search</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title or description" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City / venue" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>From</label>
            <input type="datetime-local" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>To</label>
            <input type="datetime-local" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
        <button type="button" className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={load}>
          Apply filters
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Loading events…</p>
      ) : events.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No events match your filters.</p>
      ) : (
        <div className="grid-events">
          {events.map((ev) => (
            <Link
              key={ev._id}
              to={`/events/${ev._id}`}
              className="card"
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              {ev.imageUrl ? (
                <img src={ev.imageUrl} alt="" className="event-thumb" />
              ) : (
                <div className="event-thumb" />
              )}
              <h2 style={{ fontSize: '1.1rem', margin: '0.75rem 0 0.25rem' }}>{ev.title}</h2>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.875rem' }}>
                {new Date(ev.dateTime).toLocaleString()} · {ev.location}
              </p>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
                <strong>{ev.availableSeats}</strong> seats left
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
