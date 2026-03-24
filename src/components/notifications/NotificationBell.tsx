import React, { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, where, limit } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import './NotificationBell.css';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  createdAt: any;
}

interface NotificationBellProps {
  userId: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    // Listen to user-specific notifications + global ones
    const q = query(
      collection(db, "notifications"),
      where("targetId", "in", [userId, "all"]),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(notes);
      setUnreadCount(notes.length); // For now, treat all as unread if they exist
    });

    return () => unsubscribe();
  }, [userId]);

  const removeNotification = async (id: string) => {
    try {
      // In a real app, we'd mark as read, but for simplicity we delete or filter locally
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to dismiss notification:", err);
    }
  };

  return (
    <div className="notification-bell-container">
      <button 
        className={`bell-trigger ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown glass-morphism animate-in">
          <div className="dropdown-header">
            <h3>Notifications</h3>
            <button className="close-dropdown" onClick={() => setIsOpen(false)}><X size={16} /></button>
          </div>

          <div className="dropdown-body">
            {notifications.length === 0 ? (
              <div className="empty-notifications">
                <BellOff size={32} />
                <p>No new updates</p>
              </div>
            ) : (
              notifications.map((note) => (
                <div key={note.id} className={`notification-item ${note.type}`}>
                  <div className="note-content">
                    <p className="note-title">{note.title}</p>
                    <p className="note-message">{note.message}</p>
                  </div>
                  <button className="dismiss-note" onClick={() => removeNotification(note.id)}>
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
