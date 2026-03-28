import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, collection, getDoc, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';
import SEO from '../../components/seo/SEO';
import { useToast } from '../../components/toast/Toast';
import { 
    User, 
    ArrowRight, 
    ArrowLeft, 
    Loader2, 
    Trophy,
    CheckCircle2,
    Target,
    Phone,
    Fingerprint,
    ShieldAlert
} from 'lucide-react';
import { useRegistrationGuard } from '../../hooks/useRegistrationGuard';
import './EsportsRegistration.css';


// Game Configurations
const GAMES = [
    { id: 'bgmi', label: 'BGMI', tagline: 'Grid-Warrior Mobile', prize: '₹10,000+', fee: 500, type: 'TEAM', members: 5, platform: 'Mobile', color: '#ff9800', image: `${import.meta.env.BASE_URL}assets/esports/bgmi.png` },
    { id: 'freefire', label: 'FREE FIRE', tagline: 'Squad Battle-Royale', prize: '₹8,000+', fee: 250, type: 'TEAM', members: 4, platform: 'Mobile', color: '#e91e63', image: `${import.meta.env.BASE_URL}assets/esports/freefire.png` },
    { id: 'codm', label: 'CALL OF DUTY (MOBILE)', tagline: 'Spec-Ops Combat', prize: '₹10,000+', fee: 400, type: 'TEAM', members: 4, platform: 'Mobile', color: '#4caf50', image: `${import.meta.env.BASE_URL}assets/esports/codm.png` },
    { id: 'valorant', label: 'VALORANT', tagline: 'Tactical PC Duel', prize: '₹20,000+', fee: 350, type: 'TEAM', members: 5, platform: 'PC', color: '#ff4655', image: `${import.meta.env.BASE_URL}assets/esports/valorant.png` },
    { id: 'sf4_solo', label: 'SHADOW-FIGHT 4 (SOLO)', tagline: 'Arena 1v1 Combat', prize: '₹15,000+', fee: 150, type: 'SOLO', members: 1, platform: 'Mobile', color: '#ffeb3b', image: `${import.meta.env.BASE_URL}assets/esports/sf4.png` },
    { id: 'sf4_duet', label: 'SHADOW-FIGHT 4 (DUET)', tagline: 'Arena 2v2 Duel', prize: '₹25,000+', fee: 250, type: 'TEAM', members: 2, platform: 'Mobile', color: '#ffeb3b', image: `${import.meta.env.BASE_URL}assets/esports/sf4.png` },
    { id: 'amongus', label: 'AMONG US', tagline: 'Social Deduction', prize: '₹2,000+', fee: 50, type: 'SOLO', members: 1, platform: 'Mobile', color: '#00bcd4', image: `${import.meta.env.BASE_URL}assets/esports/amongus.png` },
] as const;

type GameId = typeof GAMES[number]['id'];

