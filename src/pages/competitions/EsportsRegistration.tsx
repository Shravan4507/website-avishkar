import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { doc, collection, serverTimestamp, getDoc, runTransaction, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';
import SEO from '../../components/seo/SEO';
import { useToast } from '../../components/toast/Toast';
import ChromaGrid from '../../components/chroma-grid/ChromaGrid';
import { 
    User, 
    ArrowRight, 
    ArrowLeft, 
    Loader2, 
    Smartphone, 
    Monitor, 
    Hash, 
    Trophy,
    CheckCircle2
} from 'lucide-react';
import './EsportsRegistration.css';

// Game Configurations
const GAMES = [
    { id: 'bgmi', label: 'BGMI', tagline: 'Grid-Warrior Mobile', prize: '₹10,000+', type: 'TEAM', members: 4, platform: 'Mobile', color: '#ff9800', image: `${import.meta.env.BASE_URL}assets/esports/bgmi.png` },
    { id: 'freefire', label: 'FREE FIRE', tagline: 'Squad Battle-Royale', prize: '₹8,000+', type: 'TEAM', members: 4, platform: 'Mobile', color: '#e91e63', image: `${import.meta.env.BASE_URL}assets/esports/freefire.png` },
    { id: 'codm', label: 'CALL OF DUTY (MOBILE)', tagline: 'Spec-Ops Combat', prize: '₹10,000+', type: 'TEAM', members: 4, platform: 'Mobile', color: '#4caf50', image: `${import.meta.env.BASE_URL}assets/esports/codm.png` },
    { id: 'valorant', label: 'VALORANT', tagline: 'Tactical PC Duel', prize: '₹20,000+', type: 'TEAM', members: 5, platform: 'PC', color: '#ff4655', image: `${import.meta.env.BASE_URL}assets/esports/valorant.png` },
    { id: 'sf4_solo', label: 'SHADOW-FIGHT 4 (SOLO)', tagline: 'Arena 1v1 Combat', prize: '₹2,500+', type: 'SOLO', members: 1, platform: 'Mobile', color: '#ffeb3b', image: `${import.meta.env.BASE_URL}assets/esports/sf4.png` },
    { id: 'sf4_duet', label: 'SHADOW-FIGHT 4 (DUET)', tagline: 'Arena 2v2 Duel', prize: '₹3,500+', type: 'TEAM', members: 2, platform: 'Mobile', color: '#ffeb3b', image: `${import.meta.env.BASE_URL}assets/esports/sf4.png` },
    { id: 'amongus', label: 'AMONG US', tagline: 'Social Deduction', prize: '₹2,000+', type: 'SOLO', members: 1, platform: 'Mobile', color: '#00bcd4', image: `${import.meta.env.BASE_URL}assets/esports/amongus.png` },
] as const;

type GameId = typeof GAMES[number]['id'];

// Hex to RGB helper for CSS variables
const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
};

