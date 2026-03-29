import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { 
  collection, getCountFromServer, query, getDocs, 
  orderBy, doc, getDoc, where, updateDoc, setDoc, deleteDoc
} from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';
import { useToast } from '../../components/toast/Toast';
import AdminSidebar from '../../components/dashboard/sidebar/AdminSidebar';
import RegistrationManager from '../../components/admin/RegistrationManager';
import NotificationBell from '../../components/notifications/NotificationBell';

import { 
  Users, Ticket, Download, Wrench, Shield,
  Trash2, Search, Phone, Mail, School, BookOpen, Fingerprint, RefreshCw, IndianRupee
} from 'lucide-react';
import * as XLSX from 'xlsx';
import GlassSelect from '../../components/dropdown/GlassSelect';
import './admindashboard.css';




interface StallBooking {
  id: string;
  name: string;
  email: string;
  phone: string;
  organization: string;
  stallType: string;
  requirements: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected' | 'contacted';
  createdAt: any;
}

interface ContactQuery {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'resolved' | 'contacted';
  createdAt: any;
}

interface BugReport {
  id: string;
  url: string;
  userAgent: string;
  description: string;
  timestamp: any;
  status: 'open' | 'fixing' | 'resolved';
  userData?: {
    email: string;
    uid: string;
  };
}

// Department options for admin assignment
const DEPARTMENT_OPTIONS = [
  'Computer Engineering', 'Information Technology', 'AI&DS', 'AI&ML', 
  'Civil Engineering', 'Mechanical Engineering', 
  'Robotics and Automation', 'Electrical Engineering', 'E&TC Engineering', 'ECE'
];

// Core team sub-assignments
const CORE_TEAM_OPTIONS = ['Technical Team', 'Registration Team', 'Sponsorship Team', 'Support Team'];

// Flagship competition options for competition admins
const FLAGSHIP_OPTIONS = [
  { value: 'paramx--26', label: "ParamX '26" },
  { value: 'robotron--26', label: "Robo-Kshetra '26" },
  { value: 'battlegrid--26', label: "Battle Grid '26" }
];

const SCANNER_ROLE_OPTIONS = [
  { value: 'gate', label: 'Gate Entry Scanner' },
  { value: 'param-x', label: 'Param-X Scanner' },
  { value: 'battle-grid', label: 'Battle Grid Scanner' },
  { value: 'robo-kshetra', label: 'Robo-Kshetra Scanner' },
  { value: 'forge-x', label: 'Forge-X Scanner' },
  { value: 'algo-bid', label: 'Algo-Bid Scanner' },
  { value: 'code-ladder', label: 'Code-Ladder Scanner' }
];

export interface AdminProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avrAdmId: string;     // AVR-ADM-0001 format
  type: string;         // Legacy compatibility
  roleLevel: string[];  // e.g., ["admin-param-x", "admin-battle-grid"]
  assignment: string;   // Legacy fallback
  team?: string; // Legacy
}

interface AdminStats {
  totalParticipants: number | null;
  totalRegistrations: number | null;
  totalRevenue: number | null;
}

