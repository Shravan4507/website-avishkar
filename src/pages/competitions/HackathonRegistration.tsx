import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useSearchParams, useNavigate } from 'react-router-dom';

import { 
    doc, collection, serverTimestamp, query, where, 
    getDocs, runTransaction, getDoc 
} from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';
import SEO from '../../components/seo/SEO';
import { useToast } from '../../components/toast/Toast';
import GlassSelect from '../../components/dropdown/GlassSelect';
import { initiateEasebuzzCheckout, generateTxnId } from '../../utils/easebuzz';
import { fetchProblemStatements, type ProblemStatement } from '../../utils/storageUtils';
import { generateInvoice } from '../../utils/InvoiceGenerator';
import { 
    Check, Users, ArrowRight, ArrowLeft, Loader2, 
    User, Mail, Phone, Building2, Fingerprint, Search, Download, ShieldAlert,
    Copy 
} from 'lucide-react';
import { useRegistrationGuard } from '../../hooks/useRegistrationGuard';


import './HackathonRegistration.css';

// --- HELPER COMPONENT ---
interface MemberFieldProps {
    id: string;
    label: string;
    isLeader?: boolean;
    formData: any;
    lookupLoading: Record<string, boolean>;
    errors: Record<string, string>;
    handleAvrInput: (e: React.ChangeEvent<HTMLInputElement>, id: string) => void;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    lookupFailed: Record<string, boolean>;
}

const MemberField: React.FC<MemberFieldProps> = ({ 
    id, label, isLeader = false, formData, lookupLoading, lookupFailed, errors, handleAvrInput, handleInputChange 
}) => {
    const avrKey = `${id}AvrId`;
    const nameKey = `${id}Name`;
    const emailKey = `${id}Email`;
    const phoneKey = `${id}Phone`;
    const collegeKey = `${id}College`;
    const avrVal = formData[avrKey] || '';
    const notFound = lookupFailed?.[id] || false;

    return (
        <div className={`member-card ${isLeader ? 'leader' : ''} ${errors[avrKey] || errors[phoneKey] ? 'has-error' : ''}`}>
            <div className="member-index">{label}</div>
            <div className="member-inputs">
                <div className={`input-with-icon avr-lookup ${lookupLoading[id] ? 'searching' : ''} ${isLeader ? 'readonly' : ''}`}>
                    <Fingerprint size={16} />
                    <input 
                        type="text" 
                        name={avrKey} 
                        value={formData[avrKey] || ''} 
                        onChange={(e) => handleAvrInput(e, id)}
                        placeholder="AVR-XXX-0000"
                        readOnly={isLeader}
                        autoComplete="off"
                    />
                    {lookupLoading[id] ? <Loader2 size={16} className="spinner" /> : <Search size={16} />}
                </div>

                {/* HELPERS & ERROR FEEDBACK */}
                <div className="member-status-bar">
                    {notFound && avrVal.length >= 9 && (
                        <div className="status-label not-found animated">
                            Member not discovered. <span className="highlight-hint">Ask them to register on this portal.</span>
                        </div>
                    )}
                    {!notFound && avrVal.length >= 9 && (
                        <div className="status-label found animated">
                            Identity Verified
                        </div>
                    )}
                    {avrVal.length < 9 && !isLeader && (
                        <div className="status-label hint">
                            Members MUST have a website account.
                        </div>
                    )}
                </div>

                <div className="detail-row">
                    <div className="input-with-icon prefilled editable">
                        <User size={16} />
                        <input 
                            type="text" 
                            name={nameKey}
                            value={formData[nameKey] || ''} 
                            onChange={handleInputChange}
                            placeholder="Full Name" 
                        />
                    </div>
                    <div className="input-with-icon prefilled readonly">
                        <Mail size={16} />
                        <input type="email" value={formData[emailKey] || ''} placeholder="Email Address" readOnly />
                    </div>
                </div>

                <div className="detail-row">
                    <div className={`input-with-icon prefilled editable ${errors[phoneKey] ? 'field-error' : ''}`}>
                        <Phone size={16} />
                        <input 
                            type="tel" 
                            name={phoneKey}
                            value={formData[phoneKey] || ''} 
                            onChange={handleInputChange}
                            placeholder="WhatsApp Number" 
                        />
                        {errors[phoneKey] && <span className="error-badge">{errors[phoneKey]}</span>}
                    </div>
                    <div className="input-with-icon prefilled readonly">
                        <Building2 size={16} />
                        <input type="text" value={formData[collegeKey] || ''} placeholder="College/Institution" readOnly />
                    </div>
                </div>
            </div>
        </div>
    );
};



