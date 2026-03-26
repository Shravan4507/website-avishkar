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
    Users
} from 'lucide-react';
import './RoboKshetra.css';

// Robo-Kshetra Event Configurations
const ROBO_EVENTS = [
    { 
        id: 'line_follower', 
        label: 'LINE FOLLOWER', 
        tagline: 'Precision Tracking Challenge', 
        prize: '₹15,000+', 
        type: 'TEAM', 
        members: 4, 
        mode: 'Offline',
        color: '#d9ff00', 
        image: `${import.meta.env.BASE_URL}assets/robokshetra/line_follower.png` 
    },
    { 
        id: 'maze_solver', 
        label: 'MAZE SOLVER', 
        tagline: 'Autonomous Navigation Arena', 
        prize: '₹15,000+', 
        type: 'TEAM', 
        members: 4, 
        mode: 'Offline',
        color: '#d9ff00', 
        image: `${import.meta.env.BASE_URL}assets/robokshetra/maze_solver.png` 
    },
    { 
        id: 'trailblazer', 
        label: 'ROBO TRAILBLAZER', 
        tagline: 'Obstacle Challenge Course', 
        prize: '₹20,000+', 
        type: 'TEAM', 
        members: 4, 
        mode: 'Offline',
        color: '#d9ff00', 
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
                    <div className="rk-hero">
                        <div className="rk-tag">PREMIER ROBOTICS ARENA</div>
                        <h1>ROBO-<span>KSHETRA</span></h1>
                        <p>Forge, Optimize, Combat. High-octane robotics competition where logic meets heavy metal.</p>
                    </div>

                    <div className="rk-grid-wrapper">
                        <ChromaGrid 
                            items={ROBO_EVENTS.map(e => ({
                                id: e.id,
                                title: e.label,
                                subtitle: e.tagline,
                                image: e.image,
                                prizePool: e.prize,
                                isFlagship: true,
                                borderColor: e.color,
                                location: `${e.members}P | ${e.mode}`
                            } as any))}
                            columns={3}
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