const EsportsRegistration: React.FC = () => {
    const [user] = useAuthState(auth);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const selectedGame = searchParams.get('game') as GameId;
    const { toast } = useToast();
    const { isRegistered, eventName, loading: guardLoading } = useRegistrationGuard();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [lookupLoading, setLookupLoading] = useState<Record<string, boolean>>({});
    const [transactionId, setTransactionId] = useState("");

    const activeGame = GAMES.find(g => g.id === selectedGame);

    const [formData, setFormData] = useState({
        teamName: '',
        leaderAvrId: '',
        leaderName: '',
        leaderEmail: '',
        leaderPhone: '',
        leaderCollege: '',
        member2AvrId: '', member2Name: '', member2Email: '', member2Phone: '', member2College: '',
        member3AvrId: '', member3Name: '', member3Email: '', member3Phone: '', member3College: '',
        member4AvrId: '', member4Name: '', member4Email: '', member4Phone: '', member4College: '',
        member5AvrId: '', member5Name: '', member5Email: '', member5Phone: '', member5College: '',
    });

    useEffect(() => {
        if (!user) {
            navigate(`/login?redirect=/esports-register?game=${selectedGame || ''}`);
            return;
        }

        if (!selectedGame) {
            navigate('/battle-grid', { replace: true });
            return;
        }

        const loadProfile = async () => {
            try {
                const userSnap = await getDoc(doc(db, "user", user.uid));
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.name || user.displayName || '';
                    setFormData(prev => ({
                        ...prev,
                        leaderAvrId: data.avrId || '',
                        leaderName: fullName,
                        leaderEmail: data.email || user.email || '',
                        leaderPhone: data.whatsappNumber || data.phone || '',
                        leaderCollege: data.college || '',
                    }));
                }
            } catch (err) {
                toast("Failed to load profile", "error");
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, [user, selectedGame, navigate, toast]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvrInput = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        let val = e.target.value.toUpperCase();
        if (!val.startsWith("AVR-")) val = "AVR-";
        const raw = val.slice(4).replace(/[^A-Z0-9]/g, '');
        let letters = raw.slice(0, 3).replace(/[0-9]/g, '');
        let numbers = raw.slice(letters.length).replace(/[A-Z]/g, '');
        let formatted = "AVR-" + letters + (letters.length === 3 ? "-" + numbers : "");
        setFormData(prev => ({ ...prev, [`${field}AvrId`]: formatted }));
        if (formatted.length >= 9) triggerLookup(formatted, field);
    };

    const triggerLookup = async (avrId: string, field: string) => {
        setLookupLoading(prev => ({ ...prev, [field]: true }));
        try {
            const q = query(collection(db, "user"), where("avrId", "==", avrId));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const data = snap.docs[0].data();
                const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.name || '';
                setFormData(prev => ({
                    ...prev,
                    [`${field}Name`]: fullName,
                    [`${field}Email`]: data.email || '',
                    [`${field}Phone`]: data.whatsappNumber || data.phone || '',
                    [`${field}College`]: data.college || '',
                }));
            } else {
                setFormData(prev => ({ ...prev, [`${field}Name`]: '', [`${field}Email`]: '', [`${field}Phone`]: '', [`${field}College`]: '' }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLookupLoading(prev => ({ ...prev, [field]: false }));
        }
    };

    const handleNext = () => {
        if (!formData.teamName) {
            toast("Enter team name", "warning");
            return;
        }
        setStep(2);
        window.scrollTo(0, 0);
    };

    const handlePayment = async () => {
        setSubmitting(true);
        // Simulate payment for now
        setTimeout(() => {
            const mockTxn = "TXN_" + Math.random().toString(36).substr(2, 9).toUpperCase();
            setTransactionId(mockTxn);
            setStep(3);
            setSubmitting(false);
            toast("Deployment Successful!", "success");
        }, 2000);
    };

    if (loading || guardLoading) return <div className="loader-screen"><Loader2 className="spinner" /></div>;

    if (isRegistered) {
        return (
            <div className="esports-reg-page-v2 centered">
                <div className="registered-overlay fade-in">
                    <ShieldAlert size={64} color="#ff4655" className="locked-icon" />
                    <h1 className="locked-title">ARENA LOCKED</h1>
                    <p className="locked-text">You are already signed for <strong>{eventName}</strong>.</p>
                    <button className="primary-cta-reg" onClick={() => navigate('/user/dashboard')}>RETURN TO COMMAND</button>
                </div>
            </div>
        );
    }

    return (
        <div className="esports-reg-page-v2">
            <SEO title={`${activeGame?.label} Registration`} description="Battle-Grid '26 E-Sports Entry" />
            
            <div className="esports-header-v2">
                <div className="nav-row">
                    <button className="back-portal-btn" onClick={() => navigate('/battle-grid')}>
                        <ArrowLeft size={16} /> RE-SELECT ARENA
                    </button>
                    <div className="platform-tag">
                        {activeGame?.platform === 'PC' ? <Target size={14} /> : <Phone size={14} />}
                        {activeGame?.platform} - {activeGame?.type} Entry
                    </div>
                </div>
                <div className="main-logo-row">
                    <span className="game-label-large">{activeGame?.label}</span>
                    <span className="reg-text-large">REGISTRATION</span>
                </div>
            </div>

            <div className="esports-layout-v2">
                <div className="reg-stepper">
                    <div className={`step-item ${step >= 1 ? 'active' : ''}`}>
                        <span className="step-num">1</span>
                        <span className="step-label">{activeGame?.type === 'TEAM' ? 'Squad' : 'Solo'}</span>
                    </div>
                    <div className="step-divider" />
                    <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
                        <span className="step-num">2</span>
                        <span className="step-label">Review</span>
                    </div>
                </div>

                {step === 1 && (
                    <div className="tactical-form-card fade-in">
                        <div className="form-section-header">
                            <label className="tactical-label">{activeGame?.type === 'TEAM' ? 'SQUAD NAME' : 'PLAYER NAME'}</label>
                            <div className="tactical-input-wrapper">
                                <Trophy size={18} className="field-icon" />
                                <input type="text" name="teamName" value={formData.teamName} onChange={handleInputChange} placeholder="Enter Name" />
                            </div>
                        </div>

                        <div className="tactical-divider">
                            <span>{activeGame?.type === 'TEAM' ? 'LEADER DETAILS' : 'PLAYER DETAILS'}</span>
                            <div className="divider-line" />
                        </div>

                        <div className="tactical-grid">
                            <div className="form-section-header">
                                <label className="tactical-label">IN-GAME NAME (IGN)</label>
                                <div className="tactical-input-wrapper">
                                    <User size={18} className="field-icon" />
                                    <input type="text" name="leaderName" value={formData.leaderName} onChange={handleInputChange} placeholder="Display Name" />
                                </div>
                            </div>
                            <div className="form-section-header">
                                <label className="tactical-label">CHARACTER ID</label>
                                <div className="tactical-input-wrapper">
                                    <Fingerprint size={18} className="field-icon" />
                                    <input type="text" value={formData.leaderAvrId} readOnly className="readonly-input" />
                                </div>
                            </div>
                        </div>

                        <div className="form-section-header">
                            <label className="tactical-label">WHATSAPP NUMBER</label>
                            <div className="tactical-input-wrapper">
                                <Phone size={18} className="field-icon" />
                                <input type="tel" name="leaderPhone" value={formData.leaderPhone} onChange={handleInputChange} placeholder="WA Number" />
                            </div>
                        </div>

                        {activeGame?.type === 'TEAM' && Array.from({ length: (activeGame?.members as number) - 1 }).map((_, i) => {
                            const mIdx = i + 2;
                            return (
                                <div key={mIdx} className="combatant-card">
                                    <div className="combatant-header">
                                        <div className="accent-bar" />
                                        <span>Squad Combatant {mIdx}</span>
                                    </div>
                                    <div className="tactical-grid">
                                        <div className="tactical-input-wrapper">
                                            <Fingerprint size={16} className="field-icon" />
                                            <input type="text" placeholder="AVR ID" value={(formData as any)[`member${mIdx}AvrId`]} onChange={(e) => handleAvrInput(e, `member${mIdx}`)} />
                                            {lookupLoading[`member${mIdx}`] && <Loader2 size={14} className="spinner" />}
                                        </div>
                                        <div className="tactical-input-wrapper readonly">
                                            <User size={16} className="field-icon" />
                                            <input type="text" value={(formData as any)[`member${mIdx}Name`]} placeholder="Verify ID" readOnly />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        <div className="form-footer-tactical">
                            <button className="primary-cta-reg" onClick={handleNext}>PROCEED TO REVIEW <ArrowRight size={20} /></button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="tactical-form-card review-mode fade-in">
                        <div className="review-header">
                            <h3>Combat Unit Review</h3>
                            <p>Verify details before deployment</p>
                        </div>
                        <div className="review-scroll scrollbar-custom">
                            <div className="review-entry"><span className="label">Competition</span><span className="value">{activeGame?.label}</span></div>
                            <div className="review-entry"><span className="label">Unit/Squad</span><span className="value">{formData.teamName}</span></div>
                            
                            <div className="tactical-divider small"><span>Unit Roster</span><div className="divider-line" /></div>
                            
                            <div className="review-roster">
                                <div className="roster-member main">
                                    <span className="rank">LEADER</span>
                                    <div className="member-details"><span className="name">{formData.leaderName}</span><span className="avr">{formData.leaderAvrId}</span></div>
                                </div>
                                {activeGame?.type === 'TEAM' && Array.from({ length: (activeGame?.members as number) - 1 }).map((_, i) => (
                                    <div key={i} className="roster-member">
                                        <span className="rank">MEMBER {i+2}</span>
                                        <div className="member-details">
                                            <span className="name">{(formData as any)[`member${i+2}Name`]}</span>
                                            <span className="avr">{(formData as any)[`member${i+2}AvrId`]}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="payment-summary-tactical">
                                <div className="summary-row"><span>Base Registration</span><span>₹{activeGame?.fee}.00</span></div>
                                <div className="summary-row total"><span>Grand Total</span><span>₹{activeGame?.fee}.00</span></div>
                            </div>
                        </div>
                        <div className="form-footer-tactical-between">
                            <button className="secondary-cta-reg" onClick={() => setStep(1)}><ArrowLeft size={18} /> BACK</button>
                            <button className="primary-cta-reg checkout" onClick={handlePayment} disabled={submitting}>
                                {submitting ? <Loader2 size={20} className="spinner" /> : <>DEPLOY TO ARENA <ArrowRight size={20} /></>}
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="tactical-form-card success-mode fade-in">
                        <div className="success-banner">
                            <div className="v-circle">
                                <CheckCircle2 size={40} />
                            </div>
                            <h1>DEPLOYMENT CONFIRMED</h1>
                            <p>Your squad is now logged in the grid.</p>
                        </div>

                        <div className="success-data">
                            <div className="data-row">
                                <span className="label">Squad</span>
                                <span className="value">{formData.teamName}</span>
                            </div>
                            <div className="data-row">
                                <span className="label">Operation</span>
                                <span className="value">{activeGame?.label}</span>
                            </div>
                            <div className="data-row">
                                <span className="label">Transaction ID</span>
                                <span className="value">{transactionId}</span>
                            </div>
                        </div>

                        <div className="success-actions">
                            <button className="primary-cta-reg" onClick={() => navigate('/user/dashboard')}>
                                GO TO COMMAND CENTER <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EsportsRegistration;
