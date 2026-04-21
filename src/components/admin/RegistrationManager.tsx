import React, { useState, useEffect, useMemo } from 'react';
import {
  collection, query, onSnapshot, orderBy, doc, updateDoc, deleteDoc,
  setDoc, serverTimestamp, runTransaction
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useToast } from '../../components/toast/Toast';
import GlassSelect from '../../components/dropdown/GlassSelect';
import * as XLSX from 'xlsx';

import {
  Search, Download, Edit2, Trash2, X, Eye,
  ChevronUp, ChevronDown, Users,
  Copy, Calendar, CreditCard, RotateCcw,
  UserCheck, UserX, User, Mail, Phone,
  ShieldCheck, XCircle, Clock
} from 'lucide-react';



import './RegistrationManager.css';

/* ─── Types ─── */
interface Registration {
  id: string;

  // Identification
  leaderAvrId: string;
  userId: string;
  
  // Competition Info
  competitionId: string;
  eventName: string;
  competitionCode: string;
  category: string;
  department: string;
  isFlagship: boolean;

  registrationType: "SOLO" | "TEAM";
  
  // Team Info
  teamId: string;
  teamName?: string;
  teamSize: number;

  squad: {
    avrId: string;
    name: string;
    email: string;
    phone: string;
    college: string;
    major: string;
    age: number;
    sex: string;
  }[];

  allAvrIds: string[];

  // Payment Info
  paymentRequired: boolean;
  paymentStatus: "paid" | "free" | "pending" | "success";
  amountPaid: number;
  transactionId?: string;
  paymentMode?: string;

  // Status & Attendance
  status: "confirmed" | "payment_pending";
  registeredAt: any;
  isAttended: boolean;
  checkInTime?: any;

  metadata: {
    createdAt: any;
  };

  // UI Mapping (kept for backward compatibility with existing components)
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  userCollege?: string;
  userMajor?: string;
  userAge?: number;
  userSex?: string;
  avrId?: string;
  competitionHandle?: string;
  memberCount?: number;
  members?: any[];
  moonAddon?: boolean;

  // Admin Internal
  _collection: string;
  _isPending?: boolean;
  pendingTxnId?: string;
  pendingType?: string;
  pendingFormData?: any;
}



interface RegistrationManagerProps {
  forcedHandle?: string | string[];
  eventTitleFilter?: string | string[]; // Filter by specific event title (e.g. 'BGMI')
  title?: string;
  subtitle?: string;
  isSuper?: boolean;
  collectionScope?: 'registrations' | 'hackathon' | 'both';
}

