import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import Loader from '../components/loader/Loader';

/**
 * UserProtectedRoutes
 * Rules:
 * - Must be logged in.
 * - If Admin: Redirect to /admin/dashboard
 * - If User: 
 *      - No profile: Redirect to /signup
 *      - Has profile: Allow accessing /user/dashboard
 */
const UserProtectedRoutes = () => {
  const [user, loading] = useAuthState(auth);
  const [role, setRole] = useState<'loading' | 'admin' | 'user' | 'none'>('loading');
  const [hasAvrId, setHasAvrId] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkRoleAndProfile = async () => {
      if (!user) {
        setRole('none');
        return;
      }

      // 1. Check Admin status
      const adminSnap = await getDoc(doc(db, "admins", user.uid));
      if (adminSnap.exists()) {
        setRole('admin');
        return;
      }

      // 2. Check User status
      const userSnap = await getDoc(doc(db, "user", user.uid));
      if (userSnap.exists()) {
        setRole('user');
        setHasAvrId(!!userSnap.data()?.avrId);
      } else {
        setRole('user');
        setHasAvrId(false);
      }
    };

    if (!loading) checkRoleAndProfile();
  }, [user, loading]);

  if (loading || role === 'loading') {
    return <Loader fullscreen label="Verifying your dashboard access..." />;
  }

  // Not logged in
  if (!user) return <Navigate to="/login" replace />;

  // If Admin, they shouldn't be here (EXCEPT for the scanner)
  if (role === 'admin' && location.pathname !== '/user/scanner') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // If User with NO AVR ID trying to access dashboard -> /signup
  if (role === 'user' && !hasAvrId && location.pathname !== '/signup') {
    return <Navigate to="/signup" replace />;
  }

  // If User WITH AVR ID trying to access /signup -> /user/dashboard
  if (role === 'user' && hasAvrId && location.pathname === '/signup') {
    return <Navigate to="/user/dashboard" replace />;
  }

  return <Outlet />;
};

export default UserProtectedRoutes;
