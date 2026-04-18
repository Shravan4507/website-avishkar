import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { Plus, Trash2, Edit2, X, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../components/toast/Toast';

interface Sponsor {
  id: string;
  name: string;
  logo: string;
  url: string;
  category: string;
}

interface SponsorTier {
  id: string;
  tier: string;
  class: string;
  tierColor: string;
  sponsors: Sponsor[];
}

interface SponsorsDoc {
  isActive: boolean;
  tiers: SponsorTier[];
}

const DEFAULT_TIERS: SponsorTier[] = [
    {
        id: 'tier-1',
        tier: 'Title Partner',
        class: 'grid-title',
        tierColor: '#d9ff00',
        sponsors: []
    },
    {
        id: 'tier-2',
        tier: 'Platinum Partners',
        class: 'grid-platinum',
        tierColor: '#ffffff',
        sponsors: []
    },
    {
        id: 'tier-3',
        tier: 'Gold Partners',
        class: 'grid-gold',
        tierColor: '#FFCC00',
        sponsors: []
    },
    {
        id: 'tier-4',
        tier: 'Silver Partners',
        class: 'grid-silver',
        tierColor: '#A8A8A8',
        sponsors: []
    }
];

const SponsorsManager: React.FC = () => {
  const [data, setData] = useState<SponsorsDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const [editSponsor, setEditSponsor] = useState<{tierId: string, sponsor: Sponsor} | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'page_settings', 'sponsors');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setData(snap.data() as SponsorsDoc);
      } else {
        const defaultData: SponsorsDoc = { isActive: true, tiers: DEFAULT_TIERS };
        setData(defaultData);
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to load sponsors.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveData = async (newData: SponsorsDoc) => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'page_settings', 'sponsors'), newData);
      setData(newData);
      toast.success('Sponsors updated!');
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to save sponsors.');
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = () => {
    if (!data) return;
    const newData = { ...data, isActive: !data.isActive };
    handleSaveData(newData);
  };

  const handleDeleteSponsor = (tierId: string, sponsorId: string) => {
    if (!data) return;
    if (!window.confirm('Remove this sponsor?')) return;

    const newTiers = data.tiers.map(t => {
      if (t.id === tierId) {
        return { ...t, sponsors: t.sponsors.filter(s => s.id !== sponsorId) };
      }
      return t;
    });
    handleSaveData({ ...data, tiers: newTiers });
  };

  const handleSaveSponsor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !editSponsor) return;

    const { tierId, sponsor } = editSponsor;
    if (!sponsor.id) {
      sponsor.id = 'sp-' + Date.now();
    }

    const newTiers = data.tiers.map(t => {
      if (t.id === tierId) {
        const exists = t.sponsors.some(s => s.id === sponsor.id);
        const newSponsors = exists 
          ? t.sponsors.map(s => s.id === sponsor.id ? sponsor : s)
          : [...t.sponsors, sponsor];
        return { ...t, sponsors: newSponsors };
      }
      return t;
    });

    handleSaveData({ ...data, tiers: newTiers });
    setEditSponsor(null);
  };

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'rgba(255,255,255,0.4)' }}>
        <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginRight: '10px' }} />
        Loading...
      </div>
    );
  }

  return (
    <div className="admin-overview animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ color: '#fff', margin: 0 }}>Sponsors & Partners</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Manage the public sponsors page</p>
        </div>
        
        <button 
          onClick={toggleVisibility}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: data.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: data.isActive ? '#10b981' : '#ef4444',
            border: `1px solid ${data.isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            padding: '10px 16px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem'
          }}
        >
          {data.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
          {data.isActive ? 'Sponsors Page LIVE' : 'Sponsors Page HIDDEN'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {data.tiers.map(tier => (
          <div key={tier.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: tier.tierColor, boxShadow: `0 0 10px ${tier.tierColor}44` }}></div>
                <h3 style={{ color: '#fff', margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{tier.tier}</h3>
              </div>
              <button 
                onClick={() => setEditSponsor({ tierId: tier.id, sponsor: { id: '', name: '', logo: '', url: '', category: '' } })}
                style={{ background: 'rgba(167, 139, 250, 0.2)', color: '#a78bfa', border: '1px solid rgba(167, 139, 250, 0.3)', padding: '8px 16px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
              >
                <Plus size={14} /> Add Sponsor
              </button>
            </div>
            
            <div style={{ padding: '24px' }}>
              {tier.sponsors.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '20px 0', fontSize: '0.85rem' }}>No sponsors in this tier.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                  {tier.sponsors.map(sponsor => (
                    <div key={sponsor.id} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                        <button onClick={() => setEditSponsor({ tierId: tier.id, sponsor })} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.6)', padding: '5px', borderRadius: '6px', cursor: 'pointer' }}><Edit2 size={12} /></button>
                        <button onClick={() => handleDeleteSponsor(tier.id, sponsor.id)} style={{ background: 'rgba(239,68,68,0.05)', border: 'none', color: '#ef4444', padding: '5px', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={12} /></button>
                      </div>
                      
                      <div style={{ height: '50px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <img src={sponsor.logo} alt={sponsor.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      </div>
                      <h4 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '0.95rem', textAlign: 'center', fontWeight: 600 }}>{sponsor.name}</h4>
                      <p style={{ color: '#a78bfa', margin: '0 0 12px 0', fontSize: '0.75rem', textAlign: 'center', fontWeight: 600 }}>{sponsor.category}</p>
                      
                      <div style={{ textAlign: 'center' }}>
                        <a href={sponsor.url} target="_blank" rel="noreferrer" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sponsor.url.replace(/^https?:\/\//, '')}</a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {editSponsor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#0a0a0c', border: '1px solid rgba(167, 139, 250, 0.2)', borderRadius: '24px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '1.2rem' }}>{editSponsor.sponsor.id ? 'Edit Sponsor' : 'Add New Sponsor'}</h3>
              <button onClick={() => setEditSponsor(null)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveSponsor} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Company Name</label>
                <input 
                  type="text" 
                  value={editSponsor.sponsor.name} 
                  onChange={e => setEditSponsor({ ...editSponsor, sponsor: { ...editSponsor.sponsor, name: e.target.value }})}
                  required
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Logo URL (Transparent PNG preferred)</label>
                <input 
                  type="url" 
                  value={editSponsor.sponsor.logo} 
                  onChange={e => setEditSponsor({ ...editSponsor, sponsor: { ...editSponsor.sponsor, logo: e.target.value }})}
                  required
                  style={inputStyle}
                  placeholder="https://..."
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Website URL</label>
                <input 
                  type="url" 
                  value={editSponsor.sponsor.url} 
                  onChange={e => setEditSponsor({ ...editSponsor, sponsor: { ...editSponsor.sponsor, url: e.target.value }})}
                  required
                  style={inputStyle}
                  placeholder="https://..."
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Category Label</label>
                <input 
                  type="text" 
                  value={editSponsor.sponsor.category} 
                  onChange={e => setEditSponsor({ ...editSponsor, sponsor: { ...editSponsor.sponsor, category: e.target.value }})}
                  required
                  style={inputStyle}
                  placeholder="e.g. Official Tech Partner"
                />
              </div>

              <button 
                type="submit" 
                style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}
              >
                Save Sponsor
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase'
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box'
};

const RefreshCw: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 18, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
  </svg>
);

export default SponsorsManager;
