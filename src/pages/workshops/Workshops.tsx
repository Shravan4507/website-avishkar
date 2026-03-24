import { useState, useEffect, useRef } from 'react'
import SEO from '../../components/seo/SEO'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import './Workshops.css'

const dayPasses = [
    {
        id: 1,
        title: 'DAY 1',
        subtitle: 'The Inception',
        image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80',
        price: '₹0',
        description: 'Avishkar ’26 kicks off with a surge of energy! Day 1 is dedicated to the grand inauguration, keynote sessions from industry titans, and the commencement of our flagship 24-hour hackathons. Immerse yourself in the world of high-impact technology and networking.',
        features: [
            'Grand Inauguration Ceremony',
            'Keynote: Future of Web3',
            'Commencement of Codex ’26',
            'Morning Refreshments',
            'Evening Networking Gala'
        ]
    },
    {
        id: 2,
        title: 'DAY 2',
        subtitle: 'The Grind',
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80',
        price: '₹0',
        description: 'The intensity reaches its peak on Day 2. Watch the final hours of the hackathon, witness the brutal robotics combat in the Arena, and participate in specialized technical workshops. This is where grit meets innovation.',
        features: [
            'Robotics Arena: Qualifier Rounds',
            'Technical Workshops & Paper PPTs',
            'UI/UX Design Sprint',
            'Delegate Kit & Goodies',
            'Elite Gaming Tournament Phase 1'
        ]
    },
    {
        id: 3,
        title: 'DAY 3',
        subtitle: 'The Grand Finale',
        image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&q=80',
        price: '₹10',
        description: 'Celebration, recognition, and pure entertainment. Day 3 features the grand finales of all major competitions, the prestigious award ceremony, and an unforgettable celebrity performance night to close Avishkar ’26 in style.',
        features: [
            'Grand Finale: Battle-Grid & Codex',
            'Prestigious Award Ceremony',
            'Celebrity Performance Night',
            'Gala Dinner & Social',
            'Participation Certificate Distribution'
        ]
    }
]

