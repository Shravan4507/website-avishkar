import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import './Settings.css';

interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsappNumber?: string;
  dob: string;
  college: string;
  major: string;
  avrId: string;
}

interface SettingsProps {
  existingData: UserProfile;
}

const Settings: React.FC<SettingsProps> = ({ existingData }) => {
  const [formData, setFormData] = useState({
    firstName: existingData?.firstName || '',
    lastName: existingData?.lastName || '',
    phone: existingData?.phone || '',
    whatsappNumber: existingData?.whatsappNumber || '',
    dob: existingData?.dob || '',
    college: existingData?.college || '',
    major: existingData?.major || '',
  });
  const [saved, setSaved] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingData?.uid) return;
    try {
      const userRef = doc(db, "user", existingData.uid);
      await updateDoc(userRef, formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Update Error:", error);
    }
  };

  return (
    <div className="settings-panel animate-in">
      <div className="settings-header">
        <h2 className="settings-title">Profile Settings</h2>
        <p className="settings-desc">Keep your contact information up-to-date for Avishkar notifications.</p>
        {saved && <p className="settings-saved">✅ Profile updated successfully!</p>}
      </div>

      <form className="settings-form" onSubmit={handleUpdate}>
        <div className="form-rows">
          <div className="form-group">
            <label>First Name</label>
            <input 
              type="text" 
              value={formData.firstName} 
              onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input 
              type="text" 
              value={formData.lastName} 
              onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
            />
          </div>
        </div>

        <div className="form-group">
          <label>Email (Locked)</label>
          <input type="email" value={existingData?.email} readOnly className="readonly-input" />
        </div>

        <div className="form-rows">
          <div className="form-group">
            <label>Cell Phone</label>
            <input 
              type="text" 
              value={formData.phone} 
              onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
            />
          </div>
          <div className="form-group">
            <label>WhatsApp Number</label>
            <input 
              type="text" 
              value={formData.whatsappNumber} 
              onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
            />
          </div>
        </div>

        <div className="form-group">
          <label>College</label>
          <input 
            type="text" 
            value={formData.college} 
            onChange={(e) => setFormData({...formData, college: e.target.value})} 
          />
        </div>

        <button type="submit" className="save-btn">Update Profile</button>
      </form>
    </div>
  );
};

export default Settings;
