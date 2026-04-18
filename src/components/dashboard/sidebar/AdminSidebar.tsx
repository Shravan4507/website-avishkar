import React from 'react';
import { BarChart2, Users, LogOut, Ticket, Shield, Search, Sparkles, Mail, Gamepad2, Cpu, Code, FileText, UserPlus, Edit } from 'lucide-react';
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

  const hasRole = (role: string) => adminProfile?.roleLevel?.includes(role);
  const isDeptAdmin = adminProfile?.roleLevel?.some((r: string) => r.startsWith('department_admin')) || false;
  const isCoreTeam = adminProfile?.roleLevel?.some((r: string) => r.startsWith('core_team')) || false;
  const isCompAdmin = adminProfile?.roleLevel?.some((r: string) => r.startsWith('admin-') || r === 'competition_admin') || false;

  const navItems = [
    // Core
    { id: 'overview',       label: 'Command Center',    Icon: BarChart2, visible: true },
    { id: 'registrations',  label: 'Registrations',     Icon: Ticket, visible: isSuper || isDeptAdmin || adminProfile?.assignment === 'core_team-technical-team' },
    { id: 'manual_entry',   label: 'Manual Registration', Icon: UserPlus, visible: isSuper || isDeptAdmin || isCompAdmin || adminProfile?.roleLevel?.some((r: string) => r.startsWith('workshop-')) },
    { id: 'search',         label: 'Global Search',     Icon: Search, visible: isSuper || isCoreTeam },
    { id: 'sponsors',       label: 'Sponsors & Partners', Icon: Shield, visible: isSuper || adminProfile?.assignment === 'core_team-sponsorship-team' || hasRole('core_team-sponsorship-team') },
    { id: 'stall_bookings', label: 'Marketplace Bookings', Icon: Ticket, visible: isSuper },
    { id: 'event_manager',  label: 'Event Manager',       Icon: Edit,   visible: isSuper || isDeptAdmin || isCompAdmin },

    // Flagship — ParamX
    { id: 'hackathon_regs', label: 'ParamX Registrations', Icon: Users, visible: isSuper || hasRole('admin-param-x') },

    // Flagship — Battle Grid (individual games)
    { id: 'bgmi_regs',     label: 'BGMI Registrations',          Icon: Gamepad2, visible: isSuper || hasRole('admin-battle-grid') || hasRole('admin-bgmi') },
    { id: 'freefire_regs', label: 'Free Fire Registrations',     Icon: Gamepad2, visible: isSuper || hasRole('admin-battle-grid') || hasRole('admin-freefire') },
    { id: 'codm_regs',     label: 'COD Mobile Registrations',    Icon: Gamepad2, visible: isSuper || hasRole('admin-battle-grid') || hasRole('admin-codm') },
    { id: 'sf4_regs',      label: 'Shadow Fight 4 Registrations', Icon: Gamepad2, visible: isSuper || hasRole('admin-battle-grid') || hasRole('admin-sf4') },
    { id: 'amongus_regs',  label: 'Among Us Registrations',      Icon: Gamepad2, visible: isSuper || hasRole('admin-battle-grid') || hasRole('admin-amongus') },

    // Flagship — Robo-Kshetra (individual events)
    { id: 'alignx_regs',    label: 'AlignX Registrations',    Icon: Cpu, visible: isSuper || hasRole('admin-robo-kshetra') || hasRole('admin-align-x') },
    { id: 'roborush_regs',  label: 'RoboRush Registrations',  Icon: Cpu, visible: isSuper || hasRole('admin-robo-kshetra') || hasRole('admin-robo-rush') },

    // Standard Competitions
    { id: 'forgex_regs',        label: 'Forge-X Registrations',       Icon: Code, visible: isSuper || hasRole('admin-forge-x') },
    { id: 'algobid_regs',       label: 'AlgoBid Registrations',       Icon: Code, visible: isSuper || hasRole('admin-algo-bid') },
    { id: 'codeladder_regs',    label: 'Code Ladder Registrations',   Icon: Code, visible: isSuper || hasRole('admin-code-ladder') },
    { id: 'iplauction_regs',    label: 'IPL Auction Registrations',   Icon: Users, visible: isSuper || hasRole('admin-ipl-auction') },
    { id: 'blindcode_regs',     label: 'Blind Code Registrations',    Icon: Code, visible: isSuper || hasRole('admin-blind-code') },
    { id: 'devclash_regs',      label: 'DevClash Registrations',      Icon: Code, visible: isSuper || hasRole('admin-dev-clash') },
    { id: 'vibesprint_regs',    label: 'Vibe Sprint Registrations',   Icon: Sparkles, visible: isSuper || hasRole('admin-vibe-sprint') },
    { id: 'coderelay_regs',     label: 'Code Relay Registrations',    Icon: Code, visible: isSuper || hasRole('admin-code-relay') },
    { id: 'bridgenova_regs',    label: 'Bridge Nova Registrations',   Icon: Shield, visible: isSuper || hasRole('admin-bridge-nova') },
    { id: 'poster_regs',        label: 'Poster Presentation Regs',    Icon: FileText, visible: isSuper || hasRole('admin-poster') },
    { id: 'sparktank_regs',     label: 'Spark Tank Registrations',    Icon: Sparkles, visible: isSuper || hasRole('admin-spark-tank') },
    { id: 'matlab_regs',        label: 'Matlab Madness Registrations', Icon: Cpu, visible: isSuper || hasRole('admin-matlab') },
    { id: 'circuitsim_regs',    label: 'Circuit Sim Registrations',   Icon: Cpu, visible: isSuper || hasRole('admin-circuit-sim') },
    { id: 'contraption_regs',   label: 'Contraptions Registrations',  Icon: Cpu, visible: isSuper || hasRole('admin-contraptions') },
    { id: 'cricket_regs',       label: 'Circle Cricket Registrations', Icon: Users, visible: isSuper || hasRole('admin-circle-cricket') },
    { id: 'paper_regs',         label: 'Paper Presentation Regs',     Icon: FileText, visible: isSuper || hasRole('admin-paper-pres') },
    { id: 'project_regs',       label: 'Project Competition Regs',    Icon: FileText, visible: isSuper || hasRole('admin-project-comp') },

    // Workshop
    { id: 'orbitx_regs',   label: 'Solar Spot Registrations', Icon: Sparkles, visible: isSuper || hasRole('workshop-solar-spot') },

    // System
    { id: 'email_tester',  label: 'Email Tester',     Icon: Mail, visible: isSuper },
    { id: 'support',       label: 'Support Tickets',  Icon: Users, visible: isSuper || adminProfile?.assignment === 'core_team-support-team' || hasRole('core_team-support-team') },
    { id: 'admins',        label: 'Admin Directory',  Icon: Shield, visible: isSuper },
    { id: 'users',         label: 'Manage Users',     Icon: Users, visible: isSuper || adminProfile?.assignment === 'core_team-registration-team' || hasRole('core_team-registration-team') },
  ];

  const mainNav = navItems.filter(item => ['overview', 'registrations', 'manual_entry', 'search'].includes(item.id) && item.visible);
  const additionalNav = navItems.filter(item => !['overview', 'registrations', 'manual_entry', 'search'].includes(item.id) && item.visible);

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
