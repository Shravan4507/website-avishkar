import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection, query, where, getDocs, doc, setDoc, getDoc,
  serverTimestamp, runTransaction
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '../../firebase/firebase';
import { useToast } from '../../components/toast/Toast';
import { COMPETITIONS_DATA, type Competition } from '../../data/competitions';
import { type ProblemStatement } from '../../utils/storageUtils';
import problemsData from '../../data/problems.json';
import {
  Search, ArrowRight, ArrowLeft, Loader2, CheckCircle2,
  Upload, Banknote, CreditCard, ImageIcon, AlertTriangle,
  RotateCcw, Fingerprint
} from 'lucide-react';
import './ManualRegistration.css';

/* ═══════════════════════════════════════
   Types
   ═══════════════════════════════════════ */
interface Participant {
  avrId: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  major: string;
  age: number;
  sex: string;
  igName?: string;
  gameUid?: string;
}


type PaymentMode = 'pre_paid' | 'cash' | 'online';

/* ═══════════════════════════════════════
   Constants
   ═══════════════════════════════════════ */
const EMPTY_PARTICIPANT: Participant = { avrId: '', name: '', email: '', phone: '', college: '', major: '', age: 0, sex: '', igName: '', gameUid: '' };


const STEP_LABELS = ['Competition', 'Participants', 'Payment', 'Done'];

/* ── Sub-events for flagship competitions (not in COMPETITIONS_DATA) ── */
interface SubEvent {
  id: string;
  title: string;
  subtitle: string;
  parentTitle: string;
  handle: string;         // competitionHandle used in Firestore
  department: string;
  entryFee: number;
  minTeamSize: number;
  maxTeamSize: number;
  borderColor: string;
  isFlagship: boolean;
}

const BATTLE_GRID_SUBEVENTS: SubEvent[] = [
  { id: 'battlegrid_bgmi',    title: 'BGMI',              subtitle: '4+1 Squad',       parentTitle: 'Battle Grid', handle: 'Battle-Grid', department: 'Flagship', entryFee: 0, minTeamSize: 5, maxTeamSize: 5, borderColor: '#ff9800', isFlagship: true },
  { id: 'battlegrid_freefire', title: 'Free Fire',         subtitle: '4-Player Squad',  parentTitle: 'Battle Grid', handle: 'Battle-Grid', department: 'Flagship', entryFee: 250, minTeamSize: 4, maxTeamSize: 4, borderColor: '#e91e63', isFlagship: true },
  { id: 'battlegrid_codm',    title: 'CODM',              subtitle: 'Tactical 5v5',    parentTitle: 'Battle Grid', handle: 'Battle-Grid', department: 'Flagship', entryFee: 400, minTeamSize: 5, maxTeamSize: 5, borderColor: '#4caf50', isFlagship: true },
  { id: 'battlegrid_sf4',     title: 'Shadow Fight 4',    subtitle: '1v1 Combat',      parentTitle: 'Battle Grid', handle: 'Battle-Grid', department: 'Flagship', entryFee: 99, minTeamSize: 1, maxTeamSize: 1, borderColor: '#ffeb3b', isFlagship: true },
  { id: 'battlegrid_amongus', title: 'Among Us',          subtitle: 'Social Deduction',parentTitle: 'Battle Grid', handle: 'Battle-Grid', department: 'Flagship', entryFee: 100, minTeamSize: 1, maxTeamSize: 1, borderColor: '#00bcd4', isFlagship: true },
];

const ROBO_KSHETRA_SUBEVENTS: SubEvent[] = [
  { id: 'robokshetra_alignx',   title: 'AlignX',   subtitle: 'Line Follower',  parentTitle: 'Robo-Kshetra', handle: 'Robo-Kshetra', department: 'Flagship', entryFee: 499, minTeamSize: 2, maxTeamSize: 4, borderColor: '#d9ff00', isFlagship: true },
  { id: 'robokshetra_roborush', title: 'RoboRush', subtitle: 'Speed Bot Race', parentTitle: 'Robo-Kshetra', handle: 'Robo-Kshetra', department: 'Flagship', entryFee: 499, minTeamSize: 2, maxTeamSize: 4, borderColor: '#d9ff00', isFlagship: true },
  { id: 'robokshetra_robomaze', title: 'RoboMaze', subtitle: 'Maze Navigator', parentTitle: 'Robo-Kshetra', handle: 'Robo-Kshetra', department: 'Flagship', entryFee: 499, minTeamSize: 2, maxTeamSize: 4, borderColor: '#d9ff00', isFlagship: true },
];

const ALL_SUBEVENTS = [...BATTLE_GRID_SUBEVENTS, ...ROBO_KSHETRA_SUBEVENTS];

/* ═══════════════════════════════════════
   Component
   ═══════════════════════════════════════ */
import type { AdminProfile } from '../../pages/admin/admindashboard';

interface ManualRegistrationProps {
  isSuper?: boolean;
  adminProfile?: AdminProfile | null;
}

