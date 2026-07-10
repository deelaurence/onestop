import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { adminLogin, setAdminToken } from '../../lib/admin-api';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@onestopphotography.org');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { token } = await adminLogin(email, password);
      setAdminToken(token);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-login-card">
        <div className="admin-login-icon"><Lock size={24} /></div>
        <h1>Admin sign in</h1>
        <p>Manage bookings and availability overrides.</p>
        <form onSubmit={handleSubmit}>
          <label className="book-field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="book-field">
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <p className="book-error">{error}</p>}
          <button type="submit" className="cta-button admin-login-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        {import.meta.env.DEV && (
          <p className="admin-login-hint">Dev login: admin@onestopphotography.org / onestop2026</p>
        )}
      </div>
    </section>
  );
}
