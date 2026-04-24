import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useToast } from '../../components/toast/Toast';
import { 
  Building2, Search, Download, TrendingUp, Users, 
  ChevronUp, ChevronDown, RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import './CollegeAnalytics.css';

interface CollegeStats {
  college: string;
  count: number;
  paidCount: number;
  freeCount: number;
  attendedCount: number;
}

const CollegeAnalytics: React.FC = () => {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof CollegeStats; dir: 'asc' | 'desc' }>({ key: 'count', dir: 'desc' });
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [regsSnap, hackSnap] = await Promise.all([
          getDocs(query(collection(db, 'registrations'))),
          getDocs(query(collection(db, 'hackathon_registrations')))
        ]);

        const allRegs = [
          ...regsSnap.docs.map(d => ({ ...d.data(), id: d.id, _collection: 'registrations' })),
          ...hackSnap.docs.map(d => ({ ...d.data(), id: d.id, _collection: 'hackathon_registrations' }))
        ];

        setRegistrations(allRegs);
      } catch (err) {
        console.error("Error fetching analytics data:", err);
        toast.error("Failed to load registration data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const stats = useMemo(() => {
    const map = new Map<string, CollegeStats>();

    registrations.forEach(reg => {
      const pStatus = String(reg.paymentStatus || reg.status || 'free').toLowerCase();
      const isConfirmed = pStatus === 'paid' || pStatus === 'success' || pStatus === 'free' || pStatus === 'confirmed';
      
      if (!isConfirmed) return;

      let colleges: string[] = [];
      if (reg.userCollege) {
        colleges.push(reg.userCollege);
      } else if (reg.leaderCollege) {
        colleges.push(reg.leaderCollege);
      } else if (reg.squad && Array.isArray(reg.squad)) {
        reg.squad.forEach((m: any) => {
          if (m.college) colleges.push(m.college);
        });
      } else if (reg.members && Array.isArray(reg.members)) {
        reg.members.forEach((m: any) => {
          if (m.college) colleges.push(m.college);
        });
      }

      const uniqueCollegesInReg = Array.from(new Set(colleges.map(c => {
        let name = c.trim().toUpperCase();
        
        // --- Normalization: Merge Zeal Variations ---
        if (name.includes('ZEAL') && (
          name.includes('ENGINEERING') || 
          name.includes('COLLAGE') || 
          name.includes('INSTITUTE') || 
          name.includes('SOCIETY') ||
          name === 'ZEAL COLLEGE'
        )) {
          return 'ZEAL COLLEGE OF ENGINEERING AND RESEARCH, PUNE';
        }
        
        return name;
      }).filter(Boolean)));

      uniqueCollegesInReg.forEach(collegeName => {
        const existing = map.get(collegeName) || {
          college: collegeName,
          count: 0,
          paidCount: 0,
          freeCount: 0,
          attendedCount: 0
        };

        existing.count++;
        if (pStatus === 'paid' || pStatus === 'success' || pStatus === 'confirmed') existing.paidCount++;
        else if (pStatus === 'free') existing.freeCount++;
        
        if (reg.isAttended) existing.attendedCount++;

        map.set(collegeName, existing);
      });
    });

    return Array.from(map.values());
  }, [registrations]);

  const filteredStats = useMemo(() => {
    let result = stats.filter(s => 
      s.college.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortConfig.dir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return result;
  }, [stats, searchTerm, sortConfig]);

  const handleExport = () => {
    if (filteredStats.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(filteredStats.map(s => ({
      'College Name': s.college,
      'Total Registrations': s.count,
      'Paid': s.paidCount,
      'Free': s.freeCount,
      'Attended': s.attendedCount
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'College Analytics');
    XLSX.writeFile(wb, `College_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const toggleSort = (key: keyof CollegeStats) => {
    setSortConfig(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc'
    }));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <RefreshCw className="spinner" size={32} />
      </div>
    );
  }

  return (
    <div className="college-analytics">
      <div className="analytics-header">
        <div className="header-title">
          <h1>
            <Building2 className="icon-purple-inline" />
            College-wise Analytics
          </h1>
          <p>Detailed breakdown of registrations by institution</p>
        </div>
        
        <div className="header-actions">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text"
              placeholder="Search colleges..."
              className="analytics-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={handleExport} className="btn-export">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-box icon-blue">
              <Building2 size={20} />
            </div>
            <span className="stat-label">Total Colleges</span>
          </div>
          <div className="stat-value">{stats.length}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-box icon-green">
              <Users size={20} />
            </div>
            <span className="stat-label">Top Institution</span>
          </div>
          <div className="stat-value truncate" title={stats[0]?.college}>
            {stats[0]?.count || 0} <span className="stat-subtext">({stats[0]?.college || 'N/A'})</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-box icon-purple">
              <TrendingUp size={20} />
            </div>
            <span className="stat-label">Avg. Per College</span>
          </div>
          <div className="stat-value">
            {stats.length ? (stats.reduce((acc, s) => acc + s.count, 0) / stats.length).toFixed(1) : 0}
          </div>
        </div>
      </div>

      <div className="analytics-table-container">
        <div className="table-responsive">
          <table className="analytics-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('college')}>
                  <div className="th-content">
                    College Name
                    {sortConfig.key === 'college' && (sortConfig.dir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th onClick={() => toggleSort('count')}>
                  <div className="th-content justify-end">
                    Total
                    {sortConfig.key === 'count' && (sortConfig.dir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th onClick={() => toggleSort('paidCount')}>
                  <div className="th-content justify-end">
                    Paid
                    {sortConfig.key === 'paidCount' && (sortConfig.dir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th onClick={() => toggleSort('freeCount')}>
                  <div className="th-content justify-end">
                    Free
                    {sortConfig.key === 'freeCount' && (sortConfig.dir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th onClick={() => toggleSort('attendedCount')}>
                  <div className="th-content justify-end">
                    Attended
                    {sortConfig.key === 'attendedCount' && (sortConfig.dir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStats.map((s, idx) => (
                <tr key={idx}>
                  <td className="col-name">{s.college}</td>
                  <td className="col-total">{s.count}</td>
                  <td className="col-paid">{s.paidCount}</td>
                  <td className="col-free">{s.freeCount}</td>
                  <td className="col-attended">{s.attendedCount}</td>
                </tr>
              ))}
              {filteredStats.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-row">
                    No results found for "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CollegeAnalytics;
