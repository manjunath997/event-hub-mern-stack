import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function Bookings() {
  const { socket } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api('/api/bookings/mine');
      setBookings(data.bookings || []);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket) return undefined;
    const onConfirm = (payload) => {
      setToast(`Booking confirmed! Ticket: ${payload.ticketId?.slice(0, 8)}…`);
      load();
      setTimeout(() => setToast(''), 5000);
    };
    socket.on('booking:confirmed', onConfirm);
    return () => socket.off('booking:confirmed', onConfirm);
  }, [socket, load]);

  async function cancel(bookingId) {
    if (!window.confirm('Cancel this booking?')) return;
    setError('');
    try {
      await api(`/api/bookings/${bookingId}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>My bookings</h1>
      {toast && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'rgba(52, 211, 153, 0.15)',
            borderRadius: 8,
            marginBottom: '1rem',
            color: 'var(--success)',
          }}
        >
          {toast}
        </div>
      )}
      {error && <div className="error-banner">{error}</div>}

      {bookings.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No bookings yet. Browse <Link to="/events">events</Link>.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {bookings.map((b) => (
            <div key={b._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem' }}>
                    <Link to={`/events/${b.event?._id}`}>{b.event?.title || 'Event'}</Link>
                  </h2>
                  <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
                    {b.event?.dateTime && new Date(b.event.dateTime).toLocaleString()} · Seats: {b.seats}
                  </p>
                  <span className="badge badge-user" style={{ marginTop: '0.5rem' }}>
                    {b.status}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {b.status === 'confirmed' && b.qrCodeDataUrl && (
                    <div>
                      <img src={b.qrCodeDataUrl} alt="Ticket QR" width={120} height={120} />
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: '0.25rem 0 0' }}>
                        Ticket ID: {b.ticketId?.slice(0, 12)}…
                      </p>
                    </div>
                  )}
                  {(b.status === 'confirmed' || b.status === 'pending_payment') && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ marginTop: '0.5rem' }}
                      onClick={() => cancel(b._id)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
