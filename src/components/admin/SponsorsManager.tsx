import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { Plus, Trash2, Edit2, Check, X, Eye, EyeOff, GripVertical } from 'lucide-react';
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
      try {
        await setDoc(docRef, defaultData);
      } catch (err) {
        console.warn('Could not initialize document, likely due to security rules. Proceeding with local state.');
      }
      setData(defaultData);
    }
  } catch (e: any) {
    console.error(e);
    toast.error('Failed to load sponsors configuration.');
    setData({ isActive: false, tiers: DEFAULT_TIERS });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveData = async (newData: SponsorsDoc) => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'page_settings', 'sponsors'), newData);
      setData(newData);
      toast.success('Sponsors data saved!');
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to save sponsors data.');
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
    if (!window.confirm('Are you sure you want to remove this sponsor?')) return;

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
    
    // Auto-generate ID for new sponsor
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
    return <div style={{ color: 'rgba(255,255,255,0.5)', padding: '2rem' }}>Loading Sponsors configuration...</div>;
  }

  return (
    <div className="admin-overview animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ color: '#fff', margin: 0 }}>Sponsors & Partners</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Manage the public sponsors page</p>
        </div>
        
        <button 
          onClick={toggleVisibility}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: data.isActive ? 'rgba(20, 255, 201, 0.1)' : 'rgba(255, 68, 68, 0.1)',
            color: data.isActive ? '#14ffc9' : '#ff4444',
            border: `1px solid ${data.isActive ? 'rgba(20, 255, 201, 0.3)' : 'rgba(255, 68, 68, 0.3)'}`,
            padding: '10px 16px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          {data.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
          {data.isActive ? 'Page is LIVE' : 'Page is HIDDEN'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {data.tiers.map(tier => (
          <div key={tier.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: tier.tierColor }}></div>
                <h3 style={{ color: '#fff', margin: 0, fontSize: '1.2rem' }}>{tier.tier}</h3>
              </div>
              <button 
                onClick={() => setEditSponsor({ tierId: tier.id, sponsor: { id: '', name: '', logo: '', url: '', category: '' } })}
                style={{ background: '#a78bfa', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
              >
                <Plus size={14} /> Add Sponsor
              </button>
            </div>
            
            <div style={{ padding: '24px' }}>
              {tier.sponsors.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '20px 0', fontSize: '0.9rem' }}>No sponsors in this tier yet.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                  {tier.sponsors.map(sponsor => (
                    <div key={sponsor.id} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '12px', padding: '16px', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px' }}>
                        <button onClick={() => setEditSponsor({ tierId: tier.id, sponsor })} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}><Edit2 size={14} /></button>
                        <button onClick={() => handleDeleteSponsor(tier.id, sponsor.id)} style={{ background: 'rgba(255,68,68,0.1)', border: 'none', color: '#ff4444', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={14} /></button>
                      </div>
                      
                      <div style={{ height: '60px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <img src={sponsor.logo} alt={sponsor.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} crossOrigin="anonymous" />
                      </div>
                      <h4 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '1rem', textAlign: 'center' }}>{sponsor.name}</h4>
                      <p style={{ color: '#a78bfa', margin: '0 0 12px 0', fontSize: '0.8rem', textAlign: 'center' }}>{sponsor.category}</p>
                      
                      <div style={{ textAlign: 'center' }}>
                        <a href={sponsor.url} target="_blank" rel="noreferrer" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textDecoration: 'none' }}>{sponsor.url.replace(/^https?:\/\//, '')}</a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editSponsor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#0f0f13', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '24px', width: '100%', maxWidth: '500px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: '#fff', margin: 0 }}>{editSponsor.sponsor.id ? 'Edit Sponsor' : 'Add Sponsor'}</h3>
              <button onClick={() => setEditSponsor(null)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveSponsor} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '8px', fontSize: '0.85rem' }}>Company Name</label>
                <input 
                  type="text" 
                  value={editSponsor.sponsor.name} 
                  onChange={e => setEditSponsor({ ...editSponsor, sponsor: { ...editSponsor.sponsor, name: e.target.value }})}
                  required
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '12px', color: '#fff' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '8px', fontSize: '0.85rem' }}>Logo URL (Transparent background preferred)</label>
                <input 
                  type="url" 
                  value={editSponsor.sponsor.logo} 
                  onChange={e => setEditSponsor({ ...editSponsor, sponsor: { ...editSponsor.sponsor, logo: e.target.value }})}
                  required
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '12px', color: '#fff' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '8px', fontSize: '0.85rem' }}>Website URL</label>
                <input 
                  type="url" 
                  value={editSponsor.sponsor.url} 
                  onChange={e => setEditSponsor({ ...editSponsor, sponsor: { ...editSponsor.sponsor, url: e.target.value }})}
                  required
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '12px', color: '#fff' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '8px', fontSize: '0.85rem' }}>Category Label (e.g., 'Official Tech Partner')</label>
                <input 
                  type="text" 
                  value={editSponsor.sponsor.category} 
                  onChange={e => setEditSponsor({ ...editSponsor, sponsor: { ...editSponsor.sponsor, category: e.target.value }})}
                  required
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '12px', color: '#fff' }}
                />
              </div>

              <button 
                type="submit" 
                style={{ width: '100%', padding: '14px', background: '#a78bfa', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
              >
                Save Details
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SponsorsManager;
