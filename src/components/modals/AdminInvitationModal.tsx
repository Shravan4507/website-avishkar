import React from 'react';
import { ShieldCheck, XCircle, CheckCircle } from 'lucide-react';
import './AdminInvitationModal.css';

interface AdminInvitationModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onReject: () => void;
}

const AdminInvitationModal: React.FC<AdminInvitationModalProps> = ({ isOpen, onAccept, onReject }) => {
  if (!isOpen) return null;

  return (
    <div className="invitation-overlay">
      <div className="invitation-modal glass-morphism animate-pop">
        <div className="invitation-glow" />
        <div className="invitation-header">
          <div className="shield-icon-wrapper">
            <ShieldCheck size={48} className="shield-icon" />
          </div>
          <h1>Exclusive Invitation</h1>
        </div>
        
        <div className="invitation-content">
          <p className="invitation-text">
            Congratulations! You have been selected to join the <strong>Avishkar '26 Administrative Team</strong>.
          </p>
          <div className="invitation-note">
            <p><strong>Note:</strong> If you accept, your dashboard will be upgraded with specialized administrative tools and elevated privileges.</p>
          </div>
        </div>

        <div className="invitation-actions">
          <button className="reject-btn" onClick={onReject}>
            <XCircle size={20} />
            Decline
          </button>
          <button className="accept-btn" onClick={onAccept}>
            <CheckCircle size={20} />
            Accept Invitation
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminInvitationModal;
