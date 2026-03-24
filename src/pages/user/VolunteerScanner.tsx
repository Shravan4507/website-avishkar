import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/toast/Toast';
import { CheckCircle, Camera, ArrowLeft, AlertTriangle } from 'lucide-react';
import { SkeletonDashboard } from '../../components/skeleton/Skeleton';
import { COMPETITIONS_DATA } from '../../data/competitions';
import { verifyQRPayload } from '../../utils/qrCrypto';
import './VolunteerScanner.css';

interface ScannedUser {
  id: string; // Document ID
  firstName: string;
  lastName: string;
  avrId: string;
  college: string;
}

const VolunteerScanner: React.FC = () => {
  const [user, authLoading] = useAuthState(auth);
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  
  // Custom Scanner Modes
  const [scanMode, setScanMode] = useState<string>('gate'); // 'gate' or 'EVENT_TITLE'
  const [availableEvents, setAvailableEvents] = useState<{label: string, value: string}[]>([
    { label: 'Gate Check-In (Global)', value: 'gate' }
  ]);
  
  const [, setScanResult] = useState<string | null>(null);
  const [scannedUser, setScannedUser] = useState<ScannedUser | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error' | 'already_scanned'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualId, setManualId] = useState('');
  
  const toast = useToast();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // 1. Authorization & Event Fetching
  useEffect(() => {
    const fetchAuthAndEvents = async () => {
      if (!user) {
        if (!authLoading) navigate('/login');
        return;
      }
      
      try {
        let authorized = false;
        // Check Admin
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        if (adminDoc.exists()) authorized = true;
        // Check Volunteer
        if (!authorized) {
          const userDoc = await getDoc(doc(db, "user", user.uid));
          if (userDoc.exists() && userDoc.data().role === 'volunteer') authorized = true;
        }
        
        if (!authorized) {
          toast.error("You are not authorized to use the scanner.");
          navigate('/user/dashboard');
          return;
        }
        setIsAuthorized(true);

        // Fetch Dynamic Competitions to populate dropdown
        const dynamicCompsSnap = await getDocs(collection(db, 'competitions'));
        const dynamicTitles = dynamicCompsSnap.docs.map(doc => doc.data().title);
        
        const hardcodedTitles = COMPETITIONS_DATA.map(c => c.title);
        const allEventTitles = [...new Set([...hardcodedTitles, ...dynamicTitles])];
        
        const eventOptions = allEventTitles.map(t => ({ label: `Event: ${t}`, value: t }));
        setAvailableEvents([{ label: 'Gate Check-In (Global)', value: 'gate' }, ...eventOptions]);

      } catch (err) {
        console.error(err);
        navigate('/user/dashboard');
      }
    };
    fetchAuthAndEvents();
  }, [user, authLoading, navigate]);

  // 2. Initialize Camera
  useEffect(() => {
    if (!isAuthorized) return;

    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          supportedScanTypes: [0] // Camera only
        },
        false
      );

      scannerRef.current.render(handleScan, onScanFailure);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => console.error("Failed to clear scanner", error));
        scannerRef.current = null;
      }
    };
  }, [isAuthorized, scanMode]); // Re-bind if needed, though scanMode is read dynamically in handleScan if we use refs. 
  // Wait, handleScan is standard closure, we must ensure it gets latest state.
  // Actually, easiest way is to use a mutable ref for scanMode or just rely on the component re-render.
  
  const scanModeRef = useRef(scanMode);
  scanModeRef.current = scanMode;

  const handleScan = async (decodedText: string) => {
    if (isProcessing) return;
    setScanResult(decodedText);
    
    // Verify HMAC signature
    const result = await verifyQRPayload(decodedText.trim());
    
    if (!result.valid) {
      setScanStatus('error');
      setStatusMessage(result.error || 'INVALID QR CODE');
      setIsProcessing(false);
      return;
    }
    
    await processAvrId(result.avrId);
  };

  const processAvrId = async (avrId: string) => {
    setIsProcessing(true);
    setScanStatus('idle');
    const currentMode = scanModeRef.current;

    try {
      if (currentMode === 'gate') {
        // --- GATE CHECK-IN LOGIC ---
        const q = query(collection(db, "user"), where("avrId", "==", avrId));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          setScanStatus('error');
          setStatusMessage('User not found in system.');
          setIsProcessing(false);
          return;
        }

        const userDoc = snap.docs[0];
        const userData = userDoc.data() as ScannedUser;

        // Gate entry allows infinite re-entries, but marks latest time.
        await updateDoc(doc(db, "user", userDoc.id), {
          gateCheckIn: serverTimestamp()
        });

        setScannedUser({ ...userData, id: userDoc.id });
        setScanStatus('success');
        setStatusMessage('VISITOR ENTRY GRANTED');
        
      } else {
        // --- COMPETITION SPECIFIC LOGIC ---
        const q = query(
          collection(db, "registrations"), 
          where("userAVR", "==", avrId),
          where("eventName", "==", currentMode)
        );
        const snap = await getDocs(q);

        if (snap.empty) {
          setScanStatus('error');
          setStatusMessage(`NOT REGISTERED FOR ${currentMode.toUpperCase()}`);
          setIsProcessing(false);
          return;
        }

        const regDoc = snap.docs[0];
        const regData = regDoc.data();

        // Check for Double Scan
        if (regData.isAttended === true) {
          setScanStatus('already_scanned');
          setStatusMessage('DOUBLE SCAN: ALREADY ATTENDED');
          
          // Still fetch user to show who it is
          const uQ = query(collection(db, "user"), where("avrId", "==", avrId));
          const uSnap = await getDocs(uQ);
          if (!uSnap.empty) setScannedUser({ ...uSnap.docs[0].data(), id: uSnap.docs[0].id } as ScannedUser);
          
          setIsProcessing(false);
          return;
        }

        // Grant Access
        await updateDoc(doc(db, "registrations", regDoc.id), {
          isAttended: true,
          scannedAt: serverTimestamp()
        });

        // Fetch User Data for UI
        const uQ = query(collection(db, "user"), where("avrId", "==", avrId));
        const uSnap = await getDocs(uQ);
        if (!uSnap.empty) setScannedUser({ ...uSnap.docs[0].data(), id: uSnap.docs[0].id } as ScannedUser);
        
        setScanStatus('success');
        setStatusMessage('EVENT ACCESS GRANTED');
      }
    } catch (err) {
      console.error(err);
      toast.error("Database connection failed. Check offline cache.");
      setScanStatus('error');
      setStatusMessage('SYSTEM FAILURE');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId.trim()) processAvrId(manualId.trim().toUpperCase());
  };

  const onScanFailure = () => {};

  if (authLoading || isAuthorized === null) return <SkeletonDashboard />;
  if (!isAuthorized) return null;

  return (
    <div className="volunteer-scanner-page">
      <header className="scanner-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <button className="back-btn" onClick={() => navigate('/user/dashboard')}>
            <ArrowLeft size={20} /> Back
          </button>
          <div className="scanner-title">
            <Camera size={24} color="#a78bfa" />
            <h1>Scan &amp; Go</h1>
          </div>
        </div>
        
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>Select Scanner Mode:</p>
          <select 
            value={scanMode} 
            onChange={(e) => { setScanMode(e.target.value); setScannedUser(null); setScanStatus('idle'); }}
            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontFamily: 'inherit', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}
          >
            {availableEvents.map(ev => (
              <option key={ev.value} value={ev.value} style={{ background: '#111', color: '#fff' }}>{ev.label}</option>
            ))}
          </select>
        </div>
      </header>
      
      <main className="scanner-main-content animate-in">
        <div className="scanner-container">
          {/* Camera View */}
          <div className="scanner-video-section">
            <div id="qr-reader" className="qr-reader-container"></div>
            {isProcessing && (
              <div className="scanner-overlay processing">
                <div className="spinner"></div>
                <p>Verifying Database...</p>
              </div>
            )}
            
            {/* Manual Fallback */}
            <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.5)' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Screen broken? Manual Entry:</p>
              <form onSubmit={handleManualEntry} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  value={manualId} 
                  onChange={e => setManualId(e.target.value)} 
                  placeholder="AVR-XXXX"
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }}
                />
                <button type="submit" style={{ padding: '10px 20px', background: '#a78bfa', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Verify</button>
              </form>
            </div>
          </div>

          {/* Result View */}
          <div className="scanner-result-section">
            <div className={`scan-status-card ${scanStatus}`} style={{ transition: 'all 0.3s' }}>
              
              {scanStatus === 'idle' && (
                <div className="scan-idle-card">
                  <Camera size={48} color="rgba(255,255,255,0.1)" />
                  <p>Point camera at a Virtual Pass QR Code.<br/>Currently scanning for: <strong>{scanMode === 'gate' ? 'Gate Entry' : scanMode}</strong></p>
                </div>
              )}

              {scanStatus === 'success' && scannedUser && (
                <div className="scan-success-card animate-in">
                  <div className="success-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                    <CheckCircle size={56} color="#10b981" />
                  </div>
                  <h2 style={{ color: '#10b981' }}>{statusMessage}</h2>
                  <UserDetailsCard user={scannedUser} />
                  <NextButton onNext={() => { setScanStatus('idle'); setScannedUser(null); setManualId(''); }} />
                </div>
              )}

              {scanStatus === 'already_scanned' && scannedUser && (
                <div className="scan-error-card animate-in" style={{ textAlign: 'center' }}>
                  <div className="success-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', display: 'inline-block', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                    <AlertTriangle size={56} color="#ef4444" />
                  </div>
                  <h2 style={{ color: '#ef4444', margin: '0 0 1rem 0' }}>{statusMessage}</h2>
                  <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>This pass has already been used for this event.</p>
                  <UserDetailsCard user={scannedUser} />
                  <NextButton onNext={() => { setScanStatus('idle'); setScannedUser(null); setManualId(''); }} />
                </div>
              )}

              {scanStatus === 'error' && (
                <div className="scan-error-card animate-in" style={{ textAlign: 'center' }}>
                   <div className="success-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', display: 'inline-block', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                    <AlertTriangle size={56} color="#ef4444" />
                  </div>
                  <h2 style={{ color: '#ef4444', margin: '0 0 1rem 0' }}>{statusMessage}</h2>
                  <p style={{ color: 'rgba(255,255,255,0.6)' }}>Student is not registered or valid.</p>
                  <NextButton onNext={() => { setScanStatus('idle'); setScannedUser(null); setManualId(''); }} />
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const UserDetailsCard = ({ user }: { user: ScannedUser }) => (
  <div className="scanned-user-details" style={{ width: '100%', textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Name</span>
      <span style={{ fontWeight: 600, color: '#fff' }}>{user.firstName} {user.lastName}</span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
      <span style={{ color: 'rgba(255,255,255,0.5)' }}>AVR-ID</span>
      <span style={{ color: '#a78bfa', fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 'bold' }}>{user.avrId}</span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'rgba(255,255,255,0.5)' }}>College</span>
      <span style={{ fontWeight: 600, color: '#fff' }}>{user.college}</span>
    </div>
  </div>
);

const NextButton = ({ onNext }: { onNext: () => void }) => (
  <button onClick={onNext} style={{ width: '100%', padding: '1rem', background: '#a78bfa', color: '#000', borderRadius: '12px', fontWeight: 'bold', border: 'none', marginTop: '1.5rem', cursor: 'pointer' }}>
    Scan Next Person
  </button>
);

export default VolunteerScanner;