function Workshops() {
    const navigate = useNavigate();
    const [selectedDay, setSelectedDay] = useState<typeof dayPasses[0] | null>(null);
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const modalRef = useRef<HTMLDivElement>(null);
    const modalContentRef = useRef<HTMLDivElement>(null);

    const toggleDaySelection = (id: number) => {
        setSelectedDays(prev =>
            prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
        );
    };

    const totalCost = dayPasses
        .filter(day => selectedDays.includes(day.id))
        .reduce((sum, day) => sum + parseInt(day.price.replace('₹', '')), 0);

    const closePortal = () => {
        const tl = gsap.timeline({
            onComplete: () => setSelectedDay(null)
        });
        tl.to(modalContentRef.current, { scale: 0.9, opacity: 0, duration: 0.3, ease: 'power2.in' })
            .to(modalRef.current, { opacity: 0, duration: 0.2 }, "-=0.2");
    };

    useEffect(() => {
        if (selectedDay && modalRef.current && modalContentRef.current) {
            gsap.fromTo(modalRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.3 }
            );
            gsap.fromTo(modalContentRef.current,
                { scale: 0.9, opacity: 0, y: 20 },
                { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' }
            );
        }
    }, [selectedDay]);

    return (
        <>
            <SEO 
                title="Events & Passes" 
                description="Explore the schedule of events, day-by-day itineraries, and epic hackathons at Avishkar '26." 
            />
            <main className="workshops-page">
            <header className="workshops-header">
                <div className="header-glow"></div>
                <span className="section-label">The odyssey</span>
                <h1>Festival Journey</h1>
                <div className="section-line"></div>
                <p>Experience the multi-day odyssey of Avishkar ’26. From high-stakes hackathons to celebrity showcases, reserve your spot for the definitive technical festival.</p>
            </header>

            <section className="workshops" id="workshops">
                <div className="workshops__content">
                    <div className="workshops__grid">
                        {dayPasses.map((day) => {
                            const isSelected = selectedDays.includes(day.id);
                            return (
                                <div key={day.id} className={`workshop-card ${isSelected ? 'selected' : ''}`}>
                                    <div className="workshop-card__image-container">
                                        <img src={day.image} alt={day.title} className="workshop-card__image" />
                                    </div>
                                    <h3 className="workshop-card__title">{day.title}</h3>
                                    <p className="workshop-card__subtitle" style={{ color: 'rgba(255,255,255,0.5)', marginTop: '-1rem', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '2px' }}>{day.subtitle}</p>
                                    <ul className="workshop-card__features">
                                        {day.features.slice(0, 3).map((feature, idx) => (
                                            <li key={idx}>{feature}</li>
                                        ))}
                                        <li className="more-features">And more highlights...</li>
                                    </ul>
                                    <div className="workshop-card__price">{day.price}</div>
                                    <div className="workshop-card__actions">
                                        <button
                                            className="workshop-card__btn workshop-card__btn--explore"
                                            onClick={() => setSelectedDay(day)}
                                        >
                                            Explore
                                        </button>
                                        <button
                                            className={`workshop-card__btn workshop-card__btn--select ${isSelected ? 'selected' : ''}`}
                                            onClick={() => toggleDaySelection(day.id)}
                                        >
                                            {isSelected ? 'Selected' : 'Select'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {selectedDays.length > 0 && (
                        <div className="checkout-container anim-fade-in">
                            <div className="checkout-box">
                                <div className="checkout-info">
                                    <span className="checkout-label">Journey Summary</span>
                                    <h3 className="checkout-total">Total: ₹{totalCost}</h3>
                                    <p className="checkout-count">{selectedDays.length} {selectedDays.length === 1 ? 'Day' : 'Days'} Selected</p>
                                </div>
                                <button className="checkout-btn" onClick={() => {
                                    const firstDay = dayPasses.find(d => selectedDays.includes(d.id));
                                    const title = selectedDays.length > 1 ? 'Festival Combo' : `${firstDay?.title} Pass`;
                                    const img = firstDay?.image || '';
                                    navigate(`/register?comp=${encodeURIComponent(title)}&img=${encodeURIComponent(img)}`);
                                }}>
                                    Complete Checkout
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                        <polyline points="12 5 19 12 12 19"></polyline>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {selectedDay && (
                <div className="workshop-modal-overlay" ref={modalRef} onClick={closePortal}>
                    <div className="workshop-modal-content" ref={modalContentRef} onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={closePortal}>×</button>
                        <div className="modal-main">
                            <div className="modal-image">
                                <img src={selectedDay.image} alt={selectedDay.title} />
                                <div className="modal-img-overlay"></div>
                            </div>
                            <div className="modal-details">
                                <div className="modal-header-top">
                                    <span className="modal-day-badge">{selectedDay.title}</span>
                                    <span className="modal-price-badge">{selectedDay.price}</span>
                                </div>
                                <h2>{selectedDay.subtitle}</h2>
                                <p className="modal-desc">
                                    {selectedDay.description}
                                </p>
                                <div className="modal-highlights">
                                    <h3>Day Highlights</h3>
                                    <ul>
                                        {selectedDay.features.map((f, i) => (
                                            <li key={i}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d9ff00" strokeWidth="2.5">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        className={`select-pass-btn ${selectedDays.includes(selectedDay.id) ? 'selected' : ''}`}
                                        onClick={() => {
                                            toggleDaySelection(selectedDay.id);
                                            closePortal();
                                        }}
                                    >
                                        {selectedDays.includes(selectedDay.id) ? 'Deselect Pass' : 'Grab This Pass'}
                                    </button>
                                    <p className="modal-note">* Limited spots available for technical workshops.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
        </>
    )
}

export default Workshops
