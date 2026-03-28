import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Book, Users, Award, Zap, CheckCircle2 } from 'lucide-react';
import SEO from '../../components/seo/SEO';
import './RoboKshetraRules.css';

const RoboKshetraRules: React.FC = () => {
    const navigate = useNavigate();

    const rules = [
        {
            icon: <Users size={24} />,
            title: "Squad Protocols",
            details: [
                "Each squad must consist of 2 to 4 members.",
                "Members can be from different departments or colleges.",
                "Original Aavishkar IDs (AVR-ID) are mandatory for all members.",
                "One user can only lead one team in Robo-Kshetra."
            ]
        },
        {
            icon: <Zap size={24} />,
            title: "Combat Rounds",
            details: [
                "Round 1: Mechanical Scrutiny & Tech-Check.",
                "Round 2: Qualification Heats (Speed & Accuracy).",
                "Round 3: The Grand Arena - Head-to-Head / Timed Labyrinth.",
                "Finals: Presentation of logic and performance."
            ]
        },
        {
            icon: <Award size={24} />,
            title: "Judging Matrix",
            details: [
                "Technical Precision: Ability to stay on track/solve maze.",
                "Mechanical Efficiency: Speed and stability of the machine.",
                "Logic Density: Complexity of autonomous algorithms.",
                "Presentation: Technical report and demonstration."
            ]
        },
        {
            icon: <Book size={24} />,
            title: "General Directive",
            details: [
                "Unauthorized remote assistance leads to immediate disqualification.",
                "Bots must adhere to the specified dimensions and weight limits.",
                "Safety protocols must be followed strictly in the arena.",
                "The Arena Marshal's decision is final and binding."
            ]
        }
    ];

    return (
        <div className="rk-rules-page">
            <SEO 
                title="Rules & Guidelines | Robo-Kshetra '26" 
                description="Official machine dimensions, arena rules, and judging process for Robo-Kshetra '26 Arena."
            />

            <button className="rk-back-btn" onClick={() => navigate('/robo-kshetra')}>
                <ArrowLeft size={16} /> BACK TO ARENA
            </button>

            <header className="rk-rules-header">
                <h1>COMBAT <span>PROTOCOLS</span></h1>
                <p>Read the machine specifications and arena rules carefully before deployment.</p>
            </header>

            <div className="rk-rules-grid">
                {rules.map((section, idx) => (
                    <div key={idx} className="rk-rule-card">
                        <div className="rk-rule-icon">{section.icon}</div>
                        <h2>{section.title}</h2>
                        <ul>
                            {section.details.map((item, i) => (
                                <li key={i}>
                                    <CheckCircle2 size={16} className="rk-check-icon" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <section className="rk-registration-callout">
                <h2>Ready for Deployment?</h2>
                <p>Ensure your machine is optimized and your squad is registered.</p>
                <button className="rk-rules-register-btn" onClick={() => navigate('/robo-kshetra')}>
                    PROCEED TO ASSEMBLY
                </button>
            </section>
        </div>
    );
};

export default RoboKshetraRules;
