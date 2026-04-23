import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useBugReport } from '../BugReport/BugReport'
const avishkarLogo = `${import.meta.env.BASE_URL}assets/logos/avishkar-white.webp`

import './Footer.css'

interface NetworkInformation extends EventTarget {
    downlink: number;
    addEventListener(type: 'change', listener: () => void): void;
    removeEventListener(type: 'change', listener: () => void): void;
}

interface NavigatorWithConnection extends Navigator {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
}

function Footer() {
    const { openBugReport } = useBugReport();
    const [speed, setSpeed] = useState<number | null>(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const nav = navigator as NavigatorWithConnection;
        const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
        
        const updateSpeed = () => {
            if (connection) {
                setSpeed(connection.downlink);
            }
        };

        const updateOnlineStatus = () => setIsOnline(navigator.onLine);

        updateSpeed();
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        if (connection) {
            connection.addEventListener('change', updateSpeed);
            return () => {
                connection.removeEventListener('change', updateSpeed);
                window.removeEventListener('online', updateOnlineStatus);
                window.removeEventListener('offline', updateOnlineStatus);
            };
        }

        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    }, []);

    return (
        <footer className="footer">
            <div className="footer__container">
                <div className="footer__grid">
                    <div className="footer__brand">
                        <img src={avishkarLogo} alt="Avishkar '26" className="footer__logo" />
                        <p className="footer__tagline">
                            The official annual technical festival of Zeal College of Engineering & Research. 
                            Pioneering innovation and technical excellence.
                        </p>
                        <div className="footer__socials">
                            <a href="https://instagram.com/zeal_avishkar/" target="_blank" rel="noopener noreferrer" className="social-btn" aria-label="Instagram">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                            </a>
                        </div>
                    </div>

                    <div className="footer__nav-group">
                        <div className="footer__column">
                            <h3 className="footer__heading">Navigation</h3>
                            <nav className="footer__nav">
                                <Link to="/" className="footer__link">Home</Link>
                                <Link to="/workshops" className="footer__link">Workshops</Link>
                                <Link to="/competitions" className="footer__link">Competitions</Link>
                                <Link to="/contact" className="footer__link">Contact</Link>
                                <Link to="/reach-us" className="footer__link">Reach Us</Link>
                            </nav>
                        </div>

                        <div className="footer__column">
                            <h3 className="footer__heading">Information</h3>
                            <nav className="footer__nav">
                                
                                <Link to="/faq" className="footer__link">FAQs</Link>
                                <Link to="/book-a-stall" className="footer__link">Book a Stall</Link>
                                <Link to="/login" className="footer__link">Accounts</Link>
                                <button onClick={openBugReport} className="footer__link footer__bug-btn">Report a Bug</button>
                            </nav>
                        </div>

                        <div className="footer__column">
                            <h3 className="footer__heading">Contact</h3>
                            <address className="footer__address">
                                <a href="mailto:support.avishkarr@zealeducation.com" className="footer__link">support.avishkarr@zealeducation.com</a>
                                <p style={{ fontSize: '0.7rem', opacity: 0.6, fontStyle: 'italic', marginBottom: '8px' }}>
                                    Yeah, The extra "r". We know!
                                </p>
                                <p className="address-text">
                                    Zeal College of Engineering and Research, Narhe,<br />
                                    Pune, Maharashtra 411041
                                </p>
                            </address>
                        </div>
                    </div>
                </div>

                <div className="footer__bottom">
                    <div className="footer__bottom-inner">
                        <div className="footer__bottom-left">
                            <p className="footer__copyright">© 2026 Avishkar. Pioneering Excellence.</p>
                            <div className="footer__status-row">
                                <p className="footer__timestamp">
                                    Last Updated: {new Date(__BUILD_TIMESTAMP__).toLocaleDateString('en-GB', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                                <div className="footer__speed" title={speed ? "Estimated Network Speed" : "Connection Status"}>
                                    <span className={`speed-dot ${!isOnline ? 'poor' : (speed && speed > 10) ? 'excellent' : 'good'}`}></span>
                                    <span className="speed-text">
                                        {!isOnline ? 'Offline' : (speed ? `${speed} Mbps` : 'Online • Stable')}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="footer__legal">
                            <Link to="/privacy" className="footer__link">Privacy</Link>
                            <Link to="/terms" className="footer__link">Terms</Link>
                            <Link to="/cookies" className="footer__link">Cookies</Link>
                        </div>
                        <p className="footer__credit">
                            Built with ❤️ by Avishkar Tech
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
