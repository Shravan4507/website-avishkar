import React, { useState, useEffect, useRef } from 'react';
import {
  doc, getDoc, updateDoc, setDoc
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebase';
import { 
  Save, Edit3, ChevronDown, BookOpen, Users, Trophy, 
  MapPin, ToggleLeft, ToggleRight, RefreshCw, Plus, 
  Trash2, Info, ExternalLink, Upload, FileCheck 
} from 'lucide-react';
import { COMPETITIONS_DATA } from '../../data/competitions';
import type { Competition } from '../../data/competitions';

interface EventManagerProps {
  adminProfile: any;
  isSuper: boolean;
}

// Map admin role to competition keys (slug || id) from competitions data
const resolveEventKeys = (adminProfile: any, isSuper: boolean): string[] => {
  if (isSuper) return []; 

  const roles: string[] = adminProfile?.roleLevel || [];
  const keys: string[] = [];

  roles.forEach((role: string) => {
    if (role.startsWith('department_admin-')) {
      const dept = role.replace('department_admin-', '').toLowerCase();
      COMPETITIONS_DATA.forEach(c => {
        if ((c.department || '').toLowerCase().includes(dept)) {
          keys.push(c.slug || c.id);
        }
      });
      return;
    }

    let suffix = '';
    if (role.startsWith('competition_admin-')) suffix = role.replace('competition_admin-', '');
    else if (role.startsWith('admin-')) suffix = role.replace('admin-', '');
    if (!suffix) return;

    const sfx = suffix.toLowerCase();

    COMPETITIONS_DATA.forEach(c => {
      const slug   = (c.slug   || '').toLowerCase();
      const id     = (c.id     || '').toLowerCase();
      const handle = (c.handle || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const code   = (c.code   || '').toLowerCase();
      const title  = (c.title  || '').toLowerCase().replace(/[^a-z0-9]/g, '-');

      const matches =
        (slug   && slug.includes(sfx))   ||   
        (slug   && sfx.includes(slug.replace('-26', ''))) || 
        (id     && id.includes(sfx))     ||   
        (handle && handle.includes(sfx)) ||   
        (handle && sfx.includes(handle)) ||   
        (code   && code === sfx)         ||   
        (code   && sfx.includes(code) && code.length > 2) || 
        (title  && title.includes(sfx) && sfx.length > 2);   

      if (matches) keys.push(c.slug || c.id);
    });
  });

  return [...new Set(keys)];
};

const EventManager: React.FC<EventManagerProps> = ({ adminProfile, isSuper }) => {
  const [user] = useAuthState(auth);

  const [events, setEvents] = useState<Competition[]>([]);
  const [allowedSlugs, setAllowedSlugs] = useState<string[]>([]);
  const [overrides, setOverrides] = useState<Record<string, any>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState<Record<string, number | null>>({}); 
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const overridesLoaded = useRef(false);

  useEffect(() => {
    const keys = resolveEventKeys(adminProfile, isSuper);

    let filtered: Competition[];
    if (isSuper) {
      filtered = COMPETITIONS_DATA;
    } else if (keys.length > 0) {
      filtered = COMPETITIONS_DATA.filter(c => keys.includes(c.slug || c.id));
    } else {
      filtered = [];
    }

    setEvents(filtered);
    setAllowedSlugs(keys);
    setLoading(false);

    if (user?.uid && !isSuper && keys.length > 0) {
      updateDoc(doc(db, 'admins', user.uid), { assignedEventSlugs: keys })
        .catch(() => { });
    }
  }, [adminProfile, isSuper, user]);

  useEffect(() => {
    if (events.length === 0 || overridesLoaded.current) return;
    const fetchOverrides = async () => {
      const loaded: Record<string, any> = {};
      await Promise.all(events.map(async (ev) => {
        const key = ev.slug || ev.id;
        try {
          const snap = await getDoc(doc(db, 'events_content', key));
          if (snap.exists()) loaded[key] = snap.data();
        } catch (e) { }
      }));
      setOverrides(loaded);
      overridesLoaded.current = true;
    };
    fetchOverrides();
  }, [events]);

  const getField = (slug: string, field: string, fallback: any) => {
    return overrides[slug]?.[field] ?? fallback;
  };

  const setField = (slug: string, field: string, value: any) => {
    setOverrides(prev => ({
      ...prev,
      [slug]: { ...(prev[slug] || {}), [field]: value }
    }));
    setDirty(prev => ({ ...prev, [slug]: true }));
  };

  const handleSave = async (ev: Competition) => {
    const key = ev.slug || ev.id;

    if (!isSuper && allowedSlugs.length > 0 && !allowedSlugs.includes(key)) {
      alert('Permission denied: You are not assigned to manage this event.');
      return;
    }

    setSaving(key);
    try {
      const rawData: Record<string, any> = {
        ...(overrides[key] || {}),
        updatedAt: new Date(),
        updatedBy: user?.email || 'admin',
      };
      if (ev.slug   !== undefined) rawData.slug   = ev.slug;
      if (ev.handle !== undefined) rawData.handle = ev.handle;
      
      const savedData = Object.fromEntries(
        Object.entries(rawData).filter(([, v]) => v !== undefined)
      );

      await setDoc(doc(db, 'events_content', key), savedData, { merge: true });
      setOverrides(prev => ({ ...prev, [key]: savedData }));
      setDirty(prev => ({ ...prev, [key]: false }));
    } catch (err: any) {
      alert('Save failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(null);
    }
  };

  const toggleExpanded = (slug: string) => {
    setExpanded(prev => prev === slug ? null : slug);
  };

  const getCoordinators = (ev: Competition, key: string) => {
    return overrides[key]?.coordinators || ev.coordinators || [];
  };

  const setCoordinator = (key: string, idx: number, field: 'name' | 'phone', value: string) => {
    const current = getField(key, 'coordinators', [{ name: '', phone: '' }]);
    const coords = Array.isArray(current) ? JSON.parse(JSON.stringify(current)) : [{ name: '', phone: '' }];
    if (!coords[idx]) coords[idx] = { name: '', phone: '' };
    coords[idx][field] = value;
    setField(key, 'coordinators', coords);
  };

  const addCoordinator = (key: string, currentCoords: any[]) => {
    setField(key, 'coordinators', [...currentCoords, { name: '', phone: '' }]);
  };

  const removeCoordinator = (key: string, currentCoords: any[], idx: number) => {
    const newCoords = currentCoords.filter((_, i) => i !== idx);
    setField(key, 'coordinators', newCoords);
  };

  const handleRulebookUpload = (key: string, file: File) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a valid PDF file.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      alert('File too large. Maximum size is 20 MB.');
      return;
    }

    const storageRef = ref(storage, `rulebooks/${key}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploading(prev => ({ ...prev, [key]: 0 }));

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setUploading(prev => ({ ...prev, [key]: pct }));
      },
      (err) => {
        console.error(err);
        alert('Upload failed: ' + err.message);
        setUploading(prev => ({ ...prev, [key]: null }));
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setField(key, 'rulebook', downloadURL);
        setUploading(prev => ({ ...prev, [key]: null }));
      }
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.5)' }}>
        <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
        <p>Loading your events...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.4)' }}>
        <BookOpen size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
        <p>No events are assigned to your role.</p>
        <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Contact a superadmin to assign event permissions.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{
        background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
        borderRadius: '16px', padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'flex-start'
      }}>
        <Info size={18} color="#a78bfa" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div>
          <p style={{ color: '#a78bfa', fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>Live CMS — Changes reflect on the public website instantly after saving.</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: '4px 0 0', fontSize: '0.82rem' }}>
            You can edit your event's description, prize pool, coordinators, venue, rulebook link, and toggle registration status.
          </p>
        </div>
      </div>

      {events.map((ev) => {
        const key = ev.slug || ev.id;
        const isOpen = expanded === key;
        const isDirtyNow = dirty[key];
        const isSaving = saving === key;

        const description = getField(key, 'description', ev.description);
        const prizePool = getField(key, 'prizePool', ev.prizePool || '');
        const venue = getField(key, 'venue', ev.venue);
        const rulebook = getField(key, 'rulebook', ev.rulebook || '');
        const rulebookComingSoon = getField(key, 'rulebookComingSoon', ev.rulebookComingSoon ?? false);
        const isRegistrationOpen = getField(key, 'isRegistrationOpen', ev.isRegistrationOpen ?? true);
        const status = getField(key, 'status', ev.status);
        const coords = getCoordinators(ev, key);

        return (
          <div key={key} style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.3) 100%)',
            border: `1px solid ${isDirtyNow ? 'rgba(167,139,250,0.45)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '20px',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            boxShadow: isDirtyNow ? '0 0 20px rgba(167,139,250,0.1)' : 'none',
          }}>
            <button
              onClick={() => toggleExpanded(key)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '16px',
                padding: '20px 24px', background: 'none', border: 'none',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px', overflow: 'hidden',
                flexShrink: 0, border: `2px solid ${ev.borderColor || 'rgba(167,139,250,0.3)'}`,
                background: ev.gradient || 'rgba(255,255,255,0.05)',
              }}>
                <img src={ev.image} alt={ev.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e: any) => { e.target.style.display = 'none'; }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>{ev.title}</span>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '100px',
                    background: status === 'live' ? 'rgba(16,185,129,0.15)' : status === 'published' ? 'rgba(167,139,250,0.15)' : 'rgba(245,158,11,0.15)',
                    color: status === 'live' ? '#10b981' : status === 'published' ? '#a78bfa' : '#f59e0b',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                  }}>{status}</span>
                  {isDirtyNow && (
                    <span style={{ fontSize: '0.7rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '3px 8px', borderRadius: '100px' }}>
                      Unsaved Changes
                    </span>
                  )}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', margin: '4px 0 0', fontWeight: 500 }}>
                  {ev.subtitle} · {ev.department}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                {isDirtyNow && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSave(ev); }}
                    disabled={isSaving}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)',
                      color: '#a78bfa', padding: '8px 16px', borderRadius: '10px',
                      fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    <Save size={14} />
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                )}
                <div style={{ color: 'rgba(255,255,255,0.4)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <ChevronDown size={20} />
                </div>
              </div>
            </button>

            {isOpen && (
              <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 -24px' }} />

                <div>
                  <label style={labelStyle}>
                    <Edit3 size={14} /> Event Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setField(key, 'description', e.target.value)}
                    rows={4}
                    style={textareaStyle}
                    placeholder="Describe this event for participants..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}><Trophy size={14} /> Prize Pool</label>
                    <input
                      type="text"
                      value={prizePool}
                      onChange={(e) => setField(key, 'prizePool', e.target.value)}
                      style={inputStyle}
                      placeholder="e.g. ₹1,00,000+"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}><MapPin size={14} /> Venue</label>
                    <input
                      type="text"
                      value={venue}
                      onChange={(e) => setField(key, 'venue', e.target.value)}
                      style={inputStyle}
                      placeholder="e.g. Main Lab Complex"
                    />
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '14px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <label style={{ ...labelStyle, marginBottom: '12px' }}><BookOpen size={14} /> Rulebook</label>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <input
                      ref={el => { fileInputRefs.current[key] = el; }}
                      type="file"
                      accept="application/pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleRulebookUpload(key, file);
                        e.target.value = '';
                      }}
                    />
                    <button
                      onClick={() => fileInputRefs.current[key]?.click()}
                      disabled={uploading[key] != null}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.35)',
                        color: '#a78bfa', padding: '10px 18px', borderRadius: '10px',
                        fontWeight: 700, fontSize: '0.85rem', cursor: uploading[key] != null ? 'not-allowed' : 'pointer',
                        opacity: uploading[key] != null ? 0.7 : 1, flexShrink: 0,
                      }}
                    >
                      {uploading[key] != null ? (
                        <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Uploading {uploading[key]}%</>
                      ) : (
                        <><Upload size={15} /> Upload PDF</>
                      )}
                    </button>

                    {uploading[key] != null && (
                      <div style={{ flex: 1, minWidth: '120px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', height: '6px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: '100px',
                          background: 'linear-gradient(90deg, #a78bfa, #7c3aed)',
                          width: `${uploading[key]}%`, transition: 'width 0.3s ease'
                        }} />
                      </div>
                    )}

                    {rulebook && rulebook.includes('firebasestorage') && uploading[key] == null && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>
                        <FileCheck size={14} /> Uploaded
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                    <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', fontWeight: 600 }}>OR PASTE URL</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="url"
                      value={rulebook}
                      onChange={(e) => setField(key, 'rulebook', e.target.value)}
                      style={{ ...inputStyle, flex: 1, minWidth: '200px', marginBottom: 0 }}
                      placeholder="https://drive.google.com/... or /assets/rule-books/event.pdf"
                    />
                    {rulebook && (
                      <a href={rulebook} target="_blank" rel="noopener noreferrer" style={{
                        display: 'flex', alignItems: 'center', gap: '6px', color: '#a78bfa',
                        fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none', flexShrink: 0
                      }}>
                        <ExternalLink size={14} /> Preview
                      </a>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                    <button
                      onClick={() => setField(key, 'rulebookComingSoon', !rulebookComingSoon)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: 0 }}
                    >
                      {rulebookComingSoon
                        ? <ToggleRight size={24} color="#f59e0b" />
                        : <ToggleLeft size={24} color="rgba(255,255,255,0.3)" />
                      }
                      <span style={{ color: rulebookComingSoon ? '#f59e0b' : 'rgba(255,255,255,0.4)', fontSize: '0.82rem', fontWeight: 600 }}>
                        Mark rulebook as "Coming Soon"
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}><Users size={14} /> Coordinators</label>
                    <button
                      onClick={() => addCoordinator(key, coords)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(167,139,250,0.1)',
                        border: '1px solid rgba(167,139,250,0.25)', color: '#a78bfa', padding: '6px 12px',
                        borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {coords.map((coord: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={coord.name || ''}
                          onChange={(e) => setCoordinator(key, idx, 'name', e.target.value)}
                          placeholder="Coordinator Name"
                          style={{ ...inputStyle, flex: 2, marginBottom: 0 }}
                        />
                        <input
                          type="tel"
                          value={coord.phone || ''}
                          onChange={(e) => setCoordinator(key, idx, 'phone', e.target.value)}
                          placeholder="Phone Number"
                          style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
                        />
                        {coords.length > 1 && (
                          <button
                            onClick={() => removeCoordinator(key, coords, idx)}
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '10px', borderRadius: '8px', cursor: 'pointer', flexShrink: 0 }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setField(key, 'isRegistrationOpen', !isRegistrationOpen)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px',
                      borderRadius: '12px', background: isRegistrationOpen ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)',
                      border: `1px solid ${isRegistrationOpen ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.2)'}`,
                      cursor: 'pointer',
                    }}
                  >
                    {isRegistrationOpen ? <ToggleRight size={22} color="#10b981" /> : <ToggleLeft size={22} color="#ef4444" />}
                    <span style={{ color: isRegistrationOpen ? '#10b981' : '#ef4444', fontWeight: 700, fontSize: '0.85rem' }}>
                      Registration {isRegistrationOpen ? 'Open' : 'Closed'}
                    </span>
                  </button>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['draft', 'published', 'live', 'completed'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setField(key, 'status', s)}
                        style={{
                          padding: '10px 14px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700,
                          textTransform: 'capitalize', cursor: 'pointer',
                          background: status === s ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)',
                          border: status === s ? '1px solid rgba(167,139,250,0.5)' : '1px solid rgba(255,255,255,0.08)',
                          color: status === s ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <button
                    onClick={() => handleSave(ev)}
                    disabled={isSaving}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                      border: 'none', color: '#fff', padding: '12px 28px',
                      borderRadius: '12px', fontWeight: 700, cursor: 'pointer',
                      fontSize: '0.9rem', opacity: isSaving ? 0.7 : 1,
                    }}
                  >
                    <Save size={16} />
                    {isSaving ? 'Publishing...' : 'Publish Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '6px',
  color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', borderRadius: '10px',
  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
  color: '#fff', outline: 'none', fontFamily: 'inherit', fontSize: '0.92rem',
  boxSizing: 'border-box', marginBottom: 0,
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical', lineHeight: '1.6',
};

export default EventManager;
