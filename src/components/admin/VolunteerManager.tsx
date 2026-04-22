import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc, where } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useToast } from '../toast/Toast';
import { Search, Edit, Trash2, Download, Printer, UserCheck } from 'lucide-react';
import * as XLSX from 'xlsx';

const SCANNER_ROLE_OPTIONS = [
  { value: 'gate', label: 'Gate Entry Scanner' },
  { value: 'param-x', label: 'Param-X Scanner' },
  { value: 'battle-grid', label: 'Battle Grid Scanner' },
  { value: 'robo-kshetra', label: 'Robo-Kshetra Scanner' },
  { value: 'forge-x', label: 'Forge-X Scanner' },
  { value: 'algo-bid', label: 'Algo-Bid Scanner' },
  { value: 'code-ladder', label: 'Code-Ladder Scanner' }
];

export default function VolunteerManager() {
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [promoteSearch, setPromoteSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  const [editVol, setEditVol] = useState<any | null>(null);
  const [promotedRole, setPromotedRole] = useState('gate');
  const toast = useToast();

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'user'), where('role', '==', 'volunteer'));
      const snap = await getDocs(q);
      const vols = snap.docs.map(d => ({ id: d.id, ...d.data(), staffType: 'volunteer' }));

      // Fetch Admins
      const adminSnap = await getDocs(collection(db, 'admins'));
      const admins = adminSnap.docs.map(d => ({ id: d.id, ...d.data(), staffType: 'admin' }));

      setVolunteers([...admins, ...vols]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load staff');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoteSearch.trim()) return;
    setSearching(true);
    try {
      const searchVal = promoteSearch.trim();
      let q;
      if (searchVal.includes('@')) {
        q = query(collection(db, 'user'), where('email', '==', searchVal));
      } else {
        const uAvr = searchVal.toUpperCase().startsWith('AVR-') ? searchVal.toUpperCase() : `AVR-${searchVal.toUpperCase()}`;
        q = query(collection(db, 'user'), where('avrId', '==', uAvr));
      }
      const snap = await getDocs(q);
      if (snap.empty) {
        toast.error('No user found');
        setSearchResults([]);
      } else {
        setSearchResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (err) {
      console.error(err);
      toast.error('Search failed');
    }
    setSearching(false);
  };

  const promoteUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'user', userId), {
        role: 'volunteer',
        scannerRole: promotedRole
      });
      toast.success('User promoted to Volunteer!');
      setSearchResults([]);
      setPromoteSearch('');
      fetchStaff();
    } catch (err) {
      console.error(err);
      toast.error('Failed to promote');
    }
  };

  const demoteVolunteer = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this volunteer?')) return;
    try {
      await updateDoc(doc(db, 'user', userId), {
        role: 'user',
        scannerRole: null
      });
      toast.success('Volunteer demoted.');
      fetchStaff();
    } catch (err) {
      toast.error('Failed to demote');
    }
  };

  const updateVolunteerRole = async () => {
    if (!editVol) return;
    try {
      await updateDoc(doc(db, 'user', editVol.id), {
        scannerRole: editVol.scannerRole
      });
      toast.success('Volunteer updated!');
      setEditVol(null);
      fetchStaff();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const exportExcel = () => {
    const data = volunteers.map(v => ({
      'AVR ID': v.staffType === 'admin' ? v.avrAdmId : v.avrId,
      'Name': `${v.firstName || ''} ${v.lastName || ''}`.trim() || v.email.split('@')[0],
      'Email': v.email,
      'Phone': v.phone || 'N/A',
      'Role': v.staffType === 'admin' ? 'Admin' : 'Volunteer',
      'Scanner Access': v.staffType === 'admin' ? 'All Access' : (v.scannerRole || 'gate')
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Staff_And_Volunteers');
    XLSX.writeFile(wb, `Aavishkar_Ops_Roster_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const printIDCards = () => {
    if (volunteers.length === 0) {
      toast.warning('No volunteers to print');
      return;
    }
    
    // Generate static HTML for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let html = `
      <html>
      <head>
        <title>Print Volunteer ID Cards</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #fff; margin: 0; padding: 20px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
          .id-card { 
            border: 2px solid #5a2eb2; 
            border-radius: 12px; 
            width: 320px; 
            height: 480px; 
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            background: #fff;
            color: #000;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            page-break-inside: avoid;
          }
          .header { background: #1a0b3f; color: #fff; text-align: center; padding: 15px; }
          .header h2 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 1px; }
          .header p { margin: 4px 0 0; font-size: 11px; opacity: 0.8; letter-spacing: 2px; }
          .photo-placeholder { width: 100px; height: 100px; background: #eee; border: 3px solid #5a2eb2; border-radius: 50%; margin: 20px auto; display: flex; align-items: center; justify-content: center; font-size: 36px; color: #ccc; }
          .info { text-align: center; padding: 0 20px; }
          .name { font-size: 24px; font-weight: 700; margin: 0 0 5px; color: #1a0b3f;}
          .role { font-size: 14px; font-weight: 600; color: #d946ef; margin: 0 0 15px; text-transform: uppercase; background: rgba(217, 70, 239, 0.1); display: inline-block; padding: 4px 12px; border-radius: 4px; }
          .avr { font-size: 16px; font-weight: bold; background: #f3f4f6; padding: 8px; border-radius: 6px; border: 1px solid #e5e7eb; }
          .strip { background: #d946ef; color: white; text-align: center; padding: 8px; font-weight: bold; position: absolute; bottom: 0; width: 100%; border-top: 1px solid rgba(0,0,0,0.1); font-size: 12px; }
          @media print {
            body { background: white; padding: 0; }
            .id-card { box-shadow: none; }
          }
        </style>
      </head>
      <body>
    `;

    volunteers.forEach(v => {
      const isAdmin = v.staffType === 'admin';
      const parsedRole = isAdmin ? (
        v.roleLevel?.includes('superadmin') ? 'SUPER ADMIN' : 
        v.roleLevel?.some((r: string) => r.startsWith('department_admin')) ? 'DEPARTMENT HEAD' :
        v.roleLevel?.some((r: string) => r.startsWith('core_team')) ? 'CORE TEAM' : 'EVENT CO-ORDINATOR'
      ) : 'VOLUNTEER';

      const modeLabel = isAdmin ? 'ALL ACCESS / GLOBAL' : (SCANNER_ROLE_OPTIONS.find(o => o.value === v.scannerRole)?.label || 'GATE SCANNER');
      const displayId = isAdmin ? (v.avrAdmId || v.avrId) : v.avrId;
      const fName = (v.firstName || v.email?.split('@')[0] || 'V').toUpperCase();
      const lName = (v.lastName || '').toUpperCase();

      html += `
        <div class="id-card">
          <div class="header">
            <h2>AAVISHKAR '26</h2>
            <p>OFFICIAL ORGANIZING TEAM</p>
          </div>
          <div class="photo-placeholder">${fName.charAt(0)}</div>
          <div class="info">
            <p class="name">${fName} ${lName}</p>
            <p class="role" style="background: ${isAdmin ? 'rgba(16, 185, 129, 0.1)' : 'rgba(217, 70, 239, 0.1)'}; color: ${isAdmin ? '#10b981' : '#d946ef'};">${parsedRole}</p>
            <p class="avr">${displayId || 'UNKNOWN'}</p>
          </div>
          <div class="strip">${modeLabel.toUpperCase()}</div>
        </div>
      `;
    });

    html += `</body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 1000);
  };

  const filteredVols = volunteers.filter(v => 
    v.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.avrId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.avrAdmId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-tab-section animate-in">
      {/* Header */}
      <div className="tab-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 className="tab-title-premium">Volunteer Ops</h1>
          <p className="tab-subtitle-premium" style={{ margin: 0 }}>Promote, demote, and track terminal scanner access</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="admin-action-btn" onClick={exportExcel} style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.15)' }}>
            <Download size={16} /> Export
          </button>
          <button className="admin-action-btn" onClick={printIDCards} style={{ color: '#d946ef', borderColor: 'rgba(217, 70, 239, 0.3)', background: 'rgba(217, 70, 239, 0.15)' }}>
            <Printer size={16} /> Print IDs
          </button>
        </div>
      </div>

      {/* Promotion Bar */}
      <div className="filter-bar" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem', marginBottom: '2rem', background: 'linear-gradient(145deg, rgba(20,20,30,0.5), rgba(0,0,0,0.6))', border: '1px solid rgba(167, 139, 250, 0.2)', borderRadius: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserCheck size={18} color="#a78bfa" /> Promote to Volunteer
        </h3>
        <form onSubmit={handleSearchUser} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div className="admin-search-container" style={{ position: 'relative', flex: '1 1 250px' }}>
            <Search size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Enter User's AVR-ID or Email to search..." 
              value={promoteSearch}
              onChange={e => setPromoteSearch(e.target.value)}
              style={{ width: '100%', padding: '12px 16px 12px 40px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }}
            />
          </div>
          <button type="submit" className="admin-action-btn" disabled={searching} style={{ padding: '0 24px' }}>
             {searching ? 'Looking up...' : 'Find User'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            {searchResults.map(u => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600, color: '#fff', fontSize: '1.1rem' }}>{u.firstName} {u.lastName} <span style={{ color: '#a78bfa', fontSize: '0.9rem', marginLeft: '5px' }}>({u.avrId})</span></span>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{u.email}</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select 
                    style={{ padding: '10px 16px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(167, 139, 250, 0.3)', outline: 'none', cursor: 'pointer' }}
                    value={promotedRole} 
                    onChange={e => setPromotedRole(e.target.value)}
                  >
                    {SCANNER_ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <button className="admin-action-btn" onClick={() => promoteUser(u.id)} style={{ background: '#a78bfa', color: '#000', border: 'none', fontWeight: 'bold' }}>
                    Grant Access
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Database Filter Bar */}
      <div className="filter-bar" style={{ display: 'flex', gap: '1rem', padding: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div className="filter-group" style={{ flex: '1 1 250px' }}>
          <label>Filter Directory</label>
          <div className="admin-search-container" style={{ position: 'relative' }}>
            <Search size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Filter by name, ID..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '12px 16px 12px 40px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="premium-table-container">
        {loading ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            <p>Loading directory...</p>
          </div>
        ) : (
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>AVR ID</th>
                <th>Name</th>
                <th>Assigned Scanner</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVols.map(v => {
                const isAdmin = v.staffType === 'admin';
                const parsedRole = isAdmin ? (
                  v.roleLevel?.includes('superadmin') ? 'Super Admin' : 
                  v.roleLevel?.some((r: string) => r.startsWith('department_admin')) ? 'Department Head' :
                  v.roleLevel?.some((r: string) => r.startsWith('core_team')) ? 'Core Team' : 'Event Co-ordinator'
                ) : 'Volunteer';

                return (
                  <tr key={v.id}>
                    <td className="avr-id-cell">{isAdmin ? v.avrAdmId : v.avrId}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: '#fff' }}>{(v.firstName || v.email.split('@')[0])} {v.lastName || ''}</span>
                        <span style={{ fontSize: '0.8rem', opacity: 0.7, color: isAdmin ? '#10b981' : '#d946ef', fontWeight: 600 }}>{parsedRole}</span>
                      </div>
                    </td>
                    <td>
                      {editVol?.id === v.id ? (
                        <select 
                          value={editVol.scannerRole || 'gate'} 
                          onChange={e => setEditVol({...editVol, scannerRole: e.target.value})}
                          style={{ padding: '8px', borderRadius: '6px', background: '#000', color: '#fff', border: '1px solid rgba(167, 139, 250, 0.4)' }}
                        >
                          {SCANNER_ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      ) : (
                        <span className="badge" style={{ background: isAdmin ? 'rgba(16, 185, 129, 0.15)' : 'rgba(167, 139, 250, 0.15)', color: isAdmin ? '#10b981' : '#a78bfa', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
                          {isAdmin ? 'All Access (Admin)' : (SCANNER_ROLE_OPTIONS.find(o => o.value === v.scannerRole)?.label || v.scannerRole || 'Gate')}
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.85rem' }}>{v.email}</span>
                        {v.phone && <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{v.phone}</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {!isAdmin ? (
                          <>
                            {editVol?.id === v.id ? (
                              <button onClick={updateVolunteerRole} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>Save</button>
                            ) : (
                              <button onClick={() => setEditVol(v)} style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                                <Edit size={14} /> Edit
                              </button>
                            )}
                            
                            <button 
                              onClick={() => demoteVolunteer(v.id)}
                              style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                            >
                              <Trash2 size={14} /> Demote
                            </button>
                          </>
                        ) : (
                           <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>Managed in <br/>Admin Directory</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredVols.length === 0 && (
                 <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>No volunteers found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
