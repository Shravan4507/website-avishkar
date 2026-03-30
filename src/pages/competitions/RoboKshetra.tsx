import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/toast/Toast';
import { doc, collection, serverTimestamp, runTransaction, getDoc, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';
import SEO from '../../components/seo/SEO';
import ChromaGrid, { type ChromaItem } from '../../components/chroma-grid/ChromaGrid';
import { 
    ArrowRight, 
    ArrowLeft, 
    Loader2, 
    Cpu, 
    Shield,
    CheckCircle2,
    CircuitBoard,
    LayoutDashboard,
    Zap,
    Users,
    AlertTriangle,
    Target,
    Trophy,
    FileText,
    Rocket,
    HelpCircle,
    Fingerprint,
    Search,
    User,
    Mail,
    Phone,
    Check,
    Building2,
    ShieldAlert,
    Copy,
    ExternalLink,
} from 'lucide-react';
import { useRegistrationGuard } from '../../hooks/useRegistrationGuard';
import { initiateEasebuzzCheckout, generateTxnId } from '../../utils/easebuzz';
import './RoboKshetra.css';

// --- ROBO_EVENTS logic ---


// Robo-Kshetra Event Configurations
const ROBO_EVENTS = [
    { 
        id: 'alignx', 
        label: 'ALIGNX', 
        tagline: 'Line Following Robot Competition', 
        prize: '₹15,000+', 
        fee: 400,
        type: 'TEAM', 
        members: 4, 
        mode: 'Offline',
        color: '#d9ff00', 
        description: 'Forge a bot capable of extreme precision. Navigate high-speed tracks and complex intersections with autonomous perfection.',
        gradient: 'linear-gradient(135deg, #d9ff00, #000)',
        image: `${import.meta.env.BASE_URL}assets/robokshetra/line_follower.png`
    },
    { 
        id: 'robomaze', 
        label: 'ROBOMAZE', 
        tagline: 'Autonomous Navigation Arena', 
        prize: '₹15,000+', 
        fee: 450,
        type: 'TEAM', 
        members: 4, 
        mode: 'Offline',
        color: '#d9ff00', 
        description: 'Think, adapt, escape. Engineer a machine that can solve complex labyrinths in record time using advanced sensor fusion.',
        gradient: 'linear-gradient(135deg, #d9ff00, #000)',
        image: `${import.meta.env.BASE_URL}assets/robokshetra/maze_solver.png`
    },
    { 
        id: 'roborush', 
        label: 'ROBORUSH', 
        tagline: 'Obstacle Challenge Course', 
        prize: '₹20,000+', 
        fee: 450,
        type: 'TEAM', 
        members: 4, 
        mode: 'Offline',
        color: '#d9ff00', 
        description: 'A grueling all-terrain challenge course designed to test mechanical resilience and obstacle evasion logic.',
        gradient: 'linear-gradient(135deg, #d9ff00, #000)',
        image: `${import.meta.env.BASE_URL}assets/robokshetra/trailblazer.png`
    },
] as const;

type EventId = typeof ROBO_EVENTS[number]['id'];

const RoboKshetra: React.FC = () => {
    const [user] = useAuthState(auth);
    const navigate = useNavigate();
    const toast = useToast();
    
    const [selectedEvent, setSelectedEvent] = useState<EventId | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [ticketId, setTicketId] = useState('');
    const [accountabilityAccepted, setAccountabilityAccepted] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const { isRegistered, eventName: registeredEventName } = useRegistrationGuard();


    const activeEvent = ROBO_EVENTS.find(e => e.id === selectedEvent);

    // Form states — flat keys matching hackathon pattern
    const [formData, setFormData] = useState<Record<string, string>>({
        teamName: '',
        leaderAvrId: '',
        leaderName: user?.displayName || '',
        leaderEmail: user?.email || '',
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

    const [lookupLoading, setLookupLoading] = useState<Record<string, boolean>>({});
    const [lookupFailed, setLookupFailed] = useState<Record<string, boolean>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Prefill leader from Firestore profile
    React.useEffect(() => {
        if (!user) return;
        const fetchUserData = async () => {
            try {
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
            } catch (err) {
                console.error("Prefill error:", err);
            }
        };
        fetchUserData();
    }, [user]);

    // --- AVR Lookup (same pattern as HackathonRegistration) ---
    const handleAvrInput = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
        let val = e.target.value.toUpperCase();
        const prevVal = formData[`${id}AvrId`] || '';

        if (!val.startsWith("AVR-")) {
            val = "AVR-";
        }

        const raw = val.slice(4).replace(/[^A-Z0-9]/g, '');
        let letters = raw.slice(0, 3).replace(/[0-9]/g, '');
        let numbers = raw.slice(letters.length).replace(/[A-Z]/g, '').slice(0, 4);

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
                setLookupFailed(prev => ({ ...prev, [memberKey]: true }));
            }
        } catch (err) {
            console.error("Member lookup error:", err);
        } finally {
            setLookupLoading(prev => ({ ...prev, [memberKey]: false }));
        }
    };

    const handleRegistrationSubmit = async (txnId: string) => {
        if (!activeEvent || !user) return;
        setLoading(true);

        try {
            const regId = `RK26-${activeEvent.id.toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            
            const memberKeys = ['leader', 'member2', 'member3', 'member4'];
            await runTransaction(db, async (transaction) => {
                const regRef = doc(collection(db, 'registrations'), regId);
                transaction.set(regRef, {
                    ...formData,
                    eventTitle: activeEvent.label,
                    eventSubtitle: activeEvent.tagline,
                    competitionId: `robokshetra_${activeEvent.id}`,
                    competitionHandle: 'Robo-Kshetra',
                    userId: user.uid,
                    registrationId: regId,
                    transactionId: txnId,
                    allAvrIds: memberKeys
                        .map(k => formData[`${k}AvrId`])
                        .filter(id => !!id),
                    registeredAt: serverTimestamp(),
                    status: 'confirmed',
                    paymentStatus: 'success',
                    amountPaid: activeEvent.fee,
                });
            });

            setTicketId(regId);
            setSuccess(true);
            toast.success("Deployment Confirmed! Your machine is ready.");
        } catch (error) {
            console.error("Registration failed:", error);
            toast.error("Database sync failed. Contact support with your Txn ID.");
        } finally {
            setLoading(false);
        }
    };

    // Step 1: Validate and show preview
    const handleReview = () => {
        if (!user || !activeEvent) return;

        const newErrors: Record<string, string> = {};

        if (!accountabilityAccepted) {
            toast.error("Please acknowledge scheduling accountability.");
            return;
        }

        if (!formData.teamName.trim()) {
            toast.error("IDENTIFIER required for squadron.");
            return;
        }

        // Validate all members
        const memberKeys = ['leader', 'member2', 'member3', 'member4'];
        memberKeys.forEach(m => {
            const avr = formData[`${m}AvrId`];
            const name = formData[`${m}Name`];
            const phone = formData[`${m}Phone`];

            if (!avr || avr.length < 9) newErrors[`${m}AvrId`] = "Enter AVR ID";
            else if (!name) newErrors[`${m}AvrId`] = "Lookup Failed";

            if (!phone) {
                newErrors[`${m}Phone`] = "Required";
            } else {
                const cleanPhone = phone.replace(/\D/g, '');
                if (cleanPhone.length < 10) newErrors[`${m}Phone`] = "Min 10 digits";
            }
        });

        // Duplicate AVR-ID check
        const avrIds = memberKeys.map(m => formData[`${m}AvrId`]).filter(id => id && id.length >= 9);
        const seen = new Set<string>();
        for (const id of avrIds) {
            if (seen.has(id)) {
                toast.error(`Duplicate detected: ${id} — each squad member must be unique.`);
                return;
            }
            seen.add(id);
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error("Please fix the highlighted fields.");
            return;
        }
        setErrors({});
        setShowPreview(true);
    };

    // Step 2: Trigger payment from preview
    const handlePayNow = async () => {
        if (!user || !activeEvent) return;
        setLoading(true);

        try {
            const txnid = generateTxnId("ROBO");
            const response = await fetch("https://initiatepayment-rgvkuxdaea-uc.a.run.app", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    txnid,
                    amount: activeEvent.fee.toFixed(2),
                    productinfo: `RK26: ${activeEvent.label}`,
                    firstname: formData.leaderName || user.displayName || "Participant",
                    email: formData.leaderEmail || user.email,
                    phone: formData.leaderPhone,
                    udf1: formData.leaderCollege,
                    surl: `${window.location.origin}/user/dashboard?status=success`,
                    furl: `${window.location.origin}/robo-kshetra?status=failure`
                })
            });

            const result = await response.json();

            if (result.success && result.access_key) {
                const merchantKey = import.meta.env.VITE_EASEBUZZ_KEY;
                initiateEasebuzzCheckout(merchantKey, result.access_key, async (ebResponse: any) => {
                    if (ebResponse.status === "success") {
                        await handleRegistrationSubmit(txnid);
                    } else {
                        toast.error("Payment aborted by gateway.");
                    }
                }, 'prod');
            } else {
                throw new Error(result.error || "Initiation failed.");
            }
        } catch (err: any) {
            console.error("Payment error:", err);
            toast.error("System failure during payment. Try again.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="rk-page">
                <SEO title="Registration Confirmed | Robo-Kshetra" description="Deployment archived." />
                <div className="rk-success-container animate-fade-in">
                    <div className="rk-success-card">
                        <div className="rk-success-icon">
                            <CheckCircle2 size={60} />
                        </div>
                        <h1>MACHINE DEPLOYED</h1>
                        <p>Your entry for the <strong>{activeEvent?.label}</strong> has been successfully archived in the central registry.</p>
                        
                        <div className="rk-reg-id">
                            <span className="label">DEPLOYMENT_ID</span>
                            <span className="value">{ticketId}</span>
                        </div>

                        <button className="rk-dashboard-btn" onClick={() => navigate('/user/dashboard')}>
                            <LayoutDashboard size={20} /> COMMAND CENTER
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rk-page">
            <SEO 
                title={selectedEvent ? `Assemble: ${activeEvent?.label}` : "Robo-Kshetra Arena"} 
                description="Join the ultimate battlefield of metal and electronics at Robo-Kshetra '26."
            />
            
            {!selectedEvent ? (
                <div className="rk-selection-screen animate-in">
                    {/* --- HERO SECTION --- */}
                    <section className="rk-hero">
                        <div className="hero-badge">Avishkar '26 <br/>Robotics</div>
                        <img src={`${import.meta.env.BASE_URL}assets/logos/Robokshetra.png`} alt="Robo-Kshetra" className="hero-logo" />
                        <p className="hero-subtitle">Forge, Optimize, Combat. High-octane robotics competition where logic meets heavy metal.</p>
                        
                        <div className="hero-stats">
                            <div className="stat-item">
                                <Target className="stat-icon" />
                                <div className="stat-content">
                                    <span className="stat-val">3</span>
                                    <span className="stat-label">Core Arenas</span>
                                </div>
                            </div>
                            <div className="stat-item">
                                <Trophy className="stat-icon" />
                                <div className="stat-content">
                                    <span className="stat-val">₹50,000+</span>
                                    <span className="stat-label">Prize Pool</span>
                                </div>
                            </div>
                        </div>

                        <div className="hero-ctas">
                            <button className="primary-cta" onClick={() => document.getElementById('arena')?.scrollIntoView({ behavior: 'smooth' })}>
                                Enter the Arena <Rocket size={18} />
                            </button>
                            <button className="secondary-cta disabled" onClick={() => toast.info("Rulebook is being finalized and will be available soon.")}>
                                Rulebook (Soon) <FileText size={18} />
                            </button>
                        </div>
                    </section>

                    {/* --- JUDGING SECTION --- */}
                    <section className="judging-preview">
                        <div className="section-label">Evaluation</div>
                        <h2>Judging Criteria</h2>
                        <div className="judging-grid">
                            <div className="judging-card">
                                <div className="j-icon"><Rocket size={20} /></div>
                                <h3>Innovation</h3>
                                <p>Novelty of the bot design and creative use of mechanical components.</p>
                                <span className="weightage">30% Weight</span>
                            </div>
                            <div className="judging-card">
                                <div className="j-icon"><Target size={20} /></div>
                                <h3>Technical Execution</h3>
                                <p>Stability, speed, and accuracy of the autonomous logic.</p>
                                <span className="weightage">40% Weight</span>
                            </div>
                            <div className="judging-card">
                                <div className="j-icon"><Users size={20} /></div>
                                <h3>Resilience</h3>
                                <p>Mechanical robustness and ability to handle terrain variations.</p>
                                <span className="weightage">20% Weight</span>
                            </div>
                            <div className="judging-card">
                                <div className="j-icon"><HelpCircle size={20} /></div>
                                <h3>Presentation</h3>
                                <p>Clarity of concept and technical demonstration quality.</p>
                                <span className="weightage">10% Weight</span>
                            </div>
                        </div>
                    </section>

                    {/* --- EVENT PORTAL --- */}
                    <div className="portal-header" id="arena">
                        <div className="section-label">Combat Arena</div>
                        <h2>Select Your Challenge</h2>
                        <p>Choose your battlefield. Each event tests a unique aspect of robotics engineering.</p>
                    </div>

                    <div className="rk-grid-wrapper">
                        <ChromaGrid 
                            className="rk-arenas-grid"
                            items={ROBO_EVENTS.map(e => ({
                                id: e.id,
                                title: e.label,
                                subtitle: e.tagline,
                                image: e.image,
                                prizePool: e.prize,
                                description: e.description,
                                gradient: e.gradient,
                                handle: e.type,
                                isFlagship: true,
                                borderColor: e.color,
                                location: `${e.members}P | ${e.mode}`
                            } as ChromaItem))}
                            radius={400}
                            damping={0.5}
                            fadeOut={0.8}
                            columns={3}
                            onItemClick={(item: ChromaItem) => {
                                if (!user) {
                                    toast.error("Access Denied: Authentication required to enter assembly.");
                                    navigate('/login');
                                    return;
                                }
                                if (isRegistered) {
                                    toast.warning(`Locked: Already registered for ${registeredEventName}.`);
                                    return;
                                }
                                setSelectedEvent(item.id as EventId);
                            }}
                        />
                    </div>
                </div>
            ) : (
                <div className="rk-assembly-screen animate-fade-in">
                    {/* Event Sidebar Specs */}
                    <div className="rk-sidebar">
                        <button className="rk-back-btn" onClick={() => setSelectedEvent(null)}>
                            <ArrowLeft size={16} /> ABORT ASSEMBLY
                        </button>
                        
                        <div className="rk-event-info">
                            <div className="rk-event-thumb">
                                <img src={activeEvent?.image} alt={activeEvent?.label} />
                                <div className="rk-event-overlay" />
                            </div>
                            <h2>{activeEvent?.label}</h2>
                            <span className="rk-event-tag">{activeEvent?.tagline}</span>
                            
                            <div className="rk-spec-list">
                                <div className="rk-spec">
                                    <Zap size={16} />
                                    <span>MODE: {activeEvent?.mode}</span>
                                </div>
                                <div className="rk-spec">
                                    <Users size={16} />
                                    <span>SQUAD: {activeEvent?.members} MEMBERS</span>
                                </div>
                            </div>
                        </div>

                        <div className="rk-security-warning">
                            <Shield size={18} />
                            <p>All bots must undergo pre-battle scanning and verification.</p>
                        </div>
                    </div>

                    {/* Main Assembly Form */}
                    <div className="rk-form-arena">
                        <div className="rk-form-scroll">
                            {/* Team Name */}
                            <div className="rk-section">
                                <div className="rk-section-header">
                                    <CircuitBoard className="rk-section-icon" />
                                    <h3>TEAM_IDENTIFIER</h3>
                                </div>
                                <div className="rk-input-grid">
                                    <div className="rk-input-group full">
                                        <label>SQUADRON NAME</label>
                                        <input 
                                            placeholder="Enter unique team name"
                                            value={formData.teamName}
                                            onChange={e => setFormData({...formData, teamName: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Squad Members */}
                            <div className="rk-section">
                                <div className="rk-section-header">
                                    <Cpu className="rk-section-icon" />
                                    <h3>SQUAD_REGISTRY</h3>
                                </div>

                                <div className="rk-protocol-banner">
                                    <div className="rk-protocol-icon"><ShieldAlert size={20} /></div>
                                    <div className="rk-protocol-content">
                                        <h3>Authentication Protocol</h3>
                                        <p>Every squadron member must have an account on this platform. We synchronize verified data via AVR IDs.</p>
                                        <button className="rk-share-btn" onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/signup`);
                                            toast.success("Signup link copied!");
                                        }}>
                                            <Copy size={14} /> Share Signup Link
                                        </button>
                                    </div>
                                </div>

                                <p className="rk-form-hint">Ensure all members have created an account before proceeding with registration.</p>

                                <div className="rk-members-section">
                                    {/* LEADER */}
                                    <div className={`rk-member-card leader ${errors.leaderAvrId || errors.leaderPhone ? 'has-error' : ''}`}>
                                        <div className="rk-member-index">CMD</div>
                                        <div className="rk-member-inputs-v2">
                                            <div className={`rk-input-with-icon avr-lookup ${lookupLoading['leader'] ? 'searching' : ''} readonly`}>
                                                <Fingerprint size={16} />
                                                <input type="text" value={formData.leaderAvrId || ''} placeholder="AVR-XXX-0000" readOnly autoComplete="off" />
                                                <Search size={16} />
                                            </div>
                                            <div className="rk-detail-row">
                                                <div className="rk-input-with-icon prefilled readonly">
                                                    <User size={16} />
                                                    <input type="text" value={formData.leaderName || ''} placeholder="Full Name" readOnly />
                                                </div>
                                                <div className="rk-input-with-icon prefilled readonly">
                                                    <Mail size={16} />
                                                    <input type="email" value={formData.leaderEmail || ''} placeholder="Email Address" readOnly />
                                                </div>
                                            </div>
                                            <div className="rk-detail-row">
                                                <div className={`rk-input-with-icon prefilled ${errors.leaderPhone ? 'field-error' : ''} editable`}>
                                                    <Phone size={16} />
                                                    <input type="tel" name="leaderPhone" value={formData.leaderPhone || ''} onChange={handleInputChange} placeholder="WhatsApp Number" />
                                                    {errors.leaderPhone && <span className="rk-error-badge">{errors.leaderPhone}</span>}
                                                </div>
                                                <div className="rk-input-with-icon prefilled readonly">
                                                    <Building2 size={16} />
                                                    <input type="text" value={formData.leaderCollege || ''} placeholder="College/Institution" readOnly />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* MEMBERS 2-4 */}
                                    {['member2', 'member3', 'member4'].map((id, i) => (
                                        <div key={id} className={`rk-member-card ${errors[`${id}AvrId`] || errors[`${id}Phone`] ? 'has-error' : ''}`}>
                                            <div className="rk-member-index">P{i + 2}</div>
                                            <div className="rk-member-inputs-v2">
                                                <div className={`rk-input-with-icon avr-lookup ${lookupLoading[id] ? 'searching' : ''}`}>
                                                    <Fingerprint size={16} />
                                                    <input 
                                                        type="text" 
                                                        name={`${id}AvrId`}
                                                        value={formData[`${id}AvrId`] || ''} 
                                                        onChange={(e) => handleAvrInput(e, id)}
                                                        placeholder="AVR-XXX-0000"
                                                        autoComplete="off"
                                                    />
                                                    {lookupLoading[id] ? <Loader2 size={16} className="spinner" /> : <Search size={16} />}
                                                </div>

                                                <div className="rk-status-bar">
                                                    {formData[`${id}AvrId`]?.length >= 9 ? (
                                                        lookupFailed[id] ? (
                                                            <div className="rk-status failure">
                                                                <ShieldAlert size={12} /> Member not discovered
                                                            </div>
                                                        ) : (
                                                            <div className="rk-status success">
                                                                <Check size={12} /> Identity Verified
                                                            </div>
                                                        )
                                                    ) : (
                                                        <div className="rk-status info">
                                                            <ExternalLink size={12} /> Needs website account
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="rk-detail-row">
                                                    <div className="rk-input-with-icon prefilled editable">
                                                        <User size={16} />
                                                        <input type="text" name={`${id}Name`} value={formData[`${id}Name`] || ''} onChange={handleInputChange} placeholder="Full Name" />
                                                    </div>
                                                    <div className="rk-input-with-icon prefilled readonly">
                                                        <Mail size={16} />
                                                        <input type="email" value={formData[`${id}Email`] || ''} placeholder="Email Address" readOnly />
                                                    </div>
                                                </div>
                                                <div className="rk-detail-row">
                                                    <div className={`rk-input-with-icon prefilled editable ${errors[`${id}Phone`] ? 'field-error' : ''}`}>
                                                        <Phone size={16} />
                                                        <input type="tel" name={`${id}Phone`} value={formData[`${id}Phone`] || ''} onChange={handleInputChange} placeholder="WhatsApp Number" />
                                                        {errors[`${id}Phone`] && <span className="rk-error-badge">{errors[`${id}Phone`] || ''}</span>}
                                                    </div>
                                                    <div className="rk-input-with-icon prefilled readonly">
                                                        <Building2 size={16} />
                                                        <input type="text" value={formData[`${id}College`] || ''} placeholder="College/Institution" readOnly />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                             <div className="rk-assembly-actions">
                                <div className="scheduling-notice-card" style={{ 
                                    background: 'rgba(217, 255, 0, 0.05)', 
                                    border: '1px solid rgba(217, 255, 0, 0.2)',
                                    borderRadius: '12px',
                                    padding: '1rem',
                                    marginBottom: '1.5rem',
                                    display: 'flex',
                                    gap: '1rem'
                                }}>
                                    <AlertTriangle size={24} color="#d9ff00" style={{ flexShrink: 0 }} />
                                    <div>
                                        <h4 style={{ color: '#d9ff00', margin: '0 0 0.4rem 0', fontSize: '0.85rem', letterSpacing: '1px' }}>SCHEDULING ACCOUNTABILITY</h4>
                                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', lineHeight: '1.4', margin: 0 }}>
                                            One User, One Event policy active. You are solely responsible for managing any scheduling overlaps between registered events.
                                        </p>
                                        <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <input 
                                                type="checkbox" 
                                                id="rk-acc-check"
                                                checked={accountabilityAccepted}
                                                onChange={(e) => setAccountabilityAccepted(e.target.checked)}
                                                style={{ width: '16px', height: '16px', accentColor: '#d9ff00', cursor: 'pointer' }}
                                            />
                                            <label htmlFor="rk-acc-check" style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                                                I accept full responsibility for my schedule.
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {!showPreview ? (
                                    <>
                                        <button 
                                            className="rk-deploy-btn"
                                            disabled={loading || !formData.teamName}
                                            onClick={handleReview}
                                        >
                                            REVIEW SQUAD & PAY
                                            <ArrowRight size={20} />
                                        </button>
                                        <p className="rk-disclaimer">Verify your squad details before proceeding to payment.</p>
                                    </>
                                ) : (
                                    <div className="rk-preview-panel">
                                        <div className="rk-preview-header">
                                            <Shield size={20} />
                                            <h4>SQUAD CONFIRMATION</h4>
                                        </div>

                                        <div className="rk-preview-meta">
                                            <div className="rk-preview-meta-item">
                                                <span className="rk-preview-label">TEAM</span>
                                                <span className="rk-preview-value">{formData.teamName}</span>
                                            </div>
                                            <div className="rk-preview-meta-item">
                                                <span className="rk-preview-label">EVENT</span>
                                                <span className="rk-preview-value">{activeEvent?.label}</span>
                                            </div>
                                        </div>

                                        <div className="rk-preview-members">
                                            {['leader', 'member2', 'member3', 'member4'].map((m, idx) => (
                                                <div key={m} className="rk-preview-member">
                                                    <span className="rk-pm-rank">{idx === 0 ? 'CMD' : `P${idx + 1}`}</span>
                                                    <div className="rk-pm-info">
                                                        <span className="rk-pm-name">{formData[`${m}Name`]}</span>
                                                        <span className="rk-pm-avr">{formData[`${m}AvrId`]}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="rk-payment-summary">
                                            <div className="rk-summary-row">
                                                <span>Registration Fee</span>
                                                <span>₹{activeEvent?.fee.toFixed(2)}</span>
                                            </div>
                                            <div className="rk-summary-row total">
                                                <span>Total Payable</span>
                                                <span>₹{activeEvent?.fee.toFixed(2)}</span>
                                            </div>
                                            <p className="rk-payment-note">Secure payment via Easebuzz Gateway</p>
                                        </div>

                                        <div className="rk-preview-actions">
                                            <button className="rk-edit-btn" onClick={() => setShowPreview(false)}>
                                                <ArrowLeft size={16} /> Edit Squad
                                            </button>
                                            <button className="rk-deploy-btn" onClick={handlePayNow} disabled={loading}>
                                                {loading ? <Loader2 className="animate-spin" /> : 'PAY NOW'}
                                                {!loading && <ArrowRight size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoboKshetra;
