import React, { Suspense, lazy, useEffect, useMemo } from 'react';

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AnimatePresence } from 'framer-motion';

import PageTransition from './components/PageTransition';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/toast/Toast';
import PageSkeleton from './components/common/PageSkeleton';
import DashboardSkeleton from './components/common/DashboardSkeleton';
import PWAReloadPrompt from './components/pwa/PWAReloadPrompt';
import ScrollToTop from './components/common/ScrollToTop';
import { BugReportProvider } from './components/BugReport/BugReport';
import { isLowSpecDevice } from './utils/performance';
import { reportError } from './utils/errorReport';


const LineWaves = lazy(() => import('./components/background/LineWaves'));

// Lazy Loaded Public Pages
const Home = lazy(() => import('./pages/home/Home'));
const Workshops = lazy(() => import('./pages/workshops/Workshops'));
const Competitions = lazy(() => import('./pages/competitions/Competitions'));
const Schedule = lazy(() => import('./pages/schedule/Schedule'));
const Contact = lazy(() => import('./pages/contact/Contact'));
const Sponsors = lazy(() => import('./pages/sponsors/Sponsors'));
const ComingSoon = lazy(() => import('./pages/ComingSoon/ComingSoon'));
const Registration = lazy(() => import('./pages/competitions/Registration'));
const HackathonRegistration = lazy(() => import('./pages/competitions/HackathonRegistration'));
const RobotronRegistration = lazy(() => import('./pages/competitions/RoboKshetra'));
const RoboKshetraRules = lazy(() => import('./pages/competitions/RoboKshetraRules'));
const BattleGrid = lazy(() => import('./pages/competitions/BattleGrid'));
const BattleGridRules = lazy(() => import('./pages/competitions/BattleGridRules'));
const EsportsRegistration = lazy(() => import('./pages/competitions/EsportsRegistration'));
const MonsterBgmi = lazy(() => import('./pages/competitions/MonsterBgmi'));
const BookStall = lazy(() => import('./pages/stalls/BookStall'));
const ParamX = lazy(() => import('./pages/competitions/ParamX'));
const ParamXUpload = lazy(() => import('./pages/competitions/ParamXUpload'));
const ParamXRules = lazy(() => import('./pages/competitions/ParamXRules'));
const Rules = lazy(() => import('./pages/rules/Rules'));
const CheckoutSimulator = lazy(() => import('./pages/dev/CheckoutSimulator'));
const PaymentStatus = lazy(() => import('./pages/payment/PaymentStatus'));

// Lazy Loaded Legal Pages
const Privacy = lazy(() => import('./pages/legal/Privacy'));
const Terms = lazy(() => import('./pages/legal/Terms'));
const Cookies = lazy(() => import('./pages/legal/Cookies'));
const FAQ = lazy(() => import('./pages/info/FAQ'));
const ReachUs = lazy(() => import('./pages/info/ReachUs'));



import { PAGE_VISIBILITY } from './config/pageVisibility';

// Lazy Loaded Auth Pages
const Login = lazy(() => import('./components/Login/Login'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));

// Lazy Loaded Student-only Pages
const Signup = lazy(() => import('./pages/signup/Signup'));
const UserDashboard = lazy(() => import('./pages/user/user-dashboard'));
const VolunteerScanner = lazy(() => import('./pages/user/VolunteerScanner'));

