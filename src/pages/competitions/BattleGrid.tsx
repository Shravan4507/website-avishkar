import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebase';
import { useToast } from '../../components/toast/Toast';
import SEO from '../../components/seo/SEO';
import ChromaGrid, { type ChromaItem } from '../../components/chroma-grid/ChromaGrid';
import { 
    Trophy, 
    Gamepad2, 
    ShieldCheck, 
    Zap,
    Sword,
    FileText,
    Rocket,
    HelpCircle
} from 'lucide-react';
import { useRegistrationGuard } from '../../hooks/useRegistrationGuard';

import './BattleGrid.css';

// Game Configurations
const GAMES = [
    { id: 'bgmi', label: 'BGMI', tagline: 'Grid-Warrior Mobile (4+1 Squad)', prize: '₹50,000', fee: 500, type: 'TEAM', members: 5, platform: 'Mobile', color: '#ff9800', image: `${import.meta.env.BASE_URL}assets/esports/bgmi.png` },
    { id: 'freefire', label: 'FREE FIRE', tagline: 'Squad Battle-Royale', prize: '₹6,000', fee: 250, type: 'TEAM', members: 4, platform: 'Mobile', color: '#e91e63', image: `${import.meta.env.BASE_URL}assets/esports/freefire.png` },
    { id: 'codm', label: 'CALL OF DUTY (MOBILE)', tagline: 'Spec-Ops Combat', prize: '₹16,000', fee: 400, type: 'TEAM', members: 4, platform: 'Mobile', color: '#4caf50', image: `${import.meta.env.BASE_URL}assets/esports/codm.png` },
    { id: 'sf4', label: 'SHADOW-FIGHT 4', tagline: 'Arena 1v1 Combat', prize: '₹8,000', fee: 150, type: 'SOLO', members: 1, platform: 'Mobile', color: '#ffeb3b', image: `${import.meta.env.BASE_URL}assets/esports/sf4.png` },
    { id: 'amongus', label: 'AMONG US', tagline: 'Social Deduction', prize: 'TBD', fee: 0, type: 'SOLO', members: 1, platform: 'Mobile', color: '#00bcd4', image: `${import.meta.env.BASE_URL}assets/esports/amongus.png` },
] as const;

const BattleGrid: React.FC = () => {
    const navigate = useNavigate();
    const [user] = useAuthState(auth);
    const toast = useToast();
    const { isRegistered, eventName } = useRegistrationGuard();

    return (
        <div className="battle-grid-page">
            <SEO 
                title="Battle Grid '26 | E-Sports Arena" 
                description="The ultimate tactical gaming arena at Avishkar '26. Compete in BGMI, Valorant, Free Fire, and more for glory and massive prizes." 
            />

            {/* --- HERO SECTION --- (Derived from ParamX Hero) */}
            <section className="bg-hero">
                <div className="hero-badge">AVISHKAR '26 <br/>E-SPORTS</div>
                <img src="/assets/logos/Battle-Grid.png" alt="Battle Grid '26" className="hero-logo" />

                <p className="hero-subtitle">The Ultimate Tactical Arena Championship</p>
                
                <div className="hero-stats">
                    <div className="stat-item">
                        <Gamepad2 className="stat-icon" />
                        <div className="stat-content">
                            <span className="stat-val">{GAMES.length}</span>
                            <span className="stat-label">Tactical Arenas</span>
                        </div>
                    </div>
                    <div className="stat-item">
                        <Trophy className="stat-icon" />
                        <div className="stat-content">
                            <span className="stat-val">₹80,000</span>
                            <span className="stat-label">Prize Pool</span>
                        </div>
                    </div>
                </div>

                <div className="hero-ctas">
                    {isRegistered ? (
                        <button className="primary-cta disabled" disabled>
                            Registered: {eventName} <ShieldCheck size={18} />
                        </button>
                    ) : (
                        <button className="primary-cta" onClick={() => document.getElementById('arenas')?.scrollIntoView({ behavior: 'smooth' })}>
                            Enter Arena <Rocket size={18} />
                        </button>
                    )}

                    <button className="secondary-cta disabled" onClick={() => toast.info("Rulebook is being finalized and will be available soon.")}>
                        Rulebook (Soon) <FileText size={18} />
                    </button>
                </div>
            </section>

            {/* --- COMBAT PROTOCOL --- (Derived from ParamX Judging Section) */}
            <section className="judging-preview">
                <div className="section-label">Evaluation</div>
                <h2>Combat Protocol</h2>
                <div className="judging-grid">
                    <div className="judging-card">
                        <div className="j-icon"><Sword size={20} /></div>
                        <h3>Tactical Domination</h3>
                        <p>Objective-based gameplay focused on strategy and team coordination.</p>
                        <span className="weightage">CORE SKILL</span>
                    </div>
                    <div className="judging-card">
                        <div className="j-icon"><Zap size={20} /></div>
                        <h3>Precision Ops</h3>
                        <p>Zero-latency environment with professional tournament monitoring.</p>
                        <span className="weightage">STABLE GRID</span>
                    </div>
                    <div className="judging-card">
                        <div className="j-icon"><ShieldCheck size={20} /></div>
                        <h3>Fair Play</h3>
                        <p>Anti-cheat protocols and live refereeing to ensure an even playing field.</p>
                        <span className="weightage">VERIFIED</span>
                    </div>
                    <div className="judging-card">
                        <div className="j-icon"><HelpCircle size={20} /></div>
                        <h3>Integrity</h3>
                        <p>Strict adherence to tournament guidelines and sportsmanship.</p>
                        <span className="weightage">MANDATORY</span>
                    </div>
                </div>
            </section>

            {/* --- PORTAL / CHROMAGRID SECTION --- (Derived from ParamX Portal Header) */}
            <div className="portal-header" id="arenas">
                <div className="section-label">Deployment</div>
                <h2>Select Your Battlefield</h2>
                <p>Browse through the official combat portals of Battle Grid '26. Each portal has unique deployment requirements and massive bounties.</p>
            </div>

            <div className="arenas-container">
                <div className="flagship-selection-wrapper">
                    <ChromaGrid 
                        items={GAMES.map(g => ({
                            id: g.id,
                            title: g.label,
                            subtitle: g.tagline,
                            image: g.image,
                            entryFee: g.fee,
                            isFlagship: true,
                            borderColor: g.color,
                            location: g.platform
                        } as ChromaItem))}
                        columns={3}
                        isRegistered={isRegistered}
                        registeredEventName={eventName}
                        onItemClick={(item: ChromaItem) => {
                                if (!user) {
                                toast.error("Authentication required to enter arena.");
                                navigate('/login');
                                return;
                            }
                            if (isRegistered) {
                                toast.warning(`Locked: Already registered for ${eventName}.`);
                                return;
                            }
                            navigate(`/esports-register?game=${item.id}`);
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default BattleGrid;
