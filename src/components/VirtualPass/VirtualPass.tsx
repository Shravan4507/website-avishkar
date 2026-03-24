import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { X } from 'lucide-react';
import { signQRPayload } from '../../utils/qrCrypto';
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
  };
}

const QRCodeComponent = (QRCode as any).default || QRCode;

const VirtualPass: React.FC<VirtualPassProps> = ({ isOpen, isStatic, onClose, user }) => {
  const [signedPayload, setSignedPayload] = useState<string>('');

  // Sign the AVR-ID every time the pass is opened
  useEffect(() => {
    if (isOpen || isStatic) {
      signQRPayload(user.avrId).then(setSignedPayload);
    }
  }, [isOpen, isStatic, user.avrId]);

  if (!isOpen && !isStatic) return null;
  if (!signedPayload) return null; // Wait for signing

  const content = (
    <div className={`virtual-pass-card ${isStatic ? 'virtual-pass-static' : ''}`} id={isStatic ? 'virtual-pass-static-capture' : undefined}>
      {/* Top gradient header */}
      <div className="pass-header">
        <div className="pass-logo-area">
          <span className="pass-logo-text">A</span>
        </div>
        <div className="pass-event-name">
          <span className="pass-event-title">AVISHKAR '26</span>
          <span className="pass-event-sub">National Level Technical Fest</span>
        </div>
      </div>

      {/* User Info */}
      <div className="pass-body">
        <div className="pass-user-info">
          <h2 className="pass-name">{user.firstName} {user.lastName}</h2>
          <p className="pass-college">{user.college}</p>
        </div>

        <div className="pass-divider"></div>

        {/* QR contains signed encrypted payload */}
        <div className="pass-qr-section">
          <div className="qr-wrapper">
            <QRCodeComponent 
              value={signedPayload} 
              size={140} 
              bgColor="#ffffff" 
              fgColor="#0f0f23" 
              level="H" 
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          <div className="pass-avr-id-box">
            <span className="pass-avr-label">AVR-ID</span>
            <span className="pass-avr-val">{user.avrId}</span>
          </div>
          <p className="pass-scan-hint">HMAC-SHA256 Signed • Scan to verify</p>
        </div>
      </div>

      {/* Footer strip */}
      <div className="pass-footer-strip">
        <span>VIRTUAL PASS</span>
        <span>•</span>
        <span>AVISHKAR '26</span>
      </div>
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
    <div className="virtual-pass-modal-overlay">
      <div className="virtual-pass-modal-content animate-in">
        <button className="virtual-pass-close-btn" onClick={onClose}><X size={24} /></button>
        {content}
      </div>
    </div>
  );
};

export default VirtualPass;
