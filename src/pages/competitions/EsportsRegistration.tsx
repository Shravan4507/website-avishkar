import React from 'react';
import SEO from '../../components/seo/SEO';
import './HackathonRegistration.css'; // Reusing the same styling for consistency

const EsportsRegistration: React.FC = () => {
    return (
        <div className="hackathon-reg-page">
            <SEO 
                title="Battle Grid '26 | Esports Arena" 
                description="The ultimate tactical arena battle at Battle Grid '26. Claim your spot in the grid."
            />
            <div className="hackathon-reg-container">
                <h1 className="hackathon-title">Battle Grid '26</h1>
                <p className="hackathon-subtitle">Esports Arena Registration</p>
                
                <div className="hackathon-placeholder-card">
                    <h2>Grid Under Construction</h2>
                    <p>The registration platform for Battle Grid '26 is being finalized. Prepare for the fight!</p>
                </div>
            </div>
        </div>
    );
};

export default EsportsRegistration;
