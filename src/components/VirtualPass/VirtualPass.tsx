import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { X } from 'lucide-react';
import { generateQRToken } from '../../utils/qrCrypto';
import './VirtualPass.css';

interface VirtualPassProps {
  isOpen: boolean;
  isStatic?: boolean;
  onClose: () => void;
  user: {
    firstName: string;
    lastName: string;
    college: string;
    email: string;
    photoURL?: string;
    avrId: string;
    yearBorn: string;
    eventId?: string;
    hasRegistrations?: boolean;
  };
}

const QRCodeComponent = (QRCode as any).default || QRCode;

const VirtualPass: React.FC<VirtualPassProps> = ({ isOpen, isStatic, onClose, user }) => {
  const [qrToken, setQrToken] = useState<string>('');
  const [isQRExpanded, setIsQRExpanded] = useState(false);

  // Generate the secure QR token every time the pass is opened
  useEffect(() => {
    if (isOpen || isStatic) {
      const token = generateQRToken({
        firstName: user.firstName,
        lastName: user.lastName,
        avrId: user.avrId,
        yearBorn: user.yearBorn,
        eventId: user.eventId
      });
      setQrToken(token);
    }
  }, [isOpen, isStatic, user]);

  if (!isOpen && !isStatic) return null;
  if (!qrToken) return null; // Wait for encryption

  const content = (
    <div className={`virtual-pass-card ${isStatic ? 'virtual-pass-static' : ''}`} id={isStatic ? 'virtual-pass-static-capture' : undefined}>
      {/* Profile Photo */}
      <div className="pass-photo-container">
        {user.photoURL && user.photoURL.trim() !== '' ? (
          <img 
            src={user.photoURL} 
            alt="User" 
            className="pass-user-photo" 
            crossOrigin="anonymous"
          />
        ) : (
          <div className="pass-user-initials">
            {(user.firstName || 'U').charAt(0)}
          </div>
        )}
      </div>

      {/* Vertical Role Strip (Right) */}
      <div className="pass-vertical-strip" style={{ background: 'transparent' }}>
        <span className="pass-vertical-role-text" style={{ color: '#000' }}>
          {user.hasRegistrations ? 'PARTICIPANT' : 'VISITOR'}
        </span>
      </div>

      {/* Main Info (Overlay on Blue) */}
      <div className="pass-info-overlay">
        <h2 className="pass-name-main">{user.firstName + ' ' + user.lastName}</h2>
        <div className="pass-validity">
          ID VALID UPTO: 24/04
        </div>
      </div>

      {/* QR Code Section (Inside Black Bar) */}
      <div 
        className="pass-footer-qr" 
        style={{ filter: 'invert(1)', background: 'transparent', cursor: 'zoom-in' }}
        onClick={() => setIsQRExpanded(true)}
      >
        <QRCodeComponent 
          value={qrToken} 
          size={140} 
          bgColor="#000000" 
          fgColor="#ffffff" 
          level="H" 
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* QR Expansion Overlay */}
      {isQRExpanded && (
        <div className="qr-expansion-overlay animate-in" onClick={(e) => { e.stopPropagation(); setIsQRExpanded(false); }}>
          <div className="qr-expansion-content" onClick={(e) => e.stopPropagation()}>
            <button className="qr-close-btn" onClick={() => setIsQRExpanded(false)}><X size={24} /></button>
            <div className="qr-expanded-wrapper">
              <QRCodeComponent 
                value={qrToken} 
                size={window.innerWidth < 500 ? 280 : 400} 
                bgColor="#ffffff" 
                fgColor="#000000" 
                level="Q"
              />
            </div>
            <p className="qr-hint">TAP ANYWHERE TO CLOSE</p>
          </div>
        </div>
      )}

      {/* ID Number (Bottom Right) */}
      <div className="pass-id-number">{user.avrId}</div>
    </div>
  );

  if (isStatic) {
    return (
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', pointerEvents: 'none' }}>
        {content}
      </div>
    );
  }

  return (
    <div className="virtual-pass-modal-overlay" onClick={onClose}>
      <button className="virtual-pass-close-btn" onClick={onClose}><X size={24} /></button>
      <div className="virtual-pass-modal-content animate-in" onClick={(e) => e.stopPropagation()}>
        {content}
      </div>
    </div>
  );
};

export default VirtualPass;
