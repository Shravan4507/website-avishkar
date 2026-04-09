import React from 'react';
import SEO from '../../components/seo/SEO';
import { motion } from 'framer-motion';
import GDGTransition from '../../components/gdg-cursor/GDGTransition';
import './GDGZCOER.css';

interface Session {
    id: string;
    title: string;
    time: string;
    date: string;
    description: string;
    link: string;
    color: string;
    speakers: { name: string; designation: string }[];
}

const gdgSessions: Session[] = [
    {
        id: 'git-basics',
        title: 'Git Basics Workshop',
        date: '22 April',
        time: '9:00 AM - 10:30 AM',
        description: 'Master the fundamentals of version control. Learn branching, merging, and collaboration workflows.',
        link: 'https://gdg.community.dev/e/mgp9yk/',
        color: '#4285F4',
        speakers: [{ name: 'Mr. Chaitanya Sawant', designation: 'Cloud Member' }]
    },
    {
        id: 'docker',
        title: 'Docker Workshop',
        date: '22 April',
        time: '10:45 AM - 12:15 PM',
        description: 'Dive into containerization. Build, ship, and run applications anywhere with Docker containers.',
        link: 'https://gdg.community.dev/e/mz3vfm/',
        color: '#EA4335',
        speakers: [{ name: 'Ms. Rhiya Buranpur', designation: 'Administration Lead' }]
    },
    {
        id: 'kubernetes',
        title: 'Kubernetes Workshop',
        date: '22 April',
        time: '1:00 PM - 2:30 PM',
        description: 'Orchestration at scale. Learn to manage containerized workloads and services with Kubernetes.',
        link: 'https://gdg.community.dev/e/m8r362/',
        color: '#FBBC05',
        speakers: [
            { name: 'Ms. Rhiya Buranpur', designation: 'Administration Lead' },
            { name: 'Mr. Atharva Makwan', designation: 'Cloud Lead' }
        ]
    },
    {
        id: 'ml-pipelines',
        title: 'ML Pipelines and Algos',
        date: '23 April',
        time: '9:00 AM - 12:15 PM',
        description: 'End-to-end Machine Learning. Understand data pipelines and fundamental algorithms for real-world AI.',
        link: 'https://gdg.community.dev/e/mgtd7v/',
        color: '#34A853',
        speakers: [{ name: 'Ms. Kiran Ingale', designation: 'AI-ML Member' }]
    },
    {
        id: 'ai-agents',
        title: 'AI and AI Agents Workshop',
        date: '23 April',
        time: '1:00 PM - 4:15 PM',
        description: 'The future of automation. Build intelligent agents that can reason and execute tasks autonomously.',
        link: 'https://gdg.community.dev/e/mp58b4/',
        color: '#4285F4',
        speakers: [
            { name: 'Mr. Manthan Raut', designation: 'Web Dev Lead' },
            { name: 'Mr. Siddesh Nagmote', designation: 'AI-ML Member' },
            { name: 'Mr. Om Kute', designation: 'AI-ML Lead' }
        ]
    },
    {
        id: 'system-design',
        title: 'System Design and DSA',
        date: '24 April',
        time: '9:00 AM - 12:15 PM',
        description: 'Architecting for scale. Master high-level system design patterns and tackle advanced DSA challenges.',
        link: 'https://gdg.community.dev/e/m566ub/',
        color: '#EA4335',
        speakers: [
            { name: 'Mr. Rohan Patil', designation: 'CP-DSA Lead' },
            { name: 'Mr. Vinayak Gawade', designation: 'CP-DSA Member' }
        ]
    }
];

const GDGZCOER: React.FC = () => {
    return (
        <div className="gdg-page-root">
            {/* ── Entry Transition (GDGOC page only) ── */}
            <GDGTransition />

            <SEO 
                title="GDGOC ZCOER | Avishkar '26" 
                description="Join the official GDGOC ZCOER workshops at Avishkar '26. Master Git, Docker, Kubernetes, AI/ML, and System Design." 
            />

            {/* --- Hero Section --- */}
            <header className="gdg-hero">
                <div className="gdg-hero-bg">
                    <div className="glow-circle blue"></div>
                    <div className="glow-circle red"></div>
                    <div className="glow-circle yellow"></div>
                    <div className="glow-circle green"></div>
                </div>
                
                <motion.div 
                    className="hero-content"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <img 
                        src="/assets/logos/LOGO GDG Bandung/Horizontal/_GDG Bandung - Logo Only.webp" 
                        alt="GDGOC ZCOER" 
                        className="hero-logo" 
                    />
                    <div className="hero-titles">
                        <span className="brand-label">Google Developer Groups On Campus</span>
                        <h1 className="iceland-text">ZCOER</h1>
                        <p className="hero-desc">The official technical partner of Avishkar '26, bringing <br/>world-class developer workshops to ZCOER.</p>
                    </div>
                </motion.div>
            </header>

            {/* --- Session Cards --- */}
            <main className="gdg-content">
                <section className="sessions-grid-section">
                    <div className="section-header">
                        <h2>Workshop Sessions</h2>
                        <div className="header-divider"></div>
                    </div>

                    <div className="sessions-neo-grid">
                        {gdgSessions.map((session, idx) => (
                            <motion.div 
                                key={session.id}
                                className="neo-card-container"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <a 
                                    href={session.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="neo-session-card"
                                    style={{ '--card-accent': session.color } as React.CSSProperties}
                                >
                                    <div className="card-top">
                                        <div className="date-badge">{session.date}</div>
                                        <div className="time-badge">{session.time}</div>
                                    </div>
                                    
                                    <div className="card-body">
                                        <h3>{session.title}</h3>
                                        <p>{session.description}</p>
                                    </div>

                                    <div className="card-speakers">
                                        {session.speakers.map((s, i) => (
                                            <span key={i} className="speaker-chip">
                                                — {s.name}, <em>{s.designation}</em>
                                            </span>
                                        ))}
                                    </div>

                                    <div className="card-footer">
                                        <span className="cta-text">Register Now</span>
                                        <div className="arrow-box">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <path d="M5 12h14M12 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </a>
                            </motion.div>
                        ))}
                    </div>
                </section>

                <section className="guidelines-footer">
                    <div className="neo-note">
                        <p>Note: These are official Google Developer Group On Campus events. Please adhere to GDGOC community guidelines.</p>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default GDGZCOER;
