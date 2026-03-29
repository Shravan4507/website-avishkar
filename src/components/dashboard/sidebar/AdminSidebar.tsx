import React from 'react';
import { BarChart2, Users, LogOut, Ticket, Shield, Search, Sparkles } from 'lucide-react';
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

  const navItems = [
    { id: 'overview',      label: 'Command Center', Icon: BarChart2, visible: true },
    { id: 'registrations', label: 'Registrations',  Icon: Ticket, visible: isSuper },
    { id: 'search',        label: 'Global Search',  Icon: Search, visible: isSuper },
    { id: 'sponsors',      label: 'Sponsors & Partners', Icon: Shield, visible: isSuper || adminProfile?.assignment === 'Sponsorship Team' },
    { id: 'stall_bookings', label: 'Marketplace Bookings', Icon: Ticket, visible: isSuper },
    { id: 'hackathon_regs', label: 'ParamX Registrations', Icon: Users, visible: isSuper || adminProfile?.roleLevel?.includes('admin-param-x') },
    { id: 'battlegrid_regs', label: 'Battle Grid Registrations', Icon: Ticket, visible: isSuper || adminProfile?.roleLevel?.includes('admin-battle-grid') },
    { id: 'robokshetra_regs', label: 'Robo Kshetra Registrations', Icon: Ticket, visible: isSuper || adminProfile?.roleLevel?.includes('admin-robo-kshetra') },
    { id: 'forgex_regs',      label: 'Forge-X Registrations',       Icon: Ticket, visible: isSuper || adminProfile?.roleLevel?.includes('admin-forge-x') },
    { id: 'algobid_regs',     label: 'Algo-Bid Registrations',      Icon: Ticket, visible: isSuper || adminProfile?.roleLevel?.includes('admin-algo-bid') },
    { id: 'codeladder_regs',  label: 'Code-Ladder Registrations',   Icon: Ticket, visible: isSuper || adminProfile?.roleLevel?.includes('admin-code-ladder') },
    { id: 'orbitx_regs',      label: 'Solar Spot Registrations',    Icon: Sparkles, visible: isSuper || adminProfile?.roleLevel?.includes('workshop-solar-spot') },
    { id: 'support',       label: 'Support Tickets', Icon: Users, visible: isSuper || adminProfile?.assignment === 'Support Team' },
    { id: 'admins',        label: 'Admin Directory', Icon: Shield, visible: isSuper },
    { id: 'users',         label: 'Manage Users',   Icon: Users, visible: isSuper || adminProfile?.assignment === 'Registration Team' },
  ];

  const mainNav = navItems.filter(item => ['overview', 'registrations', 'search'].includes(item.id) && item.visible);
  const additionalNav = navItems.filter(item => !['overview', 'registrations', 'search'].includes(item.id) && item.visible);

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
        {mainNav.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`sidebar-btn ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </button>
        ))}

        {additionalNav.length > 0 && <div className="sidebar-divider" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '15px 10px' }}></div>}
        
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
