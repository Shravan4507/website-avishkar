import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import ChromaGrid from '../../components/chroma-grid/ChromaGrid';
import SEO from '../../components/seo/SEO';
import { COMPETITIONS_DATA } from '../../data/competitions';
import type { Competition } from '../../data/competitions';
import './Competitions.css';

import { useRegistrationGuard } from '../../hooks/useRegistrationGuard';

function Competitions() {
    const navigate = useNavigate();
    const { isRegistered, eventName } = useRegistrationGuard();

    const flagshipCompetitions = COMPETITIONS_DATA.filter((item: any) => item.isFlagship);
    
    const [regularCompetitions, setRegularCompetitions] = useState<Competition[]>(
        COMPETITIONS_DATA.filter((item: any) => !item.isFlagship && !item.isExhibition)
    );
    const [selectedSlug, setSelectedSlug] = useState<string | undefined>();

    useEffect(() => {
        const fetchCompetitions = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'competitions'));
                const fetched: Competition[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    fetched.push({
                        ...data,
                        id: data.id || doc.id,
                        slug: data.slug || doc.id,
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
                title="Competitions | Avishkar '26" 
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
                        items={flagshipCompetitions.map(c => ({
                            ...c,
                            coordinator: c.coordinators?.[0]?.name,
                            contactNumber: c.coordinators?.[0]?.phone
                        }))}
                        radius={400}
                        damping={0.5}
                        fadeOut={0.8}
                        columns={3}
                        isRegistered={isRegistered}
                        registeredEventName={eventName}
                        disableModal={true}
                        onItemClick={(item) => {
                            if (item.comingSoon) {
                                setSelectedSlug(item.slug);
                                return;
                            }

                            if (item.slug === 'param-x-26') {
                                navigate('/param-x');
                            } else if (item.slug === 'battle-grid-26') {
                                navigate('/battle-grid');
                            } else if (item.slug === 'robotron-26') {
                                navigate('/robo-kshetra');
                            } else {
                                setSelectedSlug(item.slug);
                            }
                        }}
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
                            items={regularCompetitions.map(c => ({
                                ...c,
                                coordinator: c.coordinators?.[0]?.name,
                                contactNumber: c.coordinators?.[0]?.phone
                            }))}
                            radius={400}
                            damping={0.5}
                            fadeOut={0.8}
                            columns={3}
                            selectedItemSlug={selectedSlug}
                            isRegistered={isRegistered}
                            registeredEventName={eventName}
                            onModalClose={() => setSelectedSlug(undefined)}
                        />
                    </div>
                </section>
            )}
        </main>
        </>
    )
}

export default Competitions
