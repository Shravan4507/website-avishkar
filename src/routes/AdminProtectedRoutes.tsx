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
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null = loading

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      try {
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        setIsAdmin(adminDoc.exists());
      } catch (err: any) {
        // Permission denied = not an admin (rule requires being in admins collection to read it)
        // Any error here should be treated as "not admin" to avoid blank loading screens
        console.warn("[AdminProtectedRoutes] Could not verify admin status:", err?.code || err?.message);
        setIsAdmin(false);
      }
    };
    if (!loading) checkAdmin();
  }, [user, loading]);

  if (loading || isAdmin === null) {
    return <Loader fullscreen label="Verifying admin credentials..." />;
  }

  // Not an admin? 
  if (!isAdmin) {
    // If they have a user account, redirect to user dashboard
    return <Navigate to="/user/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminProtectedRoutes;
