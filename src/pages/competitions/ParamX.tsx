import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebase/firebase';
import { useToast } from '../../components/toast/Toast';

import SEO from '../../components/seo/SEO';
import GlassSelect from '../../components/dropdown/GlassSelect';
import { type ProblemStatement } from '../../utils/storageUtils';
import problemsData from '../../data/problems.json';
import { 
    Search, Filter, ArrowRight, Info, Loader2,
    FileText, Download, Target, Trophy, HelpCircle,
    Users, Rocket, ArrowLeft, ShieldAlert
} from 'lucide-react';
import { useRegistrationGuard } from '../../hooks/useRegistrationGuard';


import { motion } from 'framer-motion';

import './ParamX.css';

const ParamX: React.FC = () => {
    const navigate = useNavigate();
    const [user] = useAuthState(auth);
    const toast = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const [problems, setProblems] = useState<ProblemStatement[]>([]);
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDomain, setSelectedDomain] = useState('All');
    
    const { isRegistered, eventName } = useRegistrationGuard();

    
    const problemId = searchParams.get('problem');
    const selectedPS = problems.find(p => p.id === problemId);

    const MAX_SLOTS = 10;

    useEffect(() => {
        setProblems(problemsData as ProblemStatement[]);
        setLoading(false);

        const unsubscribe = onSnapshot(collection(db, "ps_metadata"), (snapshot) => {
            const newCounts: Record<string, number> = {};
            snapshot.forEach(doc => {
                newCounts[doc.id] = doc.data().count || 0;
            });
            setCounts(newCounts);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        // Scroll to top when problem changes
        window.scrollTo(0, 0);
    }, [problemId]);

    const filteredProblems = problems.filter(ps => {
        const matchesSearch = ps.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              ps.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDomain = selectedDomain === 'All' || ps.domain === selectedDomain;
        return matchesSearch && matchesDomain;
    });

    const domains = ['All', ...new Set(problems.map(p => p.domain))];

    if (loading) return <div className="loader-container"><Loader2 className="spinner" /></div>;

    // --- DETAIL VIEW ---
    if (selectedPS) {
        return (
            <div className="paramx-page detailed-view">
                <SEO 
                    title={`${selectedPS.id} | ${selectedPS.title}`} 
                    description={`Detailed view of problem statement ${selectedPS.id} for Param-X '26 hackathon.`}
                />

                
                <div className="back-nav">
                    <button className="back-btn" onClick={() => setSearchParams({})}>
                        <ArrowLeft size={20} /> Back to Problems
                    </button>
                </div>

                <motion.div 
                    className="detail-container"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="detail-header">
                        <div className="header-top">
                            <span className="ps-id-tag">{selectedPS.id}</span>
                            <span className="domain-pill">{selectedPS.domain}</span>
                        </div>
                        <h1 className="detail-title">{selectedPS.title}</h1>
                    </div>

                    <div className="detail-grid">
                        <div className="main-content">
                            <section className="detail-section">
                                <h3><Info size={22} /> Problem Objective</h3>
                                <p>{selectedPS.objective}</p>
                            </section>

                            <section className="detail-section">
                                <h3><FileText size={22} /> Required Artifacts</h3>
                                <div className="artifact-grid">
                                    <div className="artifact-card">
                                        <h4>Ideation Phase</h4>
                                        <p>Concept PPT and Architecture Diagram explaining the technological stack and core algorithm.</p>
                                    </div>
                                    <div className="artifact-card">
                                        <h4>Implementation</h4>
                                        <p>Source code repositories, database schemas, and external API documentation.</p>
                                    </div>
                                    <div className="artifact-card">
                                        <h4>Submission</h4>
                                        <p>A functional MVP or prototype along with a detailed project report.</p>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="sidebar">
                            <div className="availability-card">
                                <h3>Availability</h3>
                                <div className="slot-counter-vertical">
                                    <div className="slot-bar-v">
                                        <div 
                                            className="slot-fill-v" 
                                            style={{ height: `${((counts[selectedPS.id] || 0) / MAX_SLOTS) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="slot-info">
                                        <span className="slots-taken">{(counts[selectedPS.id] || 0)}</span>
                                        <span className="slots-total">/ {MAX_SLOTS} Teams</span>
                                    </div>
                                </div>
                                <p className="slot-hint">Hurry up! Slots are filling fast for this challenge.</p>
                            </div>

                            <div className="action-card">
                                <button 
                                    className={`main-register-btn ${((counts[selectedPS.id] || 0) >= MAX_SLOTS) || isRegistered ? 'disabled' : ''}`}
                                    disabled={(counts[selectedPS.id] || 0) >= MAX_SLOTS || isRegistered}
                                    onClick={() => {
                                        if (!user) {
                                            toast.error("Authentication required to register.");
                                            navigate('/login');
                                            return;
                                        }
                                        navigate(`/hackathon-register?psId=${selectedPS.id}`);
                                    }}
                                >
                                    {(counts[selectedPS.id] || 0) >= MAX_SLOTS ? 'Registration Closed' : (isRegistered ? 'Already Registered' : 'Register for this PS')}
                                </button>

                                <button 
                                    className="download-sample-btn disabled"
                                    onClick={() => toast.info("Sample PPT will be available soon.")}
                                >
                                    <Download size={18} /> Sample PPT (Soon)
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // --- LIST VIEW ---
    return (
        <div className="paramx-page">
            <SEO 
                title="Param-X '26 | Problem Statements" 
                description="Explore technical challenges for Param-X '26 hackathon. Solve real-world issues across domains like AI, Robotics, and IT."
            />
            
            {/* --- HERO SECTION --- */}
            <section className="paramx-hero">
                <div className="hero-badge">Avishkar '26 <br/>Flagships</div>
                <img src="/assets/logos/Param-X-White.png" alt="Param-X '26" className="hero-logo" />

                {/* <h1>Param-X '26</h1> */}

                <p className="hero-subtitle">The Ultimate 10-Hour Innovation Marathon</p>
                
                <div className="hero-stats">
                    <div className="stat-item">
                        <Target className="stat-icon" />
                        <div className="stat-content">
                            <span className="stat-val">{problems.length}</span>
                            <span className="stat-label">Problem Statements</span>
                        </div>
                    </div>
                    <div className="stat-item">
                        <Trophy className="stat-icon" />
                        <div className="stat-content">
                            <span className="stat-val">₹1,00,000+</span>
                            <span className="stat-label">Prize Pool</span>
                        </div>
                    </div>
                </div>


                <div className="hero-ctas">
                    {isRegistered ? (
                        <button className="primary-cta disabled" disabled title={`You are already registered for ${eventName}`}>
                            Registered: {eventName} <ShieldAlert size={18} />
                        </button>
                    ) : (
                        <button className="primary-cta" onClick={() => document.getElementById('problems')?.scrollIntoView({ behavior: 'smooth' })}>
                            Register Now <Rocket size={18} />
                        </button>
                    )}

                    <button className="secondary-cta disabled" onClick={() => toast.info("Rulebook is being finalized and will be available soon.")}>
                        Rulebook (Soon) <FileText size={18} />
                    </button>
                    <button className="glass-cta disabled" onClick={() => toast.info("Sample PPT will be available soon.")}>
                        Sample PPT (Soon) <Download size={18} />
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
                        <p>Novelty of the idea and creative use of technology.</p>
                        <span className="weightage">30% Weight</span>
                    </div>
                    <div className="judging-card">
                        <div className="j-icon"><Target size={20} /></div>
                        <h3>Technical Complexity</h3>
                        <p>Architecture, efficiency, and robustness of the solution.</p>
                        <span className="weightage">40% Weight</span>
                    </div>
                    <div className="judging-card">
                        <div className="j-icon"><Users size={20} /></div>
                        <h3>User Experience</h3>
                        <p>Ease of use, accessibility, and visual aesthetics.</p>
                        <span className="weightage">20% Weight</span>
                    </div>
                    <div className="judging-card">
                        <div className="j-icon"><HelpCircle size={20} /></div>
                        <h3>Presentation</h3>
                        <p>Communication skill and clarity of thoughts.</p>
                        <span className="weightage">10% Weight</span>
                    </div>
                </div>
            </section>

            {/* --- PROBLEM PORTAL SECTION --- */}
            <div className="portal-header" id="problems">
                <div className="section-label">Portal</div>
                <h2>Problem Statements</h2>
                <p>Browse through the official problem statements of Param-X '26. Each problem statement has limited slots for teams.</p>
            </div>

            <div className="paramx-controls">
                <div className="search-box">
                    <Search size={20} />
                    <input 
                        type="text" 
                        placeholder="Search by ID or Title..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-box">
                    <Filter size={18} />
                    <GlassSelect 
                        options={domains.map(d => ({ value: d, label: d === 'All' ? 'All Domains' : d }))}
                        value={selectedDomain}
                        onChange={setSelectedDomain}
                        placeholder="Filter by Domain"
                    />
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="table-container desktop-only">
                <table className="paramx-table">
                    <thead>
                        <tr>
                            <th>S.No.</th>
                            <th>PS ID</th>
                            <th>Problem Statement Title</th>
                            <th>Domain</th>
                            <th>Slots Used</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProblems.map((ps, idx) => {
                            const currentCount = counts[ps.id] || 0;
                            const isFull = currentCount >= MAX_SLOTS;

                            return (
                                <tr key={ps.id} className="ps-row" onClick={() => setSearchParams({ problem: ps.id })}>
                                    <td className="center">{idx + 1}</td>
                                    <td className="ps-id">{ps.id}</td>
                                    <td className="ps-title-cell">
                                        <div className="ps-title">{ps.title}</div>
                                        <div className="ps-objective-preview">{ps.objective.slice(0, 100)}...</div>
                                    </td>
                                    <td className="center">
                                        <span className="domain-pill">{ps.domain}</span>
                                    </td>
                                    <td className="center">
                                        <div className="slot-counter">
                                            <div className="slot-bar">
                                                <div 
                                                    className="slot-fill" 
                                                    style={{ width: `${(currentCount / MAX_SLOTS) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="slot-text">{currentCount} / {MAX_SLOTS}</span>
                                        </div>
                                    </td>
                                    <td className="center">
                                        <button 
                                            className={`register-cta ${isFull || isRegistered ? 'disabled' : ''}`}
                                            disabled={isFull || isRegistered}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!user) {
                                                    toast.error("Authentication required to register.");
                                                    navigate('/login');
                                                    return;
                                                }
                                                navigate(`/hackathon-register?psId=${ps.id}`);
                                            }}
                                        >
                                            {isFull ? 'Full' : (isRegistered ? 'Locked' : 'Register')} <ArrowRight size={16} />
                                        </button>

                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="mobile-only ps-card-list">
                {filteredProblems.map((ps) => {
                    const currentCount = counts[ps.id] || 0;
                    const isFull = currentCount >= MAX_SLOTS;

                    return (
                        <div key={ps.id} className="ps-mobile-card" onClick={() => setSearchParams({ problem: ps.id })}>
                            <div className="ps-card-header">
                                <span className="ps-id">{ps.id}</span>
                                <span className="domain-pill">{ps.domain}</span>
                            </div>
                            <h3 className="ps-title">{ps.title}</h3>
                            <p className="ps-objective-preview">{ps.objective.slice(0, 120)}...</p>
                            
                            <div className="ps-card-footer">
                                <div className="slot-counter">
                                    <div className="slot-bar">
                                        <div 
                                            className="slot-fill" 
                                            style={{ width: `${(currentCount / MAX_SLOTS) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="slot-text">{currentCount} / {MAX_SLOTS} slots used</span>
                                </div>
                                <button 
                                    className={`register-cta ${isFull || isRegistered ? 'disabled' : ''}`}
                                    disabled={isFull || isRegistered}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!user) {
                                            toast.error("Authentication required to register.");
                                            navigate('/login');
                                            return;
                                        }
                                        navigate(`/hackathon-register?psId=${ps.id}`);
                                    }}
                                >
                                    {isFull ? 'Full' : (isRegistered ? 'Locked' : 'Register')} <ArrowRight size={16} />
                                </button>

                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredProblems.length === 0 && (
                <div className="empty-state">
                    <Info size={48} />
                    <h3>No problem statements found matching your criteria.</h3>
                </div>
            )}
        </div>
    );
};

export default ParamX;