const HackathonRegistration: React.FC = () => {

    const navigate = useNavigate();
    const [user] = useAuthState(auth);

    const [searchParams] = useSearchParams();
    const { isRegistered, eventName, loading: guardLoading } = useRegistrationGuard();
    const toast = useToast();

    useEffect(() => {
        if (!guardLoading && !user) {
            toast.error("Access Protected: Please log in to register.");
            navigate(`/login?redirect=/hackathon-register?psId=${searchParams.get('psId') || ''}`);
            return;
        }

        if (!guardLoading && isRegistered) {
            toast.warning(`Locked: Already registered for ${eventName}. One event per user policy.`);
            navigate('/user/dashboard', { replace: true });
        }
    }, [user, isRegistered, eventName, guardLoading, navigate, toast, searchParams]);


    
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [problems, setProblems] = useState<ProblemStatement[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [lookupLoading, setLookupLoading] = useState<Record<string, boolean>>({});
    const [lookupFailed, setLookupFailed] = useState<Record<string, boolean>>({});
    const [transactionId, setTransactionId] = useState("");
    const [teamId, setTeamId] = useState("");


    const [formData, setFormData] = useState({
        teamName: '',
        psId: searchParams.get('psId') || '',
        
        leaderAvrId: '',
        leaderName: '',
        leaderEmail: '',
        leaderPhone: '',
        leaderCollege: '',

        member2AvrId: '',
        member2Name: '',
        member2Email: '',
        member2Phone: '',
        member2College: '',

        member3AvrId: '',
        member3Name: '',
        member3Email: '',
        member3Phone: '',
        member3College: '',

        member4AvrId: '',
        member4Name: '',
        member4Email: '',
        member4Phone: '',
        member4College: '',
    });

    // 1. Initial Load: Fetch Leader Details
    useEffect(() => {
        window.scrollTo(0, 0); // Scroll to top on first load
        const loadInitialData = async () => {

            try {
                const psData = await fetchProblemStatements();
                setProblems(psData);

                if (user) {
                    const userSnap = await getDoc(doc(db, "user", user.uid));
                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.name || data.displayName || user.displayName || '';
                        setFormData(prev => ({
                            ...prev,
                            leaderAvrId: data.avrId || '',
                            leaderName: fullName,
                            leaderEmail: data.email || user.email || '',
                            leaderPhone: data.whatsappNumber || data.whatsapp || data.phone || '',
                            leaderCollege: data.college || '',
                        }));
                    }
                }
            } catch (err) {
                toast.error("Failed to load profile details.");
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [user, toast]);

    // 2. Scroll to top on step change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    // 3. AVR ID Formatter

    const handleAvrInput = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
        let val = e.target.value.toUpperCase();
        const prevVal = (formData as any)[`${id}AvrId`] || '';

        if (!val.startsWith("AVR-")) {
            val = "AVR-";
        }

        const raw = val.slice(4).replace(/[^A-Z0-9]/g, '');
        let letters = raw.slice(0, 3).replace(/[0-9]/g, '');
        let numbers = raw.slice(letters.length).replace(/[A-Z]/g, '');

        let formatted = "AVR-" + letters;
        
        if (letters.length === 3) {
            if (prevVal.length > val.length && prevVal.endsWith("-") && !val.includes("-", 5)) {
                formatted = "AVR-" + letters;
            } else {
                formatted += "-" + numbers;
            }
        }

        setFormData(prev => ({ ...prev, [`${id}AvrId`]: formatted }));

        if (formatted.length >= 9) {
            handleAvrLookup(formatted, id);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvrLookup = async (avrId: string, memberKey: string) => {
        if (!avrId || avrId.length < 8) return;

        setLookupLoading(prev => ({ ...prev, [memberKey]: true }));
        try {
            const userQuery = query(collection(db, "user"), where("avrId", "==", avrId.trim()));
            const querySnapshot = await getDocs(userQuery);

            if (!querySnapshot.empty) {
                const data = querySnapshot.docs[0].data();
                const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.name || data.displayName || '';
                setFormData(prev => ({
                    ...prev,
                    [`${memberKey}Name`]: fullName,
                    [`${memberKey}Email`]: data.email || '',
                    [`${memberKey}Phone`]: data.whatsappNumber || data.whatsapp || data.phone || '',
                    [`${memberKey}College`]: data.college || '',
                }));
                setLookupFailed(prev => ({ ...prev, [memberKey]: false }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    [`${memberKey}Name`]: '',
                    [`${memberKey}Email`]: '',
                    [`${memberKey}Phone`]: '',
                    [`${memberKey}College`]: '',
                }));
                // Only set as 'failed' if they have actually typed a full ID
                setLookupFailed(prev => ({ ...prev, [memberKey]: true }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLookupLoading(prev => ({ ...prev, [memberKey]: false }));
        }
    };

    const validateStep1 = async () => {
        const newErrors: Record<string, string> = {};

        if (!formData.teamName || formData.teamName.length < 3) newErrors.teamName = "Too short";
        if (!formData.psId) newErrors.psId = "Required";
        
        const members = ['leader', 'member2', 'member3', 'member4'];

        members.forEach(m => {
            const avr = (formData as any)[`${m}AvrId`];
            const name = (formData as any)[`${m}Name`];
            const phone = (formData as any)[`${m}Phone`];

            if (!avr || avr.length < 9) newErrors[`${m}AvrId`] = "Enter AVR ID";
            else if (!name) newErrors[`${m}AvrId`] = "Lookup Failed";

            // IMPROVED PHONE VALIDATION: Strip non-digits and check length
            if (!phone) {
                newErrors[`${m}Phone`] = "Required";
            } else {
                const cleanPhone = phone.replace(/\D/g, '');
                if (cleanPhone.length < 10) {
                    newErrors[`${m}Phone`] = "Min 10 digits";
                }
            }
        });

        // Duplicate AVR-ID check
        const avrIds = members.map(m => (formData as any)[`${m}AvrId`]).filter((id: string) => id && id.length >= 9);
        const seen = new Set<string>();
        for (const id of avrIds) {
            if (seen.has(id)) {
                toast.error(`Duplicate detected: ${id} — each member must be unique.`);
                return false;
            }
            seen.add(id);
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error("Please fix the highlighted errors.");
            return false;
        }

        return true;
    };

    const handleNext = async () => {
        if (step === 1) {
            const isValid = await validateStep1();
            if (isValid) setStep(2);
        }
    };

    const handleSubmitRegistration = async (paymentId: string) => {
        setSubmitting(true);
        try {
            let generatedTeamId = "";
            await runTransaction(db, async (transaction) => {
                const psMetadataRef = doc(db, "ps_metadata", formData.psId);
                const psMetadataDoc = await transaction.get(psMetadataRef);

                let currentCount = 0;
                if (psMetadataDoc.exists()) currentCount = psMetadataDoc.data().count || 0;

                if (currentCount >= 10) throw new Error("This problem statement has no more slots.");

                // Generate Unique Team ID
                const teamCounterRef = doc(db, "counters", "hackathon_team_counter");
                const teamCounterDoc = await transaction.get(teamCounterRef);
                let nextTeamCount = 1;
                if (teamCounterDoc.exists()) {
                    nextTeamCount = (teamCounterDoc.data().count || 0) + 1;
                }

                transaction.update(teamCounterRef, { count: nextTeamCount });
                generatedTeamId = `AVR-PRM-${nextTeamCount.toString().padStart(4, '0')}`;

                transaction.set(psMetadataRef, { count: currentCount + 1 }, { merge: true });

                const registrationRef = doc(collection(db, "hackathon_registrations"));
                transaction.set(registrationRef, {
                    ...formData,
                    teamId: generatedTeamId,
                    status: 'confirmed',
                    paymentId,
                    amountPaid: 500,
                    allEmails: [
                        formData.leaderEmail.toLowerCase(), 
                        formData.member2Email.toLowerCase(), 
                        formData.member3Email.toLowerCase(), 
                        formData.member4Email.toLowerCase()
                    ],
                    allAvrIds: [
                        formData.leaderAvrId,
                        formData.member2AvrId,
                        formData.member3AvrId,
                        formData.member4AvrId
                    ],
                    createdAt: serverTimestamp(),
                    uid: user?.uid
                });
            });

            setTransactionId(paymentId);
            setTeamId(generatedTeamId);
            setStep(3);
            toast.success(`Team Registered! ID: ${generatedTeamId}`);

        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handlePayment = async () => {
        setSubmitting(true);

        try {
            // 1. Generate Transaction Details
            const txnid = generateTxnId("HACK");
            const amount = "500.00"; // Hackathon fee
            
            // 2. Get access_key from Cloud Function (which calls Easebuzz API)
            const response = await fetch("https://initiatepayment-rgvkuxdaea-uc.a.run.app", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    txnid,
                    amount,
                    productinfo: "Param-X '26 Registration",
                    firstname: formData.leaderName,
                    email: formData.leaderEmail,
                    phone: formData.leaderPhone,
                    udf1: formData.leaderCollege,
                    surl: `${window.location.origin}/user/dashboard?status=success`,
                    furl: `${window.location.origin}/param-x?status=failure`
                })
            });

            const result = await response.json();

            if (result.success && result.access_key) {
                // 3. Open Easebuzz checkout overlay with callback
                const merchantKey = import.meta.env.VITE_EASEBUZZ_KEY;
                
                initiateEasebuzzCheckout(merchantKey, result.access_key, async (ebResponse: any) => {
                    if (ebResponse.status === "success") {
                        await handleSubmitRegistration(txnid);
                    } else {
                        toast.error("Payment was not successful.");
                    }
                }, 'prod');
            } else {
                throw new Error(result.error || "Unable to reach payment gateway.");
            }

        } catch (err: any) {
            console.error("Payment Error:", err);
            toast.error("Communication Interrupted. Deployment halted.");
        } finally {
            setSubmitting(false);
        }
    };


    if (loading) return <div className="loader-overlay"><Loader2 className="spinner" /></div>;
    const selectedPs = problems.find(p => p.id === formData.psId);

    return (
        <div className="hackathon-reg-page">
            <SEO 
                title="Param-X '26 | Registration" 
                description="Secure your spot in Param-X '26 Hackathon. Enter your details and let's build something epic."
            />
            <div className="hackathon-reg-container">
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
                            <h1>Team Registration</h1>
                            <p className="primary-instruction">Every teammate must have a registered account to be discovered below.</p>
                        </header>

                        <div className="protocol-banner">
                            <div className="protocol-icon"><ShieldAlert size={20} /></div>
                            <div className="protocol-content">
                                <h3>Account Requirement Policy</h3>
                                <p>We synchronize verified data from our member database. If a member hasn't created an account, their AVR ID will not work.</p>
                                <button className="share-link-btn" onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/signup`);
                                    toast.success("Signup link copied! Share it with your team.");
                                }}>
                                    <Copy size={14} /> Share Signup Link
                                </button>
                            </div>
                        </div>
                        
                        <div className="form-section">
                            <label>Problem Statement*</label>
                            <GlassSelect 
                                options={problems.map(p => ({ label: `[${p.id}] ${p.title}`, value: p.id }))}
                                value={formData.psId}
                                onChange={(val: string) => setFormData(prev => ({ ...prev, psId: val }))}
                                placeholder="Choose your challenge"
                            />
                        </div>

                        <div className="form-group">
                            <label>Team Name*</label>
                            <input type="text" name="teamName" value={formData.teamName} onChange={handleInputChange} placeholder="Squad Name" />
                            {errors.teamName && <span className="error-hint">{errors.teamName}</span>}
                        </div>

                        <div className="accountability-notice">
                            <ShieldAlert size={20} />
                            <p><strong>Scheduling Notice:</strong> You are responsible for any timing overlaps. Avishkar '26 is not liable for clashes. Proceeding will lock your single allowed slot.</p>
                        </div>

                        <div className="members-section">

                            <h3><Users size={18} /> Team Roster</h3>
                            <MemberField id="leader" label="Leader" isLeader={true} formData={formData} lookupLoading={lookupLoading} lookupFailed={lookupFailed} errors={errors} handleAvrInput={handleAvrInput} handleInputChange={handleInputChange} />
                            <MemberField id="member2" label="M2" formData={formData} lookupLoading={lookupLoading} lookupFailed={lookupFailed} errors={errors} handleAvrInput={handleAvrInput} handleInputChange={handleInputChange} />
                            <MemberField id="member3" label="M3" formData={formData} lookupLoading={lookupLoading} lookupFailed={lookupFailed} errors={errors} handleAvrInput={handleAvrInput} handleInputChange={handleInputChange} />
                            <MemberField id="member4" label="M4" formData={formData} lookupLoading={lookupLoading} lookupFailed={lookupFailed} errors={errors} handleAvrInput={handleAvrInput} handleInputChange={handleInputChange} />
                        </div>

                        <footer className="form-footer">
                            <button className="primary-btn" onClick={handleNext} disabled={submitting}>
                                {submitting ? <Loader2 className="spinner" /> : <>Match Details <ArrowRight size={18} /></>}
                            </button>
                        </footer>
                    </div>
                )}

                {step === 2 && (
                    <div className="reg-card review-card fade-in">
                        <header>
                            <div className="section-label">Payment Step</div>
                            <h1>Final Squad Review</h1>
                        </header>
                        <div className="review-scroll scrollbar-custom">
                            <div className="review-meta">
                                <div className="meta-item">
                                    <span className="meta-label">Team Name</span>
                                    <span className="meta-value">{formData.teamName}</span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label">Problem Statement</span>
                                    <span className="meta-value">[{formData.psId}] {selectedPs?.title}</span>
                                </div>
                            </div>
                            
                            <div className="review-members-grid">
                                {['leader', 'member2', 'member3', 'member4'].map((m, idx) => (
                                    <div key={m} className="review-member">
                                        <div className="m-rank">{idx === 0 ? 'Leader' : `Member ${idx + 1}`}</div>
                                        <div className="m-info">
                                            <span className="m-name">{(formData as any)[`${m}Name`]}</span>
                                            <span className="m-avr">{(formData as any)[`${m}AvrId`]}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="payment-summary">
                                <div className="summary-row">
                                    <span>Registration Fee</span>
                                    <span>₹500.00</span>
                                </div>
                                <div className="summary-row total">
                                    <span>Total Amount to Pay</span>
                                    <span>₹500.00</span>
                                </div>
                                <p className="payment-note">Secure payment via Easebuzz Gateway</p>
                            </div>
                        </div>
                        <footer className="form-footer space-between">
                            <button className="secondary-btn" onClick={() => setStep(1)}><ArrowLeft size={18} /> Edit Team</button>
                            <button className="primary-btn payment-trigger" onClick={handlePayment} disabled={submitting}>
                                {submitting ? <Loader2 className="spinner" /> : <>Proceed to Payment <ArrowRight size={18} /></>}
                            </button>

                        </footer>
                    </div>
                )}

                {step === 3 && (
                    <div className="reg-card success-card fade-in">
                        <div className="success-lottie">
                            <div className="victory-badge">
                                <Check size={48} strokeWidth={3} />
                            </div>
                        </div>
                        <header>
                            <h1>Registration Complete!</h1>
                            <p>Get ready for the ultimate innovation marathon.</p>
                        </header>
                        
                        <div className="success-content">
                            <div className="team-highlight">
                                <span className="label">Confirmed Squad</span>
                                <span className="value">{formData.teamName}</span>
                            </div>

                            <div className="success-details">
                                <div className="detail-item id-highlight">
                                    <span className="d-label">Team ID</span>
                                    <span className="d-value team-id">{teamId}</span>
                                </div>

                                <div className="detail-item">
                                    <span className="d-label">Transaction ID</span>
                                    <span className="d-value">{transactionId}</span>
                                </div>

                                <div className="detail-item">
                                    <span className="d-label">Status</span>
                                    <span className="d-value status-paid">Successfully Paid</span>
                                </div>
                                <p className="confirmation-help">
                                    We've sent a detailed confirmation email and rules booklet to <strong>{formData.leaderEmail}</strong>. 
                                    Please check your inbox (and spam folder).
                                </p>
                            </div>
                        </div>

                        <footer className="success-footer">
                            <button className="secondary-btn invoice-btn" onClick={() => generateInvoice({
                                teamName: formData.teamName,
                                leaderName: formData.leaderName,
                                leaderEmail: formData.leaderEmail,
                                avrId: formData.leaderAvrId,
                                psId: formData.psId,
                                psTitle: selectedPs?.title || formData.psId,
                                paymentId: transactionId,
                                date: new Date().toLocaleDateString(),
                                amount: "500.00"
                            })}>
                                <Download size={18} /> Download Invoice
                            </button>
                            <button className="primary-btn dashboard-btn" onClick={() => window.location.href = '/user/dashboard'}>
                                Go to Dashboard <ArrowRight size={18} />
                            </button>
                        </footer>

                    </div>
                )}


            </div>
        </div>
    );
};

export default HackathonRegistration;
