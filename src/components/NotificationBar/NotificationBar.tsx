import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, type Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { Bell, X } from 'lucide-react';
import './NotificationBar.css';

interface Announcement {
  id: string;
  text: string;
  priority: number;
  active: boolean;
  createdAt: Timestamp | null;
}

export default function NotificationBar() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Check if user already dismissed this session
    const wasDismissed = sessionStorage.getItem('notif_bar_dismissed');
    if (wasDismissed === 'true') {
      setDismissed(true);
      setLoaded(true);
      return;
    }

    const q = query(
      collection(db, 'announcements'),
      where('active', '==', true),
      orderBy('priority', 'desc')
    );

    const defaultAnnouncements: Announcement[] = [
      {
        id: 'static-1',
        text: 'Winners must submit their account details on this site to receive their prize.',
        priority: 100,
        active: true,
        createdAt: null,
      },
      {
        id: 'static-2',
        text: 'Users can register for multiple events according to the schedule. Please check the schedule first!',
        priority: 99,
        active: true,
        createdAt: null,
      },
      {
        id: 'static-3',
        text: 'Postponed events will be refunded within 7 to 10 days by the Avishkar team.',
        priority: 98,
        active: true,
        createdAt: null,
      },
      {
        id: 'static-4',
        text: 'On-spot registrations are currently open for select events. Please check event-wise availability before proceeding.',
        priority: 97,
        active: true,
        createdAt: null,
      }
    ];

    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement));
      setAnnouncements([...defaultAnnouncements, ...items]);
      setLoaded(true);
    }, () => {
      // On error (e.g. missing index), just show default announcements
      setAnnouncements(defaultAnnouncements);
      setLoaded(true);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (loaded && !dismissed && announcements.length > 0) {
      document.documentElement.classList.add('has-notification-bar');
    } else {
      document.documentElement.classList.remove('has-notification-bar');
    }
    return () => {
      document.documentElement.classList.remove('has-notification-bar');
    };
  }, [loaded, dismissed, announcements.length]);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('notif_bar_dismissed', 'true');
  };

  if (!loaded || dismissed || announcements.length === 0) return null;

  // Duplicate track items for seamless looping
  const tickerSpeed = Math.max(15, announcements.length * 12);

  return (
    <div className={`notification-bar notification-bar--entering`}>
      <div className="notification-bar__inner">
        <div className="notification-bar__badge">
          <Bell size={13} />
          <span>LIVE</span>
        </div>

        <div className="notification-bar__ticker">
          <div
            className="notification-bar__track"
            style={{ '--ticker-duration': `${tickerSpeed}s` } as React.CSSProperties}
          >
            {/* Render twice for seamless infinite scroll */}
            {[...announcements, ...announcements].map((a, i) => (
              <div key={`${a.id}-${i}`} className="notification-bar__item">
                <span className="notification-bar__dot" />
                {a.text}
                {i < announcements.length * 2 - 1 && (
                  <span className="notification-bar__separator">◆</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          className="notification-bar__close"
          onClick={handleDismiss}
          aria-label="Dismiss notifications"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