const AdminDashboard: React.FC = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSuper, setIsSuper] = useState(false);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  
  const [stats, setStats] = useState<AdminStats>({ 
    totalParticipants: null,
    totalRegistrations: null,
    totalRevenue: null
  });


  const [volunteerAvrId, setVolunteerAvrId] = useState('');
  const [scannerRole, setScannerRole] = useState(SCANNER_ROLE_OPTIONS[0].value);
  const [assigningLoading, setAssigningLoading] = useState(false);

  const [adminAvrId, setAdminAvrId] = useState('');
  const [adminRoleType, setAdminRoleType] = useState('department_admin');
  const [adminDepartment, setAdminDepartment] = useState(DEPARTMENT_OPTIONS[0]);
  const [adminCoreTeam, setAdminCoreTeam] = useState(CORE_TEAM_OPTIONS[0]);
  const [adminFlagship, setAdminFlagship] = useState(FLAGSHIP_OPTIONS[0].value);
  const [promotingLoading, setPromotingLoading] = useState(false);

  // Helper for auto-formatting AVR-ID: AVR-XXX-0000
  const handleAvrIdChange = (val: string, setter: (v: string) => void) => {
    let raw = val.toUpperCase();
    if (!raw.startsWith("AVR-")) {
      raw = "AVR-" + raw.replace(/^AVR-?/i, "");
    }
    
    // Structure: AVR-[3 letters]-[4 numbers]
    const content = raw.slice(4).replace(/[^A-Z0-9]/g, "");
    let letters = content.slice(0, 3).replace(/[0-9]/g, "");
    let numbers = content.slice(letters.length).replace(/[A-Z]/g, "").slice(0, 4);
    
    let formatted = "AVR-" + letters;
    if (letters.length === 3) {
      formatted += (numbers.length > 0 ? "-" + numbers : "");
    }
    setter(formatted);
  };
  const [syncingLoading, setSyncingLoading] = useState(false);
  
  const [stallBookings, setStallBookings] = useState<StallBooking[]>([]);
  const [loadingStalls, setLoadingStalls] = useState(false);
  
  const [contactQueries, setContactQueries] = useState<ContactQuery[]>([]);
  const [loadingContact, setLoadingContact] = useState(false);
  
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [loadingBugs, setLoadingBugs] = useState(false);
  
  const [supportSubTab, setSupportSubTab] = useState<'contact' | 'bugs'>('contact');
  

  
  const toast = useToast();

  useEffect(() => {
    const fetchAdminType = async () => {
      if (!user) return;
      try {
        const adminRef = doc(db, "admins", user.uid);
        const adminSnap = await getDoc(adminRef);
        if (adminSnap.exists()) {
          const data = adminSnap.data();
          const updates: any = {};

          if (user.photoURL && data.photoURL !== user.photoURL) {
            updates.photoURL = user.photoURL;
          }

          if (!data.avrAdmId) {
            try {
              const counterRef = doc(db, 'counters', 'admin_counter');
              const counterSnap = await getDoc(counterRef);
              const nextAdmNum = (counterSnap.exists() ? (counterSnap.data().count || 0) : 0) + 1;
              const avrAdmId = `AVR-ADM-${String(nextAdmNum).padStart(4, '0')}`;
              updates.avrAdmId = avrAdmId;
              await setDoc(counterRef, { count: nextAdmNum }, { merge: true });
            } catch (err) {
              console.error("Error auto-assigning Admin ID:", err);
            }
          }

          if (data.type === 'superadmin') {
            const currentRoles = Array.isArray(data.roleLevel) ? data.roleLevel : (data.roleLevel ? [data.roleLevel] : []);
            if (!currentRoles.includes('superadmin')) {
              updates.roleLevel = [...currentRoles, 'superadmin'];
            }
          }

          if (Object.keys(updates).length > 0) {
            await updateDoc(adminRef, updates);
          }

          const roles = Array.isArray(data.roleLevel) 
            ? data.roleLevel.map((r: string) => r.toLowerCase()) 
            : (data.roleLevel ? [data.roleLevel.toLowerCase()] : []);

          const localProfile: AdminProfile = {
            id: adminSnap.id,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            avrAdmId: data.avrAdmId || updates.avrAdmId || 'ASSIGNING...',
            type: data.type || 'admin',
            roleLevel: roles,
            assignment: data.assignment || ''
          };

          setIsSuper(localProfile.type === 'superadmin' || localProfile.roleLevel.includes('superadmin'));
          setAdminProfile(localProfile);
        }
      } catch (err) {
        console.error("Error checking admin rank:", err);
      }
    };
    fetchAdminType();

    const fetchStats = async () => {
      try {
        const [usersSnap, regsSnap, hackSnap] = await Promise.all([
          getCountFromServer(collection(db, "user")),
          getCountFromServer(collection(db, "registrations")),
          getCountFromServer(collection(db, "hackathon_registrations"))
        ]);

        let revenue = 0;
        const [regsDocs, hackDocs] = await Promise.all([
          getDocs(query(collection(db, "registrations"), where("paymentStatus", "in", ["success", "paid"]))),
          getDocs(query(collection(db, "hackathon_registrations"), where("status", "==", "confirmed")))
        ]);
        
        regsDocs.forEach(d => revenue += (d.data().amountPaid || 0));
        hackDocs.forEach(d => revenue += (d.data().amountPaid || d.data().amount || 0));
        
        setStats({ 
          totalParticipants: usersSnap.data().count,
          totalRegistrations: regsSnap.data().count + hackSnap.data().count,
          totalRevenue: revenue
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
        setStats({ totalParticipants: 0, totalRegistrations: 0, totalRevenue: 0 });
      }
    };
    fetchStats();
  }, [user]);



  useEffect(() => {
    const fetchStalls = async () => {
      if (activeTab === 'stall_bookings' && isSuper) {
        setLoadingStalls(true);
        try {
          const q = query(collection(db, "stall-bookings"), orderBy("createdAt", "desc"));
          const snap = await getDocs(q);
          setStallBookings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StallBooking)));
        } catch (err) {
          console.error("Error fetching stall bookings:", err);
        } finally {
          setLoadingStalls(false);
        }
      }
    };

    const fetchContactQueries = async () => {
      if (activeTab === 'support' && supportSubTab === 'contact' && isSuper) {
        setLoadingContact(true);
        try {
          const q = query(collection(db, "contact_queries"), orderBy("createdAt", "desc"));
          const snap = await getDocs(q);
          setContactQueries(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactQuery)));
        } catch (err) {
          console.error("Error fetching contact queries:", err);
        } finally {
          setLoadingContact(false);
        }
      }
    };

    const fetchBugReports = async () => {
      if (activeTab === 'support' && supportSubTab === 'bugs' && isSuper) {
        setLoadingBugs(true);
        try {
          const q = query(collection(db, "bug_reports"), orderBy("timestamp", "desc"));
          const snap = await getDocs(q);
          setBugReports(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BugReport)));
        } catch (err) {
          console.error("Error fetching bug reports:", err);
        } finally {
          setLoadingBugs(false);
        }
      }
    };

    fetchStalls();
    fetchContactQueries();
    fetchBugReports();
  }, [isSuper, activeTab, supportSubTab]);



  const handleAssignVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volunteerAvrId.trim()) return;
    
    setAssigningLoading(true);
    try {
      const q = query(collection(db, "user"), where("avrId", "==", volunteerAvrId.trim().toUpperCase()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast.error(`User with ID ${volunteerAvrId.toUpperCase()} not found.`);
        setAssigningLoading(false);
        return;
      }
      
      const userDoc = snap.docs[0];
      await updateDoc(doc(db, "user", userDoc.id), { 
        role: 'volunteer',
        scannerRole: scannerRole // e.g. 'gate', 'param-x'
      });
      toast.success(`${userDoc.data().firstName} is now a ${scannerRole.toUpperCase()} Volunteer!`);
      setVolunteerAvrId('');
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign volunteer role.");
    } finally {
      setAssigningLoading(false);
    }
  };

  const handlePromoteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminAvrId.trim()) {
      toast.error("Please enter an AVR ID.");
      return;
    }

    // Build the composite roleLevel
    let compositeRole = '';
    if (adminRoleType === 'department_admin') {
      compositeRole = `department_admin-${adminDepartment.toLowerCase()}`;
    } else if (adminRoleType === 'core_team') {
      compositeRole = `core_team-${adminCoreTeam.toLowerCase()}`;
    } else if (adminRoleType === 'competition_admin') {
      compositeRole = `competition_admin-${adminFlagship}`;
    } else {
      compositeRole = 'superadmin';
    }

    setPromotingLoading(true);
    try {
      // Find user by AVR ID
      const q = query(collection(db, "user"), where("avrId", "==", adminAvrId.trim().toUpperCase()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast.error(`User with ID ${adminAvrId.toUpperCase()} not found.`);
        setPromotingLoading(false);
        return;
      }
      
      const userDocSnap = snap.docs[0];
      const userData = userDocSnap.data();

      // Generate auto-incrementing AVR-ADM-XXXX
      const counterRef = doc(db, 'counters', 'admin_counter');
      const counterSnap = await getDoc(counterRef);
      let nextAdmNum = 1;
      if (counterSnap.exists()) {
        nextAdmNum = (counterSnap.data().count || 0) + 1;
      }
      const avrAdmId = `AVR-ADM-${String(nextAdmNum).padStart(4, '0')}`;
      
      // Create admin document
      await setDoc(doc(db, "admins", userDocSnap.id), {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        avrAdmId: avrAdmId,
        roleLevel: [compositeRole],
        assignment: compositeRole, // Legacy fallback
        type: adminRoleType === 'superadmin' ? 'superadmin' : 'admin'
      });

      // Update the counter
      await setDoc(counterRef, { count: nextAdmNum }, { merge: true });

      // Delete user document
      await deleteDoc(doc(db, "user", userDocSnap.id));
      
      toast.success(`${userData.firstName} promoted as ${compositeRole} (${avrAdmId})!`);
      setAdminAvrId('');
    } catch (err) {
      console.error(err);
      toast.error("Failed to promote admin.");
    } finally {
      setPromotingLoading(false);
    }
  };



  const handleExportStallExcel = () => {
    if (stallBookings.length === 0) {
      toast.error("No bookings to export!");
      return;
    }
    
    const exportData = stallBookings.map(stall => ({
      "Organization": stall.organization,
      "Name": stall.name,
      "Email": stall.email,
      "Phone": stall.phone,
      "Stall Type": stall.stallType,
      "Requirements": stall.requirements,
      "Message": stall.message,
      "Status": stall.status || 'pending',
      "Submitted At": stall.createdAt?.toDate ? stall.createdAt.toDate().toLocaleString() : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Marketplace_Bookings");
    XLSX.writeFile(workbook, `Avishkar26_Stall_Bookings_${new Date().toLocaleDateString()}.xlsx`);
  };

  const handleDeleteStall = async (id: string) => {
    if (!window.confirm("Delete this stall booking request?")) return;
    try {
      await deleteDoc(doc(db, "stall-bookings", id));
      setStallBookings(prev => prev.filter(s => s.id !== id));
      toast.success("Booking deleted.");
    } catch (err) {
      toast.error("Failed to delete booking.");
    }
  };

  const handleUpdateStallStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "stall-bookings", id), { status: newStatus });
      setStallBookings(prev => prev.map(s => s.id === id ? { ...s, status: newStatus as any } : s));
      toast.success(`Booking marked as ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  // --- CONTACT QUERY HANDLERS ---
  const handleExportContactExcel = () => {
    if (contactQueries.length === 0) {
      toast.error("No queries to export!");
      return;
    }
    
    const exportData = contactQueries.map(q => ({
      "Name": q.name,
      "Email": q.email,
      "Subject": q.subject,
      "Message": q.message,
      "Status": q.status || 'pending',
      "Submitted At": q.createdAt?.toDate ? q.createdAt.toDate().toLocaleString() : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contact_Inquiries");
    XLSX.writeFile(workbook, `Avishkar26_Contact_Queries_${new Date().toLocaleDateString()}.xlsx`);
  };

  const handleDeleteContact = async (id: string) => {
    if (!window.confirm("Delete this contact inquiry?")) return;
    try {
      await deleteDoc(doc(db, "contact_queries", id));
      setContactQueries(prev => prev.filter(q => q.id !== id));
      toast.success("Inquiry deleted.");
    } catch (err) {
      toast.error("Failed to delete inquiry.");
    }
  };

  const handleUpdateContactStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "contact_queries", id), { status: newStatus });
      setContactQueries(prev => prev.map(q => q.id === id ? { ...q, status: newStatus as any } : q));
      toast.success(`Inquiry marked as ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  // --- BUG REPORT HANDLERS ---
  const handleDeleteBug = async (id: string) => {
    if (!window.confirm("Delete this bug report?")) return;
    try {
      await deleteDoc(doc(db, "bug_reports", id));
      setBugReports(prev => prev.filter(b => b.id !== id));
      toast.success("Report deleted.");
    } catch (err) {
      toast.error("Failed to delete report.");
    }
  };

  const handleUpdateBugStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "bug_reports", id), { status: newStatus });
      setBugReports(prev => prev.map(b => b.id === id ? { ...b, status: newStatus as any } : b));
      toast.success(`Report marked as ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };



  const handleSyncRegistrations = async () => {
    if (!isSuper || syncingLoading) return;
    
    if (!window.confirm("This will scan all registrations and backfill missing data (Phone, College, Age) from user profiles. Proceed?")) {
      return;
    }

    setSyncingLoading(true);
    let syncCount = 0;

    try {
      const regsSnap = await getDocs(collection(db, "registrations"));
      const calculateAge = (dob: string) => {
        if (!dob) return 0;
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      };

      for (const regDoc of regsSnap.docs) {
        const regData = regDoc.data();
        if (!regData.userId) continue;

        const userSnap = await getDoc(doc(db, "user", regData.userId));
        if (userSnap.exists()) {
          const userData = userSnap.data();
          await updateDoc(regDoc.ref, {
            userPhone: userData.phone || regData.userPhone || '',
            userCollege: userData.college || regData.userCollege || '',
            userMajor: userData.major || regData.userMajor || '',
            userAge: calculateAge(userData.dob) || regData.userAge || 0,
            userSex: userData.sex || regData.userSex || '',
            userName: `${userData.firstName} ${userData.lastName}`
          });
          syncCount++;
        }
      }

      // Sync current admin's profile picture during global sync
      if (user?.uid) {
        await updateDoc(doc(db, "admins", user.uid), {
          photoURL: user.photoURL || ""
        });
        const mySnap = await getDoc(doc(db, "admins", user.uid));
        setAdminProfile({ id: mySnap.id, ...mySnap.data() } as AdminProfile);
      }

      toast.success(`Successfully synced ${syncCount} registration records!`);

    } catch (err) {
      console.error("Sync Error:", err);
      toast.error("An error occurred during sync.");
    } finally {
      setSyncingLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="admin-tab-section">
            <div className="admin-header-card" style={{ marginBottom: '2rem' }}>
              <div className="admin-profile-flex">
                <div className="admin-avatar-wrapper">
                  <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="Admin Avatar" />
                </div>
                <div className="admin-info-main">
                  <div className="admin-title-row">
                    <h1 className="admin-welcome-text">Command Center</h1>
                    {isSuper && <span className="admin-badge-super">SUPERADMIN</span>}
                  </div>
                  <p className="tab-subtitle-premium" style={{ margin: 0 }}>
                    Welcome back, <span style={{ color: '#fff', fontWeight: 700 }}>{user?.email}</span>
                  </p>
                  <div className="admin-id-pill" style={{ marginTop: '0.5rem' }}>
                    Admin ID: <span>{adminProfile?.avrAdmId || 'ASSIGNING...'}</span>
                  </div>
                </div>
              </div>
              <NotificationBell userId={user?.uid || ''} />
            </div>

            <div className="admin-stats-container">
              <div className="admin-stat-premium">
                <div className="stat-label-row">
                  <Users size={20} color="#a78bfa" />
                  <span>Total Participants</span>
                </div>
                {stats.totalParticipants === null ? (
                  <div className="stat-value-big">...</div>
                ) : (
                  <div className="stat-value-big">{stats.totalParticipants}</div>
                )}
              </div>

              <div className="admin-stat-premium">
                <div className="stat-label-row">
                  <Ticket size={20} color="#a78bfa" />
                  <span>Total Registrations</span>
                </div>
                {stats.totalRegistrations === null ? (
                  <div className="stat-value-big">...</div>
                ) : (
                  <div className="stat-value-big">{stats.totalRegistrations}</div>
                )}
              </div>

              <div className="admin-stat-premium">
                <div className="stat-label-row">
                  <IndianRupee size={20} color="#a78bfa" />
                  <span>Total Revenue</span>
                </div>
                {stats.totalRevenue === null ? (
                  <div className="stat-value-big">...</div>
                ) : (
                  <div className="stat-value-big">₹{stats.totalRevenue.toLocaleString()}</div>
                )}
              </div>
            </div>
            
            {isSuper && (
                <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                  <div className="admin-stat-premium" style={{ height: 'fit-content' }}>
                    <div className="stat-label-row">
                       <Wrench size={20} color="#a78bfa" />
                       <span>System Actions</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem' }}>
                      <button 
                        onClick={handleSyncRegistrations} 
                        disabled={syncingLoading}
                        className="user-edit-profile-btn"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(167, 139, 250, 0.1)', borderColor: 'rgba(167, 139, 250, 0.3)', color: '#a78bfa' }}
                      >
                        <RefreshCw size={18} className={syncingLoading ? 'animate-spin' : ''} />
                        {syncingLoading ? 'Syncing...' : 'Sync Data'}
                      </button>
                      <button 
                        onClick={() => navigate('/user/scanner')} 
                        className="user-edit-profile-btn"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(52, 211, 153, 0.1)', borderColor: 'rgba(52, 211, 153, 0.3)', color: '#34d399' }}
                      >
                         📸 Launch Scanner
                      </button>
                    </div>
                  </div>
                </div>
            )}

            {isSuper && (
              <React.Fragment>
                <div className="admin-form-card" style={{ marginTop: '24px', background: 'rgba(0,0,0,0.4)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}>
                  <h3 style={{ color: '#fff', marginBottom: '16px', fontSize: '1.2rem' }}>Role Assignment (Volunteers)</h3>
                  <form onSubmit={handleAssignVolunteer} className="whitelist-form">
                    <div className="form-group">
                      <label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block', fontSize: '0.9rem', fontWeight: 600 }}>Assign Scanner Role by AVR-ID</label>
                      <div className="input-with-btn" style={{ display: 'flex', gap: '12px', marginBottom: '1rem' }}>
                        <input 
                          type="text" 
                          placeholder="e.g. AVR-SHR-0001" 
                          value={volunteerAvrId}
                          onChange={(e) => handleAvrIdChange(e.target.value, setVolunteerAvrId)}
                          style={{ flex: 1, padding: '14px 16px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(167, 139, 250, 0.3)', color: '#fff', outline: 'none', fontFamily: 'inherit', fontSize: '0.95rem' }}
                        />
                        <div style={{ width: '250px' }}>
                          <GlassSelect 
                            value={scannerRole}
                            onChange={(val: string) => setScannerRole(val)}
                            options={SCANNER_ROLE_OPTIONS}
                          />
                        </div>
                      </div>
                      <button type="submit" disabled={assigningLoading} className="user-save-btn" style={{ width: '100%', padding: '14px', borderRadius: '12px' }}>
                        {assigningLoading ? 'Searching...' : 'Assign Scanner Role'}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="admin-form-card" style={{ marginTop: '24px', background: 'rgba(167, 139, 250, 0.05)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(167, 139, 250, 0.2)', backdropFilter: 'blur(20px)' }}>
                  <h3 style={{ color: '#a78bfa', marginBottom: '16px', fontSize: '1.2rem' }}>Core Team Promotion (Superadmin Only)</h3>
                  <form onSubmit={handlePromoteAdmin} className="whitelist-form">
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block', fontSize: '0.9rem', fontWeight: 600 }}>Target AVR-ID</label>
                      <input 
                        type="text" 
                        placeholder="e.g. AVR-SHR-0001" 
                        value={adminAvrId}
                        onChange={(e) => handleAvrIdChange(e.target.value, setAdminAvrId)}
                        style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(167, 139, 250, 0.3)', color: '#fff', outline: 'none', fontFamily: 'inherit', fontSize: '0.95rem' }}
                      />
                    </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block', fontSize: '0.9rem', fontWeight: 600 }}>Role Type</label>
                      <GlassSelect 
                        value={adminRoleType} 
                        onChange={(val: string) => setAdminRoleType(val)}
                        options={[
                          { label: 'Department Admin', value: 'department_admin' },
                          { label: 'Competition Admin', value: 'competition_admin' },
                          { label: 'Core Team', value: 'core_team' },
                          { label: 'Superadmin', value: 'superadmin' }
                        ]}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block', fontSize: '0.9rem', fontWeight: 600 }}>
                        {adminRoleType === 'department_admin' ? 'Department' : adminRoleType === 'core_team' ? 'Team' : adminRoleType === 'competition_admin' ? 'Competition' : 'Scope'}
                      </label>
                      {adminRoleType === 'department_admin' && (
                        <GlassSelect 
                          value={adminDepartment}
                          onChange={(val: string) => setAdminDepartment(val)}
                          options={DEPARTMENT_OPTIONS.map((d: string) => ({ label: d, value: d }))}
                          style={{ width: '100%' }}
                        />
                      )}
                      {adminRoleType === 'core_team' && (
                        <GlassSelect 
                          value={adminCoreTeam}
                          onChange={(val: string) => setAdminCoreTeam(val)}
                          options={CORE_TEAM_OPTIONS.map((t: string) => ({ label: t, value: t }))}
                          style={{ width: '100%' }}
                        />
                      )}
                      {adminRoleType === 'competition_admin' && (
                        <GlassSelect 
                          value={adminFlagship}
                          onChange={(val: string) => setAdminFlagship(val)}
                          options={FLAGSHIP_OPTIONS}
                          style={{ width: '100%' }}
                        />
                      )}
                      {adminRoleType === 'superadmin' && (
                        <input disabled value="All Access" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(167, 139, 250, 0.3)', color: '#888', outline: 'none', fontFamily: 'inherit', fontSize: '0.95rem' }} />
                      )}
                    </div>
                  </div>
                  <button type="submit" className="add-btn" disabled={promotingLoading} style={{ background: '#a78bfa', color: '#000', width: '100%', padding: '1rem', fontWeight: 'bold', fontSize: '1rem', borderRadius: '12px' }}>
                    {promotingLoading ? 'Promoting...' : 'Promote Account to Admin'}
                  </button>
                </form>
              </div>
              </React.Fragment>
            )}
          </div>
        );
      case 'sponsors':
        return (
          <div className="admin-overview">
            <h2 style={{ color: '#fff', marginBottom: '24px' }}>Sponsors & Partners</h2>
            <div className="admin-form-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '3rem', borderRadius: '24px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <Shield size={48} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ color: 'rgba(255,255,255,0.8)' }}>Coming Soon</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>Sponsor inquiries and partner management will appear here.</p>
            </div>
          </div>
        );
      case 'stall_bookings':
        return (
          <div className="tab-content animate-in">
            <div className="tab-header-flex">
              <div>
                <h1 className="tab-title">Marketplace Bookings</h1>
                <p className="tab-subtitle">Manage exhibition and food stall requests</p>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <button onClick={handleExportStallExcel} className="admin-action-btn" style={{ padding: '10px 20px' }}>
                  <Download size={18} /> Export Stalls
                </button>
              </div>
            </div>

            <div className="premium-table-container" style={{ marginTop: '24px' }}>
              <table className="admin-data-table" style={{ minWidth: '1100px' }}>
                <thead>
                  <tr>
                    <th>Organization</th>
                    <th>Contact Person</th>
                    <th>Stall Type</th>
                    <th>Phone</th>
                    <th>Requirements</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingStalls ? <tr><td colSpan={7} style={{ textAlign: 'center' }}>Loading stalls...</td></tr> : 
                   stallBookings.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', opacity: 0.5 }}>No stall bookings found.</td></tr> :
                   stallBookings.map(stall => (
                    <tr key={stall.id}>
                      <td style={{ fontWeight: 600 }}>{stall.organization}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{stall.name}</span>
                          <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>{stall.email}</span>
                        </div>
                      </td>
                      <td><span className="category-pill">{stall.stallType}</span></td>
                      <td>{stall.phone}</td>
                      <td style={{ maxWidth: '300px', fontSize: '0.85rem' }}>{stall.requirements}</td>
                      <td style={{ textAlign: 'center' }}>
                        <select 
                          className={`status-select status--${stall.status || 'pending'}`}
                          value={stall.status || 'pending'}
                          onChange={(e) => handleUpdateStallStatus(stall.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="contacted">Contacted</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            onClick={() => handleDeleteStall(stall.id)}
                            style={{ background: 'rgba(255, 68, 68, 0.1)', border: 'none', color: '#ff4444', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                   ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'support':
        return (
          <div className="tab-content animate-in">
            <div className="tab-header-flex">
              <div>
                <h1 className="tab-title">Support & Feedback</h1>
                <p className="tab-subtitle">Manage user inquiries and technical bug reports</p>
              </div>
              {supportSubTab === 'contact' && (
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <button onClick={handleExportContactExcel} className="admin-action-btn" style={{ padding: '10px 20px' }}>
                    <Download size={18} /> Export Queries
                  </button>
                </div>
              )}
            </div>

            <div className="support-subtabs">
              <button 
                className={`subtab-btn ${supportSubTab === 'contact' ? 'active' : ''}`}
                onClick={() => setSupportSubTab('contact')}
              >
                <Mail size={18} /> Contact Queries
                <span className="subtab-count">{contactQueries.length}</span>
              </button>
              <button 
                className={`subtab-btn ${supportSubTab === 'bugs' ? 'active' : ''}`}
                onClick={() => setSupportSubTab('bugs')}
              >
                <Wrench size={18} /> Bug Reports
                <span className="subtab-count">{bugReports.length}</span>
              </button>
            </div>

            {supportSubTab === 'contact' ? (
              <div className="premium-table-container">
                <table className="admin-data-table" style={{ minWidth: '1000px' }}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Subject</th>
                      <th>Message</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingContact ? <tr><td colSpan={5} style={{ textAlign: 'center' }}>Loading queries...</td></tr> : 
                     contactQueries.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', opacity: 0.5 }}>No contact inquiries found.</td></tr> :
                     contactQueries.map(q => (
                      <tr key={q.id}>
                        <td style={{ fontWeight: 600 }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{q.name}</span>
                            <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>{q.email}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{q.subject}</td>
                        <td style={{ maxWidth: '400px', whiteSpace: 'normal', fontSize: '0.85rem' }}>{q.message}</td>
                        <td style={{ textAlign: 'center' }}>
                          <select 
                            className={`status-select status--${q.status || 'pending'}`}
                            value={q.status || 'pending'}
                            onChange={(e) => handleUpdateContactStatus(q.id, e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="contacted">Contacted</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button 
                              onClick={() => handleDeleteContact(q.id)}
                              style={{ background: 'rgba(255, 68, 68, 0.1)', border: 'none', color: '#ff4444', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                     ))
                    }
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="premium-table-container">
                <table className="admin-data-table" style={{ minWidth: '1000px' }}>
                  <thead>
                    <tr>
                      <th>URL / Device</th>
                      <th>User</th>
                      <th>Description</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingBugs ? <tr><td colSpan={5} style={{ textAlign: 'center' }}>Loading reports...</td></tr> : 
                     bugReports.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', opacity: 0.5 }}>No bug reports found.</td></tr> :
                     bugReports.map(b => (
                      <tr key={b.id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{b.url}</span>
                            <span style={{ fontSize: '0.75rem', opacity: 0.5, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.userAgent}</span>
                          </div>
                        </td>
                        <td>
                          {b.userData ? (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span>{b.userData.email}</span>
                              <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{b.userData.uid}</span>
                            </div>
                          ) : (
                            <span style={{ opacity: 0.5 }}>Anonymous</span>
                          )}
                        </td>
                        <td style={{ maxWidth: '400px', whiteSpace: 'normal', fontSize: '0.85rem' }}>{b.description}</td>
                        <td style={{ textAlign: 'center' }}>
                          <select 
                            className={`status-select bug--${b.status || 'open'}`}
                            value={b.status || 'open'}
                            onChange={(e) => handleUpdateBugStatus(b.id, e.target.value)}
                          >
                            <option value="open">Open</option>
                            <option value="fixing">Fixing</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button 
                              onClick={() => handleDeleteBug(b.id)}
                              style={{ background: 'rgba(255, 68, 68, 0.1)', border: 'none', color: '#ff4444', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                     ))
                    }
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      case 'registrations':
        return <RegistrationManager />;
      case 'search':
        return isSuper ? <GlobalSearchView /> : <div>Access Denied</div>;
      case 'admins':
        return isSuper ? <AdminDirectoryView currentUserId={user?.uid} /> : <div>Access Denied</div>;
      case 'hackathon_regs':
        return (isSuper || adminProfile?.roleLevel.includes('admin-param-x') || adminProfile?.roleLevel.includes('flagship_admin-paramx--26')) 
          ? <RegistrationManager 
              forcedHandle="ParamX-Hack" 
              title="Param-X '26 Registrations" 
              subtitle="Managing all hackathon team registrations" 
            /> 
          : <div>Access Denied</div>;
      case 'battlegrid_regs':
        return (isSuper || adminProfile?.roleLevel.includes('admin-battle-grid'))
          ? <RegistrationManager 
              forcedHandle="Battle-Grid" 
              title="Battle Grid '26 Registrations" 
              subtitle="Managing all E-sports arena registrations" 
            />
          : <div>Access Denied</div>;
      case 'robokshetra_regs':
        return (isSuper || adminProfile?.roleLevel.includes('admin-robo-kshetra'))
          ? <RegistrationManager 
              forcedHandle="Robo-Kshetra" 
              title="Robo-Kshetra '26 Registrations" 
              subtitle="Managing all flagship robo-war registrations" 
            />
          : <div>Access Denied</div>;
      case 'forgex_regs':
        return (isSuper || adminProfile?.roleLevel.includes('admin-forge-x'))
          ? <RegistrationManager 
              forcedHandle="Forge-X" 
              title="Forge-X '26 Registrations" 
              subtitle="Managing all product design competition registrations" 
            />
          : <div>Access Denied</div>;
      case 'algobid_regs':
        return (isSuper || adminProfile?.roleLevel.includes('admin-algo-bid'))
          ? <RegistrationManager 
              forcedHandle="Algo-Bid" 
              title="Algo-Bid '26 Registrations" 
              subtitle="Managing all algorithm optimization registrations" 
            />
          : <div>Access Denied</div>;
      case 'codeladder_regs':
        return (isSuper || adminProfile?.roleLevel.includes('admin-code-ladder'))
          ? <RegistrationManager 
              forcedHandle="Code-Ladder" 
              title="Code-Ladder '26 Registrations" 
              subtitle="Managing all competitive programming registrations" 
            />
          : <div>Access Denied</div>;
      // website_settings removed
      default:
        return <div className="tab-content"><h1>{activeTab}</h1><p>Under construction.</p></div>;
    }
  };

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-container">
        <div className="admin-main-layout">
          <AdminSidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            isSuper={isSuper} 
            adminProfile={adminProfile}
          />
          <main className="admin-main-content">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

interface AdminDirectoryProps {
  currentUserId?: string;
}

const AdminDirectoryView: React.FC<AdminDirectoryProps> = ({ currentUserId }) => {
  const [activeAdmins, setActiveAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const q = query(collection(db, "admins"), orderBy("type", "desc"));
        const snap = await getDocs(q);
        setActiveAdmins(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdmins();
  }, []);

  const handleDemote = async (adminId: string, adminName: string) => {
    if (adminId === currentUserId) {
      toast.error("You cannot demote yourself!");
      return;
    }
    
    if (!window.confirm(`Are you sure you want to demote ${adminName}? They will lose all admin access instantly.`)) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, "admins", adminId));
      setActiveAdmins(prev => prev.filter(adm => adm.id !== adminId));
      toast.success(`${adminName} has been demoted to a regular user.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to demote admin.");
    }
  };

  return (
    <div className="admin-tab-section">
      <div className="admin-header-card" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="tab-title-premium">Admin Directory</h1>
          <p className="tab-subtitle-premium" style={{ margin: 0 }}>System-wide access management</p>
        </div>
        <div className="admin-badge-super" style={{ fontSize: '0.9rem' }}>
          {activeAdmins.length} Active Node{activeAdmins.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="admin-directory-grid">
        {loading ? <div style={{ color: '#fff' }}>Scanning nodes...</div> :
         activeAdmins.map(admin => (
          <div key={admin.id} className="admin-profile-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div className="admin-avatar-wrapper" style={{ width: '60px', height: '60px' }}>
                <img src={admin.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${admin.email}`} alt="Avatar" />
              </div>
              <span className={`badge-premium ${admin.roleLevel === 'superadmin' ? 'badge-super' : 'badge-flagship'}`}>
                {admin.roleLevel === 'superadmin' ? 'SUPER' : 'FLAGSHIP'}
              </span>
            </div>
            
            <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '4px' }}>{admin.email?.split('@')[0]}</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: '1rem' }}>{admin.email}</p>
            
            <div className="admin-id-pill" style={{ fontSize: '0.75rem', marginBottom: '1.5rem' }}>
              Node: <span>{admin.avrAdmId || 'Unassigned'}</span>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(20, 255, 201, 0.8)', fontSize: '0.75rem', fontWeight: 700 }}>
                  <Shield size={14} /> ONLINE
               </div>
               {admin.id !== currentUserId && (
                 <button 
                   onClick={() => handleDemote(admin.id, admin.email)}
                   style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '4px', opacity: 0.6 }}
                 >
                   <Trash2 size={16} />
                 </button>
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// WebsiteSettingsView removed

const GlobalSearchView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [userRegs, setUserRegs] = useState<any[]>([]);
  const toast = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setUserData(null);
    setUserRegs([]);

    try {
      const qUser = query(
        collection(db, "user"), 
        where("avrId", "==", searchQuery.trim().toUpperCase())
      );
      const userSnap = await getDocs(qUser);

      let foundUser = null;
      if (userSnap.empty) {
        const qEmail = query(collection(db, "user"), where("email", "==", searchQuery.trim().toLowerCase()));
        const emailSnap = await getDocs(qEmail);
        if (!emailSnap.empty) {
          foundUser = { id: emailSnap.docs[0].id, ...emailSnap.docs[0].data() };
        }
      } else {
        foundUser = { id: userSnap.docs[0].id, ...userSnap.docs[0].data() };
      }

      if (!foundUser) {
        toast.error("No user found with that ID or Email.");
        return;
      }

      setUserData(foundUser);

      const qRegs = query(collection(db, "registrations"), where("userId", "==", foundUser.id));
      const regsSnap = await getDocs(qRegs);
      setUserRegs(regsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch (err) {
      console.error(err);
      toast.error("Search failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-content animate-in">
      <h1 className="tab-title">Global User Search</h1>
      <p className="tab-subtitle">Look up any participant by AVR-ID or Email to view their full profile and history.</p>

      <form onSubmit={handleSearch} style={{ maxWidth: '600px', margin: '30px 0' }}>
        <div style={{ position: 'relative', display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
            <input 
              type="text" 
              placeholder="Enter Email or AVR-ID (e.g. AVR-ABC-0001)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '16px 16px 16px 48px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '14px', color: '#fff', fontSize: '1rem', outline: 'none' }}
            />
          </div>
          <button type="submit" disabled={loading} style={{ background: '#a78bfa', color: '#000', padding: '0 24px', borderRadius: '14px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', border: 'none' }}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {userData && (
        <div className="search-results animate-in">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Profile Card */}
            <div className="admin-form-card" style={{ padding: '24px', background: 'rgba(167, 139, 250, 0.05)', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', margin: '0 auto 12px', overflow: 'hidden', background: 'rgba(0,0,0,0.2)', border: '2px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {userData.photoURL && userData.photoURL.trim() !== '' ? (
                    <img src={userData.photoURL} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa', fontSize: '2.5rem', fontWeight: 'bold' }}>
                      {(userData.firstName || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <h2 style={{ color: '#fff', margin: 0 }}>{userData.firstName} {userData.lastName}</h2>
                <span className="avr-id-cell">{userData.avrId}</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                  <Mail size={16} /> {userData.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                  <Phone size={16} /> {userData.phone || 'No Phone'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                  <Fingerprint size={16} /> Age: {userData.dob ? (new Date().getFullYear() - new Date(userData.dob).getFullYear()) : 'N/A'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                  <School size={16} /> {userData.college || 'N/A'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                  <BookOpen size={16} /> {userData.major || 'N/A'}
                </div>
              </div>
            </div>

            {/* Registrations List */}
            <div className="admin-form-card" style={{ padding: '24px' }}>
              <h3 style={{ color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ticket size={20} color="#a78bfa" /> Event History ({userRegs.length})
              </h3>
              
              {userRegs.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px 0' }}>No event registrations found for this user.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {userRegs.map(reg => (
                    <div key={reg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <h4 style={{ color: '#fff', margin: 0 }}>{reg.eventName}</h4>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>{reg.category} • {reg.department}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ 
                          color: reg.isAttended ? '#10b981' : '#f59e0b',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '4px 8px',
                          background: reg.isAttended ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          borderRadius: '6px',
                          textTransform: 'uppercase'
                        }}>
                          {reg.isAttended ? 'Attended' : 'Registered'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
