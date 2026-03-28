import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { doc, collection, serverTimestamp, runTransaction } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';
import SEO from '../../components/seo/SEO';
import { useToast } from '../../components/toast/Toast';
import ChromaGrid from '../../components/chroma-grid/ChromaGrid';
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
    HelpCircle
} from 'lucide-react';
import { useRegistrationGuard } from '../../hooks/useRegistrationGuard';
import './RoboKshetra.css';


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

    const { isRegistered, eventName: registeredEventName } = useRegistrationGuard();


    const activeEvent = ROBO_EVENTS.find(e => e.id === selectedEvent);

    // Form states
    const [formData, setFormData] = useState({
        teamName: '',
        leaderName: user?.displayName || '',
        leaderAavishkarId: '',
        leaderPhone: '',
        members: Array(3).fill({ name: '', id: '' }) 
    });

    const handleSubmit = async () => {
        if (!user || !activeEvent) return;
        
        if (isRegistered && registeredEventName !== activeEvent.label) {
            toast.error(`Access Denied: Already registered for ${registeredEventName}`);
            navigate('/user/dashboard');
            return;
        }

        if (!accountabilityAccepted) {
            toast.error("Please acknowledge scheduling accountability.");
            return;
        }

        // Simple validation
        if (!formData.teamName || !formData.leaderAavishkarId || !formData.leaderPhone) {
            toast.error("Please fill all leader details before deployment.");
            return;
        }


        setLoading(true);

        try {
            const regId = `RK26-${activeEvent.id.toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            
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
                    allAvrIds: [
                        formData.leaderAavishkarId,
                        ...formData.members.map(m => m.id)
                    ].filter(id => !!id),
                    timestamp: serverTimestamp(),
                    status: 'confirmed',
                    paymentStatus: 'pending',
                });
            });

            setTicketId(regId);
            setSuccess(true);
            toast.success("Deployment Confirmed! Your machine is ready.");
        } catch (error) {
            console.error("Registration failed:", error);
            toast.error("Communication Failure. Retry link established.");
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
                        <h1 className="hero-title">ROBO-<span>KSHETRA</span></h1>
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
                            <button className="secondary-cta" onClick={() => navigate('/robo-kshetra/rules')}>
                                Rulebook <FileText size={18} />
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
                            } as any))}
                            radius={400}
                            damping={0.5}
                            fadeOut={0.8}
                            columns={3}
                            isRegistered={isRegistered}
                            registeredEventName={registeredEventName}
                            onItemClick={(item: any) => setSelectedEvent(item.id as EventId)}
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
                            <div className="rk-section">
                                <div className="rk-section-header">
                                    <CircuitBoard className="rk-section-icon" />
                                    <h3>LEAD_METADATA</h3>
                                </div>
                                
                                <div className="rk-input-grid">
                                    <div className="rk-input-group full">
                                        <label>TEAM_IDENTIFIER</label>
                                        <input 
                                            placeholder="Enter unique team name"
                                            value={formData.teamName}
                                            onChange={e => setFormData({...formData, teamName: e.target.value})}
                                        />
                                    </div>
                                    <div className="rk-input-group">
                                        <label>COMMANDER_NAME</label>
                                        <input 
                                            value={formData.leaderName}
                                            onChange={e => setFormData({...formData, leaderName: e.target.value})}
                                        />
                                    </div>
                                    <div className="rk-input-group">
                                        <label>AAVISHKAR_ID</label>
                                        <input 
                                            placeholder="AVR-10XXXX"
                                            value={formData.leaderAavishkarId}
                                            onChange={e => setFormData({...formData, leaderAavishkarId: e.target.value})}
                                        />
                                    </div>
                                    <div className="rk-input-group full">
                                        <label>COMM_LINK (PHONE)</label>
                                        <input 
                                            placeholder="+91 XXXXX XXXXX"
                                            value={formData.leaderPhone}
                                            onChange={e => setFormData({...formData, leaderPhone: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="rk-section">
                                <div className="rk-section-header">
                                    <Cpu className="rk-section-icon" />
                                    <h3>SQUAD_MEMBER_REGISTRY</h3>
                                </div>
                                
                                <div className="rk-members-list">
                                    {formData.members.map((member, index) => (
                                        <div key={index} className="rk-member-row">
                                            <div className="rk-member-rank">P{index + 2}</div>
                                            <div className="rk-member-inputs">
                                                <input 
                                                    placeholder="Member Name"
                                                    value={member.name}
                                                    onChange={e => {
                                                        const newMembers = [...formData.members];
                                                        newMembers[index] = { ...member, name: e.target.value };
                                                        setFormData({ ...formData, members: newMembers });
                                                    }}
                                                />
                                                <input 
                                                    placeholder="AVR-ID"
                                                    value={member.id}
                                                    onChange={e => {
                                                        const newMembers = [...formData.members];
                                                        newMembers[index] = { ...member, id: e.target.value };
                                                        setFormData({ ...formData, members: newMembers });
                                                    }}
                                                />
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

                                <button 
                                    className="rk-deploy-btn"
                                    disabled={loading || !formData.teamName}
                                    onClick={handleSubmit}
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : 'INITIATE DEPLOYMENT PROTOCOL'}
                                    <ArrowRight size={20} />
                                </button>
                                <p className="rk-disclaimer">By deploying, you agree to the official RK'26 tournament regulations.</p>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoboKshetra;
