import React from 'react';
import { Helmet } from 'react-helmet-async';
import './LegalPage.css';

const Cookies: React.FC = () => {
    return (
        <div className="legal-container">
            <Helmet>
                <title>Cookie Policy | Avishkar '26</title>
                <meta name="description" content="Cookie Policy for Avishkar '26. How we use cookies to improve your experience." />
            </Helmet>

            <div className="legal-card pulse-entry">
                <header className="legal-header">
                    <span className="legal-meta">Last Updated: March 29, 2026</span>
                    <h1>Cookie Policy</h1>
                </header>

                <div className="legal-content">
                    <p>
                        This Cookie Policy explains how <strong>Avishkar '26</strong> uses cookies and similar technologies to recognize you when you visit our platform.
                    </p>

                    <h2>1. What are cookies?</h2>
                    <p>
                        Cookies are small data files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide reporting information.
                    </p>

                    <h2>2. Why do we use cookies?</h2>
                    <p>
                        We use cookies for several reasons:
                    </p>
                    <ul>
                        <li><strong>Essential Cookies:</strong> Required for the platform to function, such as maintaining your login session.</li>
                        <li><strong>Preference Cookies:</strong> Used to remember your dashboard settings and preferences.</li>
                        <li><strong>Analytics Cookies:</strong> Help us understand how users navigate the site so we can improve the experience.</li>
                    </ul>

                    <h2>3. Managing Cookies</h2>
                    <p>
                        Most web browsers allow you to control cookies through their settings. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience since it will no longer be personalized to you.
                    </p>

                    <h2>4. Updates to this Policy</h2>
                    <p>
                        We may update this Cookie Policy from time to time in order to reflect changes to the cookies we use or for other operational, legal, or regulatory reasons.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Cookies;
