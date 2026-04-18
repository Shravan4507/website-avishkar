import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useToast } from '../toast/Toast';
import { Search, Loader2, Users, Download, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import './UserManager.css';

interface UserData {
  id: string;
  avrId: string;
  firstName?: string;
  lastName?: string;
  name?: string; // Fallback
  displayName?: string; // Fallback
  email: string;
  phone?: string;
  whatsappNumber?: string;
  college?: string;
  department?: string;
  major?: string;
  year?: string;
  passingYear?: number | string;
  sex?: string;
  dob?: string;
  createdAt?: any;
}

interface UserManagerProps {
  isSuper?: boolean;
}

const UserManager: React.FC<UserManagerProps> = ({ isSuper }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Pulling all users, ordered by creation time
      const usersQuery = query(collection(db, 'user'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(usersQuery);
      const data: UserData[] = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserData[];
      setUsers(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userDocId: string, avrId: string) => {
    if (!isSuper) {
      toast.error('Only superadmins can delete users.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user ${avrId}? This action cannot be undone and will not remove their associated registrations.`)) return;

    try {
      await deleteDoc(doc(db, 'user', userDocId));
      setUsers(prev => prev.filter(u => u.id !== userDocId));
      toast.success(`User ${avrId} deleted successfully.`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete user.');
    }
  };

  const exportData = () => {
    if (users.length === 0) return toast.warning('No data to export');
    
    const exportArr = users.map(u => ({
      'AVR-ID': u.avrId || 'N/A',
      'First Name': u.firstName || u.name?.split(' ')[0] || u.displayName || 'N/A',
      'Last Name': u.lastName || u.name?.split(' ').slice(1).join(' ') || '',
      'Email': u.email || 'N/A',
      'Phone': u.whatsappNumber || u.phone || 'N/A',
      'College': u.college || 'N/A',
      'Department': u.major || u.department || 'N/A',
      'Passing Year': u.passingYear || u.year || 'N/A',
      'Gender': u.sex || 'N/A',
      'DOB': u.dob || 'N/A',
      'Registered At': u.createdAt?.toDate ? u.createdAt.toDate().toLocaleString() : new Date().toLocaleString()
    }));

    const ws = XLSX.utils.json_to_sheet(exportArr);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, `avishkar_users_export_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return users.filter(u => {
      const id = (u.avrId || '').toLowerCase();
      const mail = (u.email || '').toLowerCase();
      const fName = (u.firstName || '').toLowerCase();
      const lName = (u.lastName || '').toLowerCase();
      const col = (u.college || '').toLowerCase();
      return id.includes(q) || mail.includes(q) || fName.includes(q) || lName.includes(q) || col.includes(q);
    });
  }, [users, searchTerm]);

  return (
    <div className="admin-tab-section animate-in">
      {/* Header */}
      <div className="tab-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 className="tab-title-premium">User Management</h1>
          <p className="tab-subtitle-premium" style={{ margin: 0 }}>View and manage registered accounts</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="admin-action-btn" onClick={fetchUsers}>
            <Search size={16} /> Refresh
          </button>
          <button className="admin-action-btn" onClick={exportData} style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.15)' }}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar" style={{ display: 'flex', gap: '1rem', padding: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <div className="filter-group" style={{ flex: '1 1 250px' }}>
          <label>Search Users</label>
          <div className="admin-search-container" style={{ position: 'relative' }}>
            <Search size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by name, email, AVR-ID..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '12px 16px 12px 40px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }}
            />
          </div>
        </div>
        <div className="filter-group" style={{ flex: '0 0 auto', justifyContent: 'flex-end' }}>
          <div style={{ background: 'rgba(167, 139, 250, 0.1)', padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(167, 139, 250, 0.2)', color: '#a78bfa', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', height: '46px' }}>
            <Users size={18} />
            Total: {filteredUsers.length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="premium-table-container">
        {loading ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            <Loader2 size={32} className="manual-spinner" style={{ margin: '0 auto 1rem auto', color: '#a78bfa' }} />
            <p>Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            <Users size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
            <p>No users found matching your search.</p>
          </div>
        ) : (
          <table className="admin-data-table user-manager-table">
            <thead>
              <tr>
                <th>AVR ID</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Context</th>
                <th>Joined</th>
                {isSuper && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => {
                const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || user.displayName || 'Unknown';
                const dateRaw = user.createdAt?.toDate ? user.createdAt.toDate() : new Date();
                const joinedStr = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(dateRaw);
                
                // Calculate age accurately handling DD/MM/YYYY
                let ageStr = '?';
                if (user.dob) {
                  let birthYear = NaN;
                  if (user.dob.includes('/')) {
                    const parts = user.dob.split('/');
                    if (parts.length === 3) birthYear = parseInt(parts[2], 10);
                  } else {
                    birthYear = new Date(user.dob).getFullYear();
                  }
                  if (!isNaN(birthYear)) {
                    ageStr = (new Date().getFullYear() - birthYear).toString();
                  }
                }
                
                return (
                  <tr key={user.id}>
                    <td className="avr-id-cell">{user.avrId || 'NO-ID'}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: '#fff' }}>{name}</span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{user.sex || 'Unknown'} • Age: {ageStr}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.85rem' }}>{user.email || 'No email'}</span>
                        <span style={{ fontSize: '0.8rem', opacity: 0.7, color: '#a78bfa' }}>{user.whatsappNumber || user.phone || 'No phone'}</span>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'normal', maxWidth: '200px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.college || 'No college'}</span>
                        <span style={{ fontSize: '0.75rem', color: '#3b82f6' }}>{user.major || user.department || 'No dept'} • Pass Year: {user.passingYear || user.year || '-'}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem', opacity: 0.8 }}>{joinedStr}</td>
                    {isSuper && (
                      <td>
                        <button 
                          onClick={() => handleDeleteUser(user.id, user.avrId)}
                          style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                          title="Delete User"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserManager;
