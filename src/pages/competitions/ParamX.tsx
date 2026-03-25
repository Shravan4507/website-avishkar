import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import SEO from '../../components/seo/SEO';
import GlassSelect from '../../components/dropdown/GlassSelect';
import { fetchProblemStatements, type ProblemStatement } from '../../utils/storageUtils';
import { Search, Filter, ArrowRight, Info, Loader2 } from 'lucide-react';
import './ParamX.css';

const ParamX: React.FC = () => {
    const navigate = useNavigate();
    const [problems, setProblems] = useState<ProblemStatement[]>([]);
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDomain, setSelectedDomain] = useState('All');

    // Default limit per PS (as per SIH example in user's image)
    const MAX_SLOTS = 500;

    useEffect(() => {
        const loadData = async () => {
            try {
                const psData = await fetchProblemStatements();
                setProblems(psData);
            } catch (err) {
                console.error("Error loading problem statements:", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();

        // Real-time counts from Firestore
        const unsubscribe = onSnapshot(collection(db, "ps_metadata"), (snapshot) => {
            const newCounts: Record<string, number> = {};
            snapshot.forEach(doc => {
                newCounts[doc.id] = doc.data().count || 0;
            });
            setCounts(newCounts);
        });

        return () => unsubscribe();
    }, []);

    const filteredProblems = problems.filter(ps => {
        const matchesSearch = ps.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              ps.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDomain = selectedDomain === 'All' || ps.domain === selectedDomain;
        return matchesSearch && matchesDomain;
    });

    const domains = ['All', ...new Set(problems.map(p => p.domain))];

    if (loading) return <div className="loader-container"><Loader2 className="spinner" /></div>;

    return (
        <div className="paramx-page">
            <SEO 
                title="ParamX '26 | Problem Statements" 
                description="Explore technical challenges for ParamX '26 hackathon. Solve real-world issues across domains like AI, Robotics, and IT."
            />
            
            <div className="paramx-hero">
                <h1>ParamX Problem Portal</h1>
                <p>Browse official challenges and track slot availability in real-time.</p>
            </div>

            <div className="paramx-controls">
                <div className="search-box">
                    <Search size={20} />
                    <input 
                        type="text" 
                        placeholder="Search by ID or Title..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-box">
                    <Filter size={18} />
                    <GlassSelect 
                        options={domains.map(d => ({ value: d, label: d === 'All' ? 'All Domains' : d }))}
                        value={selectedDomain}
                        onChange={setSelectedDomain}
                        placeholder="Filter by Domain"
                    />
                </div>
            </div>

            <div className="table-container desktop-only">
                <table className="paramx-table">
                    <thead>
                        <tr>
                            <th>S.No.</th>
                            <th>PS ID</th>
                            <th>Problem Statement Title</th>
                            <th>Domain</th>
                            <th>Slots Used</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProblems.map((ps, idx) => {
                            const currentCount = counts[ps.id] || 0;
                            const isFull = currentCount >= MAX_SLOTS;

                            return (
                                <tr key={ps.id} className="ps-row">
                                    <td className="center">{idx + 1}</td>
                                    <td className="ps-id">{ps.id}</td>
                                    <td className="ps-title-cell">
                                        <div className="ps-title">{ps.title}</div>
                                        <div className="ps-objective-preview">{ps.objective.slice(0, 100)}...</div>
                                    </td>
                                    <td className="center">
                                        <span className="domain-pill">{ps.domain}</span>
                                    </td>
                                    <td className="center">
                                        <div className="slot-counter">
                                            <div className="slot-bar">
                                                <div 
                                                    className="slot-fill" 
                                                    style={{ width: `${(currentCount / MAX_SLOTS) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="slot-text">{currentCount} / {MAX_SLOTS}</span>
                                        </div>
                                    </td>
                                    <td className="center">
                                        <button 
                                            className={`register-cta ${isFull ? 'disabled' : ''}`}
                                            disabled={isFull}
                                            onClick={() => navigate(`/hackathon-register?psId=${ps.id}`)}
                                        >
                                            {isFull ? 'Full' : 'Register'} <ArrowRight size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="mobile-only ps-card-list">
                {filteredProblems.map((ps) => {
                    const currentCount = counts[ps.id] || 0;
                    const isFull = currentCount >= MAX_SLOTS;

                    return (
                        <div key={ps.id} className="ps-mobile-card">
                            <div className="ps-card-header">
                                <span className="ps-id">{ps.id}</span>
                                <span className="domain-pill">{ps.domain}</span>
                            </div>
                            <h3 className="ps-title">{ps.title}</h3>
                            <p className="ps-objective-preview">{ps.objective.slice(0, 120)}...</p>
                            
                            <div className="ps-card-footer">
                                <div className="slot-counter">
                                    <div className="slot-bar">
                                        <div 
                                            className="slot-fill" 
                                            style={{ width: `${(currentCount / MAX_SLOTS) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="slot-text">{currentCount} / {MAX_SLOTS} slots used</span>
                                </div>
                                <button 
                                    className={`register-cta ${isFull ? 'disabled' : ''}`}
                                    disabled={isFull}
                                    onClick={() => navigate(`/hackathon-register?psId=${ps.id}`)}
                                >
                                    {isFull ? 'Full' : 'Register'} <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredProblems.length === 0 && (
                <div className="empty-state">
                    <Info size={48} />
                    <h3>No problem statements found matching your criteria.</h3>
                </div>
            )}
        </div>
    );
};

export default ParamX;