const EsportsRegistration: React.FC = () => {
    const [user] = useAuthState(auth);
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedGame, setSelectedGame] = useState<GameId | ''>('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        teamName: '',
        leaderInGameName: '',
        leaderInGameId: '',
        leaderPhone: '',
        leaderCollege: '',
        members: [] as { name: string, ign: string, igid: string, phone: string }[]
    });

    const activeGame = GAMES.find(g => g.id === selectedGame);

    useEffect(() => {
        if (!user) {
            navigate('/login?redirect=/esports-register');
            return;
        }

        const loadUserMetadata = async () => {
            try {
                const userSnap = await getDoc(doc(db, "user", user.uid));
                if (userSnap.exists()) {
                    setFormData(prev => ({ 
                        ...prev, 
                        leaderCollege: userSnap.data().college || '' 
                    }));
                }
            } catch (err) {
                console.error("Error loading user data:", err);
            } finally {
                setLoading(false);
            }
        };
        loadUserMetadata();
    }, [user, navigate]);

    useEffect(() => {
        // Reset members when game changes
        if (activeGame) {
            const memberCount = activeGame.type === 'TEAM' ? activeGame.members - 1 : 0;
            setFormData(prev => ({
                ...prev,
                members: Array.from({ length: memberCount }, () => ({ name: '', ign: '', igid: '', phone: '' }))
            }));
            setErrors({});
        }
    }, [selectedGame, activeGame]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleMemberChange = (index: number, field: string, value: string) => {
        setFormData(prev => {
            const newMembers = [...prev.members];
            newMembers[index] = { ...newMembers[index], [field]: value };
            return { ...prev, members: newMembers };
        });
        
        const errorKey = `member${index}_${field}`;
        if (errors[errorKey]) {
            setErrors(prev => {
                const newErrs = { ...prev };
                delete newErrs[errorKey];
                return newErrs;
            });
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        const phoneRegex = /^\d{10}$/;

        if (!selectedGame) newErrors.game = "Please select a game";
        
        if (activeGame?.type === 'TEAM') {
            if (!formData.teamName || formData.teamName.length < 3) newErrors.teamName = "Min 3 chars";
        }

        if (!formData.leaderInGameName) newErrors.leaderInGameName = "Required";
        if (!formData.leaderInGameId) newErrors.leaderInGameId = "Required";
        if (!formData.leaderPhone || !phoneRegex.test(formData.leaderPhone)) newErrors.leaderPhone = "10 digit WA";
        
        if (activeGame?.type === 'TEAM') {
            formData.members.forEach((m, i) => {
                if (!m.name) newErrors[`member${i}_name`] = "Required";
                if (!m.ign) newErrors[`member${i}_ign`] = "Required";
                if (!m.igid) newErrors[`member${i}_igid`] = "Required";
                if (!m.phone || !phoneRegex.test(m.phone)) newErrors[`member${i}_phone`] = "10 digit WA";
            });
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm() || !user || !activeGame) return;

        setSubmitting(true);
        try {
            await runTransaction(db, async (transaction) => {
                // Check if already registered for this specific game
                const q = query(
                    collection(db, "registrations"), 
                    where("userId", "==", user.uid),
                    where("competitionId", "==", `battle-grid-${activeGame.id}`)
                );
                const existing = await getDocs(q);
                if (!existing.empty) {
                    throw new Error(`You have already registered for ${activeGame.label}`);
                }

                const regRef = doc(collection(db, "registrations"));
                const registrationData = {
                    userId: user.uid,
                    userName: user.displayName,
                    userEmail: user.email,
                    competitionId: `battle-grid-${activeGame.id}`,
                    competitionName: `Battle-Grid '26: ${activeGame.label}`,
                    teamName: activeGame.type === 'TEAM' ? formData.teamName : 'SOLO',
                    game: activeGame.id,
                    type: activeGame.type,
                    platform: activeGame.platform,
                    college: formData.leaderCollege,
                    leader: {
                        name: user.displayName,
                        email: user.email,
                        ign: formData.leaderInGameName,
                        igid: formData.leaderInGameId,
                        phone: formData.leaderPhone
                    },
                    members: formData.members,
                    registeredAt: serverTimestamp(),
                    status: 'PENDING'
                };

                transaction.set(regRef, registrationData);
            });

            setStep(3); // Success Step
            toast("Victory! Registration Successful.", "success");
        } catch (err: any) {
            toast(err.message || "Encountered a technical glitch.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="esports-loader">
            <Loader2 className="spinner" />
            <p>Gathering Combat Intel...</p>
        </div>
    );

    if (step === 3) return (
        <div className="esports-success-container">
            <SEO title="Registration Confirmed | Battle Grid '26" description="Your spot in the arena is locked." />
            <div className="success-content glass-card">
                <CheckCircle2 color="#4caf50" size={80} />
                <h1>Registration Confirmed!</h1>
                <p>Welcome to <strong>Battle-Grid '26</strong>: <span>{activeGame?.label}</span></p>
                <div className="success-info">
                    <p>Details have been logged into the grid. Join our official Discord for tournament brackets and timing schedules.</p>
                </div>
                <button className="esports-btn primary" onClick={() => navigate('/user/dashboard')}>
                    View Dashboard <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );

    return (
        <div className="esports-reg-page">
            <SEO 
                title={`${activeGame?.label || 'E-Sports'} Registration | Battle-Grid '26`} 
                description="Join the ultimate tactical arena at Avishkar '26. Battle-Grid Esports registration is now live." 
            />
            
            <div className="esports-header">
                <div className="title-wrapper">
                    <Trophy className="title-icon" />
                    <h1>Battle-Grid '26</h1>
                </div>
                <p>Select your battlefield and claim your spot in the grid.</p>
            </div>

            <div className="esports-layout">
                {/* Step 0: Game Selection Cards via ChromaGrid */}
                {!selectedGame && (
                    <div className="flagship-selection-wrapper animate-in">
                        <ChromaGrid 
                            items={GAMES.map(g => ({
                                id: g.id,
                                title: g.label,
                                subtitle: g.tagline,
                                image: g.image,
                                prizePool: g.prize,
                                isFlagship: true,
                                borderColor: g.color,
                                location: g.platform
                            } as any))}
                            columns={3}
                            onItemClick={(item: any) => setSelectedGame(item.id as GameId)}
                        />
                    </div>
                )}

                {selectedGame && step !== 3 && (
                    <div 
                        className="form-wrapper-enhanced animate-in"
                        style={{ 
                            '--game-color': activeGame?.color,
                            '--game-color-rgb': activeGame ? hexToRgb(activeGame.color) : '82, 39, 255'
                        } as React.CSSProperties}
                    >
                        <div className="form-header-premium" style={{ borderLeftColor: activeGame?.color }}>
                            <div className="active-game-meta">
                                <button className="back-to-games" onClick={() => setSelectedGame('')}>
                                    <ArrowLeft size={16} /> Re-select Arena
                                </button>
                                <h2>{activeGame?.label} <span>Registration</span></h2>
                            </div>
                            <div className="platform-pill">
                                {activeGame?.platform === 'PC' ? <Monitor size={14} /> : <Smartphone size={14} />}
                                <span>{activeGame?.platform} - {activeGame?.type === 'TEAM' ? 'Team Entry' : 'Solo Entry'}</span>
                            </div>
                        </div>

                        <div className="esports-steps-h">
                            <div className={`h-step ${step >= 1 ? 'active' : ''}`}>
                                <div className="h-step-num">1</div>
                                <span>{activeGame?.type === 'TEAM' ? 'Squad' : 'Details'}</span>
                            </div>
                            <div className="h-step-line"></div>
                            <div className={`h-step ${step >= 2 ? 'active' : ''}`}>
                                <div className="h-step-num">2</div>
                                <span>Review</span>
                            </div>
                        </div>

                        {step === 1 ? (
                            <div className="cyber-form animate-in">
                                <div className="grid-form">
                                    {activeGame?.type === 'TEAM' && (
                                        <div className="input-group full">
                                            <label>Squad Name</label>
                                            <div className="input-cyber-wrapper">
                                                <Trophy className="cyber-icon" size={18} />
                                                <input 
                                                    type="text" 
                                                    name="teamName" 
                                                    value={formData.teamName}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter Team Name"
                                                />
                                            </div>
                                            {errors.teamName && <span className="error-text-cyber">{errors.teamName}</span>}
                                        </div>
                                    )}

                                    <div className="section-title-cyber">
                                        <span>{activeGame?.type === 'TEAM' ? 'Leader Details' : 'Player Information'}</span>
                                    </div>

                                    <div className="input-group">
                                        <label>In-Game Name (IGN)</label>
                                        <div className="input-cyber-wrapper">
                                            <User className="cyber-icon" size={18} />
                                            <input 
                                                type="text" 
                                                name="leaderInGameName" 
                                                value={formData.leaderInGameName}
                                                onChange={handleInputChange}
                                                placeholder="Game display name"
                                            />
                                        </div>
                                        {errors.leaderInGameName && <span className="error-text-cyber">Required</span>}
                                    </div>

                                    <div className="input-group">
                                        <label>Character ID</label>
                                        <div className="input-cyber-wrapper">
                                            <Hash className="cyber-icon" size={18} />
                                            <input 
                                                type="text" 
                                                name="leaderInGameId" 
                                                value={formData.leaderInGameId}
                                                onChange={handleInputChange}
                                                placeholder="Numeric ID"
                                            />
                                        </div>
                                        {errors.leaderInGameId && <span className="error-text-cyber">Required</span>}
                                    </div>

                                    <div className="input-group full">
                                        <label>WhatsApp Number</label>
                                        <div className="input-cyber-wrapper">
                                            <Smartphone className="cyber-icon" size={18} />
                                            <input 
                                                type="tel" 
                                                name="leaderPhone" 
                                                value={formData.leaderPhone}
                                                onChange={handleInputChange}
                                                placeholder="Official WA Number"
                                            />
                                        </div>
                                        {errors.leaderPhone && <span className="error-text-cyber">{errors.leaderPhone}</span>}
                                    </div>

                                    {activeGame?.type === 'TEAM' && formData.members.map((member, i) => (
                                        <div key={i} className="member-cyber-card animate-in">
                                            <div className="member-label">Squad Combatant {i + 2}</div>
                                            <div className="member-grid">
                                                <div className="m-input">
                                                    <input 
                                                        placeholder="Full Name"
                                                        value={member.name}
                                                        onChange={(e) => handleMemberChange(i, 'name', e.target.value)}
                                                    />
                                                </div>
                                                <div className="m-input">
                                                    <input 
                                                        placeholder="IGN"
                                                        value={member.ign}
                                                        onChange={(e) => handleMemberChange(i, 'ign', e.target.value)}
                                                    />
                                                </div>
                                                <div className="m-input">
                                                    <input 
                                                        placeholder="Game ID"
                                                        value={member.igid}
                                                        onChange={(e) => handleMemberChange(i, 'igid', e.target.value)}
                                                    />
                                                </div>
                                                <div className="m-input">
                                                    <input 
                                                        placeholder="WhatsApp"
                                                        value={member.phone}
                                                        onChange={(e) => handleMemberChange(i, 'phone', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="form-actions-cyber">
                                    <button className="cyber-btn primary" onClick={() => validateForm() && setStep(2)}>
                                        Proceed to Review <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="review-cyber animate-in">
                                <div className="review-summary-glass">
                                    <div className="r-summary-title">Battle Summary</div>
                                    <div className="r-grid">
                                        <div className="r-item">
                                            <label>Arena</label>
                                            <p>{activeGame?.label}</p>
                                        </div>
                                        {activeGame?.type === 'TEAM' && (
                                            <div className="r-item">
                                                <label>Squad Name</label>
                                                <p>{formData.teamName}</p>
                                            </div>
                                        )}
                                        <div className="r-item">
                                            <label>Leader</label>
                                            <p>{formData.leaderInGameName} ({formData.leaderInGameId})</p>
                                        </div>
                                        <div className="r-item">
                                            <label>Members</label>
                                            <p>{activeGame?.members} Total</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="disclaimer-cyber">
                                    <p>By confirming, you agree to the tournament rules. Any form of hacking or unsportsmanlike behavior will result in an immediate permanent ban from all Avishkar '26 events.</p>
                                </div>

                                <div className="form-actions-cyber">
                                    <button className="cyber-btn secondary" onClick={() => setStep(1)} disabled={submitting}>
                                        <ArrowLeft size={18} /> Modify
                                    </button>
                                    <button className="cyber-btn primary" onClick={handleSubmit} disabled={submitting}>
                                        {submitting ? <Loader2 className="spinner" /> : 'Confirm Combat Entry'} 
                                        {!submitting && <ArrowRight size={18} />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="success-cyber animate-in">
                        <div className="success-icon-wrapper">
                            <CheckCircle2 size={80} className="s-icon" />
                        </div>
                        <h2>Deployment Successful!</h2>
                        <p>Your squad/entry has been successfully deployed to the <strong>{activeGame?.label}</strong> arena. Prepare for battle!</p>
                        <div className="success-actions">
                            <button className="cyber-btn primary" onClick={() => navigate('/user-dashboard')}>
                                View My Arena Pass
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EsportsRegistration;
