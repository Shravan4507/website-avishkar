import { Link } from 'react-router-dom'
import { useBugReport } from '../BugReport/BugReport'
const avishkarLogo = `${import.meta.env.BASE_URL}assets/logos/avishkar-white.webp`

import './Footer.css'

function Footer() {
    const { openBugReport } = useBugReport();

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
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-btn" aria-label="LinkedIn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-btn" aria-label="X (Twitter)">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
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
                                <Link to="/sponsors" className="footer__link">Sponsors</Link>
                                <Link to="/team" className="footer__link">Team</Link>
                                <Link to="/contact" className="footer__link">Contact</Link>
                            </nav>
                        </div>

                        <div className="footer__column">
                            <h3 className="footer__heading">Information</h3>
                            <nav className="footer__nav">
                                <Link to="/join" className="footer__link">Join Us</Link>
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
                            <p className="footer__timestamp">
                                Last Updated: {new Date(__BUILD_TIMESTAMP__).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                        <div className="footer__legal">
                            <Link to="/privacy" className="footer__link">Privacy</Link>
                            <Link to="/terms" className="footer__link">Terms</Link>
                            <Link to="/cookies" className="footer__link">Cookies</Link>
                        </div>
                        <p className="footer__credit">
                            Built with 🔥 by <Link to="/team">Avishkar Tech</Link>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
