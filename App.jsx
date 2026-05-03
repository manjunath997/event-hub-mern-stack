import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Events } from './pages/Events';
import { EventDetail } from './pages/EventDetail';
import { Bookings } from './pages/Bookings';
import { Dashboard } from './pages/Dashboard';
import { EventForm } from './pages/EventForm';

function PrivateRoute({ children, admin }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <p style={{ color: 'var(--muted)' }}>Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && !isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/events" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route
          path="/bookings"
          element={
            <PrivateRoute>
              <Bookings />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/events/new"
          element={
            <PrivateRoute admin>
              <EventForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/events/:id/edit"
          element={
            <PrivateRoute admin>
              <EventForm edit />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/events" replace />} />
      </Routes>
    </Layout>
  );
}
