import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import ChromaGrid from '../../components/chroma-grid/ChromaGrid';
import SEO from '../../components/seo/SEO';
import { COMPETITIONS_DATA } from '../../data/competitions';
import type { Competition } from '../../data/competitions';
import './Competitions.css';

function Competitions() {
    const flagshipCompetitions = COMPETITIONS_DATA.filter((item: any) => item.isFlagship);
    const exhibitionItems = COMPETITIONS_DATA.filter((item: any) => item.isExhibition);
    
    const [regularCompetitions, setRegularCompetitions] = useState<Competition[]>(
        COMPETITIONS_DATA.filter((item: any) => !item.isFlagship && !item.isExhibition)
    );

    useEffect(() => {
        const fetchCompetitions = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'competitions'));
                const fetched: Competition[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    fetched.push({
                        image: data.image || '',
                        title: data.title || 'Untitled',
                        subtitle: data.subtitle || '',
                        location: data.location || '',
                        handle: data.handle || '',
                        description: data.description || '',
                        borderColor: data.borderColor || '#5227FF',
                        gradient: data.gradient || 'linear-gradient(145deg, #5227FF, #000)',
                        url: data.url || '#',
                        prizePool: data.prizePool || '',
                        slug: doc.id,
                    } as Competition);
                });
                
                if (fetched.length > 0) {
                    const initial = COMPETITIONS_DATA.filter((item: any) => !item.isFlagship && !item.isExhibition);
                    setRegularCompetitions([...initial, ...fetched]);
                }
            } catch (error) {
                console.error("Error fetching dynamic competitions:", error);
            }
        };

        fetchCompetitions();
    }, []);

    return (
        <>
            <SEO 
                title="Competitions" 
                description="Push your limits. Compete in grueling coding and technical arenas at Avishkar '26." 
            />
            <main className="competitions-page">
            <header className="competitions-header">
                <div className="header-glow"></div>
                <h1>Arena of Excellence</h1>
                <p>Push your limits, showcase your skills, and claim glory. Avishkar '26 presents the most prestigious technical and gaming arena of the year.</p>
            </header>

            <section className="competition-section flagship-section">
                <div className="section-header">
                    <span className="section-label">Premier Events</span>
                    <h2>Flagship Competitions</h2>
                    <div className="section-line"></div>
                </div>
                <div className="competitions-container">
                    <ChromaGrid
                        items={flagshipCompetitions}
                        radius={400}
                        damping={0.5}
                        fadeOut={0.8}
                        columns={3}
                    />
                </div>
            </section>

            {regularCompetitions.length > 0 && (
                <section className="competition-section arena-section">
                    <div className="section-header">
                        <span className="section-label">The Main Event Arena</span>
                        <h2>Standard Competitions</h2>
                        <div className="section-desc">More events revealing soon...</div>
                        <div className="section-line"></div>
                    </div>
                    <div className="competitions-container">
                        <ChromaGrid
                            items={regularCompetitions}
                            radius={400}
                            damping={0.5}
                            fadeOut={0.8}
                            columns={3}
                        />
                    </div>
                </section>
            )}

            <section className="competition-section branding-section">
                <div className="section-header">
                    <span className="section-label">Innovation Showcase</span>
                    <h2>Exhibitions & Branding</h2>
                    <div className="section-desc">Non-competitive creative showcases</div>
                    <div className="section-line"></div>
                </div>
                <div className="competitions-container">
                    <ChromaGrid
                        items={exhibitionItems}
                        radius={400}
                        damping={0.5}
                        fadeOut={0.8}
                        columns={1}
                    />
                </div>
            </section>
        </main>
        </>
    )
}

export default Competitions
