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

      // 1. Check Admin status — use try/catch because the rule only allows
      //    reading admins/uid if you own it; if not found = regular user, not an error.
      try {
        const adminSnap = await getDoc(doc(db, "admins", user.uid));
        if (adminSnap.exists()) {
          setRole('admin');
          return;
        }
      } catch (err: unknown) {
        // permission-denied or any other error means not an admin — fall through to user check
        console.warn("[UserProtectedRoutes] Admin check failed (expected for non-admins):", (err as { code?: string })?.code);
      }

      // 2. Check User status
      try {
        const userSnap = await getDoc(doc(db, "user", user.uid));
        if (userSnap.exists()) {
          setRole('user');
          setHasAvrId(!!userSnap.data()?.avrId);
        } else {
          setRole('user');
          setHasAvrId(false);
        }
      } catch (err: unknown) {
        console.warn("[UserProtectedRoutes] User profile check failed:", (err as { code?: string })?.code);
        // Default to 'user' so they can proceed to signup
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
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  // If Admin, they shouldn't be here (EXCEPT for the scanner)
  if (role === 'admin' && location.pathname !== '/user/scanner') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // If User with NO AVR ID trying to access dashboard -> /signup
  if (role === 'user' && !hasAvrId && location.pathname !== '/signup') {
    return <Navigate to="/signup" state={{ from: location }} replace />;
  }

  // If User WITH AVR ID trying to access /signup -> /user/dashboard
  if (role === 'user' && hasAvrId && location.pathname === '/signup') {
    return <Navigate to="/user/dashboard" replace />;
  }

  return <Outlet />;
};

export default UserProtectedRoutes;
