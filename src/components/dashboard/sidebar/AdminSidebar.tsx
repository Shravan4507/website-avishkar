import React from 'react';
import { BarChart2, Users, Settings, Wrench, LogOut, Ticket, Shield } from 'lucide-react';
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
  { id: 'sponsors',      label: 'Sponsors & Partners', Icon: Shield },
  { id: 'support',       label: 'Support Tickets', Icon: Users },
  { id: 'admins',        label: 'Admin Directory', Icon: Shield },
  { id: 'users',         label: 'Manage Users',   Icon: Users },
  { id: 'events',        label: 'Event Settings', Icon: Wrench },
  { id: 'website_settings', label: 'Website Settings', Icon: Settings },
  { id: 'settings',      label: 'Master Settings',Icon: Settings },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, setActiveTab, isSuper, adminProfile }) => {
  const handleLogout = async () => {
    try {
      await auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error("Admin Logout Error:", error);
    }
  };

  const getFilteredNav = () => {
    if (isSuper || adminProfile?.roleLevel === 'superadmin') return ADMIN_NAV;
    
    return ADMIN_NAV.filter(item => {
      if (item.id === 'overview') return true;
      
      const role = adminProfile?.roleLevel;
      const assignment = adminProfile?.assignment;
      
      if (item.id === 'registrations') {
        return ['department_admin', 'competition_admin'].includes(role || '') || assignment === 'Registration Team';
      }
      if (item.id === 'content') {
        return role === 'department_admin' || assignment === 'Technical Team';
      }
      if (item.id === 'events' || item.id === 'settings') {
        return assignment === 'Technical Team';
      }
      if (item.id === 'sponsors') {
        return assignment === 'Sponsorship Team';
      }
      if (item.id === 'support') {
        return assignment === 'Support Team';
      }
      if (item.id === 'users') {
        return assignment === 'Registration Team';
      }
      
      return false;
    });
  };

  const filteredNav = getFilteredNav();

  return (
    <aside className="dashboard-sidebar admin-sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-logo">Admin Console</h2>
      </div>

      <nav className="sidebar-nav">
        {filteredNav.map(({ id, label, Icon }) => (
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
