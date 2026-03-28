import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { 
  collection, getCountFromServer, query, getDocs, 
  orderBy, doc, getDoc, where, updateDoc, setDoc, deleteDoc
} from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';
import { useToast } from '../../components/toast/Toast';
import AdminSidebar from '../../components/dashboard/sidebar/AdminSidebar';
import CompetitionForm from '../../components/admin/CompetitionForm';
import NotificationBell from '../../components/notifications/NotificationBell';

import { 
  Users, Ticket, Download, Wrench, Shield,
  Edit2, Trash2, X, Search, ChevronUp, ChevronDown,
  Phone, Mail, School, BookOpen, Fingerprint, RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import GlassSelect from '../../components/dropdown/GlassSelect';
// Removed usePageSettings
import './admindashboard.css';

interface Registration {
  id: string;
  userName: string;
  userEmail: string;
  userAVR: string;
  userPhone: string;
  userCollege: string;
  userMajor: string;
  userAge: number;
  userSex: string;
  userId: string;
  eventName: string;
  competitionId: string;
  category: string;
  department: string;
  registeredAt: any;
  isAttended: boolean;
}

interface HackathonRegistration {
  id: string;
  teamName: string;
  psId: string;
  leaderName: string;
  leaderEmail: string;
  leaderPhone: string;
  leaderCollege: string;
  member2Name: string;
  member2Email: string;
  member2Phone: string;
  member2College: string;
  member3Name: string;
  member3Email: string;
  member3Phone: string;
  member3College: string;
  member4Name: string;
  member4Email: string;
  member4Phone: string;
  member4College: string;
  status: string;
  createdAt: any;
}

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

export interface AdminProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avrAdmId: string;     // AVR-ADM-0001 format
  type: string;         // Legacy compatibility
  roleLevel: string;    // e.g., "department_admin-computer engineering", "superadmin", "core_team-registration team"
  assignment: string;   // Legacy fallback
  team?: string; // Legacy
}

interface AdminStats {
  totalParticipants: number | null;
  totalRegistrations: number | null;
}

