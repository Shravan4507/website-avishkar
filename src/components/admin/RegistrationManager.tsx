import React, { useState, useEffect, useMemo } from 'react';
import {
  collection, query, getDocs, orderBy, doc, updateDoc, deleteDoc
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useToast } from '../../components/toast/Toast';
import GlassSelect from '../../components/dropdown/GlassSelect';
import * as XLSX from 'xlsx';

import {
  Search, Download, Edit2, Trash2, X, Eye,
  ChevronUp, ChevronDown, Users, Ticket,
  Copy, Calendar, CreditCard, RotateCcw, 
  IndianRupee, UserCheck, UserX, User, Mail, Phone
} from 'lucide-react';

import './RegistrationManager.css';

/* ─── Types ─── */
interface Registration {
  id: string;
  userName: string;
  userEmail: string;
  avrId: string;
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
  paymentStatus: string;
  amountPaid: number;
  transactionId: string | null;
  status: string;
  allAvrIds?: string[];
  competitionHandle?: string;
  isFlagship?: boolean;
  teamName?: string;
  memberCount?: number;
  // Team details for modal
  members?: Array<{
    name: string;
    email: string;
    phone?: string;
    college?: string;
  }>;
  moonAddon?: boolean;
  _collection: 'registrations' | 'hackathon_registrations';
}

interface RegistrationManagerProps {
  forcedHandle?: string;
  title?: string;
  subtitle?: string;
}