const ManualRegistration: React.FC<ManualRegistrationProps> = ({ isSuper = false, adminProfile = null }) => {
  const [user] = useAuthState(auth);
  const toast = useToast();

  // Steps
  const [step, setStep] = useState(1);

  // Step 1 — Competition
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null);
  const [selectedSubEvent, setSelectedSubEvent] = useState<SubEvent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [teamSize, setTeamSize] = useState(1);

  // Step 1b — PS selector (hackathon only)
  const [problems, setProblems] = useState<ProblemStatement[]>([]);
  const [selectedPsId, setSelectedPsId] = useState('');
  const [psLoading, setPsLoading] = useState(false);

  // Step 2 — Participants
  const [participants, setParticipants] = useState<Participant[]>([{ ...EMPTY_PARTICIPANT }]);
  const [teamName, setTeamName] = useState('');
  const [lookupLoading, setLookupLoading] = useState<Record<number, boolean>>({});
  const [lookupStatus, setLookupStatus] = useState<Record<number, 'verified' | 'failed' | null>>({});

  // Step 3 — Payment
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('pre_paid');
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Confirmation
  const [resultId, setResultId] = useState('');
  const [resultTeamId, setResultTeamId] = useState('');

  const isHackathon = selectedComp?.handle === 'ParamX-Hack';
  const isSubEvent = !!selectedSubEvent;
  // IDs of umbrella competitions that should be replaced by sub-events
  const UMBRELLA_IDS = ['robotron--26', 'battlegrid--26'];

  const allowedHandles = new Set<string>();
  const allowedEventTitles = new Set<string>();
  
  if (!isSuper && adminProfile?.roleLevel) {
    const roleMapping: Record<string, { handle: string, eventTitle?: string }> = {
      'admin-param-x': { handle: 'ParamX-Hack', eventTitle: '10-Hour Hackathon' },
      'admin-battle-grid': { handle: 'Battle-Grid' },
      'admin-bgmi': { handle: 'Battle-Grid', eventTitle: 'BGMI' },
      'admin-freefire': { handle: 'Battle-Grid', eventTitle: 'Free Fire' },
      'admin-codm': { handle: 'Battle-Grid', eventTitle: 'CODM' },
      'admin-sf4': { handle: 'Battle-Grid', eventTitle: 'The Duel' },
      'admin-amongus': { handle: 'Battle-Grid', eventTitle: 'Social Deduction' },
      'admin-robo-kshetra': { handle: 'Robo-Kshetra' },
      'admin-align-x': { handle: 'Robo-Kshetra', eventTitle: 'AlignX' },
      'admin-robo-maze': { handle: 'Robo-Kshetra', eventTitle: 'RoboMaze' },
      'admin-robo-rush': { handle: 'Robo-Kshetra', eventTitle: 'RoboRush' },
      'admin-forge-x': { handle: 'Forge-Lead', eventTitle: 'Forge-X' },
      'admin-algo-bid': { handle: 'Algo-Master', eventTitle: 'AlgoBid' },
      'admin-code-ladder': { handle: 'Code-Climber', eventTitle: 'Code Ladder' },
      'admin-ipl-auction': { handle: 'IPL-Auctioneer', eventTitle: 'IPL Auction' },
      'admin-blind-code': { handle: 'Blind-Coder', eventTitle: 'Blind Code Challenge' },
      'admin-dev-clash': { handle: 'Dev-Striker', eventTitle: 'Dev Clash' },
      'admin-vibe-sprint': { handle: 'Vibe-Lead', eventTitle: 'Vibe Sprint' },
      'admin-code-relay': { handle: 'Relay-Coder', eventTitle: 'Code Run' },
      'admin-bridge-nova': { handle: 'Arch-Nova', eventTitle: 'Bridge Nova' },
      'admin-poster': { handle: 'Paper-Lead', eventTitle: 'Poster Presentation' },
      'admin-spark-tank': { handle: 'Spark-Lead', eventTitle: 'Spark Tank - Electro-Innovation Pitch' },
      'admin-matlab': { handle: 'Mat-Master', eventTitle: 'Matlab Madness' },
      'admin-circuit-sim': { handle: 'Circuit-Ninja', eventTitle: 'Circuit Simulation' },
      'admin-contraptions': { handle: 'Master-Builder', eventTitle: 'Contraption Challange' },
      'admin-circle-cricket': { handle: 'Cricket-Lead', eventTitle: 'Circle Cricket' },
      'admin-paper-pres': { handle: 'Research-Lead', eventTitle: 'Paper Presentation' },
      'admin-project-comp': { handle: 'Project-Master', eventTitle: 'Project Competition' },
      'workshop-solar-spot': { handle: 'OrbitX-Solar', eventTitle: 'Solar Spot' },
    };

    const DEPARTMENT_PSEUDO_ROLES: Record<string, string[]> = {
      'department_admin-computer-engineering': ['admin-forge-x', 'admin-algo-bid'],
      'department_admin-information-technology': ['admin-sf4', 'admin-codm', 'admin-code-ladder'],
      'department_admin-ai-ds': ['admin-ipl-auction'],
      'department_admin-ai-ml': ['admin-dev-clash', 'admin-vibe-sprint', 'admin-code-relay'],
      'department_admin-civil-engineering': ['admin-bridge-nova'],
      'department_admin-electrical-engineering': ['admin-poster', 'admin-spark-tank', 'admin-freefire'],
      'department_admin-e-tc-engineering': ['admin-matlab', 'admin-circuit-sim'],
      'department_admin-ece': ['admin-blind-code', 'admin-circle-cricket', 'admin-amongus'],
      'department_admin-mechanical-engineering': ['admin-contraptions'],
    };

    let expandedRoles: string[] = [];
    adminProfile.roleLevel.forEach((role: string) => {
      expandedRoles.push(role);
      if (DEPARTMENT_PSEUDO_ROLES[role]) {
        expandedRoles.push(...DEPARTMENT_PSEUDO_ROLES[role]);
      }
    });

    expandedRoles.forEach((role: string) => {
      const mapping = roleMapping[role];
      if (mapping) {
        allowedHandles.add(mapping.handle);
        if (mapping.eventTitle) {
          allowedEventTitles.add(mapping.eventTitle.toUpperCase());
        }
      }
    });
  }

  /* ── Filtered competitions (excludes umbrella entries) ── */
  const filteredComps = COMPETITIONS_DATA.filter(c => {
    if (c.status === 'draft') return false;
    if (UMBRELLA_IDS.includes(c.id)) return false; // replaced by sub-events
    
    if (!isSuper) {
      const upperTitle = (c.title || '').toUpperCase().trim();
      if (!allowedHandles.has(c.handle || '') && !allowedHandles.has(c.code || '') && !allowedEventTitles.has(upperTitle)) {
        return false;
      }
    }

    const q = searchTerm.toLowerCase();
    return c.title.toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q) ||
      (c.code || '').toLowerCase().includes(q);
  });

  /* ── Filtered sub-events ── */
  const filteredSubEvents = ALL_SUBEVENTS.filter(se => {
    if (!isSuper) {
      const upperTitle = (se.title || '').toUpperCase().trim();
      if (!allowedHandles.has(se.handle || '') && !allowedEventTitles.has(upperTitle)) {
        return false;
      }
    }

    const q = searchTerm.toLowerCase();
    return se.title.toLowerCase().includes(q) ||
      se.parentTitle.toLowerCase().includes(q) ||
      se.department.toLowerCase().includes(q);
  });

  /* ── Load PS data when hackathon is selected ── */
  useEffect(() => {
    if (isHackathon && problems.length === 0) {
      setPsLoading(true);
      const loadProblems = async () => {
        try {
          const snap = await getDocs(collection(db, 'ps_metadata'));
          const counts: Record<string, number> = {};
          snap.forEach(d => {
            counts[d.id] = d.data().count || 0;
          });
          const merged = (problemsData as ProblemStatement[]).map(ps => ({
            ...ps,
            count: counts[ps.id] || 0
          }));
          setProblems(merged);
        } catch (err) {
          toast.error('Failed to load problem statement live counts. Using offline data.');
          setProblems(problemsData as ProblemStatement[]);
        } finally {
          setPsLoading(false);
        }
      };
      loadProblems();
    }
  }, [isHackathon, problems.length, toast]);

  /* ── Update participant slots when teamSize changes ── */
  useEffect(() => {
    setParticipants(prev => {
      if (teamSize > prev.length) {
        return [...prev, ...Array(teamSize - prev.length).fill(null).map(() => ({ ...EMPTY_PARTICIPANT }))];
      }
      return prev.slice(0, teamSize);
    });
  }, [teamSize]);

  /* ── AVR ID Lookup ── */
  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  /* ── AVR ID Lookup ── */
  const handleAvrLookup = useCallback(async (index: number) => {
    const avrId = participants[index].avrId.trim().toUpperCase();
    if (!avrId || avrId.length < 8) {
      toast.warning('AVR ID must be at least 8 characters');
      return;
    }

    setLookupLoading(prev => ({ ...prev, [index]: true }));
    setLookupStatus(prev => ({ ...prev, [index]: null }));

    try {
      const q = query(collection(db, 'user'), where('avrId', '==', avrId));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const data = snap.docs[0].data();
        const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.name || data.displayName || '';

        setParticipants(prev => {
          const updated = [...prev];
          updated[index] = {
            avrId,
            name: fullName,
            email: data.email || '',
            phone: data.whatsappNumber || data.whatsapp || data.phone || '',
            college: data.college || '',
            major: data.major || '',
            age: calculateAge(data.dob),
            sex: data.sex || '',
          };
          return updated;
        });
        setLookupStatus(prev => ({ ...prev, [index]: 'verified' }));
      } else {
        setLookupStatus(prev => ({ ...prev, [index]: 'failed' }));
        toast.warning(`No user found for ${avrId}. Fill details manually.`);
      }
    } catch (err) {
      setLookupStatus(prev => ({ ...prev, [index]: 'failed' }));
      toast.error('Lookup failed. Try again.');
    } finally {
      setLookupLoading(prev => ({ ...prev, [index]: false }));
    }
  }, [participants, toast]);


  /* ── Participant field update ── */
  const updateParticipant = (index: number, field: keyof Participant, value: string) => {
    setParticipants(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: field === 'avrId' ? value.toUpperCase() : value };
      return updated;
    });
    // Clear lookup status when changing AVR ID
    if (field === 'avrId') {
      setLookupStatus(prev => ({ ...prev, [index]: null }));
    }
  };

  /* ── Step validation ── */
  const canProceedStep1 = () => {
    if (!selectedComp && !selectedSubEvent) return false;
    if (isHackathon && !selectedPsId) return false;
    return true;
  };

  const canProceedStep2 = () => {
    // At least the leader (index 0) must have an AVR ID and name
    const leader = participants[0];
    if (!leader.avrId || leader.avrId.length < 8 || !leader.name) return false;
    return true;
  };

  const canSubmit = () => {
    if (paymentMode === 'pre_paid' && !paymentFile) return false;
    return true;
  };

  /* ── Upload payment proof ── */
  const uploadPaymentProof = async (txnId: string): Promise<string> => {
    if (!paymentFile) return '';
    const ext = paymentFile.name.split('.').pop() || 'jpg';
    const storageRef = ref(storage, `payment_proofs/${txnId}.${ext}`);
    const uploadTask = uploadBytesResumable(storageRef, paymentFile);

    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
        },
        (error) => reject(error),
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        }
      );
    });
  };

  /* ═══════════════════════════════════════
     SUBMISSION LOGIC
     ═══════════════════════════════════════ */
  const handleSubmit = async () => {
    if ((!selectedComp && !selectedSubEvent) || !user) return;
    setSubmitting(true);
    setError('');

    try {
      const txnId = `MANUAL-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

      // Upload payment proof if needed
      let proofUrl = '';
      if (paymentMode === 'pre_paid' && paymentFile) {
        proofUrl = await uploadPaymentProof(txnId);
      }

      if (isSubEvent && selectedSubEvent) {
        // ── Sub-event Registration (Battle Grid games / Robo-Kshetra events) ──
        await handleSubEventSubmit(txnId, proofUrl, selectedSubEvent);
      } else if (isHackathon) {
        const fee = 500;
        // ── Hackathon (Param-X) Registration ──
        await handleHackathonSubmit(txnId, proofUrl, fee);
      } else {
        const fee = selectedComp!.entryFee || 0;
        // ── Standard Competition Registration ──
        await handleStandardSubmit(txnId, proofUrl, fee);
      }

      setStep(4);
      toast.success('Registration created successfully!');
    } catch (err: any) {
      setError(err.message || 'Submission failed');
      toast.error(err.message || 'Registration failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Hackathon Submit ── */
  const handleHackathonSubmit = async (txnId: string, proofUrl: string, fee: number) => {
    let generatedTeamId = '';
    await runTransaction(db, async (transaction) => {
      // PS metadata counter
      const psMetadataRef = doc(db, 'ps_metadata', selectedPsId);
      const psMetadataDoc = await transaction.get(psMetadataRef);
      let currentCount = 0;
      if (psMetadataDoc.exists()) currentCount = psMetadataDoc.data().count || 0;
      if (currentCount >= 10) throw new Error('This problem statement has no more slots.');

      // Team counter
      const teamCounterRef = doc(db, 'counters', 'hackathon_team_counter');
      const teamCounterDoc = await transaction.get(teamCounterRef);
      let nextTeamCount = 1;
      if (teamCounterDoc.exists()) nextTeamCount = (teamCounterDoc.data().count || 0) + 1;

      transaction.update(teamCounterRef, { count: nextTeamCount });
      generatedTeamId = `AVR-PRM-${nextTeamCount.toString().padStart(4, '0')}`;

      transaction.set(psMetadataRef, { count: currentCount + 1 }, { merge: true });

      // Standardize squad
      const squad = participants.map(p => ({
        avrId: p.avrId,
        name: p.name,
        email: p.email,
        phone: p.phone,
        college: p.college,
        major: p.major || 'None',
        age: p.age || 18,
        sex: p.sex || 'Other',
        igName: p.igName || null,
        gameUid: p.gameUid || null
      }));

      const regRef = doc(collection(db, 'hackathon_registrations'));
      transaction.set(regRef, {
        id: regRef.id,
        leaderAvrId: participants[0].avrId,
        userId: participants[0].avrId, // Manual entry: using AVR as fallback for userId
        
        competitionId: selectedComp!.id,
        competitionCode: (selectedComp as any).code || 'PRM',
        competitionHandle: 'ParamX-Hack',
        eventName: selectedComp!.title,
        category: selectedComp!.subtitle || 'Flagship Hackathon',
        department: selectedComp!.department,
        isFlagship: true,

        registrationType: 'TEAM',
        teamId: generatedTeamId,
        teamName,
        teamSize: participants.length,
        squad,
        allAvrIds: participants.map(p => p.avrId),

        psId: selectedPsId,
        
        paymentRequired: true,
        paymentStatus: 'paid',
        amountPaid: fee,
        transactionId: txnId,
        paymentMode: paymentMode,
        paymentProofUrl: proofUrl || null,

        status: 'confirmed',
        registeredAt: serverTimestamp(),
        isAttended: false,
        
        metadata: {
          createdAt: serverTimestamp(),
          _manualEntry: true,
          _createdBy: user!.uid,
          _createdByEmail: user!.email || '',
        }
      });
    });


    setResultTeamId(generatedTeamId);
    setResultId(txnId);
  };

  /* ── Standard Submit ── */
  const handleStandardSubmit = async (txnId: string, proofUrl: string, fee: number) => {
    const leader = participants[0];
    const regId = `${selectedComp!.id}_${leader.avrId}`;
    const regRef = doc(db, 'registrations', regId);

    // Check for existing registration
    const existSnap = await getDoc(regRef);
    if (existSnap.exists()) {
      throw new Error(`${leader.avrId} is already registered for ${selectedComp!.title}.`);
    }

    const squad = participants.map(p => ({
      avrId: p.avrId,
      name: p.name,
      email: p.email,
      phone: p.phone,
      college: p.college,
      major: p.major || 'None',
      age: p.age || 18,
      sex: p.sex || 'Other'
    }));

    const allAvrIds = participants.map(p => p.avrId);

    await setDoc(regRef, {
      id: regId,
      leaderAvrId: leader.avrId,
      userId: leader.avrId, // Manual entry: using AVR as fallback for userId

      competitionId: selectedComp!.id,
      competitionCode: (selectedComp as any).code || selectedComp!.id.split('--')[0].toUpperCase(),
      competitionHandle: selectedComp!.handle || null,
      eventName: selectedComp!.title,
      category: selectedComp!.subtitle || 'General Event',
      department: selectedComp!.department,
      isFlagship: (selectedComp as any).isFlagship || false,

      registrationType: participants.length > 1 ? 'TEAM' : 'SOLO',
      teamId: regId, // For solo events, record ID acts as teamId
      teamName: teamName || null,
      teamSize: participants.length,
      squad,
      allAvrIds,

      paymentRequired: (selectedComp as any).paymentRequired || fee > 0,
      paymentStatus: fee > 0 ? 'paid' : 'free',
      amountPaid: fee,
      transactionId: txnId,
      paymentMode: paymentMode,
      paymentProofUrl: proofUrl || null,

      status: 'confirmed',
      registeredAt: serverTimestamp(),
      isAttended: false,
      
      metadata: {
        createdAt: serverTimestamp(),
        _manualEntry: true,
        _createdBy: user!.uid,
        _createdByEmail: user!.email || '',
      }
    });


    setResultId(regId);
  };

  /* ── Sub-event Submit (Battle Grid / Robo-Kshetra) ── */
  const handleSubEventSubmit = async (txnId: string, proofUrl: string, se: SubEvent) => {
    const leader = participants[0];
    const regId = `${se.id}_${leader.avrId}`;
    const regRef = doc(db, 'registrations', regId);

    // Check for existing registration
    const existSnap = await getDoc(regRef);
    if (existSnap.exists()) {
      throw new Error(`${leader.avrId} is already registered for ${se.title}.`);
    }

    const allAvrIds = participants.map(p => p.avrId);

    await setDoc(regRef, {
      id: regId,
      leaderAvrId: leader.avrId,
      userId: leader.avrId, // Manual entry: using AVR as fallback for userId

      competitionId: se.id,
      competitionCode: se.id.includes('robokshetra') ? 'ROBO' : se.id.includes('battlegrid') ? 'BG' : 'SUB',
      competitionHandle: se.handle,
      eventName: se.title,
      category: se.parentTitle,
      department: se.department,
      isFlagship: se.isFlagship,

      registrationType: participants.length > 1 ? 'TEAM' : 'SOLO',
      teamId: regId,
      teamName: teamName || null,
      teamSize: participants.length,

      squad: participants.map(p => ({
        avrId: p.avrId,
        name: p.name,
        email: p.email,
        phone: p.phone,
        college: p.college,
        major: p.major || 'None',
        age: p.age || 18,
        sex: p.sex || 'Other',
        igName: p.igName || null,
        gameUid: p.gameUid || null
      })),
      allAvrIds,

      paymentRequired: se.entryFee > 0,
      paymentStatus: 'paid',
      amountPaid: se.entryFee,
      transactionId: txnId,
      paymentMode: paymentMode,
      paymentProofUrl: proofUrl || null,

      status: 'confirmed',
      registeredAt: serverTimestamp(),
      isAttended: false,
      
      metadata: {
        createdAt: serverTimestamp(),
        _manualEntry: true,
        _createdBy: user!.uid,
        _createdByEmail: user!.email || '',
      }
    });


    setResultId(regId);
  };

  /* ── Reset for another entry ── */
  const handleReset = () => {
    setStep(1);
    setSelectedComp(null);
    setSelectedSubEvent(null);
    setSearchTerm('');
    setTeamSize(1);
    setSelectedPsId('');
    setParticipants([{ ...EMPTY_PARTICIPANT }]);
    setTeamName('');
    setLookupLoading({});
    setLookupStatus({});
    setPaymentMode('pre_paid');
    setPaymentFile(null);
    setUploadProgress(0);
    setError('');
    setResultId('');
    setResultTeamId('');
  };

  /* ═══════════════════════════════════════
     RENDER
     ═══════════════════════════════════════ */
  return (
    <div className="manual-reg">
      <h1 className="manual-reg-title">Manual Registration Entry</h1>
      <p className="manual-reg-subtitle">SuperAdmin — Create registrations bypassing the standard user flow</p>

      {/* ── Step Indicator ── */}
      <div className="manual-step-indicator">
        {STEP_LABELS.map((label, i) => (
          <React.Fragment key={label}>
            {i > 0 && <div className={`manual-step-connector ${step > i ? 'completed' : ''}`} />}
            <div
              className={`manual-step-node ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'completed' : ''}`}
              title={label}
            >
              {step > i + 1 ? '✓' : i + 1}
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* ═══════ STEP 1: Competition Selection ═══════ */}
      {step === 1 && (
        <div className="manual-glass-card">
          <h2>Select Competition</h2>
          <p className="step-desc">Choose the competition for this manual registration</p>

          <div className="comp-search-wrapper">
            <Search size={16} />
            <input
              className="comp-search-bar"
              type="text"
              placeholder="Search competitions..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="comp-selector-grid">
            {filteredComps.map(comp => (
              <div
                key={comp.id}
                className={`comp-card ${selectedComp?.id === comp.id && !isSubEvent ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedComp(comp);
                  setSelectedSubEvent(null);
                  const min = comp.minTeamSize || 1;
                  setTeamSize(comp.id === 'codex--26' ? 4 : min);
                }}
              >
                <div className="comp-card-dot" style={{ background: comp.borderColor }} />
                <div className="comp-card-info">
                  <h4>{comp.title}</h4>
                  <span>{comp.department}</span>
                </div>
                <div className="comp-card-fee">
                  {comp.id === 'codex--26' ? '₹500' : comp.entryFee ? `₹${comp.entryFee}` : 'FREE'}
                </div>
              </div>
            ))}

            {/* Sub-event cards (Battle Grid & Robo-Kshetra) */}
            {filteredSubEvents.map(se => (
              <div
                key={se.id}
                className={`comp-card ${selectedSubEvent?.id === se.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedSubEvent(se);
                  setSelectedComp(null);
                  setTeamSize(se.minTeamSize);
                }}
              >
                <div className="comp-card-dot" style={{ background: se.borderColor }} />
                <div className="comp-card-info">
                  <h4>{se.title}</h4>
                  <span>{se.parentTitle}</span>
                </div>
                <div className="comp-card-fee">₹{se.entryFee}</div>
              </div>
            ))}
          </div>

          {/* Competition Details Preview */}
          {selectedComp && !isSubEvent && (
            <>
              <div className="comp-preview">
                <div className="comp-preview-item">
                  <label>Event</label>
                  <span>{selectedComp.title}</span>
                </div>
                <div className="comp-preview-item">
                  <label>Department</label>
                  <span>{selectedComp.department}</span>
                </div>
                <div className="comp-preview-item">
                  <label>Entry Fee</label>
                  <span>{isHackathon ? '₹500' : selectedComp.entryFee ? `₹${selectedComp.entryFee}` : 'Free'}</span>
                </div>
                <div className="comp-preview-item">
                  <label>Team Size</label>
                  <span>{selectedComp.minTeamSize || 1}–{selectedComp.maxTeamSize || 1}</span>
                </div>
              </div>

              {/* Team size selector (non-hackathon) */}
              {!isHackathon && (selectedComp.minTeamSize || 1) !== (selectedComp.maxTeamSize || 1) && (
                <div className="team-size-selector">
                  <label>Participants:</label>
                  <div className="team-size-btns">
                    {Array.from(
                      { length: (selectedComp.maxTeamSize || 1) - (selectedComp.minTeamSize || 1) + 1 },
                      (_, i) => (selectedComp.minTeamSize || 1) + i
                    ).map(n => (
                      <button
                        key={n}
                        className={`team-size-btn ${teamSize === n ? 'selected' : ''}`}
                        onClick={() => setTeamSize(n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PS Selector (hackathon only) */}
              {isHackathon && (
                <div className="ps-selector" style={{ marginTop: '1.5rem' }}>
                  <label>Problem Statement</label>
                  {psLoading ? (
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', padding: '12px 0' }}>
                      <Loader2 size={14} className="manual-spinner" style={{ display: 'inline', marginRight: '6px' }} />
                      Loading problem statements...
                    </div>
                  ) : (
                    <select
                      value={selectedPsId}
                      onChange={e => setSelectedPsId(e.target.value)}
                    >
                      <option value="">— Select Problem Statement —</option>
                      {problems.map(ps => (
                        <option key={ps.id} value={ps.id}>
                          {ps.id} — {ps.title} ({ps.domain}) [{ps.count}/10 slots taken]
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </>
          )}

          {/* Sub-event Details Preview */}
          {selectedSubEvent && (
            <>
              <div className="comp-preview">
                <div className="comp-preview-item">
                  <label>Event</label>
                  <span>{selectedSubEvent.title}</span>
                </div>
                <div className="comp-preview-item">
                  <label>Category</label>
                  <span>{selectedSubEvent.parentTitle}</span>
                </div>
                <div className="comp-preview-item">
                  <label>Entry Fee</label>
                  <span>₹{selectedSubEvent.entryFee}</span>
                </div>
                <div className="comp-preview-item">
                  <label>Team Size</label>
                  <span>{selectedSubEvent.minTeamSize === selectedSubEvent.maxTeamSize ? selectedSubEvent.minTeamSize : `${selectedSubEvent.minTeamSize}–${selectedSubEvent.maxTeamSize}`}</span>
                </div>
              </div>

              {/* Team size selector for Sub-events */}
              {selectedSubEvent.minTeamSize !== selectedSubEvent.maxTeamSize && (
                <div className="team-size-selector">
                  <label>Participants:</label>
                  <div className="team-size-btns">
                    {Array.from(
                      { length: selectedSubEvent.maxTeamSize - selectedSubEvent.minTeamSize + 1 },
                      (_, i) => selectedSubEvent.minTeamSize + i
                    ).map(n => (
                      <button
                        key={n}
                        className={`team-size-btn ${teamSize === n ? 'selected' : ''}`}
                        onClick={() => setTeamSize(n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="manual-nav-btns">
            <button
              className="manual-btn manual-btn-next"
              disabled={!canProceedStep1()}
              onClick={() => {
                // Ensure teamSize is at least the minimum allowed
                if (isHackathon) {
                  setTeamSize(4);
                } else if (isSubEvent && selectedSubEvent) {
                  if (teamSize < selectedSubEvent.minTeamSize) setTeamSize(selectedSubEvent.minTeamSize);
                } else if (selectedComp) {
                  const min = selectedComp.minTeamSize || 1;
                  if (teamSize < min) setTeamSize(min);
                }
                setStep(2);
              }}
            >
              Next <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════ STEP 2: Participant Details ═══════ */}
      {step === 2 && (
        <div className="manual-glass-card">
          <h2>Participant Details</h2>
          <p className="step-desc">
            Enter AVR IDs to auto-fill participant info. {isHackathon ? 'Hackathon requires 2–4 members.' : `${teamSize} participant(s) for ${isSubEvent ? selectedSubEvent?.title : selectedComp?.title}.`}
          </p>

          {/* Team name */}
          {teamSize > 1 && (
            <div className="team-name-input">
              <label>Team Name {isHackathon ? '(Required)' : '(Optional)'}</label>
              <input
                type="text"
                placeholder="Enter team name..."
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
              />
            </div>
          )}

          {/* Participant slots */}
          {participants.map((p, idx) => (
            <div
              key={idx}
              className={`participant-slot ${lookupStatus[idx] === 'verified' ? 'verified' : lookupStatus[idx] === 'failed' ? 'failed' : ''}`}
            >
              <div className="participant-slot-header">
                <span className="participant-slot-label">
                  {idx === 0 ? (isHackathon ? 'Leader' : 'Participant 1 (Leader)') : `${isHackathon ? 'Member' : 'Participant'} ${idx + 1}`}
                </span>
                {lookupStatus[idx] === 'verified' && <span className="participant-slot-status verified">✓ Verified</span>}
                {lookupStatus[idx] === 'failed' && <span className="participant-slot-status not-found">Not Found</span>}
                {lookupLoading[idx] && <span className="participant-slot-status looking">Looking up...</span>}
              </div>

              <div className="participant-avr-row">
                <input
                  type="text"
                  placeholder="AVR-XXX-0000"
                  value={p.avrId}
                  onChange={e => updateParticipant(idx, 'avrId', e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAvrLookup(idx); }}
                />
                <button
                  onClick={() => handleAvrLookup(idx)}
                  disabled={lookupLoading[idx] || p.avrId.length < 8}
                >
                  {lookupLoading[idx] ? (
                    <Loader2 size={14} className="manual-spinner" />
                  ) : (
                    <><Fingerprint size={14} /> Lookup</>
                  )}
                </button>
              </div>

              <div className="participant-details-grid">
                <div className="participant-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={p.name}
                    onChange={e => updateParticipant(idx, 'name', e.target.value)}
                    readOnly={lookupStatus[idx] === 'verified'}
                    placeholder="Full Name"
                  />
                </div>
                <div className="participant-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={p.email}
                    onChange={e => updateParticipant(idx, 'email', e.target.value)}
                    readOnly={lookupStatus[idx] === 'verified'}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="participant-field">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={p.phone}
                    onChange={e => updateParticipant(idx, 'phone', e.target.value)}
                    readOnly={lookupStatus[idx] === 'verified'}
                    placeholder="9876543210"
                  />
                </div>
                <div className="participant-field">
                  <label>College</label>
                  <input
                    type="text"
                    value={p.college}
                    onChange={e => updateParticipant(idx, 'college', e.target.value)}
                    readOnly={lookupStatus[idx] === 'verified'}
                    placeholder="Institution"
                  />
                </div>
                <div className="participant-field">
                  <label>Major</label>
                  <input
                    type="text"
                    value={p.major}
                    onChange={e => updateParticipant(idx, 'major', e.target.value)}
                    readOnly={lookupStatus[idx] === 'verified'}
                    placeholder="e.g. CSE, ME"
                  />
                </div>
                <div className="participant-field">
                  <label>Age</label>
                  <input
                    type="number"
                    value={p.age || ''}
                    onChange={e => updateParticipant(idx, 'age', e.target.value)}
                    readOnly={lookupStatus[idx] === 'verified'}
                    placeholder="18"
                  />
                </div>
                <div className="participant-field">
                  <label>Sex</label>
                  <select
                    value={p.sex}
                    onChange={e => updateParticipant(idx, 'sex', e.target.value)}
                    disabled={lookupStatus[idx] === 'verified'}
                  >
                    <option value="">— Select —</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                {selectedSubEvent?.title.toLowerCase().includes('free fire') && (
                  <>
                    <div className="participant-field">
                      <label>In-game Name</label>
                      <input
                        type="text"
                        value={p.igName}
                        onChange={e => updateParticipant(idx, 'igName', e.target.value)}
                        placeholder="e.g. ProPlayer_X"
                      />
                    </div>
                    <div className="participant-field">
                      <label>Free Fire UID</label>
                      <input
                        type="text"
                        value={p.gameUid}
                        onChange={e => updateParticipant(idx, 'gameUid', e.target.value)}
                        placeholder="e.g. 1234567890"
                      />
                    </div>
                  </>
                )}
              </div>

            </div>
          ))}

          <div className="manual-nav-btns">
            <button className="manual-btn manual-btn-back" onClick={() => setStep(1)}>
              <ArrowLeft size={16} /> Back
            </button>
            <button
              className="manual-btn manual-btn-next"
              disabled={!canProceedStep2()}
              onClick={() => setStep(3)}
            >
              Next <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════ STEP 3: Payment ═══════ */}
      {step === 3 && (
        <div className="manual-glass-card">
          <h2>Payment Details</h2>
          <p className="step-desc">Select how payment was / will be handled</p>

          {/* Amount display */}
          <div className="payment-amount-display">
            <div>
              <div className="amount-label">Entry Fee</div>
              <div className="amount-value">
                {isSubEvent && selectedSubEvent ? `₹${selectedSubEvent.entryFee}` : isHackathon ? '₹500' : selectedComp?.entryFee ? `₹${selectedComp.entryFee}` : '₹0 (Free)'}
              </div>
            </div>
          </div>

          {/* Payment mode cards */}
          <div className="payment-mode-grid">
            <div
              className={`payment-mode-card ${paymentMode === 'pre_paid' ? 'selected' : ''}`}
              onClick={() => setPaymentMode('pre_paid')}
            >
              <div className="mode-icon"><ImageIcon size={22} /></div>
              <div className="mode-label">Already Paid</div>
              <div className="mode-desc">User has already paid. Upload payment screenshot as proof.</div>
            </div>
            <div
              className={`payment-mode-card ${paymentMode === 'cash' ? 'selected' : ''}`}
              onClick={() => setPaymentMode('cash')}
            >
              <div className="mode-icon"><Banknote size={22} /></div>
              <div className="mode-label">Cash</div>
              <div className="mode-desc">On-the-spot cash payment. No gateway needed.</div>
            </div>
            <div
              className={`payment-mode-card ${paymentMode === 'online' ? 'selected' : ''}`}
              onClick={() => setPaymentMode('online')}
            >
              <div className="mode-icon"><CreditCard size={22} /></div>
              <div className="mode-label">Pay Now — Online</div>
              <div className="mode-desc">Coming soon. Use "Already Paid" with screenshot for now.</div>
            </div>
          </div>

          {/* File upload zone (for pre_paid) */}
          {paymentMode === 'pre_paid' && (
            <>
              <div
                className={`file-upload-zone ${paymentFile ? 'has-file' : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error('File too large. Max 5MB.');
                        return;
                      }
                      setPaymentFile(file);
                    }
                  }}
                />
                {paymentFile ? (
                  <>
                    <Upload size={28} className="upload-icon" style={{ color: '#34d399' }} />
                    <p className="file-name">{paymentFile.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                      Click to change
                    </p>
                  </>
                ) : (
                  <>
                    <Upload size={28} className="upload-icon" />
                    <p>Click to upload <strong>payment screenshot</strong></p>
                    <p style={{ fontSize: '0.72rem', marginTop: '4px' }}>PNG, JPG, WebP — Max 5MB</p>
                  </>
                )}
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="upload-progress-bar">
                  <div className="fill" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
            </>
          )}

          {error && (
            <div className="manual-error-banner">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <div className="manual-nav-btns">
            <button className="manual-btn manual-btn-back" onClick={() => setStep(2)}>
              <ArrowLeft size={16} /> Back
            </button>
            <button
              className="manual-btn manual-btn-submit"
              disabled={!canSubmit() || submitting || paymentMode === 'online'}
              onClick={handleSubmit}
            >
              {submitting ? (
                <><Loader2 size={16} className="manual-spinner" /> Registering...</>
              ) : (
                <><CheckCircle2 size={16} /> Create Registration</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ═══════ STEP 4: Confirmation ═══════ */}
      {step === 4 && (
        <div className="manual-glass-card manual-confirm-card">
          <div className="confirm-icon">
            <CheckCircle2 size={36} />
          </div>
          <h2>Registration Complete!</h2>
          <p className="confirm-subtitle">Manual entry has been recorded in the system</p>

          <div className="confirm-detail-grid">
            <div>
              <div className="detail-label">Competition</div>
              <div className="detail-value">{selectedComp?.title}</div>
            </div>
            <div>
              <div className="detail-label">Leader</div>
              <div className="detail-value">{participants[0]?.name || participants[0]?.avrId}</div>
            </div>
            {resultTeamId && (
              <div>
                <div className="detail-label">Team ID</div>
                <div className="detail-value" style={{ color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace' }}>{resultTeamId}</div>
              </div>
            )}
            <div>
              <div className="detail-label">Registration ID</div>
              <div className="detail-value" style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace' }}>{resultId}</div>
            </div>
            <div>
              <div className="detail-label">Payment</div>
              <div className="detail-value" style={{ textTransform: 'capitalize' }}>
                {paymentMode === 'pre_paid' ? 'Already Paid (Proof uploaded)' : paymentMode === 'cash' ? 'Cash' : 'Online'}
              </div>
            </div>
            <div>
              <div className="detail-label">Amount</div>
              <div className="detail-value">
                {isHackathon ? '₹500' : (selectedSubEvent ? `₹${selectedSubEvent.entryFee}` : selectedComp?.entryFee ? `₹${selectedComp.entryFee}` : 'Free')}
              </div>
            </div>
            {participants[0]?.igName && (
              <div>
                <div className="detail-label">In-game Name</div>
                <div className="detail-value">{participants[0].igName}</div>
              </div>
            )}
            {participants[0]?.gameUid && (
              <div>
                <div className="detail-label">Game UID</div>
                <div className="detail-value">{participants[0].gameUid}</div>
              </div>
            )}
          </div>

          <button className="manual-btn manual-btn-another" onClick={handleReset}>
            <RotateCcw size={16} /> Register Another
          </button>
        </div>
      )}
    </div>
  );
};

export default ManualRegistration;
