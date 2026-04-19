import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { auth, db } from '../../firebase/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc } from 'firebase/firestore'
import { X } from 'lucide-react'
const logo = `${import.meta.env.BASE_URL}assets/logos/avishkar-icon.webp?v=2`
import './Navbar.css'

const TABS = [
  { label: 'Home', path: '/' },
  { label: 'Workshops', path: '/workshops' },
  { label: 'Schedule', path: '/schedule' },
  { label: 'Rules', path: '/rules' },
  { label: 'Competitions', path: '/competitions' },
] as const

const PRELOAD_MAP: Record<string, () => Promise<any>> = {
  '/': () => import('../../pages/home/Home'),
  '/workshops': () => import('../../pages/workshops/Workshops'),
  '/schedule': () => import('../../pages/schedule/Schedule'),
  '/competitions': () => import('../../pages/competitions/Competitions'),
  '/rules': () => import('../../pages/rules/Rules'),

  '/login': () => import('../../components/Login/Login'),
  '/user/dashboard': () => import('../../pages/user/user-dashboard'),
  '/admin/dashboard': () => import('../../pages/admin/admindashboard'),
};

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null)
  const [avatarLoadError, setAvatarLoadError] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user)
        setAvatarLoadError(false) // reset error state on new auth
        try {
          // ── Pre-Approval Activation: runs on every login until cleared ──
          // Handles the case where a user was pre-approved BEFORE they registered.
          // Signup.tsx handles the registration-time case; this handles login-time.
          if (user.email) {
            const paQuery = query(collection(db, 'pre_approved_admins'), where('email', '==', user.email.toLowerCase()));
            const paSnap = await getDocs(paQuery);
            if (!paSnap.empty) {
              const paData = paSnap.docs[0].data();

              // Generate a proper AVR-ADM ID
              const adminCounterRef = doc(db, 'counters', 'admin_counter');
              const adminCounterSnap = await getDoc(adminCounterRef);
              const nextAdmNum = ((adminCounterSnap.exists() ? adminCounterSnap.data().count : 0) || 0) + 1;
              const avrAdmId = `AVR-ADM-${String(nextAdmNum).padStart(4, '0')}`;

              const nameParts = (user.displayName || '').split(' ');
              await setDoc(doc(db, 'admins', user.uid), {
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                email: user.email,
                photoURL: user.photoURL || null,
                avrAdmId,
                roleLevel: paData.roleLevel || [],
                assignment: paData.assignment || '',
                type: paData.type || 'admin',
                activatedAt: new Date(),
                _activatedFromPreApproval: true,
              });

              // Increment the counter
              await setDoc(adminCounterRef, { count: nextAdmNum }, { merge: true });

              // Clean up the pre-approval record
              await deleteDoc(paSnap.docs[0].ref);
            }
          }

          // Check admins collection first
          const adminDoc = await getDoc(doc(db, 'admins', user.uid))
          if (adminDoc.exists()) {
            const adminData = adminDoc.data()
            // Use Firestore photo if set, otherwise always use Firebase Auth live photoURL
            setUserAvatar(adminData.photoURL || adminData.avatar || user.photoURL || null)
            setUserRole('admin')
          } else {
            // Then check user collection
            const userDoc = await getDoc(doc(db, 'user', user.uid))
            if (userDoc.exists()) {
              const userData = userDoc.data()
              // profilePhoto (custom upload) > photoURL from Firestore > Firebase Auth photoURL
              setUserAvatar(userData.profilePhoto || userData.photoURL || user.photoURL || null)
              setUserRole('user')
            } else {
              // No Firestore doc yet — use Firebase Auth photo directly
              setUserAvatar(user.photoURL || null)
              setUserRole(null)
            }
          }
        } catch (err) {
          // On any Firestore error, fall back to Firebase Auth photo
          setUserAvatar(user.photoURL || null)
          setUserRole(null)
        }
      } else {
        setCurrentUser(null)
        setUserAvatar(null)
        setUserRole(null)
      }
    })
    return () => unsubscribe()
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const leftTabs = TABS.slice(0, 3)
  const rightTabs = TABS.slice(3)

  return (
    <div className={`navbar ${isScrolled ? 'navbar--scrolled' : ''} ${isMobileMenuOpen ? 'navbar--open' : ''}`}>
      <nav className="navbar__inner" aria-label="Main navigation">
        <div className="navbar__left">
          {leftTabs.map((tab) => (
            <Link 
              key={tab.label} 
              to={tab.path} 
              className={`navbar__tab ${location.pathname === tab.path ? 'navbar__tab--active' : ''}`}
              onMouseEnter={() => PRELOAD_MAP[tab.path]?.()}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <div className="navbar__center">
          <Link to="/" className="navbar__logo-link" aria-label="Home">
            <img src={logo} alt="Avishkar '26" className="navbar__logo" />
          </Link>
        </div>

        <div className="navbar__right">
          {rightTabs.map((tab) => (
            <Link 
              key={tab.label} 
              to={tab.path} 
              className={`navbar__tab ${location.pathname === tab.path ? 'navbar__tab--active' : ''}`}
              onMouseEnter={() => PRELOAD_MAP[tab.path]?.()}
            >
              {tab.label}
            </Link>
          ))}
          {currentUser ? (
            <Link 
              to={userRole === 'admin' ? '/admin/dashboard' : '/user/dashboard'} 
              className="navbar__avatar-link" 
              aria-label="Dashboard"
              onMouseEnter={() => {
                const path = userRole === 'admin' ? '/admin/dashboard' : '/user/dashboard';
                PRELOAD_MAP[path]?.();
              }}
            >
              {(() => {
                // Priority: Firestore override > Firebase Auth photoURL
                const finalAvatar = !avatarLoadError
                  ? ([userAvatar, currentUser.photoURL].find(url =>
                      url && url.trim() !== '' &&
                      (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:'))
                    ) || null)
                  : null;

                if (finalAvatar) {
                  return (
                    <img
                      src={finalAvatar}
                      alt=""
                      className="navbar__avatar-img"
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarLoadError(true)}
                    />
                  );
                }
                return (
                  <div className="navbar__avatar-initials">
                    {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                );
              })()}
            </Link>
          ) : (
            <Link 
              to="/login" 
              className={`navbar__tab ${location.pathname === '/login' ? 'navbar__tab--active' : ''}`}
              onMouseEnter={() => PRELOAD_MAP['/login']?.()}
            >
              Login
            </Link>
          )}
        </div>

        <button 
          className="navbar__hamburger" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-expanded={isMobileMenuOpen}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? <X size={28} color="#fff" /> : (
            <div className="hamburger-box">
              <div className="hamburger-inner"></div>
            </div>
          )}
        </button>
      </nav>

      <div className="navbar__mobile-menu">
        <div className="mobile-menu__inner">
          {TABS.map((tab) => (
            <Link 
              key={tab.label} 
              to={tab.path} 
              className={`mobile-menu__tab ${location.pathname === tab.path ? 'mobile-menu__tab--active' : ''}`}
              onMouseEnter={() => PRELOAD_MAP[tab.path]?.()}
            >
              {tab.label}
            </Link>
          ))}
          {currentUser ? (
            <Link 
              to={userRole === 'admin' ? '/admin/dashboard' : '/user/dashboard'} 
              className={`mobile-menu__tab ${['/user/dashboard', '/admin/dashboard'].includes(location.pathname) ? 'mobile-menu__tab--active' : ''}`}
              onMouseEnter={() => {
                const path = userRole === 'admin' ? '/admin/dashboard' : '/user/dashboard';
                PRELOAD_MAP[path]?.();
              }}
            >
              Dashboard
            </Link>
          ) : (
            <Link 
              to="/login" 
              className={`mobile-menu__tab ${location.pathname === '/login' ? 'navbar__tab--active' : ''}`}
              onMouseEnter={() => PRELOAD_MAP['/login']?.()}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default Navbar
