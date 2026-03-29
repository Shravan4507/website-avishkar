import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import './ChromaGrid.css';

export interface ChromaItem {
    image: string;
    title: string;
    subtitle: string;
    slug?: string;
    handle?: string;
    location?: string;
    description?: string;
    borderColor?: string;
    gradient?: string;
    url?: string;
    prizePool?: string;
    entryFee?: number;
    coordinator?: string;
    contactNumber?: string;
    isFlagship?: boolean;
    socials?: {
        github?: string;
        linkedin?: string;
        twitter?: string;
        instagram?: string;
    };
}

export interface ChromaGridProps {
    items?: ChromaItem[];
    className?: string;
    radius?: number;
    columns?: number;
    rows?: number;
    damping?: number;
    fadeOut?: number;
    ease?: string;
    showRegister?: boolean;
    isRegistered?: boolean;
    registeredEventName?: string | null;
    selectedItemSlug?: string;
    onItemClick?: (item: ChromaItem) => void;
    onModalClose?: () => void;
}


type SetterFn = (v: number | string) => void;

const SocialIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'github':
            return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>;
        case 'linkedin':
            return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>;
        case 'twitter':
            return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>;
        case 'instagram':
            return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>;
        case 'star':
            return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
        default:
            return null;
    }
};

export const ChromaGrid: React.FC<ChromaGridProps> = ({
    items,
    className = '',
    radius = 300,
    columns = 3,
    rows = 2,
    damping = 0.45,
    fadeOut = 0.6,
    ease = 'power3.out',
    showRegister = true,
    isRegistered = false,
    registeredEventName = null,
    selectedItemSlug,
    onItemClick,
    onModalClose
}) => {

    const rootRef = useRef<HTMLDivElement>(null);
    const fadeRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const modalContentRef = useRef<HTMLDivElement>(null);
    const setX = useRef<SetterFn | null>(null);
    const setY = useRef<SetterFn | null>(null);
    const pos = useRef({ x: 0, y: 0 });
    const [selectedMember, setSelectedMember] = useState<ChromaItem | null>(null);

    const data = items || [];

    useEffect(() => {
        const el = rootRef.current;
        if (!el) return;
        setX.current = gsap.quickSetter(el, '--x', 'px') as SetterFn;
        setY.current = gsap.quickSetter(el, '--y', 'px') as SetterFn;
        const { width, height } = el.getBoundingClientRect();
        pos.current = { x: width / 2, y: height / 2 };
        setX.current(pos.current.x);
        setY.current(pos.current.y);
    }, []);

    const moveTo = (x: number, y: number) => {
        gsap.to(pos.current, {
            x,
            y,
            duration: damping,
            ease,
            onUpdate: () => {
                setX.current?.(pos.current.x);
                setY.current?.(pos.current.y);
            },
            overwrite: true
        });
    };

    const handleMove = (e: React.PointerEvent) => {
        if (!rootRef.current || selectedMember) return;
        const r = rootRef.current.getBoundingClientRect();
        moveTo(e.clientX - r.left, e.clientY - r.top);
        gsap.to(fadeRef.current, { opacity: 0, duration: 0.25, overwrite: true });
    };

    const handleLeave = () => {
        if (selectedMember) return;
        gsap.to(fadeRef.current, {
            opacity: 1,
            duration: fadeOut,
            overwrite: true
        });
    };

    const handleCardClick = (member: ChromaItem) => {
        if (onItemClick) {
            onItemClick(member);
        } else {
            setSelectedMember(member);
        }
    };

    const closePortal = () => {
        if (onModalClose) {
            onModalClose();
        } else {
            const tl = gsap.timeline({
                onComplete: () => setSelectedMember(null)
            });
            tl.to(modalContentRef.current, { scale: 0.9, opacity: 0, duration: 0.3, ease: 'power2.in' })
                .to(modalRef.current, { opacity: 0, duration: 0.2 }, "-=0.2");
        }
    };

    useEffect(() => {
        if (selectedItemSlug) {
            const item = data.find(i => i.slug === selectedItemSlug);
            if (item) setSelectedMember(item);
        } else {
            // Only clear it if it was previously set (to allow internal modal closing)
            if (selectedMember) {
                const tl = gsap.timeline({
                    onComplete: () => setSelectedMember(null)
                });
                tl.to(modalContentRef.current, { scale: 0.9, opacity: 0, duration: 0.3, ease: 'power2.in' })
                    .to(modalRef.current, { opacity: 0, duration: 0.2 }, "-=0.2");
            }
        }
    }, [selectedItemSlug, data]);

    useEffect(() => {
        if (selectedMember && modalRef.current && modalContentRef.current) {
            gsap.fromTo(modalRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.3 }
            );
            gsap.fromTo(modalContentRef.current,
                { scale: 0.9, opacity: 0, y: 20 },
                { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' }
            );
        }
    }, [selectedMember]);

    const handleCardMove: React.MouseEventHandler<HTMLElement> = e => {
        const card = e.currentTarget as HTMLElement;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    };

    return (
        <div
            ref={rootRef}
            className={`chroma-grid ${className} ${selectedMember ? 'modal-open' : ''}`}
            style={
                {
                    '--r': `${radius}px`,
                    '--cols': columns,
                    '--rows': rows
                } as React.CSSProperties
            }
            onPointerMove={handleMove}
            onPointerLeave={handleLeave}
        >
            {data.map((c, i) => (
                <article
                    key={i}
                    className="chroma-card"
                    onMouseMove={handleCardMove}
                    onClick={() => handleCardClick(c)}
                    style={
                        {
                            '--card-border': c.borderColor || 'transparent',
                            '--card-gradient': c.gradient,
                            cursor: 'pointer'
                        } as React.CSSProperties
                    }
                >
                    <div className="chroma-img-wrapper">
                        {c.isFlagship && <div className="flagship-badge">Flagship</div>}
                        <img src={c.image} alt={c.title} loading="lazy" />
                        {c.prizePool && <div className="prize-tag">Prize: {c.prizePool}</div>}
                        {c.entryFee && <div className="fee-tag">Fee: ₹{c.entryFee}</div>}
                    </div>
                    <footer className="chroma-info">
                        <h3 className="name">{c.title}</h3>
                        {c.handle && <span className="handle">{c.handle}</span>}
                        <p className="role">{c.subtitle}</p>
                        {c.location && <span className="location">{c.location}</span>}
                    </footer>
                </article>
            ))}
            <div className="chroma-overlay" />
            <div ref={fadeRef} className="chroma-fade" />

            {selectedMember && createPortal(
                <div className="chroma-modal-overlay" ref={modalRef} onClick={closePortal}>
                    <div className="chroma-modal-content" ref={modalContentRef} onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={closePortal}>×</button>
                        <div className="modal-main">
                            <div className="modal-image">
                                <img src={selectedMember.image} alt={selectedMember.title} />
                            </div>
                            <div className="modal-details">
                                <div className="modal-header-top">
                                    <span className="modal-loc">{selectedMember.location}</span>
                                    {selectedMember.prizePool && <span className="modal-prize-pool">Pool: {selectedMember.prizePool}</span>}
                                </div>
                                <h2>{selectedMember.title}</h2>
                                <div className="modal-meta">
                                    <span className="modal-role">{selectedMember.subtitle}</span>
                                    <span className="dot"></span>
                                    {selectedMember.url ? (
                                        <a href={selectedMember.url} target="_blank" rel="noopener noreferrer" className="modal-handle link">
                                            {selectedMember.handle}
                                        </a>
                                    ) : (
                                        <span className="modal-handle">{selectedMember.handle}</span>
                                    )}
                                </div>
                                <p className="modal-desc">
                                    {selectedMember.description}
                                </p>

                                {(selectedMember.coordinator || selectedMember.contactNumber) && (
                                    <div className="modal-coordinator">
                                        <div className="coord-label">Event Coordinator</div>
                                        <div className="coord-info">
                                            <span className="coord-name">{selectedMember.coordinator}</span>
                                            {selectedMember.contactNumber && (
                                                <a href={`tel:${selectedMember.contactNumber}`} className="coord-phone">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                                    {selectedMember.contactNumber}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <div className="modal-actions">
                                    {showRegister && (
                                        isRegistered ? (
                                            <button className="register-btn disabled" disabled title={`Already registered for ${registeredEventName}`}>
                                                Locked: {registeredEventName}
                                            </button>
                                        ) : (
                                            <Link 
                                                to={
                                                    selectedMember.slug === 'codex-26' ? '/hackathon-register' : 
                                                    selectedMember.slug === 'robotron-26' ? '/robotron-register' :
                                                    selectedMember.slug === 'battle-grid-26' ? '/esports-register' :
                                                    `/register/${selectedMember.slug || encodeURIComponent(selectedMember.title)}`
                                                } 
                                                className="register-btn"
                                            >
                                                Register Now
                                            </Link>
                                        )
                                    )}

                                    <div className="modal-socials">
                                        {selectedMember.socials?.linkedin && (
                                            <a href={selectedMember.socials.linkedin} target="_blank" rel="noopener noreferrer" className="social-icon-btn" title="LinkedIn">
                                                <SocialIcon type="linkedin" />
                                            </a>
                                        )}
                                        {selectedMember.socials?.twitter && (
                                            <a href={selectedMember.socials.twitter} target="_blank" rel="noopener noreferrer" className="social-icon-btn" title="X">
                                                <SocialIcon type="twitter" />
                                            </a>
                                        )}
                                        {selectedMember.socials?.instagram && (
                                            <a href={selectedMember.socials.instagram} target="_blank" rel="noopener noreferrer" className="social-icon-btn" title="Instagram">
                                                <SocialIcon type="instagram" />
                                            </a>
                                        )}
                                        {selectedMember.socials?.github && (
                                            <a href={selectedMember.socials.github} target="_blank" rel="noopener noreferrer" className="social-icon-btn gh" title="GitHub">
                                                <SocialIcon type="github" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ChromaGrid;
