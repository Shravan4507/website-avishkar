import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';
import Loader from '../../components/loader/Loader';
import { useToast } from '../../components/toast/Toast';
import { majors } from '../../data/majors';
import collegesData from '../../data/colleges.json';
import GlassSelect from '../../components/dropdown/GlassSelect';
import './Signup.css';

const PASSING_YEARS = ["2024", "2025", "2026", "2027", "2028"];

const collegeOptions = collegesData.map(c => ({ label: c, value: c }));
const majorOptions = majors.map(m => ({ label: m, value: m }));

const Signup: React.FC = () => {
  const [user, authLoading] = useAuthState(auth);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    photoURL: '',
    phone: '',
    whatsappNumber: '',
    whatsappSameAsPhone: true,
    dob: '',
    sex: 'Male',
    college: '',
    major: '',
    passingYear: '2026',
  });
  const [submitting, setSubmitting] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const checkExisting = async () => {
      if (user) {
        // Capture initial Google Info
        const names = user.displayName?.split(' ') || ['', ''];
        setFormData(prev => ({
          ...prev,
          firstName: prev.firstName || names[0] || '',
          lastName: prev.lastName || names.slice(1).join(' ') || '',
          email: user.email || '',
          photoURL: user.photoURL || '',
        }));

        // CHECK IF ALREADY REGISTERED
        try {
          const userSnap = await getDoc(doc(db, "user", user.uid));
          if (userSnap.exists() && userSnap.data()?.avrId) {
             navigate('/user/dashboard', { replace: true });
             return;
          }
        } catch (e) {
          console.error("Check existing user err:", e);
        }
      } else if (!authLoading) {
        // Not logged in -> kick to login
        navigate('/login', { replace: true });
        return;
      }
      setIsCheckingProfile(false);
    };
    
    if (!authLoading) {
      checkExisting();
    }
  }, [user, authLoading, navigate]);

  const getAvroNamePart = (name: string) => {
    let part = name.toUpperCase().replace(/[^A-Z]/g, '');
    while (part.length < 3) {
      const randomChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      part += randomChar;
    }
    return part.slice(0, 3);
  };

  const validateForm = () => {
    const nameRegex = /^[a-zA-Z\s.-]{2,50}$/;
    const phoneRegex = /^[6-9]\d{9}$/;
    const dobRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;

    if (!nameRegex.test(formData.firstName)) {
      toast.error("First name should only contain letters and be 2-50 characters.");
      return false;
    }
    if (!nameRegex.test(formData.lastName)) {
      toast.error("Last name should only contain letters.");
      return false;
    }
    if (!phoneRegex.test(formData.phone)) {
      toast.error("Please enter a valid 10-digit phone number.");
      return false;
    }
    if (!formData.whatsappSameAsPhone && !phoneRegex.test(formData.whatsappNumber)) {
      toast.error("Please enter a valid 10-digit WhatsApp number.");
      return false;
    }

    const dobMatch = formData.dob.match(dobRegex);
    if (!dobMatch) {
      toast.error("Date of Birth must be in DD/MM/YYYY format.");
      return false;
    }

    const [_, d, m, y] = dobMatch.map(Number);
    const birthDate = new Date(y, m - 1, d);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (isNaN(birthDate.getTime()) || birthDate > today || age < 15 || age > 50) {
      toast.error("Please enter a valid Date of Birth (Age: 15-50).");
      return false;
    }

    if (!formData.college) {
      toast.error("Please select or enter your college.");
      return false;
    }
    if (!formData.major) {
      toast.error("Please select or enter your major.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, "counters", "user_counter");
        const userRef = doc(db, "user", user.uid);

        const counterSnap = await transaction.get(counterRef);
        let nextNumber = 1;
        
        if (counterSnap.exists()) {
          nextNumber = counterSnap.data().count + 1;
        }

        const namePart = getAvroNamePart(formData.firstName);
        const seqPart = nextNumber.toString().padStart(4, '0');
        const uniqueAvrId = `AVR-${namePart}-${seqPart}`;

        transaction.set(counterRef, { count: nextNumber }, { merge: true });
        
        transaction.set(userRef, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          photoURL: formData.photoURL,
          phone: formData.phone,
          whatsappNumber: formData.whatsappNumber,
          dob: formData.dob,
          sex: formData.sex,
          college: formData.college,
          major: formData.major,
          passingYear: formData.passingYear,
          uid: user.uid,
          avrId: uniqueAvrId,
          createdAt: serverTimestamp(),
          role: 'user'
        });
      });

      toast.success("Welcome to Avishkar '26!");
      navigate('/user/dashboard', { replace: true });
    } catch (error) {
      console.error("Signup Transaction Error:", error);
      toast.error("Registration failed. Please try again.");
      setSubmitting(false);
    }
  };

  const handleDOBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 8) val = val.slice(0, 8);
    let formatted = val;
    if (val.length > 2) formatted = val.slice(0, 2) + '/' + val.slice(2);
    if (val.length > 4) formatted = val.slice(0, 2) + '/' + val.slice(2, 4) + '/' + val.slice(4);
    setFormData({ ...formData, dob: formatted });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({ 
      ...formData, 
      phone: val,
      whatsappNumber: formData.whatsappSameAsPhone ? val : formData.whatsappNumber 
    });
  };

  if (authLoading || isCheckingProfile) {
    return <Loader fullscreen label="Preparing your portal..." />;
  }

  if (submitting) {
    return <Loader fullscreen label="Finalizing your registration..." />;
  }

  return (
    <div className="signup-container">
      <div className="signup-card animate-in">
        <h2 className="signup-title">Registration Form</h2>
        <p className="signup-subtitle">Complete your student profile to join Avishkar '26.</p>

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="form-rows">
            <div className="form-group">
              <label>First Name*</label>
              <input type="text" value={formData.firstName} required onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Last Name*</label>
              <input type="text" value={formData.lastName} required onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
            </div>
          </div>

          <div className="form-group">
            <label>Email (View Only)</label>
            <input type="email" value={formData.email} readOnly className="readonly-input" />
          </div>

          <div className="form-rows">
            <div className="form-group">
              <label>Cell Phone*</label>
              <div className="phone-input-wrapper">
                <span className="prefix">+91</span>
                <input type="text" placeholder="XXXXXXXXXX" value={formData.phone} required onChange={handlePhoneChange} />
              </div>
            </div>
            <div className="form-group">
              <label>Date of Birth* (DD/MM/YYYY)</label>
              <input type="text" placeholder="DD/MM/YYYY" value={formData.dob} required onChange={handleDOBChange} />
            </div>
          </div>

          <div className="checkbox-group">
            <input 
              type="checkbox" 
              id="whatsapp" 
              checked={formData.whatsappSameAsPhone} 
              onChange={(e) => setFormData({...formData, whatsappSameAsPhone: e.target.checked, whatsappNumber: e.target.checked ? formData.phone : formData.whatsappNumber })} 
            />
            <label htmlFor="whatsapp">WhatsApp number is same as Cell Phone</label>
          </div>

          {!formData.whatsappSameAsPhone && (
            <div className="form-group animate-in">
              <label>WhatsApp Number*</label>
              <div className="phone-input-wrapper">
                <span className="prefix">+91</span>
                <input 
                  type="text" 
                  placeholder="XXXXXXXXXX" 
                  value={formData.whatsappNumber} 
                  required 
                  onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                />
              </div>
            </div>
          )}

          <div className="form-rows">
            <div className="form-group">
              <label>Sex*</label>
              <GlassSelect 
                value={formData.sex || 'Male'} 
                onChange={(val) => setFormData({...formData, sex: val})}
                options={[
                  { label: 'Male', value: 'Male' },
                  { label: 'Female', value: 'Female' },
                  { label: 'Other', value: 'Other' }
                ]}
              />
            </div>
            <div className="form-group">
              <label>Year of Passing*</label>
              <GlassSelect 
                value={formData.passingYear || PASSING_YEARS[0]} 
                onChange={(val) => setFormData({...formData, passingYear: val})}
                options={PASSING_YEARS.map(year => ({ label: year, value: year }))}
              />
            </div>
          </div>

          {/* College with Searchable Dropdown */}
          <div className="form-group">
            <label>College Name*</label>
            <GlassSelect 
              placeholder="Search or type your college name..."
              value={formData.college}
              onChange={(val) => setFormData({...formData, college: val})}
              options={collegeOptions}
              searchable={true}
            />
          </div>

          {/* Major with Searchable Dropdown */}
          <div className="form-group">
            <label>Major/Branch*</label>
            <GlassSelect 
              placeholder="Search or type your major..."
              value={formData.major}
              onChange={(val) => setFormData({...formData, major: val})}
              options={majorOptions}
              searchable={true}
            />
          </div>

          <button type="submit" className="signup-btn">Finish Registration</button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
