import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './GDGTransition.css';

const GDGTransition: React.FC = () => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 2000); // Allow time for full animation

        return () => clearTimeout(timer);
    }, []);

    const bars = [
        { color: '#ea4335', direction: 1 },  // Red (Slide Right)
        { color: '#4285f4', direction: -1 }, // Blue (Slide Left)
        { color: '#34a853', direction: 1 },  // Green (Slide Right)
        { color: '#f9ab00', direction: -1 }  // Yellow (Slide Left)
    ];

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div 
                    className="gdg-transition-overlay"
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, delay: 1 }}
                >
                    {bars.map((bar, idx) => (
                        <motion.div
                            key={idx}
                            className="transition-bar"
                            style={{ backgroundColor: bar.color }}
                            initial={{ x: 0 }}
                            animate={{ 
                                x: bar.direction === 1 ? '100%' : '-100%' 
                            }}
                            transition={{ 
                                duration: 1, 
                                ease: [0.645, 0.045, 0.355, 1], // easeInOutQuart
                                delay: 0.2 + (idx * 0.1) 
                            }}
                        />
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GDGTransition;
