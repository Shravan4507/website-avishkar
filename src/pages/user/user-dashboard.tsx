import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, updateDoc, onSnapshot, serverTimestamp, query, collection, getDocs, where } from 'firebase/firestore';
import { auth, db, storage } from '../../firebase/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import DashboardSkeleton from '../../components/common/DashboardSkeleton';
import NotificationBell from '../../components/notifications/NotificationBell';
import { useToast } from '../../components/toast/Toast';
import { Award, FileText, Instagram, Youtube, BookOpen, Download, Camera, Loader2, CloudUpload, Zap } from 'lucide-react';
import VirtualPass from '../../components/VirtualPass/VirtualPass';
import { generateInvoice } from '../../utils/InvoiceGenerator';
import { useCache } from '../../hooks/useCache';
import ImageCropper from '../../components/image-cropper/ImageCropper';
import './user-dashboard.css';


interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsappNumber?: string;
  dob: string;
  sex: string;
  major: string;
  college: string;
  passingYear: string;
  avrId: string;
  photoURL?: string;
  points?: number;
  referrals?: number;
  role?: string;
  designation?: string;
  badges?: {
    voidWalker?: {
      unlocked: boolean;
      unlockedAt: string;
    }
  };
}

const UserDashboard: React.FC = () => {
  const [user, authLoading] = useAuthState(auth);
  const navigate = useNavigate();
  const toast = useToast();
  
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [cachedPhoto, setCachedPhoto] = useCache<string>('user_pfp', '', 'local');
  const [myRegistrations, setMyRegistrations] = useState<any[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPassOpen, setIsPassOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  
  // Profile Image Upload State
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isAvatarExpanded, setIsAvatarExpanded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const getHighResUrl = (url?: string) => {
    if (!url) return '';
    if (url.includes('googleusercontent.com')) {
      return url.replace(/=s\d+-c/, '=s1000-c');
    }
    return url;
  };
  
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image too large (Max 5MB)");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = async (croppedImage: string) => {
    if (!user || !userData) return;
    setIsUploadingImage(true);
    setIsCropperOpen(false);
    toast.info("Optimizing and uploading...");

    try {
      const storageRef = ref(storage, `users/${user.uid}/avatar.webp`);
      // uploadString with 'data_url' picks up the base64 from the cropper
      await uploadString(storageRef, croppedImage, 'data_url', {
        contentType: 'image/webp'
      });
      
      const downloadURL = await getDownloadURL(storageRef);
      
      // 1. Update Firestore
      await updateDoc(doc(db, "user", user.uid), {
        photoURL: downloadURL,
        updatedAt: serverTimestamp()
      });

      // 2. Update Local Cache (Super Smooth UX)
      setCachedPhoto(croppedImage); // Use base64 locally for instant render
      
      toast.success("Profile picture updated!");
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("Failed to upload image.");
    } finally {
      setIsUploadingImage(false);
    }
  };
  
  const handleDownloadPass = async () => {
    if (!userData) return;
    setIsDownloading(true);
    toast.info("Generating your high-res pass...");

    try {
      const html2canvas = (await import('html2canvas')).default;
      // Wait for static pass and textures to be ready
      await new Promise(r => setTimeout(r, 1000));
      
      const element = document.getElementById('virtual-pass-static-capture');
      if (!element) throw new Error("Capture element not found");

      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: false,
        scale: 3,
        backgroundColor: null,
        logging: false,
        onclone: (doc) => {
          const el = doc.getElementById('virtual-pass-static-capture');
          if (el) {
            el.style.position = 'fixed';
            el.style.top = '0';
            el.style.left = '0';
            el.style.zIndex = '9999';
            el.style.opacity = '1';
            el.style.pointerEvents = 'auto';
          }
        }
      });

      const link = document.createElement('a');
      link.download = `Avishkar26_Pass_${userData.firstName}.webp`;
      link.href = canvas.toDataURL('image/webp', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Pass downloaded!");
    } catch (e) {
      console.error("Pass download error:", e);
      toast.error("Failed to generate pass.");
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (!user && !authLoading) {
      navigate('/login');
      return;
    }

    if (user) {
      // REAL-TIME LISTENER FOR USER PROFILE
      const unsubscribe = onSnapshot(doc(db, "user", user.uid), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserProfile;
          if (data.avrId) {
            setUserData(data);
            setEditForm(data);
            // Cache photo for super smooth UI on next visit
            if (data.photoURL) setCachedPhoto(data.photoURL);
            
            // Also check if admin to show scanner button
            getDoc(doc(db, "admins", user.uid)).then(adm => {
              if (adm.exists()) setIsAdmin(true);
            });
          } else {
            navigate('/signup', { replace: true });
          }
        } else {
          // Check if admin
          getDoc(doc(db, "admins", user.uid)).then(adm => {
            if (adm.exists()) {
              navigate('/admin/dashboard', { replace: true });
            } else {
              navigate('/signup', { replace: true });
            }
          });
        }
      });


      // FETCH MY REGISTRATIONS
      const fetchMyRegistrations = async () => {
        try {
          // 1. Fetch User Profile to get AVR ID
          const uSnap = await getDoc(doc(db, "user", user.uid));
          const avrId = uSnap.data()?.avrId;

          // Standard registrations (Check userEmail OR allAvrIds)
          const qLeader = query(collection(db, "registrations"), where("userEmail", "==", user.email));
          const snapLeader = await getDocs(qLeader);
          
          let memberRegs: any[] = [];
          if (avrId) {
            const qMember = query(collection(db, "registrations"), where("allAvrIds", "array-contains", avrId));
            const snapMember = await getDocs(qMember);
            memberRegs = snapMember.docs.map(d => ({ id: d.id, ...d.data() }));
          }

          const leaderRegs = snapLeader.docs.map(d => ({ id: d.id, ...d.data() }));
          
          // Combine and deduplicate by document ID
          const combinedRegs = [...leaderRegs, ...memberRegs];
          const uniqueRegs = Array.from(new Map(combinedRegs.map(item => [item.id, item])).values());

          // Param-X / Hackathon registrations (Check leaderEmail OR allAvrIds OR allEmails)
          const qH1 = query(collection(db, "hackathon_registrations"), where("leaderEmail", "==", user.email));
          const snapH1 = await getDocs(qH1);
          
          let hMemberRegs: any[] = [];
          if (avrId) {
            const qH2 = query(collection(db, "hackathon_registrations"), where("allAvrIds", "array-contains", avrId));
            const snapH2 = await getDocs(qH2);
            hMemberRegs = snapH2.docs.map(d => ({ id: d.id, ...d.data() }));
          }

          const hLeaderRegs = snapH1.docs.map(d => ({ id: d.id, ...d.data() }));
          const combinedHRegs = [...hLeaderRegs, ...hMemberRegs].map(reg => ({
            ...reg,
            eventName: 'Param-X Hackathon',
            category: 'Tech / Hackathon',
            isHackathon: true
          }));
          const uniqueHRegs = Array.from(new Map(combinedHRegs.map(item => [item.id, item])).values());

          setMyRegistrations([...uniqueRegs, ...uniqueHRegs]);
        } catch (e) {
          console.error("Registrations fetch error:", e);
        }
      };

      
      if (user.email) {
        fetchMyRegistrations();
      }

      return () => unsubscribe();
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (isAvatarExpanded || isPassOpen || isEditModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isAvatarExpanded, isPassOpen, isEditModalOpen]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast.info("Logged out successfully.");
      navigate('/login');
    } catch (e) {
      toast.error("Logout failed.");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData) return;
    
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "user", user.uid), {
        ...editForm,
        updatedAt: serverTimestamp()
      });
      toast.success("Profile updated successfully!");
      setIsEditModalOpen(false);
    } catch (error) {
      toast.error("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };



  if (authLoading || (!userData && !authLoading)) {
    return <DashboardSkeleton />;
  }

  if (!userData) return null;

  return (
    <div className="user-dashboard-page">
      <div className="user-dashboard-container">
        
        {/* --- HEADER --- */}
        <header className="user-dashboard-header">
          <div className="user-dashboard-profile">
            <div className="user-dashboard-avatar" onClick={() => setIsAvatarExpanded(true)} style={{ cursor: 'pointer' }}>
              {(() => {
                const finalUrl = [userData?.photoURL, getHighResUrl(user?.photoURL || undefined), cachedPhoto].find(url => url && url.trim() !== '' && (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:')));
                
                if (finalUrl) {
                  return (
                    <img 
                      src={finalUrl} 
                      alt="" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="user-dashboard-initials">${userData?.firstName?.[0] || 'U'}${userData?.lastName?.[0] || ''}</div>`;
                        }
                      }}
                    />
                  );
                }
                return (
                  <div className="user-dashboard-initials">
                    {(userData?.firstName || 'U').charAt(0)}
                  </div>
                );
              })()}
            </div>
            <div className="user-dashboard-info">
              <h1 className="user-dashboard-name">Welcome, {userData.firstName}</h1>
              <div className="user-dashboard-badges">
                <div className="user-dashboard-id">AVR-ID: <span>{userData.avrId}</span></div>
                {userData.badges?.voidWalker?.unlocked && (
                  <div className="badge-pill void-walker-badge" title="Unlocked by bypassing the main protocol">
                    <Zap size={14} fill="currentColor" /> Void Walker
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="user-dashboard-header-actions">
            <NotificationBell userId={user?.uid || ''} />
            <button className="user-edit-profile-btn" onClick={() => setIsEditModalOpen(true)}>Edit Profile</button>
            <button className="user-logout-btn" onClick={handleLogout}>Log Out</button>
          </div>
        </header>

        {/* --- MAIN GRID --- */}
        <div className="user-dashboard-grid">
          
          {/* LEFT SIDEBAR: Quick Actions & Follow Us */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Quick Actions Panel */}
            <aside className="user-dashboard-section">
              <div className="user-section-header">
                <h2>Quick Actions</h2>
              </div>
              <div className="user-action-buttons">
                {(userData.role === 'volunteer' || isAdmin) && (
                  <button 
                    className="user-action-btn" 
                    onClick={() => navigate('/user/scanner')}
                    style={{ background: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.3)', color: '#fff' }}
                  >
                    <span style={{ color: '#a78bfa', fontWeight: 'bold' }}>Launch Scanner</span> 📸
                  </button>
                )}
                <button className="user-action-btn" onClick={() => setIsPassOpen(true)}>
                  View Virtual Pass <span>🪪</span>
                </button>
                <button className="user-action-btn" onClick={() => navigate('/schedule')}>
                  Event Schedule <span>📅</span>
                </button>

              </div>
            </aside>

            {/* Follow Us Panel */}
            <aside className="user-dashboard-section" style={{ textAlign: 'center' }}>
              <h3 style={{ color: '#e2e8f0', fontSize: '1.2rem', marginBottom: '1rem', fontFamily: "'Iceland', sans-serif", letterSpacing: '1.5px' }}>Follow Us</h3>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <a href="https://www.instagram.com/zeal_avishkar/" target="_blank" rel="noreferrer" className="social-icon-btn">
                  <Instagram size={24} />
                </a>
                <a href="https://www.youtube.com/@zeal_avishkar" target="_blank" rel="noreferrer" className="social-icon-btn">
                  <Youtube size={24} />
                </a>
              </div>
            </aside>
          </div>

          {/* MAIN COLUMN: Registrations & Downloads */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* My Registrations */}
            <section className="user-dashboard-section">
              <div className="user-section-header">
                <h2>My Registrations</h2>
                <Award size={24} color="#a78bfa" />
              </div>
              <div className="registrations-grid">
                {myRegistrations.length > 0 ? myRegistrations.map((reg) => (
                    <div key={reg.id} className="registration-card">
                    <div className="reg-icon"><Award size={20}/></div>
                    <div className="reg-details">
                      <h3>{reg.eventName}</h3>
                      <p>{reg.category}</p>

                      {reg.teamId && (
                        <div className="reg-team-id">
                          <span className="id-label">Team ID</span>
                          <span className="id-value">{reg.teamId}</span>
                        </div>
                      )}
                    </div>
                    <div className="reg-actions">
                      <div className="reg-status">Registered</div>
                      {reg.isHackathon && (
                        <div className="reg-hackathon-actions">
                          <button 
                            className="invoice-download-btn" 
                            title="Download Invoice"
                            onClick={() => generateInvoice({
                              teamName: reg.teamName,
                              leaderName: reg.leaderName,
                              leaderEmail: reg.leaderEmail,
                              avrId: reg.leaderAvrId || reg.avrId,
                              psId: reg.psId,
                              psTitle: reg.psId, 
                              paymentId: reg.paymentId,
                              date: reg.createdAt?.toDate ? reg.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString(),
                              amount: "500.00"
                            })}
                          >
                            <Download size={18} />
                          </button>
                          <button 
                            className="dashboard-upload-btn"
                            title="Upload PPT"
                            onClick={() => navigate('/param-x/upload')}
                          >
                            <CloudUpload size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                )) : (
                  <div className="empty-state-card">
                    <p>You haven't registered for any events yet!</p>
                    <button className="user-edit-profile-btn" style={{ width: 'auto' }} onClick={() => navigate('/competitions')}>Browse Competitions</button>
                  </div>
                )}
              </div>
            </section>

            {/* Downloads Section */}
            <section className="user-dashboard-section">
              <div className="user-section-header">
                <h2>Downloads</h2>
                <FileText size={24} color="#a78bfa" />
              </div>
              <div className="downloads-grid">
                <button className="download-card" onClick={handleDownloadPass} disabled={isDownloading}>
                  <div className="dl-icon"><Award size={24} /></div>
                  <div className="dl-info">
                    <h3>Virtual Pass</h3>
                    <p>{isDownloading ? 'Generating...' : 'Download as PNG'}</p>
                  </div>
                </button>
                <button className="download-card disabled-card" onClick={() => toast.info("The official rule book is being finalized and will be available soon.")}>
                  <div className="dl-icon"><BookOpen size={24} /></div>
                  <div className="dl-info">
                    <h3>Rule Book</h3>
                    <p>Coming soon</p>
                  </div>
                </button>
                <button className="download-card disabled-card" onClick={() => toast.info("Certificates will be available after the event.")}>
                  <div className="dl-icon"><FileText size={24} /></div>
                  <div className="dl-info">
                    <h3>Certificates</h3>
                    <p>Available post-event</p>
                  </div>
                </button>
                <button className="download-card disabled-card" onClick={() => toast.info("Workshop content will be uploaded soon.")}>
                  <div className="dl-icon"><Youtube size={24} /></div>
                  <div className="dl-info">
                    <h3>Workshop Content</h3>
                    <p>Coming soon</p>
                  </div>
                </button>
              </div>
            </section>
          </div>
        </div>

      </div>

      {/* --- EDIT PROFILE MODAL --- */}
      {isEditModalOpen && (
        <div className="user-modal-overlay">
          <div className="user-modal-card user-modal-card--large">
            <div className="user-modal-header">
              <h2>Update Profile</h2>
              <button className="user-close-btn" onClick={() => setIsEditModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="user-edit-form">
              {/* Avatar Upload Section */}
              <div className="user-avatar-edit-section">
                <div className="avatar-edit-preview">
                  {(() => {
                    const finalUrl = [userData?.photoURL, getHighResUrl(user?.photoURL || undefined), cachedPhoto].find(url => url && url.trim() !== '' && (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:')));
                    return finalUrl ? <img src={finalUrl} alt="Avatar" /> : <div className="avatar-edit-initials">{(userData.firstName || 'U').charAt(0)}</div>;
                  })()}
                  {isUploadingImage && (
                    <div className="avatar-upload-loading">
                      <Loader2 className="spinner" />
                    </div>
                  )}
                </div>
                <button 
                  type="button" 
                  className="avatar-change-trigger"
                  onClick={() => document.getElementById('avatar-input-hidden')?.click()}
                  disabled={isUploadingImage}
                >
                  <Camera size={14} /> Change Photo
                </button>
                <input 
                  type="file" 
                  id="avatar-input-hidden" 
                  hidden 
                  accept="image/*" 
                  onChange={handleImageSelect}
                />
              </div>

              <div className="user-form-grid">
                <div className="user-form-group">
                  <label>First Name</label>
                  <input type="text" value={editForm.firstName || ''} onChange={e => setEditForm({...editForm, firstName: e.target.value})} />
                </div>
                <div className="user-form-group">
                  <label>Last Name</label>
                  <input type="text" value={editForm.lastName || ''} onChange={e => setEditForm({...editForm, lastName: e.target.value})} />
                </div>
                <div className="user-form-group">
                  <label>Email (Verified)</label>
                  <input type="text" value={userData.email} readOnly className="readonly-input" />
                </div>
                <div className="user-form-group">
                  <label>AVR-ID (Permanent)</label>
                  <input type="text" value={userData.avrId} readOnly className="readonly-input" />
                </div>
                <div className="user-form-group">
                  <label>College</label>
                  <input type="text" value={editForm.college || ''} onChange={e => setEditForm({...editForm, college: e.target.value})} />
                </div>
                <div className="user-form-group">
                  <label>Major</label>
                  <input type="text" value={editForm.major || ''} onChange={e => setEditForm({...editForm, major: e.target.value})} />
                </div>
                <div className="user-form-group">
                  <label>Phone Number</label>
                  <input type="text" value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                </div>
                <div className="user-form-group">
                  <label>WhatsApp Number</label>
                  <input type="text" value={editForm.whatsappNumber || ''} onChange={e => setEditForm({...editForm, whatsappNumber: e.target.value})} />
                </div>
              </div>

              <div className="user-modal-footer">
                <button type="button" className="user-cancel-btn" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="user-save-btn" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* --- VIRTUAL PASS MODALS --- */}
      <VirtualPass 
        isOpen={isPassOpen} 
        onClose={() => setIsPassOpen(false)} 
        user={{
          firstName: userData.firstName,
          lastName: userData.lastName,
          college: userData.college,
          email: userData.email,
          photoURL: userData.photoURL,
          avrId: userData.avrId,
          yearBorn: userData.dob ? userData.dob.split('-')[0] : (userData.passingYear ? (parseInt(userData.passingYear) - 4).toString() : '2005'),
          eventId: myRegistrations.find(r => r.eventName === 'Param-X Hackathon')?.id || myRegistrations[0]?.id,
          hasRegistrations: myRegistrations.length > 0
        }} 
      />

      {/* Static capture element for html2canvas */}
      <VirtualPass 
        isOpen={false} 
        isStatic={true}
        onClose={() => {}} 
        user={{
          firstName: userData.firstName,
          lastName: userData.lastName,
          college: userData.college,
          email: userData.email,
          photoURL: userData.photoURL,
          avrId: userData.avrId,
          yearBorn: userData.dob ? userData.dob.split('-')[0] : (userData.passingYear ? (parseInt(userData.passingYear) - 4).toString() : '2005'),
          eventId: myRegistrations.find(r => r.eventName === 'Param-X Hackathon')?.id || myRegistrations[0]?.id,
          hasRegistrations: myRegistrations.length > 0
        }} 
      />
      {isAvatarExpanded && (
        <div className="avatar-expand-overlay" onClick={() => setIsAvatarExpanded(false)}>
          <button className="avatar-expand-close" onClick={() => setIsAvatarExpanded(false)}>&times;</button>
          <div className="avatar-expand-content" onClick={e => e.stopPropagation()}>
            {(() => {
              const finalUrl = [userData?.photoURL, getHighResUrl(user?.photoURL || undefined), cachedPhoto].find(url => url && url.trim() !== '' && (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:')));
              return finalUrl ? <img src={finalUrl} alt="Full Avatar" /> : <div className="avatar-expand-initials">{(userData?.firstName || 'U').charAt(0)}</div>;
            })()}
          </div>
        </div>
      )}
      {isCropperOpen && (
        <ImageCropper 
          imageSrc={imageToCrop} 
          onCropComplete={onCropComplete} 
          onCancel={() => setIsCropperOpen(false)} 
        />
      )}
    </div>
  );
};

export default UserDashboard;
