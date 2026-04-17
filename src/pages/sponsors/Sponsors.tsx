import SEO from '../../components/seo/SEO'
import './Sponsors.css'

const SPONSORS_DATA = [
    {
        tier: 'Title Partner',
        class: 'grid-title',
        tierColor: '#d9ff00',
        sponsors: [
            { id: 1, name: 'Google', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg', url: 'https://google.com', category: 'Official Tech Partner' }
        ]
    },
    {
        tier: 'Platinum Partners',
        class: 'grid-platinum',
        tierColor: '#ffffff',
        sponsors: [
            { id: 2, name: 'Red Bull', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/50/Red_Bull_logo.svg/langfr-300px-Red_Bull_logo.svg.png', url: 'https://redbull.com', category: 'Official Energy Partner' },
            { id: 3, name: 'Intel', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Intel_logo_%282020%29.svg', url: 'https://intel.com', category: 'Computing Partner' }
        ]
    },
    {
        tier: 'Gold Partners',
        class: 'grid-gold',
        tierColor: '#FFCC00',
        sponsors: [
            { id: 4, name: 'Microsoft', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg', url: 'https://microsoft.com', category: 'Software Partner' },
            { id: 5, name: 'Adobe', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Adobe_Corporate_Logo.svg', url: 'https://adobe.com', category: 'Creative Partner' },
            { id: 6, name: 'AWS', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg', url: 'https://aws.amazon.com', category: 'Cloud Partner' }
        ]
    },
    {
        tier: 'Silver Partners',
        class: 'grid-silver',
        tierColor: '#A8A8A8',
        sponsors: [
            { id: 7, name: 'Nvidia', logo: 'https://upload.wikimedia.org/wikipedia/sco/2/21/Nvidia_logo.svg', url: 'https://nvidia.com', category: 'Graphics Partner' },
            { id: 8, name: 'Spotify', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_with_text.svg', url: 'https://spotify.com', category: 'Music Partner' },
            { id: 9, name: 'Github', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg', url: 'https://github.com', category: 'Dev Partner' },
            { id: 10, name: 'Vercel', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Vercel_logo_black.svg', url: 'https://vercel.com', category: 'Hosting Partner' }
        ]
    }
]

function Sponsors() {
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
                {SPONSORS_DATA.map((tier, idx) => (
                    <section key={idx} className="sponsors-tier">
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
                                    <img
                                        src={sponsor.logo}
                                        alt={sponsor.name}
                                        className="sponsor-logo"
                                    />
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
                    <a href="/website-avishkar/contact" className="become-sponsor-btn">Partner With Us</a>
                </div>
            </section>
        </main>
        </>
    )
}

export default Sponsors
