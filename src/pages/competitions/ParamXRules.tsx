import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Book, Users, Award, Zap, CheckCircle2 } from 'lucide-react';
import SEO from '../../components/seo/SEO';
import './ParamXRules.css';

const ParamXRules: React.FC = () => {
    const navigate = useNavigate();

    const rules = [
        {
            icon: <Users size={24} />,
            title: "Team Formation",
            details: [
                "Each team must consist of 2 to 4 members.",
                "Compulsory to have at least one female member in the team (SIH Style).",
                "All members must be from the same college.",
                "Cross-departmental teams are encouraged."
            ]
        },
        {
            icon: <Zap size={24} />,
            title: "Rounds & Timeline",
            details: [
                "Round 1: Idea Submission (PPT based). Due by April 18th.",
                "Round 2: Internal Scrutiny & Mentorship call.",
                "Round 3: The 24-Hour Grand Finale (Hackathon).",
                "Final Demo: Presentation to the jury."
            ]
        },
        {
            icon: <Award size={24} />,
            title: "Judging Criteria",
            details: [
                "Innovation & Originality: How unique is the solution?",
                "Technical Complexity: Depth of technology used.",
                "Feasibility: Can this be used in the real world?",
                "User Experience: Design and ease of use."
            ]
        },
        {
            icon: <Book size={24} />,
            title: "General Guidelines",
            details: [
                "Plagiarism of any form will lead to immediate disqualification.",
                "Teams must use their own laptops and hardware if required.",
                "High-speed Wi-Fi and power outlets will be provided.",
                "Decision of the jury will be final and binding."
            ]
        }
    ];

    return (
        <div className="rules-page">
            <SEO 
                title="Rules & Guidelines | Param-X '26" 
                description="Official rules, eligibility criteria, and judging process for Param-X '26 Hackathon."
            />

            <button className="back-btn" onClick={() => navigate('/param-x')}>
                <ArrowLeft size={20} /> Back to Portal
            </button>

            <header className="rules-header">
                <h1>Rules & Regulations</h1>
                <p>Please read the guidelines carefully before registering your team.</p>
            </header>

            <div className="rules-grid">
                {rules.map((section, idx) => (
                    <div key={idx} className="rule-card">
                        <div className="rule-icon">{section.icon}</div>
                        <h2>{section.title}</h2>
                        <ul>
                            {section.details.map((item, i) => (
                                <li key={i}>
                                    <CheckCircle2 size={16} className="check-icon" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <section className="registration-callout">
                <h2>Ready to Build?</h2>
                <p>Make sure your team is ready and your idea is solid. Registration costs ₹500 per team.</p>
                <button className="rules-register-btn" onClick={() => navigate('/param-x')}>
                    Proceed to Registration
                </button>
            </section>
        </div>
    );
};

export default ParamXRules;
