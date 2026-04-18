import React, { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/firebase'
import SEO from '../../components/seo/SEO'
import './Sponsors.css'

interface Sponsor {
  id: string;
  name: string;
  logo: string;
  url: string;
  category: string;
}

interface SponsorTier {
  id: string;
  tier: string;
  class: string;
  tierColor: string;
  sponsors: Sponsor[];
}

interface SponsorsDoc {
  isActive: boolean;
  tiers: SponsorTier[];
}

// Fallback hardcoded data before hydration
const FALLBACK_DATA: SponsorTier[] = [
    {
        id: '1',
        tier: 'Title Partner',
        class: 'grid-title',
        tierColor: '#d9ff00',
        sponsors: [
            { id: 'g1', name: 'Google', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg', url: 'https://google.com', category: 'Official Tech Partner' }
        ]
    },
    {
        id: '2',
        tier: 'Platinum Partners',
        class: 'grid-platinum',
        tierColor: '#ffffff',
        sponsors: [
            { id: 'p1', name: 'Red Bull', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/50/Red_Bull_logo.svg/langfr-300px-Red_Bull_logo.svg.png', url: 'https://redbull.com', category: 'Official Energy Partner' },
            { id: 'p2', name: 'Intel', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Intel_logo_%282020%29.svg', url: 'https://intel.com', category: 'Computing Partner' }
        ]
    }
]

function Sponsors() {
    const [data, setData] = useState<SponsorsDoc | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSponsors = async () => {
            try {
                const snap = await getDoc(doc(db, 'page_settings', 'sponsors'));
                if (snap.exists()) {
                    setData(snap.data() as SponsorsDoc);
                } else {
                    setData({ isActive: false, tiers: [] });
                }
            } catch (err) {
                console.error(err);
                // On error, show fallback but maybe inactive?
                setData({ isActive: false, tiers: FALLBACK_DATA });
            } finally {
                setLoading(false);
            }
        };

        loadSponsors();
    }, []);

    if (loading) {
        return (
            <>
                <SEO title="Our Sponsors" description="Loading Sponsors..." />
                <main className="sponsors-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                    <div style={{ color: 'rgba(255,255,255,0.5)' }}>Loading Sponsors...</div>
                </main>
            </>
        );
    }

    if (!data?.isActive) {
        return (
            <>
                <SEO title="Our Sponsors" description="Coming Soon" />
                <main className="sponsors-page" style={{ 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', textAlign: 'center', padding: '2rem' 
                }}>
                    <header className="sponsors-header" style={{ marginBottom: '2rem' }}>
                        <div className="header-glow"></div>
                        <h1>Our Partners</h1>
                        <p>We are currently finalizing our incredible lineup of sponsors!</p>
                    </header>
                    <div style={{ padding: '3rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', maxWidth: '600px' }}>
                        <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Sponsors List Unveiling Soon</h2>
                        <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                            We are building the future together alongside world-class organizations. Stay tuned to discover the amazing partners supporting Avishkar '26.
                        </p>
                    </div>
                    <section className="sponsors-cta" style={{ marginTop: '4rem', background: 'none' }}>
                        <div className="cta-content" style={{ margin: 0, border: 'none' }}>
                            <a href="/contact" className="become-sponsor-btn">Want to Partner With Us?</a>
                        </div>
                    </section>
                </main>
            </>
        );
    }

    return (
        <>
            <SEO 
                title="Our Sponsors" 
                description="Building the future together. Discover the amazing organizations and partners supporting Avishkar '26." 
            />
            <main className="sponsors-page">
            <header className="sponsors-header">
                <div className="header-glow"></div>
                <h1>Our Partners</h1>
                <p>Building the future together. We are proud to be supported by world-class organizations that share our vision for innovation and excellence.</p>
            </header>

            <div className="sponsors-container">
                {data.tiers.filter(t => t.sponsors.length > 0).map((tier) => (
                    <section key={tier.id} className="sponsors-tier">
                        <div className="tier-title">
                            <h2>{tier.tier}</h2>
                            <div className="tier-line" style={{ background: `linear-gradient(to right, ${tier.tierColor}80, transparent)` }}></div>
                        </div>
                        <div className={`sponsors-grid ${tier.class}`}>
                            {tier.sponsors.map(sponsor => (
                                <a
                                    key={sponsor.id}
                                    href={sponsor.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="sponsor-card"
                                    style={{ '--tier-color': tier.tierColor } as React.CSSProperties}
                                >
                                    <div className="sponsor-category">{sponsor.category}</div>
                                    <div style={{ height: '80px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <img
                                            src={sponsor.logo}
                                            alt={sponsor.name}
                                            className="sponsor-logo"
                                            style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                                            crossOrigin="anonymous"
                                        />
                                    </div>
                                </a>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            <section className="sponsors-cta">
                <div className="cta-content">
                    <h2>Interested in Partnering?</h2>
                    <p>Join us in creating an unforgettable experience for thousands of students and technology enthusiasts.</p>
                    <a href="/contact" className="become-sponsor-btn">Partner With Us</a>
                </div>
            </section>
        </main>
        </>
    )
}

export default Sponsors
