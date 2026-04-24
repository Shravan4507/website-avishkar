import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useToast } from '../../components/toast/Toast';
import {
  Building2, Search, Download, TrendingUp, Users, 
  ChevronUp, ChevronDown, RefreshCw, Ticket
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

  const { stats, totalVerified } = useMemo(() => {
    const map = new Map<string, CollegeStats>();
    let verifiedCount = 0;

    registrations.forEach(reg => {
      const pStatus = String(reg.paymentStatus || '').toLowerCase();
      const status = String(reg.status || '').toLowerCase();

      // Align with Command Center: Finalized = confirmed OR paid OR success OR free
      const isVerified = 
        status === 'confirmed' || 
        pStatus === 'paid' || 
        pStatus === 'success' || 
        pStatus === 'free';

      if (!isVerified) return;
      
      verifiedCount++;

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
        if ((name.includes('ZEAL') && (
          name.includes('ENGINEERING') ||
          name.includes('COLLAGE') ||
          name.includes('INSTITUTE') ||
          name.includes('SOCIETY') ||
          name === 'ZEAL COLLEGE'
        )) || name.includes('ZCOER')) {
          return 'ZEAL COLLEGE OF ENGINEERING AND RESEARCH, PUNE';
        }

        // --- Normalization: Merge PVG Variations ---
        if (name.includes('PVG') || name.includes('PUNE VIDYARTHI GRIHA')) {
          return "PVG'S COLLEGE OF ENGINEERING AND TECHNOLOGY, PUNE";
        }

        // --- Normalization: Merge JSPM Variations ---
        if (name.includes('JSPM')) {
          return "JSPM'S COLLEGE, NARHE, PUNE";
        }

        // --- Normalization: Merge KJEI Variations ---
        if (name.includes('K.J.') || name.includes('KJ ') || name.includes('TRINITY')) {
          return "KJEI'S TRINITY AND KJ COLLEGE,PISOLI, PUNE";
        }

        // --- Normalization: Merge Sinhgad Variations ---
        if (name.includes('SINHGAD') || name.includes('SINHAGAD') || name.includes('SKN') || name.includes('SCOE')) {
          return "SINHGAD TECHNICAL EDUCATION SOCIETY'S SMT. KASHIBAI NAVALE COLLEGE OF ENGINEERING, VADGAON, PUNE";
        }

        // --- Normalization: Merge COEP Variations ---
        if (name.includes('COEP') || name.includes('COLLEGE OF ENGINEERING PUNE')) {
          return 'COLLEGE OF ENGINEERING PUNE (COEP)';
        }

        // --- Normalization: Merge PICT Variations ---
        if (name.includes('PICT') || name.includes('PUNE INSTITUTE OF COMPUTER TECHNOLOGY')) {
          return 'PUNE INSTITUTE OF COMPUTER TECHNOLOGY (PICT)';
        }

        // --- Normalization: Merge VIT/VIIT Variations ---
        if (name.includes('VISHWAKARMA INSTITUTE') || name.includes('VIT ') || name.includes('VIIT')) {
          if (name.includes('INFORMATION') || name.includes('VIIT')) {
            return 'VISHWAKARMA INSTITUTE OF INFORMATION TECHNOLOGY (VIIT), PUNE';
          }
          return 'VISHWAKARMA INSTITUTE OF TECHNOLOGY (VIT), PUNE';
        }

        // --- Normalization: Merge DY Patil Variations ---
        if (name.includes('D.Y. PATIL') || name.includes('D Y PATIL') || name.includes('DYP')) {
          if (name.includes('AKURDI')) return 'D.Y. PATIL COLLEGE OF ENGINEERING, AKURDI, PUNE';
          if (name.includes('PIMPRI')) return 'DR. D.Y. PATIL INSTITUTE OF TECHNOLOGY, PIMPRI, PUNE';
          if (name.includes('LOHEGAON')) return 'D.Y. PATIL SCHOOL OF ENGINEERING, LOHEGAON, PUNE';
          return 'D.Y. PATIL GROUP OF INSTITUTIONS, PUNE';
        }

        // --- Normalization: Merge PCCOE Variations ---
        if (name.includes('PCCOE') || name.includes('PIMPRI CHINCHWAD')) {
          if (name.includes('RESEARCH') || name.includes('PCCOER')) return 'PIMPRI CHINCHWAD COLLEGE OF ENGINEERING AND RESEARCH (PCCOER), PUNE';
          return 'PIMPRI CHINCHWAD COLLEGE OF ENGINEERING (PCCOE), PUNE';
        }

        // --- Normalization: Merge MIT Variations ---
        if (name.includes('MIT') && (name.includes('ENGINEERING') || name.includes('TECHNOLOGY') || name.includes('WPU'))) {
          if (name.includes('ALANDI')) return 'MIT ACADEMY OF ENGINEERING, ALANDI, PUNE';
          if (name.includes('KOTHRUD') || name.includes('WPU')) return 'MIT WORLD PEACE UNIVERSITY (MIT-WPU), KOTHRUD, PUNE';
          if (name.includes('LONI')) return 'MIT COLLEGE OF ENGINEERING, LONI KALBHOR, PUNE';
          return 'MIT GROUP OF INSTITUTIONS, PUNE';
        }

        // --- Normalization: Merge Rajgad Variations ---
        if (name.includes('RAJGAD')) {
          return "RAJGAD DNYANPEETH'S TECHNICAL CAMPUS, DHANGWADI";
        }

        // --- Normalization: Merge Keystone Variations ---
        if (name.includes('KEYSTONE')) {
          return "KEYSTONE SCHOOL OF ENGINEERING, PUNE";
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

    return { stats: Array.from(map.values()), totalVerified: verifiedCount };
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
              <Ticket size={20} />
            </div>
            <span className="stat-label">Total Registrations</span>
          </div>
          <div className="stat-value">
            {totalVerified}
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
