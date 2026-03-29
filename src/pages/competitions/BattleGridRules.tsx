import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Users, Sword, Zap, ShieldCheck } from 'lucide-react';
import SEO from '../../components/seo/SEO';
import './BattleGridRules.css';

const BattleGridRules: React.FC = () => {
    const navigate = useNavigate();

    const sections = [
        {
            icon: <Users size={24} />,
            title: "Deployment Protocols",
            details: [
                "BGMI: 4 Active Players + 1 Mandatory Substitute (4+1).",
                "Free Fire & COD Mobile: 4 Member Squads required.",
                "Shadow Fight 4 & Among Us: Strictly Solo entry format.",
                "Original AVR-IDs are mandatory for match entry validation.",
                "One leader can register only one squadron per game portal."
            ]
        },
        {
            icon: <Shield size={24} />,
            title: "Fair Play Guard",
            details: [
                "Strict Zero-Tolerance policy for third-party hacks or scripts.",
                "No Emulators/PC players. Pure Mobile/Tablet gameplay only.",
                "Illegal teaming with opponents results in immediate squad ban.",
                "Admins may request screen-sharing or live POV during matches.",
                "Use of bugs/glitches for unfair advantage is prohibited."
            ]
        },
        {
            icon: <Zap size={24} />,
            title: "Arena Operations",
            details: [
                "Lobby IDs shared via Discord 15 minutes before the drop-time.",
                "Match timing is absolute; laggards will not be waited for.",
                "Internet stability is the sole responsibility of the combatant.",
                "Lobbies will NOT be restarted for individual disconnects.",
                "Match recording is recommended as evidence for disputes."
            ]
        },
        {
            icon: <Sword size={24} />,
            title: "Victory Matrix",
            details: [
                "Points = Combat Kills + Tactical Placement Points.",
                "Tournament follows a Brackets / Group progression layout.",
                "The Grid Marshall's (Admin) decision is final and binding.",
                "Prize distribution is based on verified finish standing only.",
                "Among Us sessions follow specific task/imposter score logic."
            ]
        }
    ];

    return (
        <div className="bg-rules-page">
            <SEO 
                title="Combat Rules & Guidelines | Battle Grid '26" 
                description="Official esports tournament rules, squad requirements, and fair play protocols for Battle Grid '26 Arena."
            />

            <button className="bg-back-btn" onClick={() => navigate('/battle-grid')}>
                <ArrowLeft size={16} /> BACK TO ARENA
            </button>

            <header className="bg-rules-header">
                <h1>GRID <span>PROTOCOLS</span></h1>
                <p>Read the tactical guidelines and fair play protocols carefully before drop-in.</p>
            </header>

            <div className="bg-rules-grid">
                {sections.map((section, idx) => (
                    <div key={idx} className="bg-rule-card">
                        <div className="bg-rule-icon">{section.icon}</div>
                        <h2>{section.title}</h2>
                        <ul>
                            {section.details.map((item, i) => (
                                <li key={i}>
                                    <ShieldCheck size={16} className="bg-check-icon" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <section className="bg-registration-callout">
                <h2>Ready to Drop?</h2>
                <p>Ensure your squad is synced and your device is optimized for the grid.</p>
                <button className="bg-rules-register-btn" onClick={() => navigate('/battle-grid')}>
                    PROCEED TO PORTAL
                </button>
            </section>
        </div>
    );
};

export default BattleGridRules;
