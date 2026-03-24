import { useAuthState } from 'react-firebase-hooks/auth';
import { Navigate, Outlet } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { useEffect, useState } from 'react';
import Loader from '../components/loader/Loader';

/**
 * PublicRoutes Guard (Simplified)
 * Logic:
 * - If Provider is 'password' (email/pass): They are likely Admin.
 * - If Provider is 'google.com': They are likely User.
 */
const PublicRoutes = () => {
  const [user, loading] = useAuthState(auth);
  const [destination, setDestination] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    const resolveRole = async () => {
      if (!user) return;
      setIsResolving(true);
      
      const provider = user.providerData[0]?.providerId;

      try {
        if (provider === 'password') {
          // Check Admin Collection
          const adminSnap = await getDoc(doc(db, "admins", user.uid));
          if (adminSnap.exists()) {
             setDestination('/admin/dashboard');
          } else {
             setDestination(null); // Fallback if no admin doc
          }
        } else if (provider === 'google.com') {
          // Check User Collection
          const userSnap = await getDoc(doc(db, "user", user.uid));
          if (userSnap.exists()) {
            setDestination(userSnap.data()?.avrId ? '/user/dashboard' : '/signup');
          } else {
            setDestination('/signup');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsResolving(false);
      }
    };

    if (!loading && user) resolveRole();
  }, [user, loading]);

  if (loading || isResolving) {
    return <Loader fullscreen label="Directing to portal..." />;
  }

  if (user && destination) {
    if (window.location.pathname === destination) return <Outlet />;
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
};

export default PublicRoutes;
