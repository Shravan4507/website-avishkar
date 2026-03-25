import React, { useState } from 'react';
import { db, storage } from '../../firebase/firebase';
import { setDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { compressImageToWebP } from '../../utils/imageCompressor';
import { useToast } from '../toast/Toast';
import { Plus, Image as ImageIcon, UploadCloud } from 'lucide-react';
import type { AdminProfile } from '../../pages/admin/admindashboard';
import { generateCompetitionId } from '../../data/competitions';
import GlassSelect from '../dropdown/GlassSelect';

interface CompetitionFormProps {
  adminProfile: AdminProfile | null;
}

const THEME_PRESETS = [
  { label: 'Avishkar Purple', border: '#5227FF', gradient: 'linear-gradient(145deg, #5227FF, #000)' },
  { label: 'Neon Cyber Green', border: '#d9ff00', gradient: 'linear-gradient(180deg, #d9ff00, #000)' },
  { label: 'Valorant Red', border: '#ff4655', gradient: 'linear-gradient(210deg, #ff4655, #000)' },
  { label: 'Electric Blue', border: '#00f0ff', gradient: 'linear-gradient(145deg, #00f0ff, #000)' },
  { label: 'Warning Orange', border: '#ff8c00', gradient: 'linear-gradient(180deg, #ff8c00, #000)' },
  { label: 'Hacker Terminal', border: '#00ff41', gradient: 'linear-gradient(180deg, #00ff41, #000)' }
];

const inputStyle = {
  width: '100%', 
  padding: '14px 16px', 
  borderRadius: '12px', 
  background: 'rgba(0,0,0,0.3)', 
  border: '1px solid rgba(167, 139, 250, 0.3)', 
  color: '#fff', 
  outline: 'none',
  fontFamily: 'inherit',
  fontSize: '0.95rem',
  transition: 'border-color 0.2s ease'
};

const labelStyle = {
  display: 'block',
  color: 'rgba(255,255,255,0.7)',
  marginBottom: '8px',
  fontSize: '0.9rem',
  fontWeight: '600'
};

const CompetitionForm: React.FC<CompetitionFormProps> = ({ adminProfile }) => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    location: '',
    handle: '',
    prizePool: '',
    url: '#'
  });

  const [themeIndex, setThemeIndex] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile || (
      !adminProfile.roleLevel.startsWith('department_admin') && 
      !adminProfile.roleLevel.startsWith('competition_admin') && 
      !adminProfile.roleLevel.startsWith('core_team') && 
      adminProfile.roleLevel !== 'superadmin'
    )) {
      error('You do not have permission to post competitions.');
      return;
    }

    if (!formData.title || !formData.description || !imageFile) {
      error('Please fill all required fields and select an image.');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // 1. Generate the URL Slug
      const generateSlug = (title: string) => title.toLowerCase().trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      const baseSlug = generateSlug(formData.title);
      let customSlug = baseSlug;
      
      // 2. Collision Detection
      const docRef = doc(db, 'competitions', customSlug);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        customSlug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;
      }

      // 3. Compress & Upload Image with Slug as Filename
      const compressedWebP = await compressImageToWebP(imageFile);
      const storageRef = ref(storage, `competitions/images/${customSlug}.webp`);
      const uploadTask = uploadBytesResumable(storageRef, compressedWebP);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (err) => {
          console.error("Upload error:", err);
          error('Failed to upload image.');
          setLoading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          // Extract department from roleLevel: "department_admin-computer engineering" → "Computer Engineering"
          const adminDept = adminProfile.roleLevel.startsWith('department_admin-') 
            ? adminProfile.roleLevel.replace('department_admin-', '')
            : adminProfile.assignment || 'Unknown';

          // Generate deterministic competition ID
          const competitionId = generateCompetitionId(adminDept, formData.title);
          const selectedTheme = THEME_PRESETS[themeIndex];

          const competitionDoc = {
            id: competitionId,
            ...formData,
            borderColor: selectedTheme.border,
            gradient: selectedTheme.gradient,
            image: downloadURL,
            department: adminDept,
            isFlagship: false,
            slug: customSlug,
            createdAt: serverTimestamp(),
            createdBy: adminProfile.id
          };

          // Store using the competition ID as the Firestore doc ID
          await setDoc(doc(db, 'competitions', competitionId), competitionDoc);
          
          success('Competition successfully posted!');
          
          setFormData({
            title: '',
            subtitle: '',
            description: '',
            location: '',
            handle: '',
            prizePool: '',
            url: '#'
          });
          setThemeIndex(0);
          setImageFile(null);
          setImagePreview(null);
          setLoading(false);
          setUploadProgress(0);
        }
      );
    } catch (err: any) {
      console.error("Error posting competition", err);
      error('Error posting competition: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="admin-form-card" style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Plus size={32} color="#a78bfa" />
        <h3 style={{ color: '#fff', fontSize: '1.5rem', margin: 0 }}>Post New Competition</h3>
      </div>
      
      <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '32px' }}>
        Create a new competition card to be displayed on the platform. All uploaded images undergo advanced WebP compression implicitly prior to indexing.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <label style={labelStyle}>Competition Title <span style={{ color: '#ff4655' }}>*</span></label>
            <input name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. Code Relay '26" required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Subtitle / Category <span style={{ color: '#ff4655' }}>*</span></label>
            <input name="subtitle" value={formData.subtitle} onChange={handleInputChange} placeholder="e.g. Competitive Programming" required style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Full Description <span style={{ color: '#ff4655' }}>*</span></label>
          <textarea 
            name="description" 
            value={formData.description} 
            onChange={handleInputChange} 
            placeholder="A compelling description of the competition mechanics..." 
            rows={4} 
            required
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          <div>
            <label style={labelStyle}>Location / Venue</label>
            <input name="location" value={formData.location} onChange={handleInputChange} placeholder="e.g. IT Smart Class" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Prize Pool</label>
            <input name="prizePool" value={formData.prizePool} onChange={handleInputChange} placeholder="e.g. ₹5,000+" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Short Handle</label>
            <input name="handle" value={formData.handle} onChange={handleInputChange} placeholder="e.g. Code-Relay" style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <label style={labelStyle}>Card Theme Preset</label>
            <GlassSelect 
              options={THEME_PRESETS.map((t, idx) => ({ label: t.label, value: idx.toString() }))}
              value={themeIndex.toString()}
              onChange={(val) => setThemeIndex(Number(val))}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Registration URL</label>
            <input name="url" value={formData.url} onChange={handleInputChange} placeholder="Optional external link or '#'" style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Competition Image Asset <span style={{ color: '#ff4655' }}>*</span></label>
          <div style={{ position: 'relative', width: '100%', height: '240px', background: 'rgba(0,0,0,0.5)', border: '2px dashed rgba(167, 139, 250, 0.4)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.3s' }}>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange} 
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }}
              required={!imageFile}
            />
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <>
                <ImageIcon size={48} color="rgba(167, 139, 250, 0.5)" style={{ marginBottom: '12px' }} />
                <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500, fontSize: '1.1rem' }}>Click or drag a high-res image here</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', marginTop: '8px' }}>PNG, JPG, JPEG (auto-compressed to WebP)</span>
              </>
            )}
            {imagePreview && (
              <div style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem', color: '#fff', pointerEvents: 'none', zIndex: 11, border: '1px solid rgba(255,255,255,0.1)' }}>
                Change Image
              </div>
            )}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            background: loading ? '#333' : 'rgba(167, 139, 250, 0.15)', 
            color: loading ? '#888' : '#a78bfa', 
            width: '100%', 
            padding: '16px', 
            fontWeight: 'bold', 
            fontSize: '1.1rem', 
            borderRadius: '16px',
            border: `1px solid ${loading ? '#333' : 'rgba(167, 139, 250, 0.4)'}`,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '16px',
            transition: 'all 0.3s'
          }}
          onMouseOver={(e) => { if(!loading) { e.currentTarget.style.background = 'rgba(167, 139, 250, 0.25)'; e.currentTarget.style.transform = 'translateY(-2px)' } }}
          onMouseOut={(e) => { if(!loading) { e.currentTarget.style.background = 'rgba(167, 139, 250, 0.15)'; e.currentTarget.style.transform = 'translateY(0)' } }}
        >
          {loading ? (
            <>
              <span>Compressing & Uploading...</span>
              <div style={{ width: '120px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#a78bfa', transition: 'width 0.2s' }} />
              </div>
              <span style={{ fontSize: '0.9rem' }}>{Math.round(uploadProgress)}%</span>
            </>
          ) : (
            <>
              <UploadCloud size={22} />
              <span>Post Competition to Database</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default CompetitionForm;
