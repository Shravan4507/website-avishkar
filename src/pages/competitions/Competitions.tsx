import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import ChromaGrid from '../../components/chroma-grid/ChromaGrid';
import SEO from '../../components/seo/SEO';
import { COMPETITIONS_DATA } from '../../data/competitions';
import type { Competition } from '../../data/competitions';
import './Competitions.css';

import { useRegistrationGuard } from '../../hooks/useRegistrationGuard';

// Merge Firestore overrides on top of static data
async function applyOverrides(items: Competition[]): Promise<Competition[]> {
    return Promise.all(items.map(async (item) => {
        const key = item.slug || item.id;
        try {
            const snap = await getDoc(doc(db, 'events_content', key));
            if (snap.exists()) {
                const override = snap.data();
                return {
                    ...item,
                    description: override.description ?? item.description,
                    prizePool: override.prizePool ?? item.prizePool,
                    venue: override.venue ?? item.venue,
                    rulebook: override.rulebook ?? item.rulebook,
                    rulebookComingSoon: override.rulebookComingSoon ?? item.rulebookComingSoon,
                    isRegistrationOpen: override.isRegistrationOpen ?? item.isRegistrationOpen,
                    status: override.status ?? item.status,
                    coordinators: override.coordinators ?? item.coordinators,
                    entryFee: override.entryFee ?? item.entryFee,
                };
            }
        } catch (e) { /* no override, use static */ }
        return item;
    }));
}

function Competitions() {
    const navigate = useNavigate();
    const { isRegistered, eventName } = useRegistrationGuard();

    const hiddenSlugs = ['param-x-26', 'robotron-26', 'codm-26'];

    const [flagshipCompetitions, setFlagshipCompetitions] = useState<Competition[]>(
        COMPETITIONS_DATA.filter((item: any) => item.isFlagship && !hiddenSlugs.includes(item.slug))
    );
    const [regularCompetitions, setRegularCompetitions] = useState<Competition[]>(
        COMPETITIONS_DATA.filter((item: any) => !item.isFlagship && !item.isExhibition && !hiddenSlugs.includes(item.slug))
    );
    const [selectedSlug, setSelectedSlug] = useState<string | undefined>();

    useEffect(() => {
        const fetchAndMerge = async () => {
            try {
                // Apply Firestore overrides to static data
                const hiddenSlugs = ['param-x-26', 'robotron-26', 'codm-26'];
                const flagshipRaw = COMPETITIONS_DATA.filter((item: any) => item.isFlagship && !hiddenSlugs.includes(item.slug));
                const regularRaw = COMPETITIONS_DATA.filter((item: any) => !item.isFlagship && !item.isExhibition && !hiddenSlugs.includes(item.slug));

                const [flagshipMerged, regularMerged] = await Promise.all([
                    applyOverrides(flagshipRaw),
                    applyOverrides(regularRaw),
                ]);

                setFlagshipCompetitions(flagshipMerged);

                // Also check for any additional dynamic competitions in Firestore
                const querySnapshot = await getDocs(collection(db, 'competitions'));
                const fetched: Competition[] = [];
                querySnapshot.forEach((d) => {
                    const data = d.data();
                    // Only include if not already in static data
                    const alreadyExists = COMPETITIONS_DATA.some(c => c.slug === (data.slug || d.id));
                    if (!alreadyExists) {
                        fetched.push({ ...data, id: data.id || d.id, slug: data.slug || d.id } as Competition);
                    }
                });

                setRegularCompetitions([...regularMerged, ...fetched]);
            } catch (error) {
                console.error("Error fetching competitions:", error);
            }
        };

        fetchAndMerge();
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
                            isRegistrationOpen: false,
                            coordinator: c.coordinators?.[0]?.name,
                            contactNumber: c.coordinators?.[0]?.phone
                        }))}
                        radius={400}
                        damping={0.5}
                        fadeOut={0.8}
                        columns={Math.min(3, flagshipCompetitions.length) || 3}
                        isRegistered={isRegistered}
                        registeredEventName={eventName}
                        selectedItemSlug={selectedSlug}
                        onModalClose={() => setSelectedSlug(undefined)}
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
                            } else if (selectedSlug === item.slug) {
                                // Register Now button clicked from inside the modal — navigate to registration
                                navigate(`/register/${item.slug}`);
                            } else {
                                // First click on card — open the modal
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
                                isRegistrationOpen: false,
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
