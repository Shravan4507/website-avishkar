import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, runTransaction, serverTimestamp, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';
import Loader from '../../components/loader/Loader';
import { useToast } from '../../components/toast/Toast';
import GlassSelect from '../../components/dropdown/GlassSelect';
import './AdminSetup.css';

const TEAMS = [
  "Stage Team",
  "Documentation Team",
  "Hospitality Team",
  "Technical Team",
  "Marketing Team",
  "Security Team",
  "Finance Team",
];

const ROLES = ["Head", "Member"];

const AdminSetup: React.FC = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    team: TEAMS[0],
    role: ROLES[1],
  });
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/admin-login');
      return;
    }
    // Pre-fill name from Firebase Auth display name if available
    const names = user.displayName?.split(' ') || ['', ''];
    setFormData(prev => ({
      ...prev,
      firstName: names[0] || '',
      lastName: names.slice(1).join(' ') || '',
    }));
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    try {
      await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, "counters", "admin_counter");
        const adminRef = doc(db, "admins", user.uid);

        const counterSnap = await transaction.get(counterRef);
        let nextNumber = 1;
        if (counterSnap.exists()) {
          nextNumber = counterSnap.data().count + 1;
        }

        const adminUniqueId = `AVR-ADM-${nextNumber.toString().padStart(4, '0')}`;

        transaction.set(counterRef, { count: nextNumber }, { merge: true });
        transaction.set(adminRef, {
          ...formData,
          uid: user.uid,
          email: user.email,
          adminId: adminUniqueId,
          createdAt: serverTimestamp(),
          accessLevel: formData.role === 'Head' ? 100 : 50,
          type: 'admin',
        });
      });

      // Update whitelist status if it exists
      try {
        const q = query(collection(db, "admin_whitelist"), where("email", "==", user.email?.toLowerCase()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          await updateDoc(doc(db, "admin_whitelist", snap.docs[0].id), {
            status: 'active'
          });
        }
      } catch (e) {
        console.error("Whitelist update failed:", e);
      }

      toast.success("Admin Profile Activated!");
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      console.error("Admin Setup Error:", err);
      toast.error("Activation failed. Please try again.");
      setSubmitting(false);
    }
  };

  if (submitting) {
    return <Loader fullscreen label="Activating your admin account..." />;
  }

  return (
    <div className="admin-setup-container">
      <div className="admin-setup-card">
        <div className="admin-badge">FIRST TIME SETUP</div>
        <h2 className="setup-title">Complete Your Profile</h2>
        <p className="setup-subtitle">Fill in your administrative details to activate your account.</p>

        <form className="setup-form" onSubmit={handleSubmit}>
          <div className="form-rows">
            <div className="form-group">
              <label>First Name*</label>
              <input
                type="text"
                value={formData.firstName}
                required
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Last Name*</label>
              <input
                type="text"
                value={formData.lastName}
                required
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Cell Phone*</label>
            <div className="phone-input-wrapper">
              <span className="prefix">+91</span>
              <input
                type="text"
                placeholder="XXXXXXXXXX"
                value={formData.phone}
                required
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              />
            </div>
          </div>

          <div className="form-rows">
            <div className="form-group">
              <label>Your Team*</label>
              <GlassSelect 
                value={formData.team} 
                onChange={(val) => setFormData({ ...formData, team: val })}
                options={TEAMS.map(t => ({ label: t, value: t }))}
              />
            </div>
            <div className="form-group">
              <label>Official Role*</label>
              <GlassSelect 
                value={formData.role} 
                onChange={(val) => setFormData({ ...formData, role: val })}
                options={ROLES.map(r => ({ label: r, value: r }))}
              />
            </div>
          </div>

          <button type="submit" className="setup-btn" disabled={submitting}>
            {submitting ? 'Activating...' : 'Activate Admin Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminSetup;