/* ─── Component ─── */
const RegistrationManager: React.FC<RegistrationManagerProps> = ({ forcedHandle, eventTitleFilter, title, subtitle, isSuper, collectionScope = 'both' }) => {
  const toast = useToast();

  // Data
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEvent, setFilterEvent] = useState('All');
  const [filterDept, setFilterDept] = useState('All');
  const [filterCollege, setFilterCollege] = useState('All');
  const [filterPayment, setFilterPayment] = useState('All');
  const [filterAttendance, setFilterAttendance] = useState('All');

  // Sort
  const [sortConfig, setSortConfig] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'registeredAt', dir: 'desc' });

  // UI State
  const [detailReg, setDetailReg] = useState<Registration | null>(null);
  const [editReg, setEditReg] = useState<Registration | null>(null);
  const [saving, setSaving] = useState(false);

  /* ────────────────── Fetch (Realtime) ────────────────── */
  useEffect(() => {
    setLoading(true);

    let regsDocs: any[] = [];
    let hackDocs: any[] = [];
    let pendingDocs: any[] = [];

    let regsReady = false;
    let hackReady = false;
    let pendingReady = false;

    const shouldFetchRegs = collectionScope === 'both' || collectionScope === 'registrations';
    const shouldFetchHack = collectionScope === 'both' || collectionScope === 'hackathon';

    if (!shouldFetchRegs) regsReady = true;
    if (!shouldFetchHack) hackReady = true;

    const processData = () => {
      if (!regsReady || !hackReady || !pendingReady) return;
      try {
        const regSnap = { docs: regsDocs };
        const hackSnap = { docs: hackDocs };
        const pendingSnap = { docs: pendingDocs };

        const standardRegs = regSnap.docs.map(d => {
          const data = d.data();
          
          // Normalize: fallback logic to handle both legacy and new standardized schema
          const normalized = {
            id: d.id,
            ...data,
            // Header display fields
            userName: data.userName || (data.squad && data.squad[0]?.name) || data.leaderName || '—',
            userEmail: data.userEmail || (data.squad && data.squad[0]?.email) || data.leaderEmail || '—',
            avrId: data.avrId || data.leaderAvrId || (data.squad && data.squad[0]?.avrId) || data.userAVR || '—',
            userPhone: data.userPhone || (data.squad && data.squad[0]?.phone) || data.leaderPhone || '',
            userCollege: data.userCollege || (data.squad && data.squad[0]?.college) || data.leaderCollege || '',
            userMajor: data.userMajor || (data.squad && data.squad[0]?.major) || '',
            userAge: data.userAge || (data.squad && data.squad[0]?.age) || 0,
            userSex: data.userSex || (data.squad && data.squad[0]?.sex) || '',
            
            eventName: data.eventName || data.eventTitle || '—',
            department: data.department || data.competitionHandle || '',
            category: data.category || data.competitionHandle || '',
            teamName: data.teamName || '',
            teamSize: data.teamSize || data.memberCount || (data.squad ? data.squad.length : 1),
            // Default to 'ParamX-Hack' if missing but eventName indicates a Param-X hackathon
            competitionHandle: data.competitionHandle || ((data.eventName || data.eventTitle || '').includes('Param-X') ? 'ParamX-Hack' : ''),
            registeredAt: data.registeredAt || data.createdAt || data.timestamp || data.metadata?.createdAt,
            paymentStatus: (data.paymentStatus || 'free').toLowerCase(), // normalize to lowercase
            _collection: 'registrations',
          } as Registration;

          // If squad exists (new schema), use it. Otherwise, build members from legacy fields.
          if (!normalized.squad && !normalized.members) {
            const memberKeys = ['member2', 'member3', 'member4', 'member5'];
            const members = [
              { name: normalized.userName, email: normalized.userEmail, phone: normalized.userPhone, college: normalized.userCollege },
              ...memberKeys
                .filter(k => data[`${k}Name`] || data[`${k}AvrId`])
                .map(k => ({
                  name: data[`${k}Name`] || '—',
                  email: data[`${k}Email`] || '',
                  phone: data[`${k}Phone`] || '',
                  college: data[`${k}College`] || '',
                }))
            ];
            if (members.length > 1) {
              normalized.members = members;
              normalized.memberCount = members.length;
            }
          } else if (normalized.squad) {
            normalized.memberCount = normalized.squad.length;
          }

          return normalized;
        });


        const hackathonRegs = hackSnap.docs.map(d => {
          const data = d.data();
          
          const normalized = {
            id: d.id,
            ...data,
            avrId: data.leaderAvrId || data.avrId || (data.squad && data.squad[0]?.avrId) || '—',
            userName: data.leaderName || data.userName || (data.squad && data.squad[0]?.name) || '—',
            userEmail: data.leaderEmail || data.userEmail || (data.squad && data.squad[0]?.email) || '—',
            userPhone: data.leaderPhone || data.userPhone || (data.squad && data.squad[0]?.phone) || '',
            userCollege: data.leaderCollege || data.userCollege || (data.squad && data.squad[0]?.college) || '',
            userMajor: data.userMajor || (data.squad && data.squad[0]?.major) || '',
            userAge: data.userAge || (data.squad && data.squad[0]?.age) || 0,
            userSex: data.userSex || (data.squad && data.squad[0]?.sex) || '',
            
            eventName: data.psId ? `Param-X '26 (PS: ${data.psId})` : "Param-X '26",
            department: data.userMajor || data.department || "Hackathon",
            registeredAt: data.createdAt || data.timestamp || (data.metadata?.createdAt),
            paymentStatus: data.status === 'confirmed' ? 'paid' : 'pending',
            amountPaid: data.amountPaid || data.amount || 0,
            transactionId: data.transactionId || data.paymentId || null,
            status: data.status || 'pending',
            isAttended: data.isAttended || false,
            teamName: data.teamName,
            teamSize: data.teamSize || (data.squad ? data.squad.length : [data.member2Name, data.member3Name, data.member4Name].filter(Boolean).length + 1),
            // Hackathon records often miss competitionHandle; default it for the Param-X admin view
            competitionHandle: data.competitionHandle || 'ParamX-Hack',
            _collection: 'hackathon_registrations'
          } as Registration;

          if (!normalized.squad) {
            normalized.members = [
              { name: data.leaderName, email: data.leaderEmail, phone: data.leaderPhone, college: data.leaderCollege },
              data.member2Name ? { name: data.member2Name, email: data.member2Email, phone: data.member2Phone, college: data.member2College } : null,
              data.member3Name ? { name: data.member3Name, email: data.member3Email, phone: data.member3Phone, college: data.member3College } : null,
              data.member4Name ? { name: data.member4Name, email: data.member4Email, phone: data.member4Phone, college: data.member4College } : null,
            ].filter(Boolean) as any;
          }

          return normalized;
        });


        // Map pending registrations (payment_pending only — skip confirmed/failed)
        const pendingRegs = pendingSnap.docs
          .filter(d => d.data().status === 'payment_pending')
          .map(d => {
            const data = d.data();
            return {
              id: d.id,
              userName: data.userName || '—',
              userEmail: data.userEmail || '—',
              avrId: data.userAVR || data.formData?.leaderAvrId || '—',
              userPhone: data.userPhone || '',
              userCollege: '',
              userMajor: '',
              userAge: 0,
              userSex: '',
              userId: data.userId || '',
              eventName: data.eventName || '—',
              competitionId: data.competitionId || '',
              category: 'Pending Payment',
              department: data.type === 'hackathon' ? 'Hackathon' : 'Competition',
              registeredAt: data.createdAt,
              isAttended: false,
              paymentStatus: 'pending',
              amountPaid: data.amount || 0,
              transactionId: data.txnId || null,
              status: 'payment_pending',
              teamName: data.teamName || data.formData?.teamName || '',
              competitionHandle: data.competitionHandle || (data.type === 'hackathon' ? 'ParamX-Hack' : ''),
              _collection: 'pending_registrations' as const,
              _isPending: true,
              pendingTxnId: data.txnId,
              pendingType: data.type,
              pendingFormData: data.formData,
              allAvrIds: data.allAvrIds || [],
            } as Registration;
          });

        const confirmedRegs = [...standardRegs, ...hackathonRegs];

        // Deduplicate Pending Registrations
        const pendingMap = new Map<string, Registration>();

        pendingRegs.forEach(reg => {
          // Check if this pending registration has already been paid/confirmed
          const isConfirmed = confirmedRegs.some(cr => {
            const matchesUser = (cr.userId && cr.userId === reg.userId) || 
                                (cr.avrId && reg.avrId && cr.avrId === reg.avrId && reg.avrId !== '—') ||
                                (cr.userName && reg.userName && cr.userName === reg.userName && reg.userName !== '—');
            const matchesEvent = (cr.competitionId && reg.competitionId && cr.competitionId === reg.competitionId) ||
                                 (cr.competitionHandle && reg.competitionHandle && cr.competitionHandle === reg.competitionHandle) ||
                                 (cr.eventName === reg.eventName);
            
            return matchesUser && matchesEvent;
          });

          if (!isConfirmed) {
            const deductionKey = `${reg.userId || reg.avrId || reg.userName}_${reg.competitionId || reg.competitionHandle || reg.eventName}`;
            const existing = pendingMap.get(deductionKey);
            
            const getTimestamp = (val: any) => {
              if (val?.toDate) return val.toDate().getTime();
              if (val?._seconds) return val._seconds * 1000;
              if (typeof val === 'number') return val;
              return 0;
            };

            const newDate = getTimestamp(reg.registeredAt);

            if (!existing) {
              pendingMap.set(deductionKey, reg);
            } else {
              const existingDate = getTimestamp(existing.registeredAt);
              if (newDate > existingDate) {
                pendingMap.set(deductionKey, reg);
              }
            }
          }
        });

        setRegistrations([...confirmedRegs, ...Array.from(pendingMap.values())]);
      } catch (err) {
        console.error(err);
        toast.error('Failed to parse registrations.');
      } finally {
        setLoading(false);
      }
    };

    const regsQuery = query(collection(db, 'registrations'), orderBy('registeredAt', 'desc'));
    const hackQuery = query(collection(db, 'hackathon_registrations'), orderBy('createdAt', 'desc'));
    const pendingQuery = query(collection(db, 'pending_registrations'), orderBy('createdAt', 'desc'));

    const unsubs: (() => void)[] = [];

    if (shouldFetchRegs) {
      unsubs.push(onSnapshot(regsQuery, (snap) => {
        regsDocs = snap.docs; regsReady = true; processData();
      }, (e) => { console.error('Regs fetch error:', e); regsReady = true; processData(); }));
    }
    if (shouldFetchHack) {
      unsubs.push(onSnapshot(hackQuery, (snap) => {
        hackDocs = snap.docs; hackReady = true; processData();
      }, (e) => { console.error('Hack fetch error:', e); hackReady = true; processData(); }));
    }
    unsubs.push(onSnapshot(pendingQuery, (snap) => {
      pendingDocs = snap.docs; pendingReady = true; processData();
    }, (e) => { console.error('Pending fetch error:', e); pendingReady = true; processData(); }));

    return () => unsubs.forEach(u => u());
  }, [collectionScope, toast]);

  /* ────────────────── Derived Data ────────────────── */
  const uniqueEvents = useMemo(() => ['All', ...new Set(registrations.map(r => r.eventName).filter(Boolean))], [registrations]);
  const uniqueDepts = useMemo(() => ['All', ...new Set(registrations.map(r => r.department).filter(Boolean))], [registrations]);
  const uniqueColleges = useMemo(() => ['All', ...new Set(registrations.map(r => r.userCollege || '').filter(Boolean))], [registrations]);

  const filtered = useMemo(() => {
    let result = [...registrations];

    // ── Handle-based filtering (now client-side with multi-signal matching) ──
    // Maps forcedHandle → all possible identifiers that a registration could have
    const HANDLE_SIGNALS: Record<string, { ids: string[]; depts: string[]; cats: string[]; titles: string[] }> = {
      'Battle-Grid':    { ids: ['battlegrid_', 'CMP-26-BTG', 'CMP-26-FLG-BG'], depts: ['Battle Grid'], cats: ['BTG'], titles: ['battlegrid'] },
      'Robo-Kshetra':   { ids: ['robokshetra_', 'CMP-26-FLG-ROBO', 'CMP-26-FLG-ALX', 'CMP-26-FLG-RBM', 'CMP-26-FLG-RBR'], depts: ['Robo-Kshetra', 'Flagship'], cats: ['FLG'], titles: ['robo', 'alignx'] },
      'ParamX-Hack':    { ids: ['CMP-26-FLG-PRX'], depts: ['Flagship'], cats: ['FLG'], titles: ['paramx'] },

      // Department-specific handles — each maps to exactly one competition
      'Forge-Lead':     { ids: ['CMP-26-CS-FGX', 'CMP-26-CE-FGX', 'CMP-26-GEN-FGX'], depts: ['Computer Engineering', 'Forge-X'], cats: ['DEP', 'GEN'], titles: ['forgex', 'forge'] },
      'Algo-Master':    { ids: ['CMP-26-CS-ALB', 'CMP-26-CE-ALB', 'CMP-26-GEN-ALB'], depts: ['Computer Engineering', 'AlgoBid'], cats: ['DEP', 'GEN'], titles: ['algobid', 'algo'] },
      'Code-Climber':   { ids: ['CMP-26-IT-CDL', 'CMP-26-GEN-CDL'], depts: ['Information Technology', 'Code Ladder'], cats: ['DEP', 'GEN'], titles: ['codeladder'] },
      'IPL-Auctioneer': { ids: ['CMP-26-AD-IPL', 'CMP-26-ADS-IPL', 'CMP-26-GEN-IPL'], depts: ['AI&DS', 'IPL Auction'], cats: ['DEP', 'GEN'], titles: ['iplau', 'ipl'] },
      'Blind-Coder':    { ids: ['CMP-26-EC-BCC', 'CMP-26-ECE-BLC', 'CMP-26-GEN-BLC'], depts: ['ECE', 'Blind Code', 'Electronics'], cats: ['DEP', 'GEN'], titles: ['blindcode', 'blind'] },
      'Dev-Striker':    { ids: ['CMP-26-AM-DVC', 'CMP-26-AIML-DVC', 'CMP-26-GEN-DVC'], depts: ['AI&ML', 'DevClash'], cats: ['DEP', 'GEN'], titles: ['devclash', 'dev'] },
      'Vibe-Lead':      { ids: ['CMP-26-AM-VSP', 'CMP-26-AIML-VBS', 'CMP-26-GEN-VBS'], depts: ['AI&ML', 'Vibe Sprint'], cats: ['DEP', 'GEN'], titles: ['vibesprint', 'vibe'] },
      'Relay-Coder':    { ids: ['CMP-26-AM-CRR', 'CMP-26-AIML-CRL', 'CMP-26-GEN-CRL'], depts: ['AI&ML', 'Code Run', 'Code Relay'], cats: ['DEP', 'GEN'], titles: ['coderun', 'relay'] },
      'Arch-Nova':      { ids: ['CMP-26-CE-BRN', 'CMP-26-CIVIL-BNV', 'CMP-26-GEN-BNV'], depts: ['Civil Engineering', 'Bridge Nova'], cats: ['DEP', 'GEN'], titles: ['bridgenova', 'bridge'] },
      'Paper-Lead':     { ids: ['CMP-26-EE-PPT', 'CMP-26-EE-PST', 'CMP-26-DEP-PST'], depts: ['Electrical', 'Electrical Engineering', 'Poster'], cats: ['DEP'], titles: ['poster'] },
      'Spark-Lead':     { ids: ['CMP-26-EE-SPT', 'CMP-26-EE-SPK', 'CMP-26-DEP-SPK'], depts: ['Electrical', 'Electrical Engineering', 'Spark Tank'], cats: ['DEP'], titles: ['sparktank', 'spark'] },
      'Mat-Master':     { ids: ['CMP-26-EC-MTM', 'CMP-26-ETC-MTL', 'CMP-26-DEP-MTL'], depts: ['E&TC', 'E&TC Engineering', 'Matlab'], cats: ['DEP'], titles: ['matlab'] },
      'Circuit-Ninja':  { ids: ['CMP-26-EC-CTS', 'CMP-26-ETC-CKT', 'CMP-26-DEP-CKT'], depts: ['E&TC', 'E&TC Engineering', 'Circuit'], cats: ['DEP'], titles: ['circuit'] },
      'Master-Builder': { ids: ['CMP-26-ME-CTC', 'CMP-26-ME-CNT', 'CMP-26-DEP-CNT'], depts: ['Mechanical', 'Mechanical Engineering', 'Contraptions'], cats: ['DEP'], titles: ['contraption'] },
      'Cricket-Lead':   { ids: ['CMP-26-EC-CCK', 'CMP-26-ECE-CCK', 'CMP-26-DEP-CCK'], depts: ['ECE', 'Circle Cricket', 'Electronics'], cats: ['DEP'], titles: ['cricket'] },
      'Research-Lead':  { ids: ['CMP-26-GEN-PPR'], depts: ['Paper Presentation'], cats: ['DEP'], titles: ['paperpres', 'paper'] },
      'Project-Master': { ids: ['CMP-26-GEN-PRJ'], depts: ['Project Competition'], cats: ['DEP'], titles: ['project'] },

      // Workshop & Addons
      'OrbitX-Solar':   { ids: ['orbitx_solar'], depts: ['OrbitX Club'], cats: ['OrbitX Club Event'], titles: ['solarspot', 'orbitxsolar'] },
    };

    if (forcedHandle) {
      const targetHandles = Array.isArray(forcedHandle) ? forcedHandle : [forcedHandle];
      result = result.filter(r => {
        return targetHandles.some(handle => {
          const signals = HANDLE_SIGNALS[handle];
          // Primary: exact handle match
          if (r.competitionHandle === handle) return true;
          // Fallback 1: competitionId starts with any known prefix
          if (signals && r.competitionId) {
            if (signals.ids.some(prefix => r.competitionId.startsWith(prefix))) return true;
          }
          // Fallback 2: eventName semantic mapping
          if (signals && r.eventName) {
            const evtNorm = r.eventName.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (signals.titles.some(t => evtNorm.includes(t))) return true;
          }
          // Fallback 3: department match ONLY IF eventName doesn't explicitly belong to another event
          if (signals && r.department) {
            const rDeptNorm = r.department.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (signals.depts.some(d => d.toLowerCase().replace(/[^a-z0-9]/g, '') === rDeptNorm)) {
              if (r.eventName) {
                const evtNorm = r.eventName.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (signals.titles.some(t => evtNorm.includes(t))) return true;
                // If it's flagship, umbrella check
                if (r.department === 'Flagship') {
                  if (handle === 'ParamX-Hack' && evtNorm.includes('paramx')) return true;
                  if (handle === 'Robo-Kshetra' && evtNorm.includes('robo')) return true;
                  if (handle === 'Battle-Grid' && evtNorm.includes('battle')) return true;
                }
                return false; // Dept matched, but eventName didn't align. Prevent bleed-over.
              }
              return true; // No eventName to check, just assume true based on dept (legacy)
            }
          }
          return false;
        });
      });
    }

    // ── Sub-event filtering (e.g. BGMI within Battle-Grid) ── case-insensitive
    if (eventTitleFilter) {
      const titles = Array.isArray(eventTitleFilter) ? eventTitleFilter : [eventTitleFilter];
      const normalizedTitles = titles.map(t => t.toLowerCase().replace(/[^a-z0-9]/g, ''));
      const UMBRELLA_HANDLES = ['Battle-Grid', 'Robo-Kshetra'];
      
      result = result.filter(r => {
        // If the registration is NOT under a known umbrella handle, it implicitly belongs to the core handle rules
        if (r.competitionHandle && !UMBRELLA_HANDLES.includes(r.competitionHandle)) {
          return true;
        }
        
        const evt = ((r.eventName || (r as any).eventTitle || '')).toLowerCase().replace(/[^a-z0-9]/g, '');
        return normalizedTitles.some(t => evt.includes(t));
      });
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r =>
        r.userName?.toLowerCase().includes(term) ||
        r.userEmail?.toLowerCase().includes(term) ||
        r.avrId?.toLowerCase().includes(term) ||
        r.transactionId?.toLowerCase().includes(term)
      );
    }
    if (filterEvent !== 'All') result = result.filter(r => r.eventName === filterEvent);
    if (filterDept !== 'All') result = result.filter(r => r.department === filterDept);
    if (filterCollege !== 'All') result = result.filter(r => r.userCollege === filterCollege);
    if (filterPayment !== 'All') {
      const p = filterPayment.toLowerCase();
      result = result.filter(r => {
        const rp = (r.paymentStatus || '').toLowerCase();
        if (p === 'paid') return rp === 'paid' || rp === 'success';
        return rp === p;
      });
    }
    if (filterAttendance !== 'All') result = result.filter(r => filterAttendance === 'Attended' ? r.isAttended : !r.isAttended);

    // Sort
    result.sort((a: any, b: any) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'registeredAt') {
        aVal = aVal?.toDate ? aVal.toDate().getTime() : (aVal || 0);
        bVal = bVal?.toDate ? bVal.toDate().getTime() : (bVal || 0);
      }
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortConfig.dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.dir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [registrations, searchTerm, filterEvent, filterDept, filterCollege, filterPayment, filterAttendance, sortConfig]);



  /* ────────────────── Handlers ────────────────── */
  const toggleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleToggleAttendance = async (reg: Registration) => {
    const newVal = !reg.isAttended;
    try {
      await updateDoc(doc(db, reg._collection, reg.id), { isAttended: newVal });
      setRegistrations(prev => prev.map(r => r.id === reg.id ? { ...r, isAttended: newVal } : r));
    } catch (err) {
      console.error(err);
      toast.error('Failed to update attendance.');
    }
  };

  const handleDelete = async (reg: Registration) => {
    if (!window.confirm('Permanently delete this registration? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, reg._collection, reg.id));
      setRegistrations(prev => prev.filter(r => r.id !== reg.id));
      toast.success('Registration deleted.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete registration.');
    }
  };

  /* ── Approve Pending Registration ── */
  const handleApprovePending = async (reg: Registration) => {
    if (!reg._isPending || !reg.pendingFormData) return;
    if (!window.confirm(`Verify & Approve this pending ${reg.pendingType} registration for ${reg.userName}?\n\nThis will create the official registration record.`)) return;

    setSaving(true);
    try {
      if (reg.pendingType === 'hackathon') {
        // Create hackathon registration from pending formData
        const formData = reg.pendingFormData;
        
        // Generate Team ID via counter transaction
        let generatedTeamId = '';
        await runTransaction(db, async (transaction) => {
          const teamCounterRef = doc(db, 'counters', 'hackathon_team_counter');
          const teamCounterDoc = await transaction.get(teamCounterRef);
          let nextTeamCount = 1;
          if (teamCounterDoc.exists()) {
            nextTeamCount = (teamCounterDoc.data().count || 0) + 1;
          }
          transaction.update(teamCounterRef, { count: nextTeamCount });
          generatedTeamId = `AVR-PRM-${nextTeamCount.toString().padStart(4, '0')}`;

          // Update PS metadata count
          const psMetadataRef = doc(db, 'ps_metadata', formData.psId);
          const psMetadataDoc = await transaction.get(psMetadataRef);
          let currentCount = 0;
          if (psMetadataDoc.exists()) currentCount = psMetadataDoc.data().count || 0;
          transaction.set(psMetadataRef, { count: currentCount + 1 }, { merge: true });

          // Create the actual registration
          const registrationRef = doc(collection(db, 'hackathon_registrations'));
          transaction.set(registrationRef, {
            ...formData,
            teamId: generatedTeamId,
            status: 'confirmed',
            paymentId: reg.transactionId || reg.pendingTxnId,
            easepayId: null,
            bankRefNum: null,
            paymentMode: null,
            amountPaid: reg.amountPaid || 500,
            allEmails: [
              formData.leaderEmail?.toLowerCase(),
              formData.member2Email?.toLowerCase(),
              formData.member3Email?.toLowerCase(),
              formData.member4Email?.toLowerCase()
            ].filter(Boolean),
            allAvrIds: [
              formData.leaderAvrId,
              formData.member2AvrId,
              formData.member3AvrId,
              formData.member4AvrId
            ].filter(Boolean),
            createdAt: serverTimestamp(),
            uid: reg.userId,
            _approvedByAdmin: true,
            _approvedAt: new Date().toISOString()
          });
        });

        toast.success(`Hackathon registration approved! Team ID: ${generatedTeamId}`);
      } else {
        // Create standard competition registration from pending data
        const regId = `${reg.competitionId}_${reg.avrId || reg.userId}`;
        const regRef = doc(db, 'registrations', regId);

        const formData = reg.pendingFormData;
        await setDoc(regRef, {
          userId: reg.userId,
          userName: reg.userName,
          userEmail: reg.userEmail,
          userAVR: reg.avrId,
          allAvrIds: reg.allAvrIds || [],
          userPhone: reg.userPhone,
          userCollege: reg.userCollege || '',
          teamName: formData?.teamName || null,
          squad: formData?.squad || [],
          competitionId: reg.competitionId,
          eventName: reg.eventName,
          competitionHandle: reg.competitionHandle || '',
          category: 'Manually Verified',
          department: reg.department || '',
          paymentStatus: 'paid',
          amountPaid: reg.amountPaid || 0,
          moonObservation: formData?.moonObservation || false,
          transactionId: reg.transactionId || reg.pendingTxnId,
          status: 'confirmed',
          registeredAt: serverTimestamp(),
          isAttended: false,
          _approvedByAdmin: true,
          _approvedAt: new Date().toISOString()
        });

        toast.success(`Competition registration approved for ${reg.userName}!`);
      }

      // Update pending doc status
      await updateDoc(doc(db, 'pending_registrations', reg.id), {
        status: 'manually_verified',
        resolvedAt: serverTimestamp(),
        adminNote: 'Approved via Admin Dashboard'
      });

      // Remove from local state
      setRegistrations(prev => prev.filter(r => r.id !== reg.id));
    } catch (err) {
      console.error('Approval failed:', err);
      toast.error('Failed to approve registration. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Reject Pending Registration ── */
  const handleRejectPending = async (reg: Registration) => {
    if (!reg._isPending) return;
    const reason = window.prompt('Reason for rejecting this pending registration (optional):');
    if (reason === null) return; // User cancelled the prompt

    try {
      await updateDoc(doc(db, 'pending_registrations', reg.id), {
        status: 'rejected',
        resolvedAt: serverTimestamp(),
        adminNote: reason || 'Rejected via Admin Dashboard'
      });
      setRegistrations(prev => prev.filter(r => r.id !== reg.id));
      toast.success('Pending registration rejected.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to reject pending registration.');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editReg) return;
    setSaving(true);
    try {
      const updateData: Record<string, any> = {};
      if (editReg._collection === 'hackathon_registrations' as any) {
        updateData.leaderName = editReg.userName;
        updateData.leaderEmail = editReg.userEmail;
        updateData.leaderPhone = editReg.userPhone;
        updateData.leaderMajor = editReg.userMajor;
        updateData.leaderAge = editReg.userAge;
        updateData.leaderSex = editReg.userSex;
        updateData.status = editReg.paymentStatus === 'paid' ? 'confirmed' : 'pending';
      } else {
        updateData.userName = editReg.userName;
        updateData.userEmail = editReg.userEmail;
        updateData.userPhone = editReg.userPhone;
        updateData.userMajor = editReg.userMajor;
        updateData.userAge = editReg.userAge;
        updateData.userSex = editReg.userSex;
        updateData.eventName = editReg.eventName;
        updateData.category = editReg.category;
        updateData.department = editReg.department;
        updateData.paymentStatus = editReg.paymentStatus;
      }

      // Keep squad array in sync for new standard registrations
      if (editReg.squad && editReg.squad.length > 0) {
        const newSquad = [...editReg.squad];
        newSquad[0] = {
          ...newSquad[0],
          name: editReg.userName || '',
          email: editReg.userEmail || '',
          phone: editReg.userPhone || '',
          major: editReg.userMajor || '',
          age: editReg.userAge || 0,
          sex: editReg.userSex || ''
        };
        updateData.squad = newSquad;
      }

      await updateDoc(doc(db, editReg._collection, editReg.id), updateData);
      setRegistrations(prev => prev.map(r => r.id === editReg.id ? { ...editReg } : r));
      toast.success('Registration updated.');
      setEditReg(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    if (filtered.length === 0) { toast.error('No data to export.'); return; }
    const data = filtered.map((r, i) => ({
      '#': i + 1,
      'Name': r.userName,
      'Email': r.userEmail,
      'AVR ID': r.avrId,
      'Phone': r.userPhone || 'N/A',
      'College': r.userCollege || 'N/A',
      'Major': r.userMajor || 'N/A',
      'Age': r.userAge || 'N/A',
      'Sex': r.userSex || 'N/A',
      'Event': r.eventName,
      'Category': r.category,
      'Department': r.department || 'General',
      'Payment': r.paymentStatus || 'free',
      'Amount (₹)': r.amountPaid || 0,
      'Transaction ID': r.transactionId || 'N/A',
      'Attended': r.isAttended ? 'Yes' : 'No',
      'Registered At': r.registeredAt?.toDate ? r.registeredAt.toDate().toLocaleString() : 'N/A'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registrations');
    XLSX.writeFile(wb, `Avishkar26_Registrations_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`Exported ${filtered.length} records.`);
  };

  const clearFilters = () => {
    setSearchTerm(''); setFilterEvent('All'); setFilterDept('All');
    setFilterCollege('All'); setFilterPayment('All'); setFilterAttendance('All');
  };

  const hasActiveFilters = searchTerm || filterEvent !== 'All' || filterDept !== 'All' || filterCollege !== 'All' || filterPayment !== 'All' || filterAttendance !== 'All';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  const formatDate = (ts: any) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortConfig.key !== col) return null;
    return sortConfig.dir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />;
  };

  /* ────────────────── Render ────────────────── */
  return (
    <div className="reg-manager">



      {/* ── Header ── */}
      <div className="registration-manager-header">
        <div className="reg-info">
          <h1 className="reg-title">{title || 'Registration Manager'}</h1>
          <p className="reg-subtitle">
            {subtitle || (forcedHandle ? `Managing ${forcedHandle} registrations` : 'Consolidated view of all event registrations')}
            {isSuper && (
              <>
                {' • '}
                {loading ? 'Scanning...' : 
                  filtered.length !== registrations.length 
                  ? <><span className="highlight-count">{filtered.length}</span> of {registrations.length} records</>
                  : <>{registrations.length} total records</>
                }
              </>
            )}
          </p>
        </div>
        <div className="reg-actions">
          <button className="reg-btn-export" onClick={handleExport}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="reg-filter-bar">
        <div className="filter-group-wrap search">
          <span className="filter-label">Search</span>
          <div className="reg-search-wrap">
            <Search size={14} className="reg-search-icon" />
            <input
              type="text"
              placeholder="Name, email, AVR, txn..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="reg-search-input"
            />
          </div>
        </div>

        <div className="filter-group-wrap">
          <span className="filter-label">Event</span>
          <GlassSelect 
            value={filterEvent} 
            onChange={(v: string) => setFilterEvent(v)}
            className="reg-select"
            options={uniqueEvents.map(e => ({ label: e, value: e }))} 
          />
        </div>

        <div className="filter-group-wrap">
          <span className="filter-label">Department</span>
          <GlassSelect 
            value={filterDept} 
            onChange={(v: string) => setFilterDept(v)}
            className="reg-select"
            options={uniqueDepts.map(d => ({ label: d, value: d }))} 
          />
        </div>

        <div className="filter-group-wrap">
          <span className="filter-label">College</span>
          <GlassSelect 
            value={filterCollege} 
            onChange={(v: string) => setFilterCollege(v)}
            className="reg-select"
            options={uniqueColleges.map(c => ({ label: c, value: c }))} 
          />
        </div>

        <div className="filter-group-wrap">
          <span className="filter-label">Payment</span>
          <GlassSelect 
            value={filterPayment} 
            onChange={(v: string) => setFilterPayment(v)}
            className="reg-select"
            options={[
              { label: 'All', value: 'All' }, 
              { label: 'Paid', value: 'Paid' }, 
              { label: 'Pending', value: 'Pending' },
              { label: 'Free', value: 'Free' }
            ]} 
          />
        </div>

        <div className="filter-group-wrap">
          <span className="filter-label">Attendance</span>
          <GlassSelect 
            value={filterAttendance} 
            onChange={(v: string) => setFilterAttendance(v)}
            className="reg-select"
            options={[
              { label: 'All', value: 'All' }, 
              { label: 'Attended', value: 'Attended' }, 
              { label: 'Not Attended', value: 'Not Attended' }
            ]} 
          />
        </div>

        {hasActiveFilters && (
          <div className="filter-group-wrap clear">
            <span className="filter-label">&nbsp;</span>
            <button className="reg-btn-clear" onClick={clearFilters} title="Clear all filters">
              <RotateCcw size={15} />
            </button>
          </div>
        )}
      </div>

      {/* ── Data Table ── */}
      <div className="reg-table-wrap">
        <table className="reg-table">
          <thead>
            <tr>
              <th className="th-num">#</th>
              <th className="th-sort" onClick={() => toggleSort('userName')}>Participant <SortIcon col="userName" /></th>
              <th className="th-sort" onClick={() => toggleSort('userAVR')}>AVR ID <SortIcon col="userAVR" /></th>
              <th className="th-sort" onClick={() => toggleSort('eventName')}>Event <SortIcon col="eventName" /></th>
              <th>Dept</th>
              <th className="th-sort th-right" onClick={() => toggleSort('amountPaid')}>₹ <SortIcon col="amountPaid" /></th>
              <th>Payment</th>
              <th>Attended</th>
              <th className="th-sort" onClick={() => toggleSort('registeredAt')}>Date <SortIcon col="registeredAt" /></th>
              <th className="th-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="reg-empty">Loading registrations...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={10} className="reg-empty">No registrations found.</td></tr>
            ) : (
              filtered.map((reg, i) => (
                <tr 
                  key={reg.id} 
                  className={`reg-row ${reg._isPending ? 'reg-row-pending' : ''}`}
                  onClick={() => setDetailReg(reg)}
                >
                  <td className="td-num">{i + 1}</td>
                  <td className="td-participant">
                    <div className="user-info">
                      <div className="name-row">
                        <span className="user-name">{reg.userName}</span>
                        {reg._isPending && <span className="reg-pending-badge"><Clock size={11} /> Pending Payment</span>}
                        {reg.teamName && !reg._isPending && <span className="reg-team-badge">Team: {reg.teamName}</span>}
                      </div>
                      <span className="user-email">{reg.userEmail}</span>
                    </div>
                  </td>
                  <td className="td-avr">{reg.avrId}</td>
                  <td className="td-event">
                    {reg.eventName?.toUpperCase() === 'ALIGNX' ? 'AlignX' : 
                     reg.eventName?.toUpperCase() === 'ROBORUSH' ? 'RoboRush' : 
                     reg.eventName?.toUpperCase() === 'ROBOMAZE' ? 'RoboMaze' : 
                     reg.eventName}
                  </td>
                  <td className="td-dept">
                    {(reg.competitionHandle === 'Robo-Kshetra' || reg.department === 'Robo-Kshetra' || reg.eventName?.toUpperCase() === 'ALIGNX' || reg.eventName?.toUpperCase() === 'ROBORUSH' || reg.eventName?.toUpperCase() === 'ROBOMAZE') 
                     ? 'Flagship' 
                     : (reg.department || '—')}
                  </td>
                  <td className="td-amount">
                    {reg.amountPaid > 0 ? `₹${reg.amountPaid}` : '—'}
                  </td>
                  <td>
                    <span className={`reg-pill ${reg._isPending ? 'pill-pending' : reg.paymentStatus === 'paid' || reg.paymentStatus === 'success' ? 'pill-paid' : 'pill-free'}`}>
                      {reg._isPending ? 'Pending' : reg.paymentStatus === 'paid' || reg.paymentStatus === 'success' ? 'Paid' : 'Free'}
                    </span>
                  </td>
                  <td>
                    {!reg._isPending ? (
                      <button
                        className={`reg-attendance-toggle ${reg.isAttended ? 'attended' : ''}`}
                        onClick={() => handleToggleAttendance(reg)}
                        title={reg.isAttended ? 'Mark as not attended' : 'Mark as attended'}
                      >
                        {reg.isAttended ? <UserCheck size={14} /> : <UserX size={14} />}
                      </button>
                    ) : (
                      <span className="td-na">—</span>
                    )}
                  </td>
                  <td className="td-date">{formatDate(reg.registeredAt)}</td>
                  <td className="td-actions">
                    {reg._isPending ? (
                      <>
                        <button className="reg-act-btn approve" onClick={(e) => { e.stopPropagation(); handleApprovePending(reg); }} title="Verify & Approve">
                          <ShieldCheck size={14} />
                        </button>
                        <button className="reg-act-btn reject" onClick={(e) => { e.stopPropagation(); handleRejectPending(reg); }} title="Reject">
                          <XCircle size={14} />
                        </button>
                        <button className="reg-act-btn view" onClick={() => setDetailReg(reg)} title="View Details">
                          <Eye size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="reg-act-btn view" onClick={() => setDetailReg(reg)} title="View Details">
                          <Eye size={14} />
                        </button>
                        <button className="reg-act-btn edit" onClick={() => setEditReg({ ...reg })} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button className="reg-act-btn delete" onClick={() => handleDelete(reg)} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Detail Drawer ── */}
      {detailReg && (
        <div className="detail-modal-overlay" onClick={() => setDetailReg(null)}>
          <div className="detail-modal" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Registration Details</h3>
              <button className="drawer-close" onClick={() => setDetailReg(null)}><X size={20} /></button>
            </div>

            <div className="modal-content">
              <div className="modal-section">
                <div className="modal-section-title"><User size={15} /> Participant Info</div>
                <div className="modal-grid">
                  <DetailRow label="Name" value={detailReg.userName || '—'} copyable onCopy={copyToClipboard} />
                  <DetailRow label="AVR ID" value={detailReg.avrId || '—'} copyable onCopy={copyToClipboard} />
                  <DetailRow label="Email" value={detailReg.userEmail || '—'} copyable onCopy={copyToClipboard} />
                  <DetailRow label="Phone" value={detailReg.userPhone || '—'} copyable onCopy={copyToClipboard} />
                  <DetailRow label="College" value={detailReg.userCollege || '—'} />
                  <DetailRow label="Major" value={detailReg.userMajor || '—'} />
                  <DetailRow label="Age" value={String(detailReg.userAge || '—')} />
                  <DetailRow label="Sex" value={detailReg.userSex || '—'} />
                  {detailReg.teamName && <DetailRow label="Team Name" value={detailReg.teamName} />}
                  {(detailReg.teamSize || detailReg.memberCount) && <DetailRow label="Team Size" value={String(detailReg.teamSize || detailReg.memberCount)} />}

                </div>
              </div>

              {(detailReg.squad || detailReg.members) && (detailReg.squad || detailReg.members)!.length > 0 && (
                <div className="modal-section">
                  <div className="modal-section-title"><Users size={15} /> Team Members ({(detailReg.squad || detailReg.members)!.length})</div>
                  <div className="team-members-list">
                    {(detailReg.squad || (detailReg.members as any[]))!.map((member, idx) => (
                      <div key={idx} className="team-member-item">
                        <div className="member-main">
                          <span className="member-name">{member.name}</span>
                          <span className="member-role">{idx === 0 ? 'Leader' : `Member ${idx + 1}`}</span>
                          {member.avrId && <span className="member-avr">{member.avrId}</span>}
                        </div>
                        <div className="member-sub">
                          <span><Mail size={12} /> {member.email}</span>
                          {member.phone && <span><Phone size={12} /> {member.phone}</span>}
                        </div>
                        {member.major && (
                          <div className="member-extra">
                            <span>{member.major}</span>
                            <span>{member.sex} ({member.age})</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}


              <div className="modal-section">
                <div className="modal-section-title"><CreditCard size={15} /> Payment & Event</div>
                <div className="modal-grid">
                  <DetailRow label="Event" value={detailReg.eventName?.toUpperCase() === 'ALIGNX' ? 'AlignX' : 
                                                 detailReg.eventName?.toUpperCase() === 'ROBORUSH' ? 'RoboRush' : 
                                                 detailReg.eventName?.toUpperCase() === 'ROBOMAZE' ? 'RoboMaze' : 
                                                 detailReg.eventName} />
                  <DetailRow label="Category" value={detailReg.category} />
                  <DetailRow label="Status" value={detailReg.paymentStatus || 'free'} />
                  <DetailRow label="Amount" value={detailReg.amountPaid ? `₹${detailReg.amountPaid}` : '₹0'} />
                  {detailReg.moonAddon && <DetailRow label="Add-on" value="Moon Observation" />}
                  <DetailRow label="Transaction ID" value={detailReg.transactionId || 'N/A'} copyable onCopy={copyToClipboard} />
                </div>
              </div>

              <div className="modal-section">
                <div className="modal-section-title"><Calendar size={15} /> Metadata</div>
                <div className="modal-grid">
                  <DetailRow label="Process Status" value={detailReg.status || 'confirmed'} />
                  <DetailRow label="Attended" value={detailReg.isAttended ? 'Yes' : 'No'} />
                  <DetailRow label="Registered At" value={detailReg.registeredAt?.toDate ? detailReg.registeredAt.toDate().toLocaleString() : '—'} />
                  <DetailRow label="Doc ID" value={detailReg.id} copyable onCopy={copyToClipboard} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editReg && (
        <div className="reg-modal-overlay" onClick={() => setEditReg(null)}>
          <div className="reg-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Registration</h3>
              <button className="drawer-close" onClick={() => setEditReg(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="modal-form">
              <div className="modal-field">
                <label>Participant Name</label>
                <input type="text" value={editReg.userName} onChange={e => setEditReg({ ...editReg, userName: e.target.value })} required />
              </div>
              <div className="modal-field">
                <label>Email Address</label>
                <input type="email" value={editReg.userEmail} onChange={e => setEditReg({ ...editReg, userEmail: e.target.value })} required />
              </div>
              <div className="modal-field">
                <label>Phone</label>
                <input type="text" value={editReg.userPhone || ''} onChange={e => setEditReg({ ...editReg, userPhone: e.target.value })} />
              </div>
              <div className="modal-row">
                <div className="modal-field">
                  <label>Major/Branch</label>
                  <input type="text" value={editReg.userMajor || ''} onChange={e => setEditReg({ ...editReg, userMajor: e.target.value })} />
                </div>
                <div className="modal-field">
                  <label>Age</label>
                  <input type="number" value={editReg.userAge || ''} onChange={e => setEditReg({ ...editReg, userAge: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="modal-field">
                  <label>Sex</label>
                  <select value={editReg.userSex || ''} onChange={e => setEditReg({ ...editReg, userSex: e.target.value })}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="modal-row">
                <div className="modal-field">
                  <label>Event Name</label>
                  <input type="text" value={editReg.eventName} onChange={e => setEditReg({ ...editReg, eventName: e.target.value })} required />
                </div>
                <div className="modal-field">
                  <label>Category</label>
                  <input type="text" value={editReg.category} onChange={e => setEditReg({ ...editReg, category: e.target.value })} required />
                </div>
              </div>
              <div className="modal-row">
                <div className="modal-field">
                  <label>Department</label>
                  <input type="text" value={editReg.department || ''} onChange={e => setEditReg({ ...editReg, department: e.target.value })} />
                </div>
                <div className="modal-field">
                  <label>Payment Status</label>
                  <select value={editReg.paymentStatus || 'free'} onChange={e => setEditReg({ ...editReg, paymentStatus: e.target.value as Registration['paymentStatus'] })}>
                    <option value="paid">Paid</option>
                    <option value="free">Free</option>
                  </select>
                </div>
              </div>
              <div className="modal-field">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editReg.isAttended}
                    onChange={e => setEditReg({ ...editReg, isAttended: e.target.checked })}
                  />
                  Mark as Attended
                </label>
              </div>
              <button type="submit" className="modal-submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Detail Row Helper ─── */
const DetailRow: React.FC<{
  label: string;
  value: string;
  copyable?: boolean;
  onCopy?: (text: string) => void;
}> = ({ label, value, copyable, onCopy }) => (
  <div className="detail-row">
    <span className="detail-label">{label}</span>
    <span className="detail-value">
      {value}
      {copyable && value && value !== '—' && value !== 'N/A' && (
        <button className="copy-btn" onClick={() => onCopy?.(value)} title="Copy">
          <Copy size={12} />
        </button>
      )}
    </span>
  </div>
);

export default RegistrationManager;
