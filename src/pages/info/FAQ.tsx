import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, CreditCard, Wrench, Coffee } from 'lucide-react';
import { useBugReport } from '../../components/BugReport/BugReport';
import './FAQ.css';

interface FAQItemProps {
    question: string;
    answer: string;
    isOpen: boolean;
    onClick: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, onClick }) => {
    return (
        <div className={`faq-item ${isOpen ? 'active' : ''}`} onClick={onClick}>
            <div className="faq-question">
                <span>{question}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    <ChevronDown size={20} />
                </motion.div>
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="faq-answer-wrapper"
                    >
                        <div className="faq-answer">
                            <p>{answer}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const FAQ: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const { openBugReport } = useBugReport();

    const faqData = [
        {
            category: "General",
            icon: <HelpCircle size={20} />,
            questions: [
                {
                    q: "What is Avishkar '26?",
                    a: "Avishkar is the flagship annual technical festival of Zeal College of Engineering and Research, Pune. It's a premier platform for students to showcase their technical prowess through high-stakes competitions, hands-on workshops, and insightful seminars."
                },
                {
                    q: "When and where is the event being held?",
                    a: "Avishkar '26 is scheduled for April 23-25, 2026. All primary events take place at the Zeal College of Engineering and Research campus in Narhe, Pune. Exact dates for specific events can be found on the 'Schedule' page."
                },
                {
                    q: "Who can participate?",
                    a: "Undergraduate and postgraduate students from any recognized educational institution are eligible to participate. We welcome innovators from all disciplines!"
                }
            ]
        },
        {
            category: "Registrations & Payments",
            icon: <CreditCard size={20} />,
            questions: [
                {
                    q: "How do I register for events?",
                    a: "First, sign up for a student account to get your unique Avishkar ID (AVR-ID). Once you're logged in, navigate to 'Competitions' or 'Workshops', select your preferred event, and click the register button."
                },
                {
                    q: "Is there a registration fee?",
                    a: "Registration fees vary by event. Some technical tracks are free, while flagship competitions like Robo-Kshetra or Hackathons have nominal fees to cover infrastructure and prize pools. Check the individual event pages for details."
                },
                {
                    q: "Can I participate in multiple events?",
                    a: "Yes, you can register for multiple events. However, please ensure that their timings do not clash by referring to the master schedule."
                },
                {
                    q: "What should I do if my payment fails?",
                    a: "If money is deducted but registration isn't confirmed, please wait 24 hours for the system to sync. Most failed transactions are automatically refunded by Easebuzz. If the issue persists, use the 'Report a Bug' button in the footer for priority support."
                }
            ]
        },
        {
            category: "Technical & Accounts",
            icon: <Wrench size={20} />,
            questions: [
                {
                    q: "What is an AVR-ID?",
                    a: "Your Avishkar ID (AVR-ID) is a unique identifier assigned to every participant. It is used for all registrations, team formations (Squads), and attendance tracking during the festival."
                },
                {
                    q: "How do I create a Squad?",
                    a: "For team events, the team lead can initiate registration and add members by entering their AVR-IDs. Ensure your teammates have already signed up on the platform before adding them."
                }
            ]
        },
        {
            category: "Hospitality & Certificates",
            icon: <Coffee size={20} />,
            questions: [
                {
                    q: "Is accommodation provided for outstation participants?",
                    a: "Limited accommodation is available for participants traveling from outside Pune. This is provided on a first-come, first-served basis. You can request accommodation through the 'Contact' page after completing your registration."
                },
                {
                    q: "When and how will I receive my certificate?",
                    a: "E-certificates for participation and achievement will be available for download directly from your User Dashboard within 7 days after the event concludes."
                }
            ]
        }
    ];

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    let globalCounter = 0;

    return (
        <div className="faq-page-container">
            <Helmet>
                <title>FAQ | Avishkar '26</title>
                <meta name="description" content="Frequently Asked Questions about Avishkar '26 technical festival. Get help with registration, payments, and event details." />
            </Helmet>

            <div className="faq-glass-bg"></div>

            <div className="faq-content">
                <header className="faq-header animate-in">
                    <span className="faq-subtitle">Support Center</span>
                    <h1 className="faq-title">Frequently Asked Questions</h1>
                    <p className="faq-description">
                        Everything you need to know about the festival. Can't find what you're looking for? Reach out to our technical team.
                    </p>
                </header>

                <div className="faq-grid">
                    {faqData.map((section, sectionIdx) => (
                        <div key={sectionIdx} className="faq-section animate-in" style={{ animationDelay: `${sectionIdx * 0.1}s` }}>
                            <div className="faq-category-header">
                                <span className="faq-category-icon">{section.icon}</span>
                                <h2>{section.category}</h2>
                            </div>
                            <div className="faq-list">
                                {section.questions.map((item, itemIdx) => {
                                    const currentIndex = globalCounter++;
                                    return (
                                        <FAQItem
                                            key={itemIdx}
                                            question={item.q}
                                            answer={item.a}
                                            isOpen={openIndex === currentIndex}
                                            onClick={() => toggleFAQ(currentIndex)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <footer className="faq-cta animate-in">
                    <p>Still have questions?</p>
                    <div className="faq-cta-btns">
                        <a href="/contact" className="faq-cta-btn primary">Contact Support</a>
                        <button onClick={openBugReport} className="faq-cta-btn secondary">Report an Issue</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default FAQ;
