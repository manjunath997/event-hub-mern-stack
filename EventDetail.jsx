import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function EventDetail() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const [event, setEvent] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [seats, setSeats] = useState(1);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [evRes, revRes] = await Promise.all([
        api(`/api/events/${id}`),
        api(`/api/events/${id}/reviews`),
      ]);
      setEvent(evRes.event);
      setReviews(revRes);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function book() {
    setError('');
    setMsg('');
    try {
      const data = await api('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({ eventId: id, seats: Number(seats) }),
      });
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setMsg('Booking confirmed! Check My bookings for your QR ticket.');
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      await api(`/api/events/${id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating: Number(rating), comment }),
      });
      setComment('');
      setMsg('Review submitted.');
      const revRes = await api(`/api/events/${id}/reviews`);
      setReviews(revRes);
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>Loading…</p>;
  if (!event) return <p>{error || 'Not found'}</p>;

  const past = new Date(event.dateTime) < new Date();

  return (
    <div>
      <Link to="/events" style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
        ← Back to events
      </Link>
      {event.imageUrl && (
        <img
          src={event.imageUrl}
          alt=""
          style={{ width: '100%', maxHeight: 360, objectFit: 'cover', borderRadius: 12, marginTop: '1rem' }}
        />
      )}
      <h1 style={{ marginBottom: '0.25rem' }}>{event.title}</h1>
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>
        {new Date(event.dateTime).toLocaleString()} · {event.location}
      </p>
      <p style={{ whiteSpace: 'pre-wrap' }}>{event.description}</p>
      <p>
        <strong>{event.availableSeats}</strong> seats available (of {event.totalSeats})
      </p>
      {isAdmin && (
        <p>
          <Link to={`/admin/events/${id}/edit`} className="btn btn-ghost" style={{ textDecoration: 'none' }}>
            Edit event (admin)
          </Link>
        </p>
      )}

      {msg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'rgba(52, 211, 153, 0.15)',
            border: '1px solid rgba(52, 211, 153, 0.35)',
            borderRadius: 8,
            marginBottom: '1rem',
            color: 'var(--success)',
          }}
        >
          {msg}
        </div>
      )}
      {error && <div className="error-banner">{error}</div>}

      {user && !past && event.availableSeats > 0 && (
        <div className="card" style={{ maxWidth: 360, marginBottom: '2rem' }}>
          <h3 style={{ marginTop: 0 }}>Book seats</h3>
          <div className="field">
            <label>Seats</label>
            <input
              type="number"
              min={1}
              max={event.availableSeats}
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={book}>
            Book now
          </button>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 0 }}>
            If Stripe is configured on the server, you will be redirected to pay. Otherwise booking is
            confirmed immediately.
          </p>
        </div>
      )}

      {!user && !past && (
        <p>
          <Link to="/login">Login</Link> to book this event.
        </p>
      )}

      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 style={{ marginTop: 0 }}>
          Reviews {reviews && `(${reviews.averageRating}★ · ${reviews.count})`}
        </h2>
        {reviews && reviews.reviews.length === 0 && (
          <p style={{ color: 'var(--muted)' }}>No reviews yet.</p>
        )}
        {reviews &&
          reviews.reviews.map((r) => (
            <div
              key={r._id}
              style={{ borderTop: '1px solid var(--surface2)', paddingTop: '0.75rem', marginTop: '0.75rem' }}
            >
              <strong>{r.user?.name || 'User'}</strong> — {r.rating}★
              {r.comment && <p style={{ margin: '0.25rem 0 0' }}>{r.comment}</p>}
            </div>
          ))}

        {user && (
          <form onSubmit={submitReview} style={{ marginTop: '1.25rem' }}>
            <h3>Write a review</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              You need a confirmed booking for this event.
            </p>
            <div className="field">
              <label>Rating</label>
              <select value={rating} onChange={(e) => setRating(e.target.value)}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Comment</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-ghost">
              Submit review
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