const AdminDashboard: React.FC = () => {
  const [user] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSuper, setIsSuper] = useState(false);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  
  const [stats, setStats] = useState<AdminStats>({ 
    totalParticipants: null,
    totalRegistrations: null 
  });
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReg, setEditingReg] = useState<Registration | null>(null);
  const [savingReg, setSavingReg] = useState(false);

  const [volunteerAvrId, setVolunteerAvrId] = useState('');
  const [assigningLoading, setAssigningLoading] = useState(false);

  const [adminAvrId, setAdminAvrId] = useState('');
  const [adminRoleType, setAdminRoleType] = useState('department_admin');
  const [adminDepartment, setAdminDepartment] = useState(DEPARTMENT_OPTIONS[0]);
  const [adminCoreTeam, setAdminCoreTeam] = useState(CORE_TEAM_OPTIONS[0]);
  const [adminFlagship, setAdminFlagship] = useState(FLAGSHIP_OPTIONS[0].value);
  const [promotingLoading, setPromotingLoading] = useState(false);
  const [syncingLoading, setSyncingLoading] = useState(false);
  
  const [stallBookings, setStallBookings] = useState<StallBooking[]>([]);
  const [loadingStalls, setLoadingStalls] = useState(false);
  
  // Advanced Filtering & Sorting State
  const [filterTerm, setFilterTerm] = useState('');
  const [filterEvent, setFilterEvent] = useState('All');
  const [filterDept, setFilterDept] = useState('All');
  const [filterCollege, setFilterCollege] = useState('All');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Registration; direction: 'asc' | 'desc' }>({ key: 'registeredAt', direction: 'desc' });
  
  const toast = useToast();

  useEffect(() => {
    const fetchAdminType = async () => {
      if (!user) return;
      try {
        const adminRef = doc(db, "admins", user.uid);
        const adminSnap = await getDoc(adminRef);
        if (adminSnap.exists()) {
          const data = adminSnap.data();
          let updates: any = {};
          
          // Sync photoURL from Google login to Firestore for directory view
          if (user.photoURL && data.photoURL !== user.photoURL) {
            updates.photoURL = user.photoURL;
          }

          // Auto-assign avrAdmId if missing
          if (!data.avrAdmId) {
            try {
              const counterRef = doc(db, 'counters', 'admin_counter');
              const counterSnap = await getDoc(counterRef);
              const nextAdmNum = (counterSnap.exists() ? (counterSnap.data().count || 0) : 0) + 1;
              const avrAdmId = `AVR-ADM-${String(nextAdmNum).padStart(4, '0')}`;
              
              updates.avrAdmId = avrAdmId;
              await setDoc(counterRef, { count: nextAdmNum }, { merge: true });
              toast.success(`Welcome! Your Admin ID ${avrAdmId} has been assigned.`);
            } catch (err) {
              console.error("Error auto-assigning Admin ID:", err);
            }
          }

          if (Object.keys(updates).length > 0) {
            await updateDoc(adminRef, updates);
          }

          const finalData = { ...data, ...updates };
          setIsSuper(finalData.type === 'superadmin' || finalData.roleLevel === 'superadmin');
          setAdminProfile({ id: adminSnap.id, ...finalData } as AdminProfile);
        }
      } catch (err) {
        console.error("Error checking admin rank:", err);
      }
    };
    fetchAdminType();

    const fetchStats = async () => {
      try {
        const usersSnap = await getCountFromServer(collection(db, "user"));
        const regsSnap = await getCountFromServer(collection(db, "registrations"));
        
        setStats({ 
          totalParticipants: usersSnap.data().count,
          totalRegistrations: regsSnap.data().count
        });
      } catch (err) {
        setStats({ totalParticipants: 0, totalRegistrations: 0 });
      }
    };
    fetchStats();
  }, [user]);

  useEffect(() => {
    const fetchRegistrations = async () => {
      if (activeTab === 'registrations') {
        // Wait until profile is loaded
        if (!isSuper && !adminProfile) return;
        
        setLoadingRegs(true);
        try {
          let q;
          
          // Superadmin or Core Registration Team see everything
          if (isSuper || adminProfile?.roleLevel === 'superadmin' || adminProfile?.roleLevel === 'core_team-registration team') {
            q = query(collection(db, "registrations"), orderBy("registeredAt", "desc"));
          } 
          // Department Admins: roleLevel = "department_admin-computer engineering"
          else if (adminProfile?.roleLevel.startsWith('department_admin-')) {
            const dept = adminProfile.roleLevel.replace('department_admin-', '');
            q = query(
              collection(db, "registrations"), 
              where("department", "==", dept),
              orderBy("registeredAt", "desc")
            );
          }
          // Competition Admins: roleLevel = "competition_admin-codex--26"
          else if (adminProfile?.roleLevel.startsWith('competition_admin-')) {
            const compId = adminProfile.roleLevel.replace('competition_admin-', '');
            q = query(
              collection(db, "registrations"), 
              where("competitionId", "==", compId),
              orderBy("registeredAt", "desc")
            );
          }
          else {
            // Other roles don't have access to list registrations
            setRegistrations([]);
            setLoadingRegs(false);
            return;
          }

          const snap = await getDocs(q);
          const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Registration));
          setRegistrations(fetched);
        } catch (err) {
          console.error("Error fetching registrations:", err);
        } finally {
          setLoadingRegs(false);
        }
      }
    };
    
    fetchRegistrations();
  }, [isSuper, adminProfile, activeTab]);

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
    fetchStalls();
  }, [isSuper, activeTab]);

  // Derived filtered and sorted registrations
  const filteredRegs = React.useMemo(() => {
    let result = [...registrations];

    // Apply Filter Term (Search)
    if (filterTerm.trim()) {
      const term = filterTerm.toLowerCase();
      result = result.filter(reg => 
        reg.userName.toLowerCase().includes(term) || 
        reg.userEmail.toLowerCase().includes(term) || 
        reg.userAVR.toLowerCase().includes(term)
      );
    }

    // Apply Event Filter
    if (filterEvent !== 'All') {
      result = result.filter(reg => reg.eventName === filterEvent);
    }

    // Apply Dept Filter
    if (filterDept !== 'All') {
      result = result.filter(reg => reg.department === filterDept);
    }

    // Apply College Filter
    if (filterCollege !== 'All') {
      result = result.filter(reg => reg.userCollege === filterCollege);
    }

    // Apply Sorting
    result.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle serverTimestamp (registeredAt)
      if (sortConfig.key === 'registeredAt') {
        aVal = a.registeredAt?.toDate ? a.registeredAt.toDate().getTime() : (a.registeredAt || 0);
        bVal = b.registeredAt?.toDate ? b.registeredAt.toDate().getTime() : (b.registeredAt || 0);
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [registrations, filterTerm, filterEvent, filterDept, filterCollege, sortConfig]);

  // Extract unique filter options for dropdowns
  const uniqueEvents = React.useMemo(() => ['All', ...new Set(registrations.map(r => r.eventName))], [registrations]);
  const uniqueDepts = React.useMemo(() => ['All', ...new Set(registrations.map(r => r.department))], [registrations]);
  const uniqueColleges = React.useMemo(() => ['All', ...new Set(registrations.map(r => r.userCollege))], [registrations]);

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
      await updateDoc(doc(db, "user", userDoc.id), { role: 'volunteer' });
      toast.success(`${userDoc.data().firstName} is now a Volunteer!`);
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
        roleLevel: compositeRole,
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

  const handleExportExcel = () => {
    if (filteredRegs.length === 0) {
      toast.error("No registrations to export!");
      return;
    }
    
    const exportData = filteredRegs.map(reg => ({
      "Registration ID": reg.id,
      "Name": reg.userName,
      "Email": reg.userEmail,
      "AVR ID": reg.userAVR,
      "Phone": reg.userPhone || 'N/A',
      "Age": reg.userAge || 'N/A',
      "College": reg.userCollege || 'N/A',
      "Major": reg.userMajor || 'N/A',
      "Sex": reg.userSex || 'N/A',
      "Event Name": reg.eventName,
      "Department": reg.department || 'General',
      "Category": reg.category,
      "Attendance": reg.isAttended ? 'Yes' : 'No',
      "Registered At": reg.registeredAt?.toDate ? reg.registeredAt.toDate().toLocaleString() : reg.registeredAt
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");
    
    const scope = adminProfile?.roleLevel === 'superadmin' ? 'Global' : (adminProfile?.assignment || 'Scope');
    XLSX.writeFile(workbook, `Avishkar26_Registrations_${scope.replace(/\s+/g, '_')}_Filtered.xlsx`);
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

  const handleDeleteReg = async (id: string) => {
    if (!window.confirm("Are you sure you want to completely delete this registration? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "registrations", id));
      setRegistrations(prev => prev.filter(r => r.id !== id));
      toast.success("Registration deleted.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete registration.");
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReg) return;
    setSavingReg(true);
    try {
      const regRef = doc(db, "registrations", editingReg.id);
      await updateDoc(regRef, {
        userName: editingReg.userName,
        userEmail: editingReg.userEmail,
        eventName: editingReg.eventName,
        category: editingReg.category
      });
      setRegistrations(prev => prev.map(r => r.id === editingReg.id ? {...editingReg} : r));
      toast.success("Registration updated successfully!");
      setIsEditModalOpen(false);
      setEditingReg(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save changes.");
    } finally {
      setSavingReg(false);
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
      // Refresh local state if in registrations tab
      if (activeTab === 'registrations') {
        const freshSnap = await getDocs(collection(db, "registrations"));
        setRegistrations(freshSnap.docs.map(d => ({ id: d.id, ...d.data() } as Registration)));
      }
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
                      <label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block', fontSize: '0.9rem', fontWeight: 600 }}>Assign Scan Capabilities by AVR-ID</label>
                      <div className="input-with-btn" style={{ display: 'flex', gap: '12px' }}>
                        <input 
                          type="text" 
                          placeholder="e.g. AVR-SHR-0001" 
                          value={volunteerAvrId}
                          onChange={(e) => setVolunteerAvrId(e.target.value)}
                          style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(167, 139, 250, 0.3)', color: '#fff', outline: 'none', fontFamily: 'inherit', fontSize: '0.95rem' }}
                        />
                        <button type="submit" disabled={assigningLoading} style={{ background: '#a78bfa', color: '#000', padding: '14px 24px', fontWeight: 'bold', fontSize: '1rem', borderRadius: '12px', border: 'none', cursor: assigningLoading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                          {assigningLoading ? 'Searching...' : 'Make Volunteer'}
                        </button>
                      </div>
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
                        onChange={(e) => setAdminAvrId(e.target.value)}
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
      case 'content':
        return (
          <div className="admin-overview">
            <h2 style={{ color: '#fff', marginBottom: '24px' }}>Content Editor</h2>
            {isSuper || adminProfile?.roleLevel.startsWith('department_admin') || 
             adminProfile?.roleLevel.startsWith('competition_admin') || 
             adminProfile?.roleLevel.startsWith('core_team') ? (
              <CompetitionForm adminProfile={adminProfile} />
            ) : (
              <div className="admin-form-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '3rem', borderRadius: '24px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <Wrench size={48} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 1rem auto' }} />
                <h3 style={{ color: 'rgba(255,255,255,0.8)' }}>Other Content</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>Other website structures are managed here by specific teams.</p>
              </div>
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
          <div className="admin-overview">
            <h2 style={{ color: '#fff', marginBottom: '24px' }}>Support Tickets</h2>
            <div className="admin-form-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '3rem', borderRadius: '24px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <Users size={48} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ color: 'rgba(255,255,255,0.8)' }}>Coming Soon</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>Contact page queries and support tickets will map to this team.</p>
            </div>
          </div>
        );
      case 'registrations':
        return (
          <div className="tab-content animate-in">
            <div className="tab-header-flex" style={{ marginBottom: '24px' }}>
              <div>
                <h1 className="tab-title">Competition Entries</h1>
                <p className="tab-subtitle">Manage and filter participant registrations</p>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <button onClick={handleExportExcel} className="admin-action-btn" style={{ padding: '10px 20px' }}>
                  <Download size={18} /> Export Filtered
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="filter-group">
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', textTransform: 'uppercase' }}>Search</label>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                  <input 
                    type="text" 
                    placeholder="Name, Email or AVR-ID"
                    value={filterTerm}
                    onChange={(e) => setFilterTerm(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff' }}
                  />
                </div>
              </div>
              <div className="filter-group">
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', textTransform: 'uppercase' }}>Event</label>
                <GlassSelect 
                  value={filterEvent}
                  onChange={(val: string) => setFilterEvent(val)}
                  options={uniqueEvents.map(e => ({ label: e, value: e }))}
                />
              </div>
              <div className="filter-group">
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', textTransform: 'uppercase' }}>Department</label>
                <GlassSelect 
                  value={filterDept}
                  onChange={(val: string) => setFilterDept(val)}
                  options={uniqueDepts.map(d => ({ label: d, value: d }))}
                />
              </div>
              <div className="filter-group">
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', textTransform: 'uppercase' }}>College</label>
                <GlassSelect 
                  value={filterCollege}
                  onChange={(val: string) => setFilterCollege(val)}
                  options={uniqueColleges.map(c => ({ label: c, value: c }))}
                />
              </div>
            </div>
            <div className="premium-table-container">
              <table className="admin-data-table" style={{ minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th onClick={() => setSortConfig({ key: 'userName', direction: sortConfig.key === 'userName' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })} style={{ cursor: 'pointer' }}>
                      Participant {sortConfig.key === 'userName' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                    </th>
                    <th onClick={() => setSortConfig({ key: 'userAVR', direction: sortConfig.key === 'userAVR' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })} style={{ cursor: 'pointer' }}>
                      AVR ID {sortConfig.key === 'userAVR' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                    </th>
                    <th>Email</th>
                    <th onClick={() => setSortConfig({ key: 'eventName', direction: sortConfig.key === 'eventName' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })} style={{ cursor: 'pointer' }}>
                      Event {sortConfig.key === 'eventName' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                    </th>
                    <th>Category</th>
                    <th>College</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRegs ? <tr><td colSpan={7} style={{ textAlign: 'center' }}>Loading registrations...</td></tr> : 
                   filteredRegs.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', opacity: 0.5 }}>No registrations found.</td></tr> :
                   filteredRegs.map(reg => (
                    <tr key={reg.id}>
                      <td>{reg.userName}</td>
                      <td className="avr-id-cell">{reg.userAVR}</td>
                      <td>{reg.userEmail}</td>
                      <td className="event-name-cell">{reg.eventName}</td>
                      <td><span className="category-pill">{reg.category}</span></td>
                      <td>{reg.userCollege || 'N/A'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            onClick={() => { setEditingReg({...reg}); setIsEditModalOpen(true); }}
                            style={{ background: 'rgba(167, 139, 250, 0.1)', border: 'none', color: '#a78bfa', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteReg(reg.id)}
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

            {/* Edit Modal */}
            {isEditModalOpen && editingReg && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
                <div className="admin-form-card" style={{ width: '100%', maxWidth: '500px', background: 'rgba(20,20,30,0.9)', border: '1px solid rgba(167, 139, 250, 0.3)', borderRadius: '24px', padding: '32px', position: 'relative' }}>
                  <button onClick={() => { setIsEditModalOpen(false); setEditingReg(null); }} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                    <X size={24} />
                  </button>
                  <h3 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '24px' }}>Edit Registration</h3>
                  
                  <form onSubmit={handleSaveEdit} className="whitelist-form">
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block', fontSize: '0.9rem', fontWeight: 600 }}>Participant Name</label>
                      <input 
                        type="text" 
                        value={editingReg.userName}
                        onChange={(e) => setEditingReg({...editingReg, userName: e.target.value})}
                        style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', fontFamily: 'inherit' }}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block', fontSize: '0.9rem', fontWeight: 600 }}>Email Address</label>
                      <input 
                        type="email" 
                        value={editingReg.userEmail}
                        onChange={(e) => setEditingReg({...editingReg, userEmail: e.target.value})}
                        style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', fontFamily: 'inherit' }}
                        required
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block', fontSize: '0.9rem', fontWeight: 600 }}>Event Name</label>
                        <input 
                          type="text" 
                          value={editingReg.eventName}
                          onChange={(e) => setEditingReg({...editingReg, eventName: e.target.value})}
                          style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', fontFamily: 'inherit' }}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block', fontSize: '0.9rem', fontWeight: 600 }}>Category</label>
                        <input 
                          type="text" 
                          value={editingReg.category}
                          onChange={(e) => setEditingReg({...editingReg, category: e.target.value})}
                          style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', fontFamily: 'inherit' }}
                          required
                        />
                      </div>
                    </div>
                    <button type="submit" disabled={savingReg} style={{ background: '#a78bfa', color: '#000', width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', border: 'none', cursor: savingReg ? 'not-allowed' : 'pointer' }}>
                      {savingReg ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      case 'search':
        return isSuper ? <GlobalSearchView /> : <div>Access Denied</div>;
      case 'admins':
        return isSuper ? <AdminDirectoryView currentUserId={user?.uid} /> : <div>Access Denied</div>;
      case 'hackathon_regs':
        return (isSuper || adminProfile?.roleLevel === 'flagship_admin-paramx--26') 
          ? <HackathonRegistrationsView /> 
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

const HackathonRegistrationsView: React.FC = () => {
  const [registrations, setRegistrations] = useState<HackathonRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchRegs = async () => {
      try {
        const q = query(collection(db, "hackathon_registrations"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setRegistrations(snap.docs.map(d => ({ id: d.id, ...d.data() } as HackathonRegistration)));
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch hackathon registrations.");
      } finally {
        setLoading(false);
      }
    };
    fetchRegs();
  }, []);

  const handleExport = () => {
    const data = registrations.map(r => ({
      'Team Name': r.teamName,
      'PS ID': r.psId,
      'Leader Name': r.leaderName,
      'Leader Email': r.leaderEmail,
      'Leader Phone': r.leaderPhone,
      'Leader College': r.leaderCollege,
      'Member 2 Name': r.member2Name,
      'Member 2 Email': r.member2Email,
      'Member 2 Phone': r.member2Phone,
      'Member 2 College': r.member2College,
      'Member 3 Name': r.member3Name,
      'Member 3 Email': r.member3Email,
      'Member 3 Phone': r.member3Phone,
      'Member 3 College': r.member3College,
      'Member 4 Name': r.member4Name,
      'Member 4 Email': r.member4Email,
      'Member 4 Phone': r.member4Phone,
      'Member 4 College': r.member4College,
      'Status': r.status,
      'Created At': r.createdAt?.toDate().toLocaleString() || 'N/A'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hackathon Registrations");
    XLSX.writeFile(wb, "ParamX_Full_Registrations_2026.xlsx");
  };

  return (
    <div className="admin-tab-section">
      <div className="admin-header-card" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="tab-title-premium">ParamX '26 Registrations</h1>
          <p className="tab-subtitle-premium" style={{ margin: 0 }}>Managing all hackathon team registrations</p>
        </div>
        <button onClick={handleExport} className="user-edit-profile-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={18} /> Export Excel
        </button>
      </div>

      <div className="premium-table-container">
        <table className="premium-table">
          <thead>
            <tr>
              <th>Team Name</th>
              <th>PS ID</th>
              <th>Leader Info</th>
              <th>Member 2</th>
              <th>Member 3</th>
              <th>Member 4</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7}>Loading registrations...</td></tr> :
             registrations.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', opacity: 0.5 }}>No registrations yet.</td></tr> :
             registrations.map(reg => (
              <tr key={reg.id}>
                <td style={{ fontWeight: 700, color: '#a78bfa' }}>{reg.teamName}</td>
                <td style={{ fontFamily: 'Iceland', fontSize: '1.2rem' }}>{reg.psId}</td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={14} /> {reg.leaderName}</div>
                    <div style={{ opacity: 0.6, fontSize: '0.85rem' }}>{reg.leaderEmail}</div>
                    <div style={{ opacity: 0.6, fontSize: '0.85rem' }}>{reg.leaderPhone}</div>
                  </div>
                </td>
                <td>{reg.member2Name || '-'}</td>
                <td>{reg.member3Name || '-'}</td>
                <td>{reg.member4Name || '-'}</td>
                <td>
                  <span className="badge-premium badge-flagship">
                    {reg.status ? reg.status.toUpperCase() : 'CONFIRMED'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
