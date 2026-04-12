import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, collection, getDoc, query, where, getDocs, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';
import SEO from '../../components/seo/SEO';
import { useToast } from '../../components/toast/Toast';
import { 
    ArrowRight, 
    ArrowLeft, 
    Loader2, 
    Trophy,
    CheckCircle2,
    Target,
    Phone,
    Fingerprint,
    Building2,
    Shield,
    AlertTriangle,
    Cpu,
    ShieldAlert,
    Copy,
    Check,
    ExternalLink,
    Search,
    User,
    Mail,
    Gamepad2,
    Hash
} from 'lucide-react';
import { useRegistrationGuard } from '../../hooks/useRegistrationGuard';
import { initiateEasebuzzCheckout, generateTxnId } from '../../utils/easebuzz';
import './EsportsRegistration.css';

// Game Configurations
const GAMES = [
    { id: 'bgmi', label: 'BGMI', tagline: 'Grid-Warrior Mobile (4+1 Squad)', prize: '₹50,000', fee: 500, type: 'TEAM', members: 5, platform: 'Mobile', color: '#ff9800', image: `${import.meta.env.BASE_URL}assets/esports/bgmi.webp`, rulebook: `${import.meta.env.BASE_URL}assets/rule-books/bgmi.pdf`, coordinator: 'Rohit Bayas', contactNumber: '9322708124', coordinator2: 'Omkar Wadekar', contactNumber2: '7378503893' },
    { id: 'freefire', label: 'FREE FIRE', tagline: 'Garena Battle-Royale (4-Player Squad)', prize: '₹6,000', fee: 250, type: 'TEAM', members: 4, platform: 'Mobile', color: '#e91e63', image: `${import.meta.env.BASE_URL}assets/esports/freefire.webp`, rulebook: `${import.meta.env.BASE_URL}assets/rule-books/free-fire.pdf`, coordinator: 'Rohit Chavan', contactNumber: '7823056055' },
    { id: 'codm', label: 'CALL OF DUTY (MOBILE)', tagline: 'Tactical 5v5 Combat', prize: '₹16,000', fee: 400, type: 'TEAM', members: 5, platform: 'Mobile', color: '#4caf50', image: `${import.meta.env.BASE_URL}assets/esports/codm.webp`, rulebook: `${import.meta.env.BASE_URL}assets/rule-books/call-of-duty.pdf`, coordinator: 'Vaibhav Bandgar', contactNumber: '9730906103' },
    { id: 'sf4', label: 'SHADOW-FIGHT 4', tagline: 'Arena 1v1 Combat', prize: '₹8,000', fee: 150, type: 'SOLO', members: 1, platform: 'Mobile', color: '#ffeb3b', image: `${import.meta.env.BASE_URL}assets/esports/sf4.webp`, rulebook: `${import.meta.env.BASE_URL}assets/rule-books/shadow-fight-4.pdf`, coordinator: 'Pranav Kulkarni', contactNumber: '9423162724' },
    { id: 'amongus', label: 'AMONG US', tagline: 'Social Deduction', prize: 'TBD', fee: 100, type: 'SOLO', members: 1, platform: 'Mobile', color: '#00bcd4', image: `${import.meta.env.BASE_URL}assets/esports/amongus.webp`, coordinator: 'Mrunali Kolte', contactNumber: '9067101314', rulebook: `${import.meta.env.BASE_URL}assets/rule-books/among-us.pdf`, coordinator2: 'Shreya Kadam', contactNumber2: '9511659631' },
] as const;

type GameId = typeof GAMES[number]['id'];

