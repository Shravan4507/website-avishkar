import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { Bell, Plus, Trash2, Edit3, Check, X, ArrowUp, ArrowDown, ToggleLeft, ToggleRight } from 'lucide-react';

interface Announcement {
  id: string;
  text: string;
  priority: number;
  active: boolean;
  createdAt: any;
}

const NotificationManager: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('priority', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const handleAdd = async () => {
    if (!newText.trim()) return;
    setSaving(true);
    try {
      const maxPriority = announcements.length > 0 ? Math.max(...announcements.map(a => a.priority || 0)) : 0;
      await addDoc(collection(db, 'announcements'), {
        text: newText.trim(),
        priority: maxPriority + 1,
        active: true,
        createdAt: serverTimestamp()
      });
      setNewText('');
    } catch (e) {
      console.error('Failed to add announcement:', e);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this announcement permanently?')) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
    } catch (e) {
      console.error('Failed to delete:', e);
    }
  };

  const handleToggle = async (a: Announcement) => {
    try {
      await updateDoc(doc(db, 'announcements', a.id), { active: !a.active });
    } catch (e) {
      console.error('Failed to toggle:', e);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editText.trim()) return;
    try {
      await updateDoc(doc(db, 'announcements', editingId), { text: editText.trim() });
      setEditingId(null);
      setEditText('');
    } catch (e) {
      console.error('Failed to update:', e);
    }
  };

  const handlePriorityChange = async (a: Announcement, direction: 'up' | 'down') => {
    const sorted = [...announcements].sort((x, y) => y.priority - x.priority);
    const idx = sorted.findIndex(x => x.id === a.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    try {
      const temp = sorted[idx].priority;
      await updateDoc(doc(db, 'announcements', sorted[idx].id), { priority: sorted[swapIdx].priority });
      await updateDoc(doc(db, 'announcements', sorted[swapIdx].id), { priority: temp });
    } catch (e) {
      console.error('Failed to reorder:', e);
    }
  };

  return (
    <div className="tab-content animate-in">
      <div className="tab-header-flex">
        <div>
          <h1 className="tab-title">Notification Manager</h1>
          <p className="tab-subtitle">Manage homepage announcement ticker notifications</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '6px 14px', borderRadius: '20px', background: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.2)', color: '#a78bfa', fontSize: '0.8rem', fontWeight: 600 }}>
            {announcements.filter(a => a.active).length} Active
          </div>
        </div>
      </div>

      {/* Add New Notification */}
      <div style={{
        margin: '1.5rem 0',
        padding: '1.25rem',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#a78bfa', fontWeight: 600, fontSize: '0.85rem', letterSpacing: '1px' }}>
          <Plus size={16} />
          ADD NEW ANNOUNCEMENT
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            placeholder="Type your announcement message here..."
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
          <button
            onClick={handleAdd}
            disabled={saving || !newText.trim()}
            style={{
              padding: '12px 24px',
              background: '#a78bfa',
              color: '#000',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              opacity: saving || !newText.trim() ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Bell size={16} />
            {saving ? 'Adding...' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Announcements List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div style={{ color: 'rgba(255,255,255,0.4)', padding: '2rem', textAlign: 'center' }}>Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.06)' }}>
            <Bell size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p>No announcements yet. Add your first one above.</p>
          </div>
        ) : (
          announcements.map((a, idx) => (
            <div
              key={a.id}
              style={{
                padding: '1rem 1.25rem',
                background: a.active ? 'rgba(167, 139, 250, 0.04)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${a.active ? 'rgba(167, 139, 250, 0.12)' : 'rgba(255,255,255,0.04)'}`,
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                transition: 'all 0.2s ease',
                opacity: a.active ? 1 : 0.5
              }}
            >
              {/* Priority Order */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
                <button
                  onClick={() => handlePriorityChange(a, 'up')}
                  disabled={idx === 0}
                  style={{ background: 'none', border: 'none', color: idx === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)', cursor: idx === 0 ? 'default' : 'pointer', padding: '2px' }}
                >
                  <ArrowUp size={14} />
                </button>
                <span style={{ textAlign: 'center', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
                  #{idx + 1}
                </span>
                <button
                  onClick={() => handlePriorityChange(a, 'down')}
                  disabled={idx === announcements.length - 1}
                  style={{ background: 'none', border: 'none', color: idx === announcements.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)', cursor: idx === announcements.length - 1 ? 'default' : 'pointer', padding: '2px' }}
                >
                  <ArrowDown size={14} />
                </button>
              </div>

              {/* Text / Edit Mode */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {editingId === a.id ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                      autoFocus
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(167, 139, 250, 0.3)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                    <button onClick={handleSaveEdit} style={{ background: '#4ade80', color: '#000', border: 'none', borderRadius: '8px', padding: '0 12px', cursor: 'pointer' }}>
                      <Check size={16} />
                    </button>
                    <button onClick={() => { setEditingId(null); setEditText(''); }} style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 12px', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <p style={{ color: '#fff', margin: 0, fontSize: '0.88rem', lineHeight: 1.5, wordBreak: 'break-word' }}>
                    {a.text}
                  </p>
                )}
              </div>

              {/* Actions */}
              {editingId !== a.id && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {/* Toggle active/inactive */}
                  <button
                    onClick={() => handleToggle(a)}
                    title={a.active ? 'Deactivate' : 'Activate'}
                    style={{ background: 'none', border: 'none', color: a.active ? '#4ade80' : 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '4px' }}
                  >
                    {a.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                  {/* Edit */}
                  <button
                    onClick={() => { setEditingId(a.id); setEditText(a.text); }}
                    title="Edit"
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px' }}
                  >
                    <Edit3 size={16} />
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(a.id)}
                    title="Delete"
                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationManager;
