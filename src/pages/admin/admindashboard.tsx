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
import { SkeletonCard } from '../../components/skeleton/Skeleton';
import { Users, Ticket, Download, Terminal, Wrench, Shield, Edit2, Trash2, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import GlassSelect from '../../components/dropdown/GlassSelect';
import { usePageSettings } from '../../context/PageSettingsContext';
import './admindashboard.css';

interface Registration {
  id: string;
  userName: string;
  userEmail: string;
  userAVR: string;
  eventName: string;
  category: string;
  registeredAt: any;
}

const ASSIGNMENT_OPTIONS: Record<AdminProfile['roleLevel'], string[]> = {
  department_admin: [
    'Computer', 'IT', 'AI&DS', 'AI&ML', 'Civil', 'Mechanical', 
    'Robotics and Automation', 'Electrical', 'E&TC', 'ECE'
  ],
  core_team: [
    'Technical Team', 'Registration Team', 'Sponsorship Team', 'Support Team'
  ],
  competition_admin: [
    "Codex '26 Admin", "RoboTron '26 Admin", "Battle Grid '26 Admin"
  ],
  superadmin: ['All Access']
};

export interface AdminProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  type: string; // Legacy, keep for backward compatibility or replace
  roleLevel: 'superadmin' | 'core_team' | 'department_admin' | 'competition_admin';
  assignment: string;
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
  const [adminRoleLevel, setAdminRoleLevel] = useState<AdminProfile['roleLevel']>('department_admin');
  const [adminAssignment, setAdminAssignment] = useState(ASSIGNMENT_OPTIONS['department_admin'][0]);
  const [promotingLoading, setPromotingLoading] = useState(false);
  
  const toast = useToast();

  useEffect(() => {
    const fetchAdminType = async () => {
      if (!user) return;
      try {
        const adminSnap = await getDoc(doc(db, "admins", user.uid));
        if (adminSnap.exists()) {
          const data = adminSnap.data();
          setIsSuper(data.type === 'superadmin' || data.roleLevel === 'superadmin');
          setAdminProfile({ id: adminSnap.id, ...data } as AdminProfile);
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
          
          // Superadmin or Core Teams (Registration) see everything
          if (isSuper || adminProfile?.roleLevel === 'superadmin' || adminProfile?.assignment === 'Registration Team') {
            q = query(collection(db, "registrations"), orderBy("registeredAt", "desc"));
          } 
          // Department or Flagship admins see only their assignments
          else if (adminProfile?.roleLevel === 'department_admin' || adminProfile?.roleLevel === 'competition_admin') {
            q = query(
              collection(db, "registrations"), 
              where("eventName", "==", adminProfile.assignment),
              orderBy("registeredAt", "desc")
            );
          } else {
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
    if (!adminAvrId.trim() || !adminAssignment.trim()) {
      toast.error("Please fill all required fields.");
      return;
    }

    setPromotingLoading(true);
    try {
      const q = query(collection(db, "user"), where("avrId", "==", adminAvrId.trim().toUpperCase()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast.error(`User with ID ${adminAvrId.toUpperCase()} not found.`);
        setPromotingLoading(false);
        return;
      }
      
      const userDoc = snap.docs[0];
      const userData = userDoc.data();
      
      // Write to the "admins" collection using their UID
      await setDoc(doc(db, "admins", userDoc.id), {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        roleLevel: adminRoleLevel,
        assignment: adminAssignment,
        type: adminRoleLevel === 'superadmin' ? 'superadmin' : 'admin' // Legacy compatibility
      });
      
      toast.success(`${userData.firstName} promoted as ${adminRoleLevel} (${adminAssignment})!`);
      setAdminAvrId('');
      setAdminAssignment('');
    } catch (err) {
      console.error(err);
      toast.error("Failed to promote admin.");
    } finally {
      setPromotingLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (registrations.length === 0) {
      toast.error("No registrations to export!");
      return;
    }
    
    const exportData = registrations.map(reg => ({
      "Registration ID": reg.id,
      "Name": reg.userName,
      "Email": reg.userEmail,
      "AVR ID": reg.userAVR,
      "Event Name": reg.eventName,
      "Category": reg.category,
      "Registered At": reg.registeredAt?.toDate ? reg.registeredAt.toDate().toLocaleString() : reg.registeredAt
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");
    
    const scope = adminProfile?.roleLevel === 'superadmin' ? 'Global' : (adminProfile?.assignment || 'Scope');
    XLSX.writeFile(workbook, `Avishkar26_Registrations_${scope.replace(/\s+/g, '_')}.xlsx`);
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

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="tab-content animate-in">
            <div className="tab-header-flex" style={{ alignItems: 'center' }}>
              <div className="admin-dashboard-profile" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div className="admin-dashboard-avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div className="admin-dashboard-info">
                  <h1 className="tab-title" style={{ marginBottom: '8px' }}>
                    Command Center
                    {isSuper && <span className="super-badge">SUPERADMIN</span>}
                  </h1>
                  <p className="tab-subtitle" style={{ margin: 0 }}>
                    Welcome back, <span className="admin-email" style={{ color: '#fff', fontWeight: 700 }}>{user?.email}</span> 
                  </p>
                </div>
              </div>
              <NotificationBell userId={user?.uid || ''} />
            </div>

            <div className="admin-stats-grid">
              {stats.totalParticipants === null ? <SkeletonCard /> : (
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">Total Participants</span>
                    <Users className="stat-icon" size={20} />
                  </div>
                  <div className="stat-value">{stats.totalParticipants}</div>
                  <p className="stat-footer">Users registered on platform</p>
                </div>
              )}
              {stats.totalRegistrations === null ? <SkeletonCard /> : (
                <div className="stat-card stat-card--accent">
                  <div className="stat-header">
                     <span className="stat-title">Event Registrations</span>
                    <Ticket className="stat-icon" size={20} />
                  </div>
                  <div className="stat-value">{stats.totalRegistrations}</div>
                  <p className="stat-footer">Entries in registrations table</p>
                </div>
              )}
            </div>
            
            <div className="admin-actions">
              <button className="admin-action-btn"><Download size={18} /> Export Report</button>
              <button className="admin-action-btn"><Terminal size={18} /> System Logs</button>
            </div>

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
                      <label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block', fontSize: '0.9rem', fontWeight: 600 }}>Role Level</label>
                      <GlassSelect 
                        value={adminRoleLevel} 
                        onChange={(val) => {
                          const newRole = val as AdminProfile['roleLevel'];
                          setAdminRoleLevel(newRole);
                          setAdminAssignment(ASSIGNMENT_OPTIONS[newRole][0]);
                        }}
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
                      <label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block', fontSize: '0.9rem', fontWeight: 600 }}>Team / Assignment Area</label>
                      <GlassSelect 
                        value={adminAssignment}
                        onChange={(val) => setAdminAssignment(val)}
                        options={ASSIGNMENT_OPTIONS[adminRoleLevel].map(opt => ({ label: opt, value: opt }))}
                        style={{ width: '100%' }}
                      />
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
            {adminProfile?.roleLevel === 'department_admin' || adminProfile?.roleLevel === 'superadmin' ? (
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
            <div className="tab-header-flex">
              <div>
                <h1 className="tab-title">Competition Entries</h1>
                <p className="tab-subtitle">Manage all participant registrations</p>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <button onClick={handleExportExcel} className="admin-action-btn" style={{ padding: '10px 20px' }}>
                  <Download size={18} /> Export to Excel
                </button>
                <NotificationBell userId={user?.uid || ''} />
              </div>
            </div>
            <div className="table-container-outer" style={{ overflowX: 'auto' }}>
              <table className="admin-data-table" style={{ minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th>Participant</th>
                    <th>AVR ID</th>
                    <th>Email</th>
                    <th>Event</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRegs ? <tr><td colSpan={6} style={{ textAlign: 'center' }}>Loading registrations...</td></tr> : 
                   registrations.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', opacity: 0.5 }}>No registrations found.</td></tr> :
                   registrations.map(reg => (
                    <tr key={reg.id}>
                      <td>{reg.userName}</td>
                      <td className="avr-id-cell">{reg.userAVR}</td>
                      <td>{reg.userEmail}</td>
                      <td className="event-name-cell">{reg.eventName}</td>
                      <td><span className="category-pill">{reg.category}</span></td>
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
      case 'admins':
        return isSuper ? <AdminDirectoryView currentUserId={user?.uid} /> : <div>Access Denied</div>;
      case 'website_settings':
        return isSuper ? <WebsiteSettingsView /> : <div>Access Denied</div>;
      default:
        return <div className="tab-content"><h1>{activeTab}</h1><p>Under construction.</p></div>;
    }
  };

  return (
    <div className="admin-dashboard">
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isSuper={isSuper} 
        adminProfile={adminProfile}
      />
      <main className="dashboard-main-content">
        {renderContent()}
      </main>
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
    <div className="tab-content animate-in">
      <h1 className="tab-title">Admin Directory</h1>
      <p className="tab-subtitle">Viewing all authorized administrative accounts. Access is managed via the Command Center portal.</p>

      <div className="table-container-outer mt-30">
        <table className="admin-data-table">
          <thead>
            <tr><th>Name</th><th>Role</th><th>Email</th><th>Team</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5}>Loading directory...</td></tr> : 
             activeAdmins.map(adm => (
              <tr key={adm.id}>
                <td>{adm.firstName} {adm.lastName}</td>
                <td>
                    <span className={`role-badge ${adm.type || 'admin'}`}>
                        {(adm.roleLevel || adm.type || 'ADMIN').toUpperCase()}
                    </span>
                </td>
                <td className="admin-email-cell">{adm.email}</td>
                <td><span className="category-pill">{adm.assignment || adm.team || 'N/A'}</span></td>
                <td>
                  <button 
                    onClick={() => handleDemote(adm.id, adm.firstName)}
                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold' }}
                  >
                    Demote
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const WebsiteSettingsView: React.FC = () => {
  const toastContext = useToast();
  const { settings, loading } = usePageSettings();

  const handleToggle = async (pageKey: string, currentValue: boolean) => {
    try {
      await setDoc(doc(db, 'settings', 'pages'), { [pageKey]: !currentValue }, { merge: true });
      toastContext?.success("Page visibility updated successfully!");
    } catch (err) {
      console.error(err);
      toastContext?.error("Error updating page visibility.");
    }
  };

  if (loading) return <div>Loading settings...</div>;

  const pages = [
    { key: 'home', label: 'Home Page' },
    { key: 'workshops', label: 'Workshops Page' },
    { key: 'competitions', label: 'Competitions Page' },
    { key: 'team', label: 'Team Page' },
    { key: 'schedule', label: 'Schedule Page' },
    { key: 'sponsors', label: 'Sponsors Page' },
    { key: 'contact', label: 'Contact Page' }
  ];

  return (
    <div className="admin-overview" style={{ animation: 'fadeIn 0.3s ease' }}>
      <h2 style={{ color: '#fff', marginBottom: '8px' }}>Website Settings</h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '32px' }}>Toggle public visibility of application pages. Pages turned off will show a "Coming Soon" screen.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {pages.map((page) => {
          const isVisible = settings[page.key as keyof typeof settings] ?? true;
          
          return (
            <div key={page.key} style={{ 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '20px', 
              padding: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'all 0.3s ease'
            }}>
              <div>
                <h3 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '1.2rem' }}>{page.label}</h3>
                <span style={{ 
                  color: isVisible ? 'rgb(94, 255, 91)' : 'rgba(255,255,255,0.4)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  background: isVisible ? 'rgba(94, 255, 91, 0.1)' : 'rgba(255,255,255,0.05)',
                  padding: '4px 8px',
                  borderRadius: '6px'
                }}>
                  {isVisible ? 'LIVE' : 'COMING SOON'}
                </span>
              </div>
              
              <button 
                onClick={() => handleToggle(page.key, isVisible)}
                style={{
                  width: '56px',
                  height: '32px',
                  borderRadius: '20px',
                  background: isVisible ? '#5227ff' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  left: isVisible ? '28px' : '4px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDashboard;