/* ─── Component ─── */
const RegistrationManager: React.FC<RegistrationManagerProps> = ({ forcedHandle, title, subtitle }) => {
  const toast = useToast();

  // Data
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEvent, setFilterEvent] = useState('All');
  const [filterDept, setFilterDept] = useState('All');
  const [filterCollege, setFilterCollege] = useState('All');
  const [filterPayment, setFilterPayment] = useState('All');
  const [filterAttendance, setFilterAttendance] = useState('All');

  // Sort
  const [sortConfig, setSortConfig] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'registeredAt', dir: 'desc' });

  // UI State
  const [detailReg, setDetailReg] = useState<Registration | null>(null);
  const [editReg, setEditReg] = useState<Registration | null>(null);
  const [saving, setSaving] = useState(false);

  /* ────────────────── Fetch ────────────────── */
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [regSnap, hackSnap] = await Promise.all([
          getDocs(query(collection(db, 'registrations'), orderBy('registeredAt', 'desc'))),
          getDocs(query(collection(db, 'hackathon_registrations'), orderBy('createdAt', 'desc')))
        ]);

        const standardRegs = regSnap.docs.map(d => ({ 
          id: d.id, 
          ...d.data(),
          _collection: 'registrations'
        } as Registration));

        const hackathonRegs = hackSnap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            avrId: data.leaderAvrId || data.avrId || '—',
            userName: data.leaderName,
            userEmail: data.leaderEmail,
            userPhone: data.leaderPhone,
            userCollege: data.leaderCollege,
            eventName: data.psId ? `Hackathon (PS: ${data.psId})` : "Param-X '26",
            department: "Hackathon",
            registeredAt: data.createdAt || data.timestamp,
            paymentStatus: data.status === 'confirmed' ? 'paid' : 'pending',
            amountPaid: data.amountPaid || data.amount || 0,
            transactionId: data.transactionId || null,
            status: data.status || 'pending',
            isAttended: data.isAttended || false,
            teamName: data.teamName,
            memberCount: [data.member2Name, data.member3Name, data.member4Name].filter(Boolean).length + 1,
            members: [
              { name: data.leaderName, email: data.leaderEmail, phone: data.leaderPhone, college: data.leaderCollege },
              data.member2Name ? { name: data.member2Name, email: data.member2Email, phone: data.member2Phone, college: data.member2College } : null,
              data.member3Name ? { name: data.member3Name, email: data.member3Email, phone: data.member3Phone, college: data.member3College } : null,
              data.member4Name ? { name: data.member4Name, email: data.member4Email, phone: data.member4Phone, college: data.member4College } : null,
            ].filter(Boolean) as any,
            competitionHandle: 'ParamX-Hack',
            _collection: 'hackathon_registrations'
          } as Registration;
        });

        setRegistrations([...standardRegs, ...hackathonRegs]);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load registrations.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  /* ────────────────── Derived Data ────────────────── */
  const uniqueEvents = useMemo(() => ['All', ...new Set(registrations.map(r => r.eventName).filter(Boolean))], [registrations]);
  const uniqueDepts = useMemo(() => ['All', ...new Set(registrations.map(r => r.department).filter(Boolean))], [registrations]);
  const uniqueColleges = useMemo(() => ['All', ...new Set(registrations.map(r => r.userCollege).filter(Boolean))], [registrations]);

  const filtered = useMemo(() => {
    let result = [...registrations];

    if (forcedHandle) {
      result = result.filter(r => r.competitionHandle === forcedHandle);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r =>
        r.userName?.toLowerCase().includes(term) ||
        r.userEmail?.toLowerCase().includes(term) ||
        r.avrId?.toLowerCase().includes(term) ||
        r.transactionId?.toLowerCase().includes(term)
      );
    }
    if (filterEvent !== 'All') result = result.filter(r => r.eventName === filterEvent);
    if (filterDept !== 'All') result = result.filter(r => r.department === filterDept);
    if (filterCollege !== 'All') result = result.filter(r => r.userCollege === filterCollege);
    if (filterPayment !== 'All') result = result.filter(r => r.paymentStatus === filterPayment.toLowerCase());
    if (filterAttendance !== 'All') result = result.filter(r => filterAttendance === 'Attended' ? r.isAttended : !r.isAttended);

    // Sort
    result.sort((a: any, b: any) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'registeredAt') {
        aVal = aVal?.toDate ? aVal.toDate().getTime() : (aVal || 0);
        bVal = bVal?.toDate ? bVal.toDate().getTime() : (bVal || 0);
      }
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortConfig.dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.dir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [registrations, searchTerm, filterEvent, filterDept, filterCollege, filterPayment, filterAttendance, sortConfig]);

  /* ────────────────── Revenue Stats ────────────────── */
  const stats = useMemo(() => {
    const total = registrations.length;
    const paid = registrations.filter(r => r.paymentStatus === 'paid' || r.paymentStatus === 'success');
    const free = registrations.filter(r => r.paymentStatus === 'free' || !r.paymentStatus);
    const revenue = registrations.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
    const attended = registrations.filter(r => r.isAttended);
    return { total, paidCount: paid.length, freeCount: free.length, revenue, attendedCount: attended.length };
  }, [registrations]);

  /* ────────────────── Handlers ────────────────── */
  const toggleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleToggleAttendance = async (reg: Registration) => {
    const newVal = !reg.isAttended;
    try {
      await updateDoc(doc(db, reg._collection, reg.id), { isAttended: newVal });
      setRegistrations(prev => prev.map(r => r.id === reg.id ? { ...r, isAttended: newVal } : r));
    } catch (err) {
      console.error(err);
      toast.error('Failed to update attendance.');
    }
  };

  const handleDelete = async (reg: Registration) => {
    if (!window.confirm('Permanently delete this registration? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, reg._collection, reg.id));
      setRegistrations(prev => prev.filter(r => r.id !== reg.id));
      toast.success('Registration deleted.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete registration.');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editReg) return;
    setSaving(true);
    try {
      const updateData: any = {
        isAttended: editReg.isAttended
      };

      if (editReg._collection === 'hackathon_registrations') {
        updateData.leaderName = editReg.userName;
        updateData.leaderEmail = editReg.userEmail;
        updateData.leaderPhone = editReg.userPhone;
        updateData.status = editReg.paymentStatus === 'paid' ? 'confirmed' : 'pending';
      } else {
        updateData.userName = editReg.userName;
        updateData.userEmail = editReg.userEmail;
        updateData.userPhone = editReg.userPhone;
        updateData.eventName = editReg.eventName;
        updateData.category = editReg.category;
        updateData.department = editReg.department;
        updateData.paymentStatus = editReg.paymentStatus;
      }

      await updateDoc(doc(db, editReg._collection, editReg.id), updateData);
      setRegistrations(prev => prev.map(r => r.id === editReg.id ? { ...editReg } : r));
      toast.success('Registration updated.');
      setEditReg(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    if (filtered.length === 0) { toast.error('No data to export.'); return; }
    const data = filtered.map((r, i) => ({
      '#': i + 1,
      'Name': r.userName,
      'Email': r.userEmail,
      'AVR ID': r.avrId,
      'Phone': r.userPhone || 'N/A',
      'College': r.userCollege || 'N/A',
      'Major': r.userMajor || 'N/A',
      'Age': r.userAge || 'N/A',
      'Sex': r.userSex || 'N/A',
      'Event': r.eventName,
      'Category': r.category,
      'Department': r.department || 'General',
      'Payment': r.paymentStatus || 'free',
      'Amount (₹)': r.amountPaid || 0,
      'Transaction ID': r.transactionId || 'N/A',
      'Attended': r.isAttended ? 'Yes' : 'No',
      'Registered At': r.registeredAt?.toDate ? r.registeredAt.toDate().toLocaleString() : 'N/A'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registrations');
    XLSX.writeFile(wb, `Avishkar26_Registrations_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`Exported ${filtered.length} records.`);
  };

  const clearFilters = () => {
    setSearchTerm(''); setFilterEvent('All'); setFilterDept('All');
    setFilterCollege('All'); setFilterPayment('All'); setFilterAttendance('All');
  };

  const hasActiveFilters = searchTerm || filterEvent !== 'All' || filterDept !== 'All' || filterCollege !== 'All' || filterPayment !== 'All' || filterAttendance !== 'All';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  const formatDate = (ts: any) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortConfig.key !== col) return null;
    return sortConfig.dir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />;
  };

  /* ────────────────── Render ────────────────── */
  return (
    <div className="reg-manager">

      {/* ── Revenue Stats ── */}
      <div className="reg-stats-grid">
        <div className="reg-stat-card">
          <div className="reg-stat-icon"><Ticket size={20} /></div>
          <div className="reg-stat-info">
            <span className="reg-stat-label">Total Registrations</span>
            <span className="reg-stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="reg-stat-card revenue">
          <div className="reg-stat-icon"><IndianRupee size={20} /></div>
          <div className="reg-stat-info">
            <span className="reg-stat-label">Total Revenue</span>
            <span className="reg-stat-value">₹{stats.revenue.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className="reg-stat-card paid">
          <div className="reg-stat-icon"><CreditCard size={20} /></div>
          <div className="reg-stat-info">
            <span className="reg-stat-label">Paid</span>
            <span className="reg-stat-value">{stats.paidCount}</span>
          </div>
        </div>
        <div className="reg-stat-card free">
          <div className="reg-stat-icon"><Users size={20} /></div>
          <div className="reg-stat-info">
            <span className="reg-stat-label">Free</span>
            <span className="reg-stat-value">{stats.freeCount}</span>
          </div>
        </div>
        <div className="reg-stat-card attendance">
          <div className="reg-stat-icon"><UserCheck size={20} /></div>
          <div className="reg-stat-info">
            <span className="reg-stat-label">Attended</span>
            <span className="reg-stat-value">{stats.attendedCount}</span>
          </div>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="registration-manager-header">
        <div className="reg-info">
          <h1 className="reg-title">{title || 'Registration Manager'}</h1>
          <p className="reg-subtitle">
            {subtitle || (forcedHandle ? `Managing ${forcedHandle} registrations` : 'Consolidated view of all event registrations')}
            {' • '}
            {loading ? 'Scanning...' : 
              filtered.length !== registrations.length 
              ? <><span className="highlight-count">{filtered.length}</span> of {registrations.length} records</>
              : <>{registrations.length} total records</>
            }
          </p>
        </div>
        <div className="reg-actions">
          <button className="reg-btn-export" onClick={handleExport}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="reg-filter-bar">
        <div className="filter-group-wrap search">
          <span className="filter-label">Search</span>
          <div className="reg-search-wrap">
            <Search size={14} className="reg-search-icon" />
            <input
              type="text"
              placeholder="Name, email, AVR, txn..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="reg-search-input"
            />
          </div>
        </div>

        <div className="filter-group-wrap">
          <span className="filter-label">Event</span>
          <GlassSelect 
            value={filterEvent} 
            onChange={(v: string) => setFilterEvent(v)}
            className="reg-select"
            options={uniqueEvents.map(e => ({ label: e, value: e }))} 
          />
        </div>

        <div className="filter-group-wrap">
          <span className="filter-label">Department</span>
          <GlassSelect 
            value={filterDept} 
            onChange={(v: string) => setFilterDept(v)}
            className="reg-select"
            options={uniqueDepts.map(d => ({ label: d, value: d }))} 
          />
        </div>

        <div className="filter-group-wrap">
          <span className="filter-label">College</span>
          <GlassSelect 
            value={filterCollege} 
            onChange={(v: string) => setFilterCollege(v)}
            className="reg-select"
            options={uniqueColleges.map(c => ({ label: c, value: c }))} 
          />
        </div>

        <div className="filter-group-wrap">
          <span className="filter-label">Payment</span>
          <GlassSelect 
            value={filterPayment} 
            onChange={(v: string) => setFilterPayment(v)}
            className="reg-select"
            options={[
              { label: 'All', value: 'All' }, 
              { label: 'Paid', value: 'Paid' }, 
              { label: 'Free', value: 'Free' }
            ]} 
          />
        </div>

        <div className="filter-group-wrap">
          <span className="filter-label">Attendance</span>
          <GlassSelect 
            value={filterAttendance} 
            onChange={(v: string) => setFilterAttendance(v)}
            className="reg-select"
            options={[
              { label: 'All', value: 'All' }, 
              { label: 'Attended', value: 'Attended' }, 
              { label: 'Not Attended', value: 'Not Attended' }
            ]} 
          />
        </div>

        {hasActiveFilters && (
          <div className="filter-group-wrap clear">
            <span className="filter-label">&nbsp;</span>
            <button className="reg-btn-clear" onClick={clearFilters} title="Clear all filters">
              <RotateCcw size={15} />
            </button>
          </div>
        )}
      </div>

      {/* ── Data Table ── */}
      <div className="reg-table-wrap">
        <table className="reg-table">
          <thead>
            <tr>
              <th className="th-num">#</th>
              <th className="th-sort" onClick={() => toggleSort('userName')}>Participant <SortIcon col="userName" /></th>
              <th className="th-sort" onClick={() => toggleSort('userAVR')}>AVR ID <SortIcon col="userAVR" /></th>
              <th className="th-sort" onClick={() => toggleSort('eventName')}>Event <SortIcon col="eventName" /></th>
              <th>Dept</th>
              <th className="th-sort th-right" onClick={() => toggleSort('amountPaid')}>₹ <SortIcon col="amountPaid" /></th>
              <th>Payment</th>
              <th>Attended</th>
              <th className="th-sort" onClick={() => toggleSort('registeredAt')}>Date <SortIcon col="registeredAt" /></th>
              <th className="th-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="reg-empty">Loading registrations...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={10} className="reg-empty">No registrations found.</td></tr>
            ) : (
              filtered.map((reg, i) => (
                <tr 
                  key={reg.id} 
                  className="reg-row"
                  onClick={() => setDetailReg(reg)}
                >
                  <td className="td-num">{i + 1}</td>
                  <td className="td-participant">
                    <div className="user-info">
                      <div className="name-row">
                        <span className="user-name">{reg.userName}</span>
                        {reg.teamName && <span className="reg-team-badge">Team: {reg.teamName}</span>}
                      </div>
                      <span className="user-email">{reg.userEmail}</span>
                    </div>
                  </td>
                  <td className="td-avr">{reg.avrId}</td>
                  <td className="td-event">{reg.eventName}</td>
                  <td className="td-dept">{reg.department || '—'}</td>
                  <td className="td-amount">
                    {reg.amountPaid > 0 ? `₹${reg.amountPaid}` : '—'}
                  </td>
                  <td>
                    <span className={`reg-pill ${reg.paymentStatus === 'paid' || reg.paymentStatus === 'success' ? 'pill-paid' : 'pill-free'}`}>
                      {reg.paymentStatus === 'paid' || reg.paymentStatus === 'success' ? 'Paid' : 'Free'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`reg-attendance-toggle ${reg.isAttended ? 'attended' : ''}`}
                      onClick={() => handleToggleAttendance(reg)}
                      title={reg.isAttended ? 'Mark as not attended' : 'Mark as attended'}
                    >
                      {reg.isAttended ? <UserCheck size={14} /> : <UserX size={14} />}
                    </button>
                  </td>
                  <td className="td-date">{formatDate(reg.registeredAt)}</td>
                  <td className="td-actions">
                    <button className="reg-act-btn view" onClick={() => setDetailReg(reg)} title="View Details">
                      <Eye size={14} />
                    </button>
                    <button className="reg-act-btn edit" onClick={() => setEditReg({ ...reg })} title="Edit">
                      <Edit2 size={14} />
                    </button>
                    <button className="reg-act-btn delete" onClick={() => handleDelete(reg)} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Detail Drawer ── */}
      {detailReg && (
        <div className="detail-modal-overlay" onClick={() => setDetailReg(null)}>
          <div className="detail-modal" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Registration Details</h3>
              <button className="drawer-close" onClick={() => setDetailReg(null)}><X size={20} /></button>
            </div>

            <div className="modal-content">
              <div className="modal-section">
                <div className="modal-section-title"><User size={15} /> Participant Info</div>
                <div className="modal-grid">
                  <DetailRow label="Name" value={detailReg.userName} copyable onCopy={copyToClipboard} />
                  <DetailRow label="AVR ID" value={detailReg.avrId} copyable onCopy={copyToClipboard} />
                  <DetailRow label="Email" value={detailReg.userEmail} copyable onCopy={copyToClipboard} />
                  <DetailRow label="Phone" value={detailReg.userPhone || '—'} copyable onCopy={copyToClipboard} />
                  <DetailRow label="College" value={detailReg.userCollege || '—'} />
                  {detailReg.teamName && <DetailRow label="Team Name" value={detailReg.teamName} />}
                  {detailReg.memberCount && <DetailRow label="Team Size" value={String(detailReg.memberCount)} />}
                </div>
              </div>

              {detailReg.members && detailReg.members.length > 0 && (
                <div className="modal-section">
                  <div className="modal-section-title"><Users size={15} /> Team Members ({detailReg.members.length})</div>
                  <div className="team-members-list">
                    {detailReg.members.map((member, idx) => (
                      <div key={idx} className="team-member-item">
                        <div className="member-main">
                          <span className="member-name">{member.name}</span>
                          <span className="member-role">{idx === 0 ? 'Leader' : `Member ${idx + 1}`}</span>
                        </div>
                        <div className="member-sub">
                          <span><Mail size={12} /> {member.email}</span>
                          {member.phone && <span><Phone size={12} /> {member.phone}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-section">
                <div className="modal-section-title"><CreditCard size={15} /> Payment & Event</div>
                <div className="modal-grid">
                  <DetailRow label="Event" value={detailReg.eventName} />
                  <DetailRow label="Category" value={detailReg.category} />
                  <DetailRow label="Status" value={detailReg.paymentStatus || 'free'} />
                  <DetailRow label="Amount" value={detailReg.amountPaid ? `₹${detailReg.amountPaid}` : '₹0'} />
                  {detailReg.moonAddon && <DetailRow label="Add-on" value="Moon Observation" />}
                  <DetailRow label="Transaction ID" value={detailReg.transactionId || 'N/A'} copyable onCopy={copyToClipboard} />
                </div>
              </div>

              <div className="modal-section">
                <div className="modal-section-title"><Calendar size={15} /> Metadata</div>
                <div className="modal-grid">
                  <DetailRow label="Process Status" value={detailReg.status || 'confirmed'} />
                  <DetailRow label="Attended" value={detailReg.isAttended ? 'Yes' : 'No'} />
                  <DetailRow label="Registered At" value={detailReg.registeredAt?.toDate ? detailReg.registeredAt.toDate().toLocaleString() : '—'} />
                  <DetailRow label="Doc ID" value={detailReg.id} copyable onCopy={copyToClipboard} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editReg && (
        <div className="reg-modal-overlay" onClick={() => setEditReg(null)}>
          <div className="reg-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Registration</h3>
              <button className="drawer-close" onClick={() => setEditReg(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="modal-form">
              <div className="modal-field">
                <label>Participant Name</label>
                <input type="text" value={editReg.userName} onChange={e => setEditReg({ ...editReg, userName: e.target.value })} required />
              </div>
              <div className="modal-field">
                <label>Email Address</label>
                <input type="email" value={editReg.userEmail} onChange={e => setEditReg({ ...editReg, userEmail: e.target.value })} required />
              </div>
              <div className="modal-field">
                <label>Phone</label>
                <input type="text" value={editReg.userPhone || ''} onChange={e => setEditReg({ ...editReg, userPhone: e.target.value })} />
              </div>
              <div className="modal-row">
                <div className="modal-field">
                  <label>Event Name</label>
                  <input type="text" value={editReg.eventName} onChange={e => setEditReg({ ...editReg, eventName: e.target.value })} required />
                </div>
                <div className="modal-field">
                  <label>Category</label>
                  <input type="text" value={editReg.category} onChange={e => setEditReg({ ...editReg, category: e.target.value })} required />
                </div>
              </div>
              <div className="modal-row">
                <div className="modal-field">
                  <label>Department</label>
                  <input type="text" value={editReg.department || ''} onChange={e => setEditReg({ ...editReg, department: e.target.value })} />
                </div>
                <div className="modal-field">
                  <label>Payment Status</label>
                  <select value={editReg.paymentStatus || 'free'} onChange={e => setEditReg({ ...editReg, paymentStatus: e.target.value })}>
                    <option value="paid">Paid</option>
                    <option value="free">Free</option>
                  </select>
                </div>
              </div>
              <div className="modal-field">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editReg.isAttended}
                    onChange={e => setEditReg({ ...editReg, isAttended: e.target.checked })}
                  />
                  Mark as Attended
                </label>
              </div>
              <button type="submit" className="modal-submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Detail Row Helper ─── */
const DetailRow: React.FC<{
  label: string;
  value: string;
  copyable?: boolean;
  onCopy?: (text: string) => void;
}> = ({ label, value, copyable, onCopy }) => (
  <div className="detail-row">
    <span className="detail-label">{label}</span>
    <span className="detail-value">
      {value}
      {copyable && value && value !== '—' && value !== 'N/A' && (
        <button className="copy-btn" onClick={() => onCopy?.(value)} title="Copy">
          <Copy size={12} />
        </button>
      )}
    </span>
  </div>
);

export default RegistrationManager;
