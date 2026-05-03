import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';

export function EventForm({ edit }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [location, setLocation] = useState('');
  const [totalSeats, setTotalSeats] = useState(50);
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!!edit);

  useEffect(() => {
    if (!edit || !id) return;
    (async () => {
      try {
        const { event } = await api(`/api/events/${id}`);
        setTitle(event.title);
        setDescription(event.description);
        setLocation(event.location);
        setTotalSeats(event.totalSeats);
        const d = new Date(event.dateTime);
        const pad = (n) => String(n).padStart(2, '0');
        const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setDateTime(local);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [edit, id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const form = new FormData();
    form.append('title', title);
    form.append('description', description);
    form.append('dateTime', new Date(dateTime).toISOString());
    form.append('location', location);
    form.append('totalSeats', String(totalSeats));
    if (image) form.append('image', image);

    try {
      if (edit) {
        await api(`/api/events/${id}`, { method: 'PUT', body: form });
      } else {
        await api('/api/events', { method: 'POST', body: form });
      }
      navigate('/events');
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>Loading…</p>;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }} className="card">
      <h1 style={{ marginTop: 0 }}>{edit ? 'Edit event' : 'New event'}</h1>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>
        <div className="field">
          <label>Date & time</label>
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Location</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} required />
        </div>
        <div className="field">
          <label>Total seats</label>
          <input
            type="number"
            min={1}
            value={totalSeats}
            onChange={(e) => setTotalSeats(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Image (optional)</label>
          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />
        </div>
        <button type="submit" className="btn btn-primary">
          {edit ? 'Save changes' : 'Create event'}
        </button>
      </form>
    </div>
  );
}
