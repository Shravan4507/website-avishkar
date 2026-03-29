import { useNavigate } from 'react-router-dom';
import SEO from '../../components/seo/SEO'
import { ChromaGrid, type ChromaItem } from '../../components/chroma-grid/ChromaGrid';
import './Workshops.css'

const technicalClubs: ChromaItem[] = [
    {
        title: 'GDG ZCOER',
        subtitle: 'Developer Community',
        slug: 'gdg-zcoer',
        description: 'The premier developer community at ZCOER, powered by Google Developers. Join us for hands-on tech stacks, cloud computing, and industry-grade workshops.',
        image: '/assets/logos/LOGO GDG Bandung/Horizontal/_GDG Bandung - Logo Only.png',
        location: 'ZCOER Campus',
        borderColor: '#4285F4',
        gradient: 'linear-gradient(135deg, rgba(66, 133, 244, 0.05), rgba(0, 0, 0, 0.95))',
        socials: {
            instagram: 'https://www.instagram.com/gdg_zcoer/',
            linkedin: 'https://www.linkedin.com/company/gdg-zcoer/'
        }
    },
    {
        title: 'OrbitX',
        subtitle: 'Astronomy Club',
        slug: 'orbitx-zcoer',
        description: "ZCOER's premier Astronomy and Space Exploration club. Discover the cosmos, participate in stargazing sessions, and dive into the future of aerospace technology.",
        image: '/assets/logos/OrbitX/Logo-OrbitX.png',
        location: 'ZCOER Campus',
        borderColor: '#d9ff00',
        gradient: 'linear-gradient(135deg, rgba(217, 255, 0, 0.05), rgba(0, 0, 0, 0.95))',
        socials: {
            instagram: 'https://www.instagram.com/orbitx_zcoer/',
        }
    }
]

function Workshops() {
    const navigate = useNavigate();

    return (
        <>
            <SEO 
                title="Clubs & Communities" 
                description="Connect with the elite technical clubs of ZCOER driving innovation and exploration." 
            />
            <main className="workshops-page">
                <header className="workshops-header">
                    <div className="header-glow"></div>
                    <span className="section-label">The Innovators</span>
                    <h1>Technical Communities</h1>
                    <div className="section-line"></div>
                    <p>Experience the multi-day technical odyssey with ZCOER's elite clubs. Join the circle of innovation and exploration.</p>
                </header>

                <section className="innovators-circle">
                    <div className="innovators-container">
                        <ChromaGrid 
                            items={technicalClubs}
                            columns={2}
                            radius={450}
                            showRegister={false}
                            onItemClick={(item) => navigate(`/${item.slug}`)}
                        />
                    </div>
                </section>
            </main>
        </>
    )
}

export default Workshops
