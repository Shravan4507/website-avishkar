import React from 'react';
import { LayoutDashboard, CalendarDays, Laptop, Settings, LogOut } from 'lucide-react';
import { auth } from '../../../firebase/firebase';
import './Sidebar.css';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const NAV_ITEMS = [
  { id: 'overview',  label: 'Overview',      Icon: LayoutDashboard },
  { id: 'events',    label: 'My Events',     Icon: CalendarDays },
  { id: 'workshops', label: 'My Workshops',  Icon: Laptop },
  { id: 'settings',  label: 'Settings',      Icon: Settings },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const handleLogout = async () => {
    try {
      await auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-logo">Avishkar</h2>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ id, label, Icon }) => (
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

export default Sidebar;
