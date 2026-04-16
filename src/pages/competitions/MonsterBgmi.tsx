import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Trophy, Crosshair, Users, Map, Download, ChevronRight } from 'lucide-react';
import SEO from '../../components/seo/SEO';
import { motion } from 'framer-motion';
import { useToast } from '../../components/toast/Toast';

import './MonsterBgmi.css';

const MonsterBgmi: React.FC = () => {
    const navigate = useNavigate();
    const toast = useToast();

    const handleRulebookClick = () => {
        toast.info("Rulebook is currently being updated. Coming Soon!");
    };

    return (
        <div className="monster-bgmi-page">
            <SEO 
                title="BGMI Championship | Powered by Monster Energy" 
                description="Join the ultimate BGMI tactical battle at Avishkar '26, officially sponsored by Monster Energy. Free Entry, Assemble your squad!" 
            />

            <div className="monster-hero-section">
                {/* Visual Background Elements */}
                <div className="monster-claw-marks-bg"></div>
                <div className="monster-glow-orb"></div>

                <div className="monster-content-wrapper">
                    {/* Sponsor Banner Component */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="sponsor-tag"
                    >
                        <span className="powered-by">POWERED BY</span>
                        <div className="sponsor-logo-placeholder">
                            <img src={`${import.meta.env.BASE_URL}assets/sponsors/monsterenergy-logo.png`} alt="Monster Energy" className="sponsor-logo" onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }} />
                            <span className="logo-text-fallback hidden">MONSTER ENERGY</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="monster-hero-image-container"
                    >
                        <img 
                            src={`${import.meta.env.BASE_URL}assets/esports/bgmi.webp`} 
                            alt="BGMI Battlegrounds" 
                            className="monster-hero-image" 
                        />
                    </motion.div>

                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="monster-title"
                    >
                        BATTLEGROUNDS
                        <span className="monster-accent"> MOBILE INDIA</span>
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="monster-subtitle"
                    >
                        Unleash the Beast. Assemble your 4+1 squad for the ultimate tactical combat in the Battle Grid arena.
                    </motion.p>

                    {/* Stats Grid */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="monster-stats"
                    >

                        <div className="m-stat-box">
                            <Users className="m-icon" />
                            <div className="m-stat-data">
                                <h3>5 Players</h3>
                                <p>4 + 1 Squad</p>
                            </div>
                        </div>
                        <div className="m-stat-box free-entry-highlight">
                            <div className="m-stat-data">
                                <h3>100% FREE</h3>
                                <p>Entry Fee</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* CTAs */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="monster-ctas"
                    >
                        <button className="monster-btn-primary" onClick={() => navigate('/esports-register?game=bgmi')}>
                            <span>REGISTER SQUAD NOW</span>
                            <ArrowRight size={20} />
                        </button>

                        <button className="monster-btn-secondary" onClick={handleRulebookClick}>
                            <Download size={18} />
                            <span>DOWNLOAD RULEBOOK</span>
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* Info Section */}
            <div className="monster-info-grid">
                <div className="m-info-card">
                    <Crosshair size={28} className="m-card-icon" />
                    <h3>Tournament Format</h3>
                    <p>Standard Battle Royale format with Erangel, Miramar, and Sanhok. Qualifiers leading up to an intense offline final.</p>
                </div>
                <div className="m-info-card">
                    <Map size={28} className="m-card-icon" />
                    <h3>Map Rotation</h3>
                    <p>Master varied terrains and optimize your loot strategies across dynamic competitive map rotations.</p>
                </div>
                <div className="m-info-card">
                    <Trophy size={28} className="m-card-icon" />
                    <h3>Massive Bounties</h3>
                    <p>Special bounties sponsored by Monster Energy for MVP, highest squad kills, and best clutch plays.</p>
                </div>
            </div>

            {/* Promotional Asset Placeholder */}
            <div className="monster-promo-section">
                <div className="monster-promo-card">
                    <div className="promo-text">
                        <h2>FUEL YOUR SQUAD</h2>
                        <p>Experience zero latency, high-refresh-rate staging, and pure energy powered by our title sponsor.</p>
                        <button className="promo-link" onClick={() => navigate('/esports-register?game=bgmi')}>
                            ENTER ARENA <ChevronRight size={16} />
                        </button>
                    </div>
                    <div className="monster-promo-image-container">
                        <img 
                            src={`${import.meta.env.BASE_URL}assets/esports/monster-bgmi-promo.png`} 
                            alt="Monster Energy x BGMI Collaboration" 
                            className="monster-promo-image"
                        />
                        <div className="promo-image-overlay"></div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default MonsterBgmi;
