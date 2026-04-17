import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/toast/Toast';
import Loader from '../../components/loader/Loader';
import './AdminLogin.css';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      const adminDoc = await getDoc(doc(db, "admins", user.uid));
      const isProfileComplete = adminDoc.exists() &&
                                adminDoc.data()?.firstName &&
                                adminDoc.data()?.team;

      if (isProfileComplete) {
        toast.success('Welcome back, Admin!');
        setRedirecting(true);
        navigate('/admin/dashboard', { replace: true });
      } else {
        setRedirecting(true);
        navigate('/admin/setup', { replace: true });
      }
    } catch (err: unknown) {
      const errorCode = (err as { code?: string }).code;
      const msg = (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential')
        ? 'Invalid credentials. Please check your email and password.'
        : 'Something went wrong. Please try again.';
      toast.error(msg);
      console.error("Admin Login Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (redirecting) {
    return <Loader fullscreen label="Entering admin console..." />;
  }

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-badge">ADMIN PORTAL</div>
        <h2 className="admin-login-title">Avishkar '26</h2>
        <p className="admin-login-subtitle">Administrative Access Only</p>

        <form className="admin-login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@zealedu.ac.in"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default AdminLogin;
