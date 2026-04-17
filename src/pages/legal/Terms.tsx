import React from 'react';
import { Helmet } from 'react-helmet-async';
import './LegalPage.css';

const Terms: React.FC = () => {
    return (
        <div className="legal-container">
            <Helmet>
                <title>Terms & Conditions | Avishkar '26</title>
                <meta name="description" content="Terms and Conditions for participating in Avishkar '26 technical festival." />
            </Helmet>

            <div className="legal-card pulse-entry">
                <header className="legal-header">
                    <span className="legal-meta">Last Updated: March 29, 2026</span>
                    <h1>Terms & Conditions</h1>
                </header>

                <div className="legal-content">
                    <p>
                        By accessing or using the <strong>Avishkar '26</strong> platform, you agree to be bound by these Terms and Conditions. Please read them carefully.
                    </p>

                    <h2>1. Eligibility</h2>
                    <p>
                        Participants must be students of a recognized educational institution. Proof of student status (ID card) is required for participation and prize collection.
                    </p>

                    <h2>2. Registration & Fees</h2>
                    <ul>
                        <li>Registration fees are non-refundable except in case of event cancellation.</li>
                        <li>Each participant is responsible for providing accurate information.</li>
                        <li>Duplicate registrations or sharing AVR-IDs is strictly prohibited and may lead to disqualification.</li>
                    </ul>

                    <h2>3. Conduct & Participation</h2>
                    <p>
                        Participants are expected to maintain professional conduct. Any form of harassment, cheating, or technical malpractice will result in immediate disqualification and potential banning from future events.
                    </p>

                    <h2>4. Intellectual Property</h2>
                    <p>
                        All content provided on the platform, including branding, designs, and technical concepts, are the intellectual property of the Avishkar Tech Team and Zeal Education Society.
                    </p>

                    <h2>5. Modification of Events</h2>
                    <p>
                        The organizing committee reserves the right to modify event schedules, rules, or prizes without prior notice, although any major changes will be communicated via official channels.
                    </p>

                    <h2>6. Limitation of Liability</h2>
                    <p>
                        Avishkar '26 and its organizers are not liable for any personal injury, loss, or damage to equipment during participation in events.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Terms;
