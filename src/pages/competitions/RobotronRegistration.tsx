import React from 'react';
import SEO from '../../components/seo/SEO';
import './HackathonRegistration.css'; // Reusing the same styling for consistency

const RobotronRegistration: React.FC = () => {
    return (
        <div className="hackathon-reg-page">
            <SEO 
                title="Robo-Kshetra '26 | Register Now" 
                description="Join the ultimate battlefield of metal and electronics at Robo-Kshetra '26."
            />
            <div className="hackathon-reg-container">
                <h1 className="hackathon-title">Robo-Kshetra '26</h1>
                <p className="hackathon-subtitle">Combat Arena Registration</p>
                
                <div className="hackathon-placeholder-card">
                    <h2>War Arena Under Construction</h2>
                    <p>The registration platform for Robo-Kshetra '26 is being finalized. Ready your machines!</p>
                </div>
            </div>
        </div>
    );
};

export default RobotronRegistration;
