import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useToast } from '../../components/toast/Toast';
import { Search, Loader2, Users, Download, Trash2, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

interface UserData {
  id: string;
  avrId: string;
  firstName?: string;
  lastName?: string;
  name?: string; 
  displayName?: string; 
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
    if (!window.confirm(`Are you sure you want to delete user ${avrId}? This action cannot be undone.`)) return;

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
    if (users.length === 0) return toast.error('No data to export');
    
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
      <div className="tab-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 className="tab-title-premium">User Management</h1>
          <p className="tab-subtitle-premium" style={{ margin: 0 }}>View and manage registered accounts</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="admin-action-btn" onClick={fetchUsers}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="admin-action-btn" onClick={exportData} style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.15)' }}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="filter-bar" style={{ display: 'flex', gap: '1rem', padding: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <div className="filter-group" style={{ flex: '1 1 250px' }}>
          <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Search Users</label>
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
        <div className="filter-group" style={{ flex: '0 0 auto', display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ background: 'rgba(167, 139, 250, 0.1)', padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(167, 139, 250, 0.2)', color: '#a78bfa', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', height: '46px' }}>
            <Users size={18} />
            Total: {filteredUsers.length}
          </div>
        </div>
      </div>

      <div className="premium-table-container" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
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
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                <tr>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.4)' }}>AVR ID</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.4)' }}>Name</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.4)' }}>Contact</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.4)' }}>Context</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.4)' }}>Joined</th>
                  {isSuper && <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.4)' }}>Actions</th>}
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.9rem' }}>
                {filteredUsers.map(user => {
                  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || user.displayName || 'Unknown';
                  const dateRaw = user.createdAt?.toDate ? user.createdAt.toDate() : new Date();
                  const joinedStr = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(dateRaw);
                  
                  return (
                    <tr key={user.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '16px 20px', color: '#a78bfa', fontWeight: 700, fontFamily: 'monospace' }}>{user.avrId || 'NO-ID'}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: '#fff' }}>{name}</span>
                          <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{user.sex || 'Unknown'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.85rem', color: '#fff' }}>{user.email || 'No email'}</span>
                          <span style={{ fontSize: '0.8rem', opacity: 0.7, color: '#a78bfa' }}>{user.whatsappNumber || user.phone || 'No phone'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', whiteSpace: 'normal', maxWidth: '200px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.college || 'No college'}</span>
                          <span style={{ fontSize: '0.75rem', color: '#3b82f6' }}>{user.major || user.department || 'No dept'} • Pass: {user.passingYear || user.year || '-'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>{joinedStr}</td>
                      {isSuper && (
                        <td style={{ padding: '16px 20px' }}>
                          <button 
                            onClick={() => handleDeleteUser(user.id, user.avrId)}
                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
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
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManager;
