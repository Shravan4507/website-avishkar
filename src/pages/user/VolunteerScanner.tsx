import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, getDoc, or, and } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/toast/Toast';
import { CheckCircle, Camera, ArrowLeft, AlertTriangle, Download, RefreshCw, Wifi, WifiOff, Search, Power, History, Trash2 } from 'lucide-react';
import { SkeletonDashboard } from '../../components/skeleton/Skeleton';
import { decryptAndVerifyQR } from '../../utils/qrCrypto';
import GlassSelect from '../../components/dropdown/GlassSelect';
import './VolunteerScanner.css';

interface ScannedUser {
  id: string;
  firstName: string;
  lastName: string;
  avrId: string;
  college?: string;
}

interface HistoryItem {
  avrId: string;
  name: string;
  timestamp: string;
  status: 'success' | 'duplicate';
  mode: string;
}

const SCANNER_ROLE_OPTIONS = [
  { value: 'gate', label: 'Gate Entry' },
  { value: 'param-x', label: 'Param-X' },
  { value: 'battle-grid', label: 'Battle Grid' },
  { value: 'robo-kshetra', label: 'Robo-Kshetra' },
  { value: 'forge-x', label: 'Forge-X' },
  { value: 'algo-bid', label: 'Algo-Bid' },
  { value: 'code-ladder', label: 'Code-Ladder' }
];

