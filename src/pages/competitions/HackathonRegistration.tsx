import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useSearchParams } from 'react-router-dom';
import { doc, collection, serverTimestamp, query, where, getDocs, runTransaction } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';
import SEO from '../../components/seo/SEO';
import { useToast } from '../../components/toast/Toast';
import GlassSelect from '../../components/dropdown/GlassSelect';
import { fetchProblemStatements, type ProblemStatement } from '../../utils/storageUtils';
import collegesData from '../../data/colleges.json';
import { Check, Users, ArrowRight, ArrowLeft, Loader2, User, Mail, Phone, Building2 } from 'lucide-react';
import './HackathonRegistration.css';

const HackathonRegistration: React.FC = () => {
    const [user] = useAuthState(auth);
    const [searchParams] = useSearchParams();
    const { toast } = useToast();
    
    // Steps: 1: Team Details, 2: Review, 3: Success
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [problems, setProblems] = useState<ProblemStatement[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const [formData, setFormData] = useState({
        teamName: '',
        psId: searchParams.get('psId') || '',
        leaderName: user?.displayName || '',
        leaderEmail: user?.email || '',
        leaderPhone: '',
        leaderCollege: '',
        member2Name: '',
        member2Email: '',
        member2Phone: '',
        member2College: '',
        member3Name: '',
        member3Email: '',
        member3Phone: '',
        member3College: '',
        member4Name: '',
        member4Email: '',
        member4Phone: '',
        member4College: '',
    });



    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Load PS
                const data = await fetchProblemStatements();
                setProblems(data);

                // Load Leader College
                if (user) {
                    const { doc, getDoc } = await import('firebase/firestore');
                    const userSnap = await getDoc(doc(db, "user", user.uid));
                    if (userSnap.exists()) {
                        setFormData(prev => ({ ...prev, leaderCollege: userSnap.data().college || '' }));
                    }
                }
            } catch (err) {
                toast("Failed to load initial data.", "error");
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [user, toast]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateStep1 = async () => {
        const newErrors: Record<string, string> = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\d{10}$/;

        // 1. Basic Field Validation
        if (!formData.teamName || formData.teamName.length < 3) newErrors.teamName = "Min 3 chars";
        if (!formData.psId) newErrors.psId = "Required";
        
        // Leader
        if (!formData.leaderName) newErrors.leaderName = "Required";
        if (!formData.leaderPhone || !phoneRegex.test(formData.leaderPhone)) newErrors.leaderPhone = "10 digit WA";
        if (!formData.leaderCollege) newErrors.leaderCollege = "Complete Profile First";

        // Members (ParamX requires 4 members total)
        const members = [
            { id: '2', name: formData.member2Name, email: formData.member2Email, phone: formData.member2Phone, college: formData.member2College },
            { id: '3', name: formData.member3Name, email: formData.member3Email, phone: formData.member3Phone, college: formData.member3College },
            { id: '4', name: formData.member4Name, email: formData.member4Email, phone: formData.member4Phone, college: formData.member4College },
        ];

        members.forEach(m => {
            if (!m.name) newErrors[`member${m.id}Name`] = "Required";
            if (!m.email || !emailRegex.test(m.email)) newErrors[`member${m.id}Email`] = "Invalid";
            if (!m.phone || !phoneRegex.test(m.phone)) newErrors[`member${m.id}Phone`] = "10 digit WA";
            if (!m.college || m.college.length < 5) newErrors[`member${m.id}College`] = "Required";
        });

        // 2. Intra-Team Duplicate Check
        const allEmails = [formData.leaderEmail, formData.member2Email, formData.member3Email, formData.member4Email]
            .map(e => e.toLowerCase().trim());
        const allPhones = [formData.leaderPhone, formData.member2Phone, formData.member3Phone, formData.member4Phone]
            .map(p => p.trim());

        // Check Email Duplicates
        // Check Email Duplicates
        if (new Set(allEmails).size !== 4) {
            allEmails.forEach((email, idx) => {
                const firstIdx = allEmails.indexOf(email);
                if (firstIdx !== idx) {
                    const key = idx === 0 ? 'leaderEmail' : `member${idx + 1}Email`;
                    newErrors[key] = "Duplicate Email";
                }
            });
        }

        // Check Phone Duplicates
        if (new Set(allPhones).size !== 4) {
            allPhones.forEach((phone, idx) => {
                const firstIdx = allPhones.indexOf(phone);
                if (firstIdx !== idx) {
                    const key = idx === 0 ? 'leaderPhone' : `member${idx + 1}Phone`;
                    newErrors[key] = "Duplicate Phone";
                }
            });
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast("Please fix highlighted errors.", "error");
            return false;
        }

        setErrors({});
        setSubmitting(true);
        try {
            const registrationsRef = collection(db, "hackathon_registrations");
            
            // 3. Firestore Uniqueness Check: Team Name
            const qNames = query(registrationsRef, where("teamName", "==", formData.teamName));
            const snapNames = await getDocs(qNames);
            if (!snapNames.empty) {
                setErrors({ teamName: "Taken" });
                toast("Team name already taken.", "error");
                setSubmitting(false); // Fix submitting state
                return false;
            }

            // 4. Firestore Uniqueness Check: Global Emails
            const qEmails = query(registrationsRef, where("allEmails", "array-contains-any", allEmails));
            const snapEmails = await getDocs(qEmails);
            if (!snapEmails.empty) {
                toast("One or more members are already registered in another team!", "error");
                setSubmitting(false);
                return false;
            }
        } catch (err) {
            console.error(err);
            toast("Validation failed. Try again.", "error");
            setSubmitting(false);
            return false;
        } finally {
            setSubmitting(false);
        }

        return true;
    };

    const handleNext = async () => {
        if (step === 1) {
            const isValid = await validateStep1();
            if (isValid) setStep(2);
        }
    };

    const handleSubmitRegistration = async () => {
        setSubmitting(true);
        try {
            // Transact-based Slot Management & Document Creation
            await runTransaction(db, async (transaction) => {
                const psMetadataRef = doc(db, "ps_metadata", formData.psId);
                const psMetadataDoc = await transaction.get(psMetadataRef);

                let currentCount = 0;
                let limit = 10;

                if (psMetadataDoc.exists()) {
                    currentCount = psMetadataDoc.data().count || 0;
                    limit = psMetadataDoc.data().limit || 10;
                }

                if (currentCount >= limit) {
                    throw new Error("Slots for this problem statement are full. Please choose another.");
                }

                // Increment slot count
                transaction.set(psMetadataRef, { 
                    count: currentCount + 1,
                    limit: limit 
                }, { merge: true });

                // Create registration document
                const registrationRef = doc(collection(db, "hackathon_registrations"));
                transaction.set(registrationRef, {
                    ...formData,
                    status: 'confirmed', // Confirmed directly for now
                    allEmails: [
                        formData.leaderEmail.toLowerCase(), 
                        formData.member2Email.toLowerCase(), 
                        formData.member3Email.toLowerCase(), 
                        formData.member4Email.toLowerCase()
                    ],
                    createdAt: serverTimestamp(),
                    uid: user?.uid
                });
            });

            setStep(3);
            toast("Registration submitted successfully!", "success");
        } catch (err: any) {
            console.error(err);
            toast(err.message || "Failed to submit registration.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="loader-overlay"><Loader2 className="spinner" /></div>;

    const selectedPs = problems.find(p => p.id === formData.psId);

    return (
        <div className="hackathon-reg-page">
            <SEO 
                title="ParamX '26 | Hackathon Registration" 
                description="Register your team for ParamX '26, the premier hackathon of Avishkar '26. Build innovative solutions for real-world problems."
            />
            <div className="hackathon-reg-container">
                
                {/* Progress Mini Map */}
                <div className="reg-steps">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`step-dot ${step >= s ? 'active' : ''} ${step > s ? 'completed' : ''}`}>
                            {step > s ? <Check size={14} /> : s}
                        </div>
                    ))}
                </div>

                {step === 1 && (
                    <div className="reg-card fade-in">
                        <header>
                            <h1>Team Details</h1>
                            <p>Setup your squad for ParamX '26</p>
                        </header>
                        
                        <div className={`form-section ${errors.psId ? 'has-error' : ''}`}>
                            <label>Select Problem Statement*</label>
                            <GlassSelect 
                                options={problems.map(p => ({ label: `[${p.id}] ${p.title}`, value: p.id }))}
                                value={formData.psId}
                                onChange={(val) => {
                                    setFormData(prev => ({ ...prev, psId: val }));
                                    setErrors(prev => ({ ...prev, psId: '' }));
                                }}
                                placeholder="Choose your challenge"
                                className={errors.psId ? 'error-border' : ''}
                            />
                            {errors.psId && <span className="error-hint">{errors.psId}</span>}
                            {selectedPs && (
                                <div className="ps-hint">
                                    <strong>Objective:</strong> {selectedPs.objective}
                                </div>
                            )}
                        </div>

                        <div className="form-grid single-col">
                            <div className={`form-group ${errors.teamName ? 'has-error' : ''}`}>
                                <label>Team Name*</label>
                                <input type="text" name="teamName" value={formData.teamName} onChange={handleInputChange} placeholder="CyberHawks" />
                                {errors.teamName && <span className="error-hint">{errors.teamName}</span>}
                            </div>
                        </div>

                        <div className="members-section">
                            <h3><Users size={18} /> Team Members</h3>
                            
                            {/* Leader (Read Only Email) */}
                            <div className={`member-card leader ${errors.leaderName || errors.leaderPhone ? 'has-error' : ''}`}>
                                <div className="member-index">Leader</div>
                                <div className="member-inputs">
                                    <div className={`input-with-icon ${errors.leaderName ? 'has-error' : ''}`}>
                                        <User size={16} />
                                        <input type="text" name="leaderName" value={formData.leaderName} onChange={handleInputChange} placeholder="Full Name" />
                                    </div>
                                    <div className="input-with-icon readonly">
                                        <Mail size={16} />
                                        <input type="email" value={formData.leaderEmail} readOnly className="readonly-input" />
                                    </div>
                                    <div className={`input-with-icon ${errors.leaderPhone ? 'has-error' : ''}`}>
                                        <Phone size={16} />
                                        <input type="tel" name="leaderPhone" value={formData.leaderPhone} onChange={handleInputChange} placeholder="WhatsApp Contact" />
                                    </div>
                                    <div className={`input-with-icon readonly ${errors.leaderCollege ? 'has-error' : ''}`}>
                                        <Building2 size={16} />
                                        <input type="text" value={formData.leaderCollege || 'Not Set (Go to Dashboard)'} readOnly className="readonly-input" />
                                    </div>
                                </div>
                            </div>

                            {/* Member 2 */}
                            <div className={`member-card ${errors.member2Name || errors.member2Email || errors.member2Phone || errors.member2College ? 'has-error' : ''}`}>
                                <div className="member-index">M2</div>
                                <div className="member-inputs">
                                    <div className={`input-with-icon ${errors.member2Name ? 'has-error' : ''}`}>
                                        <User size={16} />
                                        <input type="text" name="member2Name" value={formData.member2Name} onChange={handleInputChange} placeholder="Name" />
                                    </div>
                                    <div className={`input-with-icon ${errors.member2Email ? 'has-error' : ''}`}>
                                        <Mail size={16} />
                                        <input type="email" name="member2Email" value={formData.member2Email} onChange={handleInputChange} placeholder="Email" />
                                    </div>
                                    <div className={`input-with-icon ${errors.member2Phone ? 'has-error' : ''}`}>
                                        <Phone size={16} />
                                        <input type="tel" name="member2Phone" value={formData.member2Phone} onChange={handleInputChange} placeholder="Phone" />
                                    </div>
                                    <div className={`form-section no-margin ${errors.member2College ? 'has-error' : ''}`}>
                                        <GlassSelect 
                                            options={collegesData.map((c: string) => ({ value: c, label: c }))}
                                            value={formData.member2College}
                                            onChange={(val) => {
                                                setFormData(prev => ({ ...prev, member2College: val }));
                                                setErrors(prev => ({ ...prev, member2College: '' }));
                                            }}
                                            placeholder="Member 2 College"
                                            searchable={true}
                                            className="member-college-select"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Member 3 */}
                            <div className={`member-card ${errors.member3Name || errors.member3Email || errors.member3Phone || errors.member3College ? 'has-error' : ''}`}>
                                <div className="member-index">M3</div>
                                <div className="member-inputs">
                                    <div className={`input-with-icon ${errors.member3Name ? 'has-error' : ''}`}>
                                        <User size={16} />
                                        <input type="text" name="member3Name" value={formData.member3Name} onChange={handleInputChange} placeholder="Name" />
                                    </div>
                                    <div className={`input-with-icon ${errors.member3Email ? 'has-error' : ''}`}>
                                        <Mail size={16} />
                                        <input type="email" name="member3Email" value={formData.member3Email} onChange={handleInputChange} placeholder="Email" />
                                    </div>
                                    <div className={`input-with-icon ${errors.member3Phone ? 'has-error' : ''}`}>
                                        <Phone size={16} />
                                        <input type="tel" name="member3Phone" value={formData.member3Phone} onChange={handleInputChange} placeholder="Phone" />
                                    </div>
                                    <div className={`form-section no-margin ${errors.member3College ? 'has-error' : ''}`}>
                                        <GlassSelect 
                                            options={collegesData.map((c: string) => ({ value: c, label: c }))}
                                            value={formData.member3College}
                                            onChange={(val) => {
                                                setFormData(prev => ({ ...prev, member3College: val }));
                                                setErrors(prev => ({ ...prev, member3College: '' }));
                                            }}
                                            placeholder="Member 3 College"
                                            searchable={true}
                                            className="member-college-select"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Member 4 */}
                            <div className={`member-card ${errors.member4Name || errors.member4Email || errors.member4Phone || errors.member4College ? 'has-error' : ''}`}>
                                <div className="member-index">M4</div>
                                <div className="member-inputs">
                                    <div className={`input-with-icon ${errors.member4Name ? 'has-error' : ''}`}>
                                        <User size={16} />
                                        <input type="text" name="member4Name" value={formData.member4Name} onChange={handleInputChange} placeholder="Name" />
                                    </div>
                                    <div className={`input-with-icon ${errors.member4Email ? 'has-error' : ''}`}>
                                        <Mail size={16} />
                                        <input type="email" name="member4Email" value={formData.member4Email} onChange={handleInputChange} placeholder="Email" />
                                    </div>
                                    <div className={`input-with-icon ${errors.member4Phone ? 'has-error' : ''}`}>
                                        <Phone size={16} />
                                        <input type="tel" name="member4Phone" value={formData.member4Phone} onChange={handleInputChange} placeholder="Phone" />
                                    </div>
                                    <div className={`form-section no-margin ${errors.member4College ? 'has-error' : ''}`}>
                                        <GlassSelect 
                                            options={collegesData.map((c: string) => ({ value: c, label: c }))}
                                            value={formData.member4College}
                                            onChange={(val) => {
                                                setFormData(prev => ({ ...prev, member4College: val }));
                                                setErrors(prev => ({ ...prev, member4College: '' }));
                                            }}
                                            placeholder="Member 4 College"
                                            searchable={true}
                                            className="member-college-select"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <footer className="form-footer">
                            <button className="primary-btn" onClick={handleNext} disabled={submitting}>
                                {submitting ? <Loader2 className="spinner" /> : <>Review Details <ArrowRight size={18} /></>}
                            </button>
                        </footer>
                    </div>
                )}

                {step === 2 && (
                    <div className="reg-card fade-in">
                        <header>
                            <h1>Review Registration</h1>
                            <p>Verify your information before payment</p>
                        </header>

                        <div className="review-list">
                            <div className="review-item"><strong>Team:</strong> {formData.teamName}</div>
                            <div className="review-item"><strong>Topic:</strong> {selectedPs?.title}</div>
                            <div className="review-item"><strong>Members:</strong> 4 Participants from multiple institutions</div>
                        </div>

                        <footer className="form-footer space-between">
                            <button className="secondary-btn" onClick={() => setStep(1)}><ArrowLeft size={18} /> Edit</button>
                            <button className="primary-btn" onClick={handleSubmitRegistration} disabled={submitting}>
                                {submitting ? <Loader2 className="spinner" /> : <>Confirm Registration <Check size={18} /></>}
                            </button>
                        </footer>
                    </div>
                )}

                {step === 3 && (
                    <div className="reg-card success fade-in">
                        <div className="success-icon">
                            <div className="pulse-ring"></div>
                            <Check size={48} />
                        </div>
                        <h1>Registration Sent!</h1>
                        <p>Your team <strong>{formData.teamName}</strong> has been registered. We are verifying your details.</p>
                        <div className="success-footer">
                            <p>Check your dashboard for status updates.</p>
                            <button className="primary-btn" onClick={() => window.location.href = '/user/dashboard'}>Go to Dashboard</button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default HackathonRegistration;
