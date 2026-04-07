import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    ArrowLeft, Book, Users, Award, Zap, CheckCircle2,
    Trophy, FileText, ChevronDown, Phone, Download, Search, X
} from 'lucide-react';
import SEO from '../../components/seo/SEO';
import { RULES_DATA, getAllRules, type CompetitionRules } from '../../data/rulesData';
import './Rules.css';

/* ── Category labels & accent colours ── */
const CATEGORY_META: Record<string, { label: string; accent: string }> = {
    flagship: { label: 'Flagship', accent: '#a78bfa' },
    standard: { label: 'Competition', accent: '#5227ff' },
    general: { label: 'General', accent: '#10b981' },
};

/* ── Section icon mapping ── */
const sectionIcon = (key: string) => {
    switch (key) {
        case 'rules':     return <Book size={22} />;
        case 'procedure': return <Zap size={22} />;
        case 'judging':   return <Award size={22} />;
        case 'prizes':    return <Trophy size={22} />;
        case 'contacts':  return <Phone size={22} />;
        default:          return <FileText size={22} />;
    }
};

const Rules: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const compSlug = searchParams.get('comp');
    const [searchTerm, setSearchTerm] = useState('');
    const detailRef = useRef<HTMLDivElement>(null);

    // Resolve active competition
    const activeComp: CompetitionRules | null = useMemo(
        () => (compSlug ? RULES_DATA[compSlug] ?? null : null),
        [compSlug]
    );

    // Scroll to top when a competition is selected
    useEffect(() => {
        if (activeComp && detailRef.current) {
            detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [activeComp]);

    // Filtered list for the search bar
    const allRules = useMemo(() => getAllRules(), []);
    const filteredComps = useMemo(() => {
        if (!searchTerm.trim()) return allRules;
        const q = searchTerm.toLowerCase();
        return allRules.filter(
            c => c.name.toLowerCase().includes(q) ||
                 c.category.toLowerCase().includes(q) ||
                 (c.tagline ?? '').toLowerCase().includes(q)
        );
    }, [searchTerm, allRules]);

    // Group by category for grid
    const grouped = useMemo(() => {
        const groups: Record<string, CompetitionRules[]> = {};
        for (const c of filteredComps) {
            (groups[c.category] ??= []).push(c);
        }
        return groups;
    }, [filteredComps]);

    const handleSelect = (slug: string) => {
        setSearchParams({ comp: slug });
    };

    const handleClear = () => {
        setSearchParams({});
    };

    return (
        <div className="unified-rules-page">
            <SEO
                title="Rules & Guidelines | Avishkar '26"
                description="Complete rules, eligibility, and judging criteria for every Avishkar '26 competition."
            />

            {/* ── Detail View ── */}
            {activeComp ? (
                <div className="rules-detail" ref={detailRef}>
                    <button className="rules-back-btn" onClick={handleClear}>
                        <ArrowLeft size={18} /> All Competitions
                    </button>

                    <header className="rules-detail-header">
                        <span
                            className="rules-category-pill"
                            style={{ '--pill-accent': CATEGORY_META[activeComp.category]?.accent ?? '#5227ff' } as React.CSSProperties}
                        >
                            {CATEGORY_META[activeComp.category]?.label ?? activeComp.category}
                        </span>
                        <h1>{activeComp.name}</h1>
                        {activeComp.tagline && <p className="rules-tagline">{activeComp.tagline}</p>}
                        <p className="rules-desc">{activeComp.description}</p>
                    </header>

                    {/* Quick-info strip */}
                    <div className="rules-quick-info">
                        <div className="rules-info-chip">
                            <Users size={16} />
                            <span>{activeComp.teamSize}</span>
                        </div>
                        <div className="rules-info-chip">
                            <Trophy size={16} />
                            <span>{activeComp.fee}</span>
                        </div>
                        {activeComp.duration && (
                            <div className="rules-info-chip">
                                <Zap size={16} />
                                <span>{activeComp.duration}</span>
                            </div>
                        )}
                    </div>

                    {/* Sections grid */}
                    <div className="rules-sections-grid">
                        {/* Rules */}
                        <div className="rules-section-card">
                            <div className="rules-section-icon">{sectionIcon('rules')}</div>
                            <h2>Rules</h2>
                            <ul>
                                {activeComp.rules.map((r, i) => (
                                    <li key={i}>
                                        <CheckCircle2 size={14} className="rules-check" />
                                        <span>{r}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Procedure */}
                        <div className="rules-section-card">
                            <div className="rules-section-icon">{sectionIcon('procedure')}</div>
                            <h2>Procedure</h2>
                            <ol>
                                {activeComp.procedure.map((p, i) => (
                                    <li key={i}><span>{p}</span></li>
                                ))}
                            </ol>
                        </div>

                        {/* Judging */}
                        <div className="rules-section-card">
                            <div className="rules-section-icon">{sectionIcon('judging')}</div>
                            <h2>Judging Criteria</h2>
                            <ul>
                                {activeComp.judgingCriteria.map((j, i) => (
                                    <li key={i}>
                                        <Award size={14} className="rules-check rules-check--gold" />
                                        <span>{j}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>



                        {/* Coordinators */}
                        {activeComp.coordinators && (
                            <div className="rules-section-card">
                                <div className="rules-section-icon">{sectionIcon('contacts')}</div>
                                <h2>Coordinators</h2>
                                {activeComp.coordinators.student && (
                                    <>
                                        <h3 className="rules-coord-label">Student Coordinators</h3>
                                        <ul>
                                            {activeComp.coordinators.student.map((s, i) => (
                                                <li key={i}><Phone size={14} className="rules-check" /><span>{s}</span></li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                                {activeComp.coordinators.faculty && (
                                    <>
                                        <h3 className="rules-coord-label">Faculty Coordinators</h3>
                                        <ul>
                                            {activeComp.coordinators.faculty.map((f, i) => (
                                                <li key={i}><Phone size={14} className="rules-check" /><span>{f}</span></li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Download rulebook CTA */}
                    {(activeComp.rulebookPath || activeComp.rulebookComingSoon) && (
                        <div className="rules-download-bar">
                            {activeComp.rulebookComingSoon ? (
                                <button className="rules-download-btn rules-download-btn--coming-soon" disabled>
                                    <Download size={18} />
                                    Rulebook Coming Soon
                                </button>
                            ) : (
                                <a
                                    href={activeComp.rulebookPath}
                                    download
                                    className="rules-download-btn"
                                >
                                    <Download size={18} />
                                    Download Full Rulebook (PDF)
                                </a>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                /* ── Grid / Selector View ── */
                <div className="rules-selector">
                    <header className="rules-selector-header">
                        <h1>Rules & Guidelines</h1>
                        <p>Select a competition to view its complete rules, procedure, and judging criteria.</p>
                    </header>

                    {/* Search bar */}
                    <div className="rules-search-wrap">
                        <Search size={18} className="rules-search-icon" />
                        <input
                            type="text"
                            placeholder="Search competitions..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="rules-search-input"
                        />
                        {searchTerm && (
                            <button className="rules-search-clear" onClick={() => setSearchTerm('')}>
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Grouped cards */}
                    {Object.entries(grouped).map(([cat, comps]) => (
                        <section key={cat} className="rules-category-section">
                            <h2 className="rules-category-title">
                                <span
                                    className="rules-cat-dot"
                                    style={{ background: CATEGORY_META[cat]?.accent ?? '#5227ff' }}
                                />
                                {CATEGORY_META[cat]?.label ?? cat}
                            </h2>
                            <div className="rules-comp-grid">
                                {comps.map(c => (
                                    <button
                                        key={c.slug}
                                        className="rules-comp-card"
                                        onClick={() => handleSelect(c.slug)}
                                        style={{ '--card-accent': CATEGORY_META[c.category]?.accent ?? '#5227ff' } as React.CSSProperties}
                                    >
                                        <div className="rules-comp-card-inner">
                                            <h3>{c.name}</h3>
                                            {c.tagline && <p className="rules-comp-tagline">{c.tagline}</p>}
                                            <div className="rules-comp-meta">
                                                <span><Users size={13} /> {c.teamSize}</span>
                                                <span><Trophy size={13} /> {c.fee}</span>
                                            </div>
                                        </div>
                                        <ChevronDown size={18} className="rules-comp-arrow" />
                                    </button>
                                ))}
                            </div>
                        </section>
                    ))}

                    {filteredComps.length === 0 && (
                        <p className="rules-no-results">No competitions match your search.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Rules;