// Lazy Loaded Admin-only Pages
const AdminSetup = lazy(() => import('./pages/admin/AdminSetup'));
const AdminDashboard = lazy(() => import('./pages/admin/admindashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Lazy Loaded Club Detail Pages
const GDGClub = lazy(() => import('./pages/clubs/GDGZCOER'));
const OrbitXClub = lazy(() => import('./pages/clubs/OrbitX'));

// Route Guards
import UserProtectedRoutes from './routes/UserProtectedRoutes';
import AdminProtectedRoutes from './routes/AdminProtectedRoutes';
import PublicRoutes from './routes/PublicRoutes';



// Wrap element with PageTransition for every route
const T = ({ el }: { el: React.ReactNode }) => (
  <PageTransition>{el}</PageTransition>
);

// --- Layout wrapper that renders Navbar/Footer on ALL pages ---
const LayoutManager = () => {
  const location = useLocation();
  const settings = PAGE_VISIBILITY;

  // We still need to know if we are on a dashboard for the layout class,
  // but we no longer hide the chrome.
  const isDashboard = location.pathname.includes('dashboard') ||
                      location.pathname.includes('signup') ||
                      location.pathname.includes('setup') ||
                      location.pathname.includes('login');

  const lowSpec = useMemo(() => isLowSpecDevice(), []);

  // Set data-perf attribute on root so CSS can opt-out of heavy effects
  useEffect(() => {
    document.documentElement.setAttribute('data-perf', lowSpec ? 'low' : 'high');
  }, [lowSpec]);

  // SELF-HEALING: Global Immune System & State Sanitization
  useEffect(() => {
    // 1. Catch unhandled promise rejections (Async failures)
    const handleRejection = (event: PromiseRejectionEvent) => {
      reportError(event.reason, { 
        severity: 'high', 
        action: 'background_process', 
        component: 'GlobalAsync' 
      });
    };

    // 2. Sanitize Local Storage (Faulty State Recovery)
    const sanitizeState = () => {
      try {
        const criticalKeys = ['user_session', 'last_date_scratch', 'pwa-settings'];
        criticalKeys.forEach(key => {
          const item = localStorage.getItem(key);
          if (item) {
            try {
              JSON.parse(item); 
            } catch (e) {
              console.warn(`[Self-Healing] Corrupted state found in ${key}. Resetting...`);
              localStorage.removeItem(key); // Autonomous repair
            }
          }
        });
      } catch (err) {
        reportError(err, { severity: 'low', component: 'StorageSanitizer' });
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);
    sanitizeState();

    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, []);

  const SuspenseFallback = () => {
    if (location.pathname.includes('dashboard')) {
      return <DashboardSkeleton />;
    }
    return <PageSkeleton />;
  };

  // Match any Param-X feature including upload, rules, or hackathon registration
  const isParamX = location.pathname.startsWith('/param-x') || location.pathname.startsWith('/hackathon-register');
  const bgColor2 = isParamX ? "#3300ffff" : "#000000";

  return (
    <>

      <div className="background-fixed">
        <Suspense fallback={null}>
          <LineWaves
            speed={0.1}
            innerLineCount={lowSpec ? 12 : 32}
            outerLineCount={lowSpec ? 12 : 36}
            warpIntensity={1}
            rotation={0}
            edgeFadeWidth={0}
            colorCycleSpeed={1}
            brightness={0.2}
            color1="#3300ffff"
            color2={bgColor2}
            color3="#000000ff"
            enableMouseInteraction={!lowSpec}
            mouseInfluence={0.1}
            fpsLimit={lowSpec ? 30 : 0}
          />
        </Suspense>
      </div>

      <div className="app-container">
        <Navbar />

        <main className={isDashboard ? "dashboard-layout" : "content"}>
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <Suspense fallback={<SuspenseFallback />}>
                <Routes location={location} key={location.pathname}>
                  {/* ── Public Site Pages ── */}
                  <Route path="/"            element={<T el={settings.home ? <Home /> : <ComingSoon pageName="Home" />} />} />
                  <Route path="/workshops"   element={<T el={settings.workshops ? <Workshops /> : <ComingSoon pageName="Workshops" />} />} />
                  <Route path="/competitions"element={<T el={settings.competitions ? <Competitions /> : <ComingSoon pageName="Competitions" />} />} />
                  <Route path="/schedule"    element={<T el={settings.schedule ? <Schedule /> : <ComingSoon pageName="Schedule" />} />} />

                  <Route path="/sponsors"    element={<T el={settings.sponsors ? <Sponsors /> : <ComingSoon pageName="Sponsors" />} />} />
                  <Route path="/privacy"     element={<T el={<Privacy />} />} />
                  <Route path="/terms"       element={<T el={<Terms />} />} />
                  <Route path="/cookies"     element={<T el={<Cookies />} />} />
                  <Route path="/faq"         element={<T el={<FAQ />} />} />
                  <Route path="/contact"     element={<T el={settings.contact ? <Contact /> : <ComingSoon pageName="Contact" />} />} />
                  <Route path="/reach-us"    element={<T el={<ReachUs />} />} />
                  <Route path="/book-a-stall" element={<T el={<BookStall />} />} />
                  <Route path="/robo-kshetra" element={<T el={settings.competitions ? <RobotronRegistration /> : <ComingSoon pageName="RoboKshetra" />} />} />
                  <Route path="/robo-kshetra/rules" element={<T el={<RoboKshetraRules />} />} />
                  <Route path="/battle-grid" element={<T el={<BattleGrid />} />} />
                  <Route path="/battle-grid/rules" element={<T el={<BattleGridRules />} />} />
                  <Route path="/param-x" element={<T el={<ParamX />} />} />
                  <Route path="/param-x/rules" element={<T el={<ParamXRules />} />} />
                  <Route path="/param-x/upload" element={<T el={<ParamXUpload />} />} />
                  <Route path="/rules" element={<T el={<Rules />} />} />
                  <Route path="/monster-x-bgmi" element={<T el={<MonsterBgmi />} />} />
                  <Route path="/dev/checkout-test" element={<T el={<CheckoutSimulator />} />} />

                  {/* ── Club Detail Pages ── */}
                  <Route path="/gdgoc-zcoer"    element={<T el={<GDGClub />} />} />
                  <Route path="/orbitx-zcoer" element={<T el={<OrbitXClub />} />} />

                  {/* ── Student Auth ── */}
                  <Route element={<PublicRoutes />}>
                    <Route path="/login" element={<T el={<Login />} />} />
                  </Route>

                  {/* ── Admin Auth ── */}
                  <Route path="/admin-login" element={<T el={<AdminLogin />} />} />

                  {/* ── Student Protected ── */}
                  <Route element={<UserProtectedRoutes />}>
                    <Route path="/signup"         element={<T el={<Signup />} />} />
                    <Route path="/user/dashboard" element={<T el={<ErrorBoundary name="Dashboard"><UserDashboard /></ErrorBoundary>} />} />
                    <Route path="/user/scanner"   element={<T el={<VolunteerScanner />} />} />
                    <Route path="/register/:slug" element={<T el={<ErrorBoundary name="Registration"><Registration /></ErrorBoundary>} />} />
                    <Route path="/hackathon-register" element={<T el={<ErrorBoundary name="HackathonReg"><HackathonRegistration /></ErrorBoundary>} />} />
                    <Route path="/esports-register" element={<T el={<ErrorBoundary name="EsportsReg"><EsportsRegistration /></ErrorBoundary>} />} />
                    <Route path="/payment/status" element={<T el={<ErrorBoundary name="PaymentStatus"><PaymentStatus /></ErrorBoundary>} />} />
                  </Route>

                  {/* ── Admin Protected ── */}
                  <Route element={<AdminProtectedRoutes />}>
                    <Route path="/admin/setup"     element={<T el={<AdminSetup />} />} />
                    <Route path="/admin/dashboard" element={<T el={<ErrorBoundary name="AdminPanel"><AdminDashboard /></ErrorBoundary>} />} />
                  </Route>

                  {/* ── 404 ── */}
                  <Route path="*" element={<T el={<NotFound />} />} />
                </Routes>
              </Suspense>
            </AnimatePresence>
          </ErrorBoundary>
        </main>

        <Footer />
        <ScrollToTop />
      </div>

    </>
  );
};

const ScrollReset = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Disable browser's automatic scroll restoration on refresh
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // Immediate scroll reset on route change
    window.scrollTo(0, 0);
    document.documentElement.scrollTo(0, 0);
    document.body.scrollTo(0, 0);
    
    // Delayed fallback for complex page entries
    const timeoutId = setTimeout(() => {
       window.scrollTo(0, 0);
    }, 10);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null;
};

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <ToastProvider>
            <Router>
              <ScrollReset />
              <BugReportProvider>
                <LayoutManager />
              </BugReportProvider>
              <PWAReloadPrompt />
            </Router>
        </ToastProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}


export default App;
