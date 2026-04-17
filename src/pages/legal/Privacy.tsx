import React from 'react';
import { Helmet } from 'react-helmet-async';
import './LegalPage.css';

const Privacy: React.FC = () => {
    return (
        <div className="legal-container">
            <Helmet>
                <title>Privacy Policy | Avishkar '26</title>
                <meta name="description" content="Privacy Policy for Avishkar '26. Learn how we handle your data." />
            </Helmet>

            <div className="legal-card pulse-entry">
                <header className="legal-header">
                    <span className="legal-meta">Last Updated: March 29, 2026</span>
                    <h1>Privacy Policy</h1>
                </header>

                <div className="legal-content">
                    <p>
                        At <strong>Avishkar '26</strong>, we are committed to protecting your privacy. This Privacy Policy outlines how we collect, use, and safeguard your personal information when you use our website and participate in our technical festival.
                    </p>

                    <h2>1. Information We Collect</h2>
                    <p>
                        We collect information that you provide directly to us when you register for events, workshops, or create an account. This includes:
                    </p>
                    <ul>
                        <li>Name and contact information (Email, Phone Number)</li>
                        <li>Educational details (College, Department, Year)</li>
                        <li>Government ID details (for verification purposes)</li>
                        <li>Avishkar ID (AVR-ID) assigned to you</li>
                    </ul>

                    <h2>2. How We Use Your Information</h2>
                    <p>
                        The information we collect is used to:
                    </p>
                    <ul>
                        <li>Process event registrations and payments</li>
                        <li>Issue virtual and physical passes</li>
                        <li>Send important updates regarding competitions and workshops</li>
                        <li>Verify eligibility for various technical tracks</li>
                        <li>Improve our platform and user experience</li>
                    </ul>

                    <h2>3. Data Security</h2>
                    <p>
                        We implement robust security measures to protect your data. All sensitive information (including payment metadata and ID numbers) is handled through secure Firebase infrastructure and end-to-end encrypted signals.
                    </p>

                    <h2>4. Third-Party Services</h2>
                    <p>
                        We use third-party services such as Firebase (Auth and Database) and Easebuzz (Payment Gateway). These services have their own privacy policies governing how they handle your data.
                    </p>

                    <h2>5. Contact Us</h2>
                    <p>
                        If you have any questions regarding this Privacy Policy, please contact us at:
                        <br />
                        <strong>support.avishkar@zealeducation.com</strong>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Privacy;
