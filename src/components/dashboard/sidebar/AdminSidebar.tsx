import React from 'react';
import { BarChart2, Users, Wrench, LogOut, Ticket, Shield, Search } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../firebase/firebase';
import type { AdminProfile } from '../../../pages/admin/admindashboard';
import './Sidebar.css';
import './AdminSidebar.css';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSuper: boolean;
  adminProfile: AdminProfile | null;
}

const ADMIN_NAV = [
  { id: 'overview',      label: 'Command Center', Icon: BarChart2 },
  { id: 'registrations', label: 'Registrations',  Icon: Ticket },
  { id: 'content',       label: 'Content Editor', Icon: Wrench },
  { id: 'search',        label: 'Global Search',  Icon: Search },
  { id: 'sponsors',      label: 'Sponsors & Partners', Icon: Shield },
  { id: 'stall_bookings', label: 'Marketplace Bookings', Icon: Ticket },
  { id: 'hackathon_regs', label: 'ParamX Registrations', Icon: Users },
  { id: 'support',       label: 'Support Tickets', Icon: Users },
  { id: 'admins',        label: 'Admin Directory', Icon: Shield },
  { id: 'users',         label: 'Manage Users',   Icon: Users },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, setActiveTab, isSuper, adminProfile }) => {
  const [user] = useAuthState(auth);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error("Admin Logout Error:", error);
    }
  };

  const getFilteredNav = () => {
    if (isSuper || adminProfile?.roleLevel === 'superadmin') {
      return ADMIN_NAV.filter(item => !['overview', 'registrations', 'content', 'search'].includes(item.id));
    }
    
    return ADMIN_NAV.filter(item => {
      if (['overview', 'registrations', 'content', 'search'].includes(item.id)) return false;
      const assignment = adminProfile?.assignment || '';
      if (item.id === 'events' || item.id === 'settings') return assignment === 'Technical Team';
      if (item.id === 'sponsors') return assignment === 'Sponsorship Team';
      if (item.id === 'support') return assignment === 'Support Team';
      if (item.id === 'users') return assignment === 'Registration Team';
      if (item.id === 'hackathon_regs') return adminProfile?.roleLevel === 'flagship_admin-paramx--26';
      return false;
    });
  };

  const additionalNav = getFilteredNav();

  return (
    <aside className="dashboard-sidebar admin-sidebar">
      <div className="sidebar-header" style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '45px', height: '45px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(167, 139, 250, 0.3)' }}>
             <img 
               src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
               alt="User" 
               style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
             />
          </div>
          <div>
            <h2 className="sidebar-logo" style={{ fontSize: '1.1rem', marginBottom: '2px' }}>Admin Node</h2>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'Iceland' }}>{adminProfile?.avrAdmId || 'Scanning...'}</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`sidebar-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart2 size={18} strokeWidth={1.8} />
          <span>Command Center</span>
        </button>

        <button
          className={`sidebar-btn ${activeTab === 'registrations' ? 'active' : ''}`}
          onClick={() => setActiveTab('registrations')}
        >
          <Ticket size={18} strokeWidth={1.8} />
          <span>Registrations</span>
        </button>

        <button
          className={`sidebar-btn ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          <Wrench size={18} strokeWidth={1.8} />
          <span>Content Editor</span>
        </button>

        <button
          className={`sidebar-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <Search size={18} strokeWidth={1.8} />
          <span>Global Search</span>
        </button>

        <div className="sidebar-divider" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '15px 10px' }}></div>
        
        {additionalNav.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`sidebar-btn ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} strokeWidth={1.8} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