const EsportsRegistration: React.FC = () => {
    const [user] = useAuthState(auth);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const selectedGame = searchParams.get('game') as GameId;
    const toast = useToast();
    const { isRegistered, eventName, loading: guardLoading } = useRegistrationGuard();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const callbackFiredRef = React.useRef(false);
    const [ticketId, setTicketId] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [accountabilityAccepted, setAccountabilityAccepted] = useState(false);
    const [lookupLoading, setLookupLoading] = useState<Record<string, boolean>>({});
    const [lookupFailed, setLookupFailed] = useState<Record<string, boolean>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    const activeGame = GAMES.find(g => g.id === selectedGame);

    // Build flat form data keys for up to 5 members
    const [formData, setFormData] = useState<Record<string, string>>({
        teamName: '',
        leaderAvrId: '', leaderName: '', leaderEmail: '', leaderPhone: '', leaderCollege: '', leaderIgn: '', leaderBgmiId: '', leaderFfId: '', leaderCodmId: '', leaderSf4Id: '',
        member2AvrId: '', member2Name: '', member2Email: '', member2Phone: '', member2College: '', member2Ign: '', member2BgmiId: '', member2FfId: '', member2CodmId: '', member2Sf4Id: '',
        member3AvrId: '', member3Name: '', member3Email: '', member3Phone: '', member3College: '', member3Ign: '', member3BgmiId: '', member3FfId: '', member3CodmId: '', member3Sf4Id: '',
        member4AvrId: '', member4Name: '', member4Email: '', member4Phone: '', member4College: '', member4Ign: '', member4BgmiId: '', member4FfId: '', member4CodmId: '', member4Sf4Id: '',
        member5AvrId: '', member5Name: '', member5Email: '', member5Phone: '', member5College: '', member5Ign: '', member5BgmiId: '', member5FfId: '', member5CodmId: '', member5Sf4Id: '',
    });

    // Get member keys based on game type
    const getMemberKeys = () => {
        if (!activeGame) return ['leader'];
        const keys = ['leader'];
        for (let i = 2; i <= activeGame.members; i++) {
            keys.push(`member${i}`);
        }
        return keys;
    };

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
                        leaderPhone: data.whatsappNumber || data.whatsapp || data.phone || '',
                        leaderCollege: data.college || '',
                    }));
                }
            } catch (err) {
                toast.error("Failed to load profile");
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, [user, selectedGame, navigate]);

    // --- AVR Input with auto-format ---
    const handleAvrInput = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
        let val = e.target.value.toUpperCase();
        const prevVal = formData[`${id}AvrId`] || '';

        if (!val.startsWith("AVR-")) val = "AVR-";

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
        if (!avrId || avrId.length < 8) {
            setLookupFailed(prev => ({ ...prev, [memberKey]: false }));
            return;
        }

        setLookupLoading(prev => ({ ...prev, [memberKey]: true }));
        setLookupFailed(prev => ({ ...prev, [memberKey]: false }));
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
                    [`${memberKey}Ign`]: '',
                    [`${memberKey}BgmiId`]: '',
                    [`${memberKey}FfId`]: '',
                    [`${memberKey}CodmId`]: '',
                    [`${memberKey}Sf4Id`]: '',
                }));
                setLookupFailed(prev => ({ ...prev, [memberKey]: true }));
            }
        } catch (err) {
            console.error("Lookup error:", err);
            setLookupFailed(prev => ({ ...prev, [memberKey]: true }));
        } finally {
            setLookupLoading(prev => ({ ...prev, [memberKey]: false }));
        }
    };

    // --- Registration ---
    const handleRegistrationSubmit = async (txnId: string, paymentMeta?: { easepayId?: string; bankRef?: string; paymentMode?: string }) => {
        if (!activeGame || !user) return;
        setSubmitting(true);

        try {
            const memberKeys = getMemberKeys();
            let generatedTeamId = "";
            let alreadyConfirmed = false;

            await runTransaction(db, async (transaction) => {
                const pendingRef = doc(db, "pending_registrations", txnId);
                const pendingDoc = await transaction.get(pendingRef);

                if (pendingDoc.exists()) {
                    const data = pendingDoc.data();
                    if (data.status === 'confirmed') {
                        alreadyConfirmed = true;
                        return; // Exit transaction early if already confirmed
                    }
                }

                // Generate Unique Team ID
                const teamCounterRef = doc(db, "counters", "esports_team_counter");
                const teamCounterDoc = await transaction.get(teamCounterRef);
                
                let nextTeamCount = 1;
                if (teamCounterDoc.exists()) {
                    nextTeamCount = (teamCounterDoc.data().count || 0) + 1;
                }

                transaction.set(teamCounterRef, { count: nextTeamCount }, { merge: true });
                generatedTeamId = `AVR-ESP-${nextTeamCount.toString().padStart(4, '0')}`;

                const regRef = doc(collection(db, 'registrations')); // Let auto-ID for document, but use generatedTeamId inside
                transaction.set(regRef, {
                    ...formData,
                    teamId: generatedTeamId, // Sequential ID
                    // Normalized field names for RegistrationManager compatibility
                    userName: formData.leaderName,
                    userEmail: formData.leaderEmail,
                    avrId: formData.leaderAvrId,
                    userPhone: formData.leaderPhone,
                    userCollege: formData.leaderCollege,
                    eventName: activeGame.label,
                    eventTitle: activeGame.label,
                    eventSubtitle: activeGame.tagline,
                    competitionId: `battlegrid_${activeGame.id}`,
                    competitionHandle: 'Battle-Grid',
                    department: 'Esports',
                    category: 'Battle-Grid',
                    userId: user.uid,
                    registrationId: generatedTeamId,
                    transactionId: txnId,
                    easepayId: paymentMeta?.easepayId || null,
                    bankRefNum: paymentMeta?.bankRef || null,
                    paymentMode: paymentMeta?.paymentMode || null,
                    allAvrIds: memberKeys
                        .map(k => formData[`${k}AvrId`])
                        .filter(id => !!id),
                    registeredAt: serverTimestamp(),
                    status: 'confirmed',
                    paymentStatus: 'success',
                    amountPaid: activeGame.fee,
                });

                transaction.update(pendingRef, {
                    status: 'confirmed',
                    resolvedAt: serverTimestamp(),
                    easepayId: paymentMeta?.easepayId || null,
                    bankRefNum: paymentMeta?.bankRef || null,
                    paymentMode: paymentMeta?.paymentMode || null
                });
            });

            if (alreadyConfirmed) {
                // Fetch the ID generated by the webhook
                const hQuery = query(collection(db, "registrations"), where("transactionId", "==", txnId));
                const hSnap = await getDocs(hQuery);
                if (!hSnap.empty) {
                    generatedTeamId = hSnap.docs[0].data().teamId;
                } else {
                    generatedTeamId = "VERIFIED-BY-ADMIN";
                }
            }

            setTicketId(generatedTeamId);
            setSuccess(true);
            toast.success(`Deployment Confirmed! Squad ID: ${generatedTeamId}`);
        } catch (error) {
            console.error("Registration failed:", error);
            toast.error("Database sync failed. Contact support.");
        } finally {
            setSubmitting(false);
        }
    };

    // --- Validate & Preview ---
    const handleReview = () => {
        if (!user || !activeGame) return;

        const newErrors: Record<string, string> = {};

        if (!accountabilityAccepted) {
            toast.error("Please acknowledge scheduling accountability.");
            return;
        }

        if (activeGame.type === 'TEAM' && !formData.teamName.trim()) {
            toast.error("Squad name required.");
            return;
        }

        // Validate all required members
        const memberKeys = getMemberKeys();
        memberKeys.forEach((m, idx) => {
            const avr = formData[`${m}AvrId`];
            const name = formData[`${m}Name`];
            const phone = formData[`${m}Phone`];
            const ign = formData[`${m}Ign`];
            const bgmiId = formData[`${m}BgmiId`];

            // For BGMI, members 1-4 are mandatory, 5 is optional unless AVR provided
            const isMandatory = activeGame.id === 'bgmi' ? (idx < 4) : true;
            const hasData = !!avr || !!ign || !!bgmiId;

            if (isMandatory || hasData) {
                if (!avr || avr.length < 9) newErrors[`${m}AvrId`] = "Enter AVR ID";
                else if (!name) newErrors[`${m}AvrId`] = "Lookup Failed";

                if (!phone) {
                    newErrors[`${m}Phone`] = "Required";
                } else {
                    const cleanPhone = phone.replace(/\D/g, '');
                    if (cleanPhone.length < 10) newErrors[`${m}Phone`] = "Min 10 digits";
                }

                if (activeGame.id === 'bgmi') {
                    if (!ign) newErrors[`${m}Ign`] = "IGN Required";
                    if (!bgmiId) {
                        newErrors[`${m}BgmiId`] = "ID Required";
                    } else if (!/^\d{10}$/.test(bgmiId)) {
                        newErrors[`${m}BgmiId`] = "Exactly 10 digits";
                    }
                }

                if (activeGame.id === 'freefire') {
                    const ffId = formData[`${m}FfId`];
                    if (!ign) newErrors[`${m}Ign`] = "IGN Required";
                    if (!ffId) {
                        newErrors[`${m}FfId`] = "ID Required";
                    } else if (!/^\d{9,10}$/.test(ffId)) {
                        newErrors[`${m}FfId`] = "9-10 digits";
                    }
                }

                if (activeGame.id === 'codm') {
                    const codmId = formData[`${m}CodmId`];
                    if (!ign) newErrors[`${m}Ign`] = "IGN Required";
                    if (!codmId) {
                        newErrors[`${m}CodmId`] = "ID Required";
                    } else if (!/^\d+$/.test(codmId)) {
                        newErrors[`${m}CodmId`] = "Must be numeric";
                    }
                }

                if (activeGame.id === 'sf4') {
                    const sf4Id = formData[`${m}Sf4Id`];
                    if (!ign) newErrors[`${m}Ign`] = "IGN Required";
                    if (!sf4Id) {
                        newErrors[`${m}Sf4Id`] = "ID Required";
                    } else if (!/^\d+$/.test(sf4Id)) {
                        newErrors[`${m}Sf4Id`] = "Must be numeric";
                    }
                }

                if (activeGame.id === 'amongus') {
                    if (!ign) newErrors[`${m}Ign`] = "Character Name Required";
                }
            }
        });

        // Duplicate AVR-ID check
        const avrIds = memberKeys.map(m => formData[`${m}AvrId`]).filter(id => id && id.length >= 9);
        const seen = new Set<string>();
        for (const id of avrIds) {
            if (seen.has(id)) {
                toast.error(`Duplicate detected: ${id} — each member must be unique.`);
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

    // --- Pay Now ---
    const handlePayNow = async () => {
        if (!user || !activeGame) return;

        // Server-side duplicate check before we even initiate payment
        const dupeQuery = query(
            collection(db, 'registrations'),
            where('userId', '==', user.uid),
            where('competitionId', '==', `battlegrid_${activeGame.id}`)
        );
        const dupeSnap = await getDocs(dupeQuery);
        if (!dupeSnap.empty) {
            // Already registered — show success with the existing ticket ID
            const existingData = dupeSnap.docs[0].data();
            setTicketId(existingData.registrationId || existingData.teamId || 'REGISTERED');
            setSuccess(true);
            toast.success('You are already registered for this arena!');
            return;
        }

        setSubmitting(true);
        callbackFiredRef.current = false; // Reset callback guard for each attempt

        try {
            const txnid = generateTxnId(activeGame.id.toUpperCase());

            const pendingRef = doc(db, "pending_registrations", txnid);
            await setDoc(pendingRef, {
                uid: user.uid,
                email: user.email || formData.leaderEmail,
                transactionId: txnid,
                type: 'esports_registration', // Important for webhook routing
                competitionId: `battlegrid_${activeGame.id}`,
                amount: activeGame.fee,
                createdAt: serverTimestamp(),
                status: 'pending',
                formData: formData,
                activeGame: activeGame
            });

            const response = await fetch("https://initiatepayment-rgvkuxdaea-uc.a.run.app", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    txnid,
                    amount: activeGame.fee.toFixed(2),
                    productinfo: `BattleGrid: ${activeGame.label}`,
                    firstname: formData.leaderName || user.displayName || "Participant",
                    email: formData.leaderEmail || user.email,
                    phone: formData.leaderPhone,
                    surl: `${window.location.origin}/esports-register?status=success`,
                    furl: `${window.location.origin}/esports-register?status=failure`
                })
            });

            const result = await response.json();

            if (result.success && result.access_key) {
                const merchantKey = import.meta.env.VITE_EASEBUZZ_KEY;
                initiateEasebuzzCheckout(merchantKey, result.access_key, async (ebResponse: any) => {
                    // Guard: prevent duplicate callbacks from Easebuzz SDK
                    if (callbackFiredRef.current) return;
                    callbackFiredRef.current = true;

                    if (ebResponse.status === "success") {
                        // Use real Easebuzz txnid from response, fallback to our generated one
                        const realTxnId = ebResponse.txnid || txnid;
                        await handleRegistrationSubmit(realTxnId, {
                            easepayId: ebResponse.easepayid || null,
                            bankRef: ebResponse.bank_ref_num || null,
                            paymentMode: ebResponse.mode || null,
                        });
                    } else {
                        callbackFiredRef.current = false; // Allow retry on failure
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
            setSubmitting(false);
        }
    };

    if (loading || guardLoading) return <div className="loader-screen"><Loader2 className="spinner" /></div>;

    if (isRegistered) {
        return (
            <div className="esports-reg-page-v2 centered">
                <div className="registered-overlay fade-in">
                    <ShieldAlert size={64} color="#ff4655" className="locked-icon" />
                    <h1 className="locked-title">ARENA LOCKED</h1>
                    <p className="locked-text">You are already signed for <strong>{eventName}</strong>.</p>
                    <button className="es-deploy-btn" onClick={() => navigate('/user/dashboard')}>RETURN TO COMMAND <ArrowRight size={18} /></button>
                </div>
            </div>
        );
    }

    // --- SUCCESS ---
    if (success) {
        return (
            <div className="esports-reg-page-v2 centered">
                <SEO title={`${activeGame?.label} — Confirmed`} description="Registration Successful" />
                <div className="es-success-card fade-in">
                    <div className="es-success-icon"><CheckCircle2 size={48} /></div>
                    <h1>DEPLOYMENT CONFIRMED</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '2rem' }}>Your squad is now logged in the grid.</p>
                    <div className="es-reg-id">
                        <span className="label">REGISTRATION ID</span>
                        <span className="value">{ticketId}</span>
                    </div>
                    <button className="es-deploy-btn" onClick={() => navigate('/user/dashboard')}>
                        GO TO DASHBOARD <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        );
    }

    const memberKeys = getMemberKeys();

    return (
        <div className="esports-reg-page-v2">
            <SEO title={`${activeGame?.label} Registration`} description="Battle-Grid '26 E-Sports Entry" />
            
            <div className="esports-header-v2">
                <div className="nav-row">
                    <button className="back-portal-btn" onClick={() => navigate('/battle-grid')}>
                        <ArrowLeft size={16} /> RE-SELECT ARENA
                    </button>
                    <div className="platform-tag">
                        {(activeGame?.platform as string) === 'PC' ? <Target size={14} /> : <Phone size={14} />}
                        {activeGame?.platform} - {activeGame?.type} Entry
                    </div>
                </div>
                <div className="main-logo-row">
                    <span className="game-label-large">{activeGame?.label}</span>
                    <span className="reg-text-large">REGISTRATION</span>
                </div>
            </div>

            <div className="esports-layout-v2">
                {/* Team Name (only for TEAM type games) */}
                {activeGame?.type === 'TEAM' && (
                    <div className="es-section">
                        <div className="es-section-header">
                            <Trophy size={18} />
                            <h3>SQUAD_IDENTIFIER</h3>
                        </div>
                        <div className="es-team-input">
                            <input 
                                type="text" 
                                name="teamName" 
                                value={formData.teamName} 
                                onChange={handleInputChange} 
                                placeholder="Enter squad name" 
                            />
                        </div>
                    </div>
                )}

                {/* Squad Registry */}
                <div className="es-section">
                    <div className="es-section-header">
                        <Cpu size={18} />
                        <h3>{activeGame?.type === 'TEAM' ? 'SQUAD_REGISTRY' : 'PLAYER_REGISTRY'}</h3>
                    </div>

                    <div className="es-protocol-banner">
                        <div className="es-protocol-icon"><ShieldAlert size={20} /></div>
                        <div className="es-protocol-content">
                            <h3>Authentication Protocol</h3>
                            <p>Every participant must have an account on this platform. We synchronize verified data via AVR IDs.</p>
                            <button className="es-share-btn" onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/signup`);
                                toast.success("Signup link copied!");
                            }}>
                                <Copy size={14} /> Share Signup Link
                            </button>
                        </div>
                    </div>

                    <p className="es-form-hint">Ensure all members have created an account before proceeding with registration.</p>

                    <div className="es-members-section">
                        {/* LEADER */}
                        <div className={`es-member-card leader ${errors.leaderAvrId || errors.leaderPhone ? 'has-error' : ''}`}>
                            <div className="es-member-index">{activeGame?.type === 'TEAM' ? 'CMD' : 'P1'}</div>
                            <div className="es-member-inputs">
                                <div className={`es-input-with-icon avr-lookup readonly`}>
                                    <Fingerprint size={16} />
                                    <input type="text" value={formData.leaderAvrId || ''} placeholder="AVR-XXX-0000" readOnly autoComplete="off" />
                                    <Search size={16} />
                                </div>
                                <div className="es-status-bar">
                                    <div className="es-status success">
                                        <Check size={12} /> Identity Verified
                                    </div>
                                </div>
                                <div className="es-detail-row">
                                    <div className="es-input-with-icon prefilled readonly">
                                        <User size={16} />
                                        <input type="text" value={formData.leaderName || ''} placeholder="Full Name" readOnly />
                                    </div>
                                    <div className="es-input-with-icon prefilled readonly">
                                        <Mail size={16} />
                                        <input type="email" value={formData.leaderEmail || ''} placeholder="Email Address" readOnly />
                                    </div>
                                </div>
                                <div className="es-detail-row">
                                    <div className={`es-input-with-icon prefilled editable ${errors.leaderPhone ? 'field-error' : ''}`}>
                                        <Phone size={16} />
                                        <input type="tel" name="leaderPhone" value={formData.leaderPhone || ''} onChange={handleInputChange} placeholder="WhatsApp Number" />
                                        {errors.leaderPhone && <span className="es-error-badge">{errors.leaderPhone}</span>}
                                    </div>
                                    <div className="es-input-with-icon prefilled readonly">
                                        <Building2 size={16} />
                                        <input type="text" value={formData.leaderCollege || ''} placeholder="College/Institution" readOnly />
                                    </div>
                                </div>
                                {activeGame?.id === 'bgmi' && (
                                    <div className="es-detail-row">
                                        <div className={`es-input-with-icon prefilled editable ${errors.leaderIgn ? 'field-error' : ''}`}>
                                            <Gamepad2 size={16} />
                                            <input type="text" name="leaderIgn" value={formData.leaderIgn || ''} onChange={handleInputChange} placeholder="In-game Name" />
                                            {errors.leaderIgn && <span className="es-error-badge">{errors.leaderIgn}</span>}
                                        </div>
                                        <div className={`es-input-with-icon prefilled editable ${errors.leaderBgmiId ? 'field-error' : ''}`}>
                                            <Hash size={16} />
                                            <input type="text" name="leaderBgmiId" value={formData.leaderBgmiId || ''} onChange={handleInputChange} placeholder="BGMI ID (10-digit)" />
                                            {errors.leaderBgmiId && <span className="es-error-badge">{errors.leaderBgmiId}</span>}
                                        </div>
                                    </div>
                                )}
                                {activeGame?.id === 'freefire' && (
                                    <div className="es-detail-row">
                                        <div className={`es-input-with-icon prefilled editable ${errors.leaderIgn ? 'field-error' : ''}`}>
                                            <Gamepad2 size={16} />
                                            <input type="text" name="leaderIgn" value={formData.leaderIgn || ''} onChange={handleInputChange} placeholder="In-game Name" />
                                            {errors.leaderIgn && <span className="es-error-badge">{errors.leaderIgn}</span>}
                                        </div>
                                        <div className={`es-input-with-icon prefilled editable ${errors.leaderFfId ? 'field-error' : ''}`}>
                                            <Hash size={16} />
                                            <input type="text" name="leaderFfId" value={formData.leaderFfId || ''} onChange={handleInputChange} placeholder="Free Fire UID" />
                                            {errors.leaderFfId && <span className="es-error-badge">{errors.leaderFfId}</span>}
                                        </div>
                                    </div>
                                )}
                                {activeGame?.id === 'codm' && (
                                    <div className="es-detail-row">
                                        <div className={`es-input-with-icon prefilled editable ${errors.leaderIgn ? 'field-error' : ''}`}>
                                            <Gamepad2 size={16} />
                                            <input type="text" name="leaderIgn" value={formData.leaderIgn || ''} onChange={handleInputChange} placeholder="In-game Name" />
                                            {errors.leaderIgn && <span className="es-error-badge">{errors.leaderIgn}</span>}
                                        </div>
                                        <div className={`es-input-with-icon prefilled editable ${errors.leaderCodmId ? 'field-error' : ''}`}>
                                            <Hash size={16} />
                                            <input type="text" name="leaderCodmId" value={formData.leaderCodmId || ''} onChange={handleInputChange} placeholder="CODM Player UID" />
                                            {errors.leaderCodmId && <span className="es-error-badge">{errors.leaderCodmId}</span>}
                                        </div>
                                    </div>
                                )}
                                {activeGame?.id === 'sf4' && (
                                    <div className="es-detail-row">
                                        <div className={`es-input-with-icon prefilled editable ${errors.leaderIgn ? 'field-error' : ''}`}>
                                            <Gamepad2 size={16} />
                                            <input type="text" name="leaderIgn" value={formData.leaderIgn || ''} onChange={handleInputChange} placeholder="In-game Name" />
                                            {errors.leaderIgn && <span className="es-error-badge">{errors.leaderIgn}</span>}
                                        </div>
                                        <div className={`es-input-with-icon prefilled editable ${errors.leaderSf4Id ? 'field-error' : ''}`}>
                                            <Hash size={16} />
                                            <input type="text" name="leaderSf4Id" value={formData.leaderSf4Id || ''} onChange={handleInputChange} placeholder="Shadow Fight Arena ID" />
                                            {errors.leaderSf4Id && <span className="es-error-badge">{errors.leaderSf4Id}</span>}
                                        </div>
                                    </div>
                                )}
                                {activeGame?.id === 'amongus' && (
                                    <div className="es-detail-row">
                                        <div className={`es-input-with-icon prefilled editable ${errors.leaderIgn ? 'field-error' : ''}`}>
                                            <Gamepad2 size={16} />
                                            <input type="text" name="leaderIgn" value={formData.leaderIgn || ''} onChange={handleInputChange} placeholder="Among Us Character Name" />
                                            {errors.leaderIgn && <span className="es-error-badge">{errors.leaderIgn}</span>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SQUAD MEMBERS */}
                        {memberKeys.slice(1).map((id, i) => (
                            <div key={id} className={`es-member-card ${errors[`${id}AvrId`] || errors[`${id}Phone`] ? 'has-error' : ''}`}>
                                <div className="es-member-index">
                                    {(activeGame?.id === 'bgmi' && i === 3) ? 'SUB' : `P${i + 2}`}
                                </div>
                                <div className="es-member-inputs">
                                    <div className={`es-input-with-icon avr-lookup ${lookupLoading[id] ? 'searching' : ''}`}>
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
                                    <div className="es-status-bar">
                                        {formData[`${id}AvrId`]?.length >= 9 ? (
                                            lookupFailed[id] ? (
                                                <div className="es-status failure">
                                                    <ShieldAlert size={12} /> Member not discovered
                                                </div>
                                            ) : (
                                                <div className="es-status success">
                                                    <Check size={12} /> Identity Verified
                                                </div>
                                            )
                                        ) : (
                                            <div className="es-status info">
                                                <ExternalLink size={12} /> Needs website account
                                            </div>
                                        )}
                                    </div>
                                    <div className="es-detail-row">
                                        <div className="es-input-with-icon prefilled editable">
                                            <User size={16} />
                                            <input type="text" name={`${id}Name`} value={formData[`${id}Name`] || ''} onChange={handleInputChange} placeholder="Full Name" />
                                        </div>
                                        <div className="es-input-with-icon prefilled readonly">
                                            <Mail size={16} />
                                            <input type="email" value={formData[`${id}Email`] || ''} placeholder="Email Address" readOnly />
                                        </div>
                                    </div>
                                    <div className="es-detail-row">
                                        <div className={`es-input-with-icon prefilled editable ${errors[`${id}Phone`] ? 'field-error' : ''}`}>
                                            <Phone size={16} />
                                            <input type="tel" name={`${id}Phone`} value={formData[`${id}Phone`] || ''} onChange={handleInputChange} placeholder="WhatsApp Number" />
                                            {errors[`${id}Phone`] && <span className="es-error-badge">{errors[`${id}Phone`]}</span>}
                                        </div>
                                        <div className="es-input-with-icon prefilled readonly">
                                            <Building2 size={16} />
                                            <input type="text" value={formData[`${id}College`] || ''} placeholder="College/Institution" readOnly />
                                        </div>
                                    </div>
                                    {activeGame?.id === 'bgmi' && (
                                        <div className="es-detail-row">
                                            <div className={`es-input-with-icon prefilled editable ${errors[`${id}Ign`] ? 'field-error' : ''}`}>
                                                <Gamepad2 size={16} />
                                                <input type="text" name={`${id}Ign`} value={formData[`${id}Ign`] || ''} onChange={handleInputChange} placeholder="In-game Name" />
                                                {errors[`${id}Ign`] && <span className="es-error-badge">{errors[`${id}Ign`]}</span>}
                                            </div>
                                            <div className={`es-input-with-icon prefilled editable ${errors[`${id}BgmiId`] ? 'field-error' : ''}`}>
                                                <Hash size={16} />
                                                <input type="text" name={`${id}BgmiId`} value={formData[`${id}BgmiId`] || ''} onChange={handleInputChange} placeholder="BGMI ID (10-digit)" />
                                                {errors[`${id}BgmiId`] && <span className="es-error-badge">{errors[`${id}BgmiId`]}</span>}
                                            </div>
                                        </div>
                                    )}
                                    {activeGame?.id === 'freefire' && (
                                        <div className="es-detail-row">
                                            <div className={`es-input-with-icon prefilled editable ${errors[`${id}Ign`] ? 'field-error' : ''}`}>
                                                <Gamepad2 size={16} />
                                                <input type="text" name={`${id}Ign`} value={formData[`${id}Ign`] || ''} onChange={handleInputChange} placeholder="In-game Name" />
                                                {errors[`${id}Ign`] && <span className="es-error-badge">{errors[`${id}Ign`]}</span>}
                                            </div>
                                            <div className={`es-input-with-icon prefilled editable ${errors[`${id}FfId`] ? 'field-error' : ''}`}>
                                                <Hash size={16} />
                                                <input type="text" name={`${id}FfId`} value={formData[`${id}FfId`] || ''} onChange={handleInputChange} placeholder="Free Fire UID" />
                                                {errors[`${id}FfId`] && <span className="es-error-badge">{errors[`${id}FfId`]}</span>}
                                            </div>
                                        </div>
                                    )}
                                    {activeGame?.id === 'codm' && (
                                        <div className="es-detail-row">
                                            <div className={`es-input-with-icon prefilled editable ${errors[`${id}Ign`] ? 'field-error' : ''}`}>
                                                <Gamepad2 size={16} />
                                                <input type="text" name={`${id}Ign`} value={formData[`${id}Ign`] || ''} onChange={handleInputChange} placeholder="In-game Name" />
                                                {errors[`${id}Ign`] && <span className="es-error-badge">{errors[`${id}Ign`]}</span>}
                                            </div>
                                            <div className={`es-input-with-icon prefilled editable ${errors[`${id}CodmId`] ? 'field-error' : ''}`}>
                                                <Hash size={16} />
                                                <input type="text" name={`${id}CodmId`} value={formData[`${id}CodmId`] || ''} onChange={handleInputChange} placeholder="CODM Player UID" />
                                                {errors[`${id}CodmId`] && <span className="es-error-badge">{errors[`${id}CodmId`]}</span>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scheduling + Actions */}
                <div className="es-actions-section">
                    <div className="es-scheduling-notice">
                        <AlertTriangle size={24} style={{ flexShrink: 0, color: '#5227ff' }} />
                        <div>
                            <h4>SCHEDULING ACCOUNTABILITY</h4>
                            <p>One User, One Event policy active. You are solely responsible for managing any scheduling overlaps between registered events.</p>
                            <div className="es-checkbox-row">
                                <input 
                                    type="checkbox" 
                                    id="es-acc-check"
                                    checked={accountabilityAccepted}
                                    onChange={(e) => setAccountabilityAccepted(e.target.checked)}
                                />
                                <label htmlFor="es-acc-check">I accept full responsibility for my schedule.</label>
                            </div>
                        </div>
                    </div>

                    {!showPreview ? (
                        <>
                            <button 
                                className="es-deploy-btn"
                                disabled={submitting || (activeGame?.type === 'TEAM' && !formData.teamName)}
                                onClick={handleReview}
                            >
                                REVIEW {activeGame?.type === 'TEAM' ? 'SQUAD' : 'ENTRY'} & PAY
                                <ArrowRight size={20} />
                            </button>
                            <p className="es-disclaimer">Verify your details before proceeding to payment.</p>
                        </>
                    ) : (
                        <div className="es-preview-panel">
                            <div className="es-preview-header">
                                <Shield size={20} />
                                <h4>{activeGame?.type === 'TEAM' ? 'SQUAD' : 'ENTRY'} CONFIRMATION</h4>
                            </div>

                            <div className="es-preview-meta">
                                {activeGame?.type === 'TEAM' && (
                                    <div className="es-preview-meta-item">
                                        <span className="es-preview-label">SQUAD</span>
                                        <span className="es-preview-value">{formData.teamName}</span>
                                    </div>
                                )}
                                <div className="es-preview-meta-item">
                                    <span className="es-preview-label">GAME</span>
                                    <span className="es-preview-value">{activeGame?.label}</span>
                                </div>
                            </div>

                            <div className="es-preview-members">
                                {memberKeys.map((m, idx) => (
                                    <div key={m} className="es-preview-member">
                                        <span className="es-pm-rank">{idx === 0 ? (activeGame?.type === 'TEAM' ? 'CMD' : 'PLAYER') : `P${idx + 1}`}</span>
                                        <div className="es-pm-info">
                                            <span className="es-pm-name">{formData[`${m}Name`]}</span>
                                            {activeGame?.id === 'bgmi' && formData[`${m}Ign`] && (
                                                <span className="es-pm-ign">{formData[`${m}Ign`]} | {formData[`${m}BgmiId`]}</span>
                                            )}
                                            {activeGame?.id === 'freefire' && formData[`${m}Ign`] && (
                                                <span className="es-pm-ign">{formData[`${m}Ign`]} | {formData[`${m}FfId`]}</span>
                                            )}
                                            {activeGame?.id === 'codm' && formData[`${m}Ign`] && (
                                                <span className="es-pm-ign">{formData[`${m}Ign`]} | {formData[`${m}CodmId`]}</span>
                                            )}
                                            {activeGame?.id === 'sf4' && formData[`${m}Ign`] && (
                                                <span className="es-pm-ign">{formData[`${m}Ign`]} | {formData[`${m}Sf4Id`]}</span>
                                            )}
                                            {activeGame?.id === 'amongus' && formData[`${m}Ign`] && (
                                                <span className="es-pm-ign">{formData[`${m}Ign`]}</span>
                                            )}
                                            <span className="es-pm-avr">{formData[`${m}AvrId`]}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="es-payment-summary">
                                <div className="es-summary-row">
                                    <span>Registration Fee</span>
                                    <span>₹{activeGame?.fee.toFixed(2)}</span>
                                </div>
                                <div className="es-summary-row total">
                                    <span>Total Payable</span>
                                    <span>₹{activeGame?.fee.toFixed(2)}</span>
                                </div>
                                <p className="es-payment-note">Secure payment via Easebuzz Gateway</p>
                            </div>

                            <div className="es-preview-actions">
                                <button className="es-edit-btn" onClick={() => setShowPreview(false)}>
                                    <ArrowLeft size={16} /> Edit Details
                                </button>
                                <button className="es-deploy-btn" onClick={handlePayNow} disabled={submitting}>
                                    {submitting ? <Loader2 className="animate-spin" /> : 'PAY NOW'}
                                    {!submitting && <ArrowRight size={20} />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EsportsRegistration;