const VolunteerScanner: React.FC = () => {
  const [user, authLoading] = useAuthState(auth);
  const navigate = useNavigate();
  const toast = useToast();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  
  // Scanner State
  const [scanMode, setScanMode] = useState<string>('gate');
  const [availableEvents, setAvailableEvents] = useState<{label: string, value: string}[]>([]);
  const [scannedUser, setScannedUser] = useState<ScannedUser | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error' | 'already_scanned'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  // App State
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualId, setManualId] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncLoading, setSyncLoading] = useState(false);
  const [localDataCount, setLocalDataCount] = useState(0);
  const [scanHistory, setScanHistory] = useState<HistoryItem[]>([]);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Camera State
  const [cameras, setCameras] = useState<{ id: string, label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scanModeRef = useRef(scanMode);
  const historyRef = useRef<HTMLDivElement>(null);

  // Load History & Mode Caches
  useEffect(() => {
    scanModeRef.current = scanMode;
    
    // Load local cache count
    const local = localStorage.getItem(`scanner_data_${scanMode}`);
    setLocalDataCount(local ? JSON.parse(local).length : 0);

    // Load history for this mode
    const histKey = `scan_history_${scanMode}_${user?.uid}`;
    const savedHist = localStorage.getItem(histKey);
    setScanHistory(savedHist ? JSON.parse(savedHist) : []);
  }, [scanMode, user]);

  // Persist History
  useEffect(() => {
    if (user) {
      const histKey = `scan_history_${scanMode}_${user.uid}`;
      localStorage.setItem(histKey, JSON.stringify(scanHistory));
    }
  }, [scanHistory, scanMode, user]);

  // Network Monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 1. Authorization
  useEffect(() => {
    const fetchAuth = async () => {
      if (!user) {
        if (!authLoading) navigate('/login');
        return;
      }
      
      try {
        let authorized = false;
        let scannerRole = '';

        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        if (adminDoc.exists()) {
          authorized = true;
          scannerRole = 'superadmin';
        }
        
        if (!authorized) {
          const uDoc = await getDoc(doc(db, "user", user.uid));
          if (uDoc.exists()) {
            const data = uDoc.data();
            if (data.role === 'volunteer') {
              authorized = true;
              scannerRole = data.scannerRole || 'gate';
            }
          }
        }
        
        if (!authorized) {
          toast.error("Unauthorized access.");
          navigate('/user/dashboard');
          return;
        }

        setIsAuthorized(true);

        if (scannerRole === 'superadmin') {
          setAvailableEvents(SCANNER_ROLE_OPTIONS);
          setScanMode('gate');
        } else {
          const roleOption = SCANNER_ROLE_OPTIONS.find(o => o.value === scannerRole);
          setAvailableEvents([roleOption || { value: scannerRole, label: scannerRole.toUpperCase() }]);
          setScanMode(scannerRole);
        }

      } catch (err) {
        console.error(err);
        toast.error("Auth check failed.");
        navigate('/user/dashboard');
      }
    };
    fetchAuth();
  }, [user, authLoading, navigate]);

  // 2. Camera detection
  useEffect(() => {
    if (!isAuthorized) return;
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        const deviceList = devices.map(d => ({ id: d.id, label: d.label }));
        setCameras(deviceList);
        
        // Default to back camera (usually contains "back", "environment", or is the last one)
        const backCamera = deviceList.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('environment') ||
          d.label.toLowerCase().includes('rear')
        );
        
        setSelectedCameraId(backCamera ? backCamera.id : deviceList[deviceList.length - 1].id);
      }
    }).catch(err => {
      console.error(err);
      toast.error("Camera detection error.");
    });
    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(e => console.error(e));
      }
    };
  }, [isAuthorized]);

  // 3. Start/Stop Logic
  const toggleCamera = async () => {
    if (isScanning) {
      await stopScanning();
    } else {
      await startScanning();
    }
  };

  const startScanning = async () => {
    if (!selectedCameraId) {
      toast.error("Select a camera first");
      return;
    }
    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;
      await html5QrCode.start(
        selectedCameraId,
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        handleScan,
        () => {}
      );
      setIsScanning(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to start camera");
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // 4. Sync Logic
  const syncLocalData = async () => {
    if (!isOnline) {
      toast.error("Offline: Connect to sync data.");
      return;
    }
    setSyncLoading(true);
    try {
      if (scanMode === 'gate') {
        const q = query(collection(db, "user"));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        localStorage.setItem('scanner_data_gate', JSON.stringify(data));
        setLocalDataCount(data.length);
      } else {
        const isHackathon = scanMode === 'param-x';
        const collectionName = isHackathon ? "hackathon_registrations" : "registrations";
        let q;
        if (isHackathon) {
          q = query(collection(db, collectionName), where("status", "==", "confirmed"));
        } else {
          q = query(collection(db, collectionName), where("eventName", "==", scanMode));
        }
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        localStorage.setItem(`scanner_data_${scanMode}`, JSON.stringify(data));
        setLocalDataCount(data.length);
      }
      toast.success("Database Synced Locally!");
    } catch (err) {
      console.error(err);
      toast.error("Sync failed.");
    } finally {
      setSyncLoading(false);
    }
  };

  const addToHistory = (avrId: string, name: string, status: 'success' | 'duplicate') => {
    const newItem: HistoryItem = {
      avrId,
      name,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status,
      mode: scanMode
    };

    setScanHistory(prev => {
      // Remove any existing entry for this ID to move it to the top
      const filtered = prev.filter(h => h.avrId !== avrId);
      return [newItem, ...filtered].slice(0, 50); // Keep last 50
    });
  };

  const handleDuplicateInteraction = (avrId: string) => {
    setHighlightedId(avrId);
    setTimeout(() => {
      const el = document.getElementById(`history-${avrId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
    
    // Clear highlight after 2s
    setTimeout(() => setHighlightedId(null), 2500);
  };

  // 5. Handle Scans
  const handleScan = async (decodedText: string) => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      const result = decryptAndVerifyQR(decodedText.trim());
      
      if (scanModeRef.current !== 'gate' && result.eventId && result.eventId !== scanModeRef.current) {
        setScanStatus('already_scanned'); 
        setStatusMessage(`PASS FOR ${result.eventId.toUpperCase()}`);
        setScannedUser({ firstName: result.firstName, lastName: result.lastName, avrId: result.avrId } as any);
        setIsProcessing(false);
        return;
      }
      await processAvrId(result.avrId);
    } catch (err: any) {
      setScanStatus('error');
      setStatusMessage(err.message || 'INVALID QR CODE');
      setIsProcessing(false);
    }
  };

  const processAvrId = async (avrId: string) => {
    setIsProcessing(true);
    setScanStatus('idle');
    const currentMode = scanModeRef.current;

    try {
      const modeData = localStorage.getItem(`scanner_data_${currentMode}`);
      const gateData = localStorage.getItem('scanner_data_gate');
      const offlineEntries = modeData ? JSON.parse(modeData) : [];
      const offlineUsers = gateData ? JSON.parse(gateData) : [];
      
      let targetDoc: any = null;
      let targetUser: any = offlineUsers.find((u: any) => u.avrId === avrId);

      if (currentMode === 'gate') targetDoc = targetUser;
      else targetDoc = offlineEntries.find((r: any) => r.userAVR === avrId || (r.allAvrIds && r.allAvrIds.includes(avrId)));

      if (!targetDoc && isOnline) {
        if (currentMode === 'gate') {
          const q = query(collection(db, "user"), where("avrId", "==", avrId));
          const snap = await getDocs(q);
          if (!snap.empty) targetDoc = { id: snap.docs[0].id, ...snap.docs[0].data() };
        } else if (currentMode === 'param-x') {
          const q = query(collection(db, "hackathon_registrations"), where("allAvrIds", "array-contains", avrId), where("status", "==", "confirmed"));
          const snap = await getDocs(q);
          if (!snap.empty) targetDoc = { id: snap.docs[0].id, ...snap.docs[0].data() };
        } else {
          const q = query(collection(db, "registrations"), and(where("eventName", "==", currentMode), where("status", "==", "confirmed"), or(where("userAVR", "==", avrId), where("allAvrIds", "array-contains", avrId))));
          const snap = await getDocs(q);
          if (!snap.empty) targetDoc = { id: snap.docs[0].id, ...snap.docs[0].data() };
        }
      }

      if (!targetDoc) {
        setScanStatus('error');
        setStatusMessage(currentMode === 'gate' ? 'User Not Found' : 'Not Registered');
        return;
      }

      const name = targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : (targetDoc.firstName ? `${targetDoc.firstName} ${targetDoc.lastName}` : 'Team Member');

      if (currentMode === 'gate') {
        if (isOnline) await updateDoc(doc(db, "user", targetDoc.id || targetDoc.uid), { gateCheckIn: serverTimestamp() });
        else {
          targetDoc.gateCheckIn = new Date().toISOString();
          localStorage.setItem('scanner_data_gate', JSON.stringify(offlineUsers));
          toast.info("Offline Gate Scan Marked!");
        }
        setScannedUser(targetDoc);
        setScanStatus('success');
        setStatusMessage('GATE ENTRY GRANTED');
        addToHistory(avrId, name, 'success');
      } else {
        if (targetDoc.isAttended) {
          setScanStatus('already_scanned');
          setStatusMessage('ALREADY SCANNED');
          setScannedUser(targetUser || targetDoc);
          addToHistory(avrId, name, 'duplicate');
          handleDuplicateInteraction(avrId);
          return;
        }
        if (isOnline) {
          const colName = currentMode === 'param-x' ? "hackathon_registrations" : "registrations";
          await updateDoc(doc(db, colName, targetDoc.id), { isAttended: true, scannedAt: serverTimestamp() });
        } else {
          targetDoc.isAttended = true;
          localStorage.setItem(`scanner_data_${currentMode}`, JSON.stringify(offlineEntries));
          toast.info("Offline Attendance Marked!");
        }
        setScannedUser(targetUser || targetDoc);
        setScanStatus('success');
        setStatusMessage('ACCESS GRANTED');
        addToHistory(avrId, name, 'success');
      }
    } catch (err) {
      console.error(err);
      setScanStatus('error');
      setStatusMessage('SYSTEM ERROR');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId.trim()) processAvrId(manualId.trim().toUpperCase());
  };

  const clearHistory = () => {
    if (window.confirm("Clear current session history?")) {
      setScanHistory([]);
    }
  };

  if (authLoading || isAuthorized === null) return <SkeletonDashboard />;

  return (
    <div className="volunteer-scanner-page">
      <header className="scanner-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="back-btn" onClick={() => navigate('/user/dashboard')}>
            <ArrowLeft size={16} /> Dashboard
          </button>
          <div className="scanner-title">
            <Camera size={22} color="#a78bfa" />
            <h1>Volunteer Scan</h1>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
            {isOnline ? <Wifi size={14} color="#10b981" /> : <WifiOff size={14} color="#ef4444" />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#a78bfa', background: 'rgba(167, 139, 250, 0.1)', padding: '4px 10px', borderRadius: '6px' }}>
            Cache: {localDataCount}
          </div>
        </div>
      </header>
      
      <main className="scanner-main-content">
        <div className="scanner-container">
          <div className="scanner-top-row">
            <div className="scanner-left-col">
              <div className="scanner-video-section">
                <div id="qr-reader"></div>
                {isProcessing && <div className="scanner-proc-overlay"><div className="spinner"></div><p>Verifying...</p></div>}
                {!isScanning && <div className="camera-off-overlay"><Power size={48} color="rgba(255,255,255,0.2)" /><p>Camera is Off</p></div>}
              </div>
              <div className="camera-controls">
                <div style={{ flex: 1 }}>
                  <GlassSelect 
                    options={cameras.length ? cameras.map(c => ({ value: c.id, label: c.label || `Camera ${cameras.indexOf(c) + 1}` })) : [{ value: '', label: 'No Camera Found' }]} 
                    value={selectedCameraId} 
                    onChange={async (id) => {
                      const wasScanning = isScanning;
                      if (wasScanning) await stopScanning();
                      setSelectedCameraId(id);
                      if (wasScanning) setTimeout(() => startScanning(), 100);
                    }} 
                    disabled={false} 
                  />
                </div>
                <button className={`start-stop-btn ${isScanning ? 'stop' : 'start'}`} onClick={toggleCamera}>
                  {isScanning ? <WifiOff size={18} /> : <Power size={18} />}
                  {isScanning ? 'Stop' : 'Start'}
                </button>
                {cameras.length > 1 && (
                  <button 
                    className="camera-switch-btn" 
                    onClick={async () => {
                      const currentIndex = cameras.findIndex(c => c.id === selectedCameraId);
                      const nextIndex = (currentIndex + 1) % cameras.length;
                      const nextId = cameras[nextIndex].id;
                      
                      const wasScanning = isScanning;
                      if (wasScanning) await stopScanning();
                      setSelectedCameraId(nextId);
                      if (wasScanning) setTimeout(() => startScanning(), 100);
                    }}
                    title="Switch Camera"
                  >
                    <RefreshCw size={18} />
                  </button>
                )}
              </div>
              <div className="scanner-manual-input">
                <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}><GlassSelect options={availableEvents} value={scanMode} onChange={setScanMode} /></div>
                  <button 
                    className="sync-btn"
                    onClick={syncLocalData}
                    disabled={syncLoading}
                    title="Manual Data Sync"
                  >
                    {syncLoading ? <RefreshCw size={18} className="spin" /> : <Download size={18} />}
                  </button>
                </div>
                <form onSubmit={handleManualEntry} style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" className="manual-input-field" placeholder="Manual AVR-ID entry..." value={manualId} onChange={(e) => {
                    let v = e.target.value.toUpperCase();
                    if (v && !v.startsWith('AVR-')) v = 'AVR-' + v;
                    setManualId(v);
                  }} />
                  <button type="submit" className="manual-search-btn"><Search size={18} /></button>
                </form>
              </div>
            </div>
            <div className="scanner-right-col">
              <div className={`scan-status-card ${scanStatus}`}>
                {scanStatus === 'idle' && <div className="idle-state"><Camera size={64} opacity={0.1} /><p>Awaiting detection for<br/><strong style={{ color: '#a78bfa' }}>{SCANNER_ROLE_OPTIONS.find(o => o.value === scanMode)?.label || scanMode}</strong></p></div>}
                {scanStatus === 'success' && scannedUser && (
                  <div className="animate-in">
                    <div className="status-icon success"><CheckCircle size={40} /></div>
                    <h2 className="status-title success">{statusMessage}</h2>
                    <div className="user-info-plate"><p className="user-name">{scannedUser.firstName} {scannedUser.lastName}</p><p className="user-avr">{scannedUser.avrId}</p></div>
                    <button className="scan-next-btn" onClick={() => { setScanStatus('idle'); setScannedUser(null); }}>Scan Next</button>
                  </div>
                )}
                {(scanStatus === 'already_scanned' || scanStatus === 'error') && (
                  <div className="animate-in">
                    <div className="status-icon error"><AlertTriangle size={40} /></div>
                    <h2 className="status-title error">{statusMessage}</h2>
                    {scannedUser && <div className="user-info-plate"><p className="user-name">{scannedUser.firstName} {scannedUser.lastName}</p><p className="user-avr">{scannedUser.avrId}</p></div>}
                    <button className={`scan-next-btn ${scanStatus === 'error' ? 'error' : ''}`} onClick={() => { setScanStatus('idle'); setScannedUser(null); }}>{scanStatus === 'error' ? 'Try Again' : 'Dismiss'}</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="scanner-history-section" ref={historyRef}>
            <div className="history-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <History size={18} color="#a78bfa" />
                <h3>Recent Activity</h3>
              </div>
              {scanHistory.length > 0 && <button className="clear-history-btn" onClick={clearHistory}><Trash2 size={14} /> Clear</button>}
            </div>
            <div className="history-list-wrapper">
              {scanHistory.length === 0 ? (
                <div className="empty-history">No scans in this session yet.</div>
              ) : (
                <div className="history-table">
                  {scanHistory.map((item) => (
                    <div 
                      key={`${item.avrId}-${item.timestamp}`} 
                      id={`history-${item.avrId}`}
                      className={`history-row ${item.status} ${highlightedId === item.avrId ? 'blink' : ''}`}
                    >
                      <div className="hist-col-info">
                        <span className="hist-name">{item.name}</span>
                        <span className="hist-avr">{item.avrId}</span>
                      </div>
                      <div className="hist-col-meta">
                        <span className={`hist-badge ${item.status}`}>{item.status.toUpperCase()}</span>
                        <span className="hist-time">{item.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VolunteerScanner;
