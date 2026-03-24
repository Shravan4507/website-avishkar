import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Navigate, Outlet } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import Loader from '../components/loader/Loader';

/**
 * AdminProtectedRoutes
 * Rules:
 * - Must be logged in.
 * - Must have an entry in 'admins' collection.
 */
const AdminProtectedRoutes = () => {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState<'loading' | 'true' | 'false'>('loading');

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin('false');
        return;
      }
      const adminDoc = await getDoc(doc(db, "admins", user.uid));
      setIsAdmin(adminDoc.exists() ? 'true' : 'false');
    };
    if (!loading) checkAdmin();
  }, [user, loading]);

  if (loading || isAdmin === 'loading') {
    return <Loader fullscreen label="Verifying admin credentials..." />;
  }

  // Not an admin? 
  if (isAdmin === 'false') {
    // If they have a user account, redirect to user dashboard
    return <Navigate to="/user/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminProtectedRoutes;
