import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ParamXGlassOpening.css';

interface ParamXGlassOpeningProps {
    isOpen: boolean;
    onComplete?: () => void;
}

const ParamXGlassOpening: React.FC<ParamXGlassOpeningProps> = ({ isOpen, onComplete }) => {
    return (
        <AnimatePresence onExitComplete={onComplete}>
            {!isOpen && (
                <motion.div 
                    className="glass-overlay"
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                >
                    {/* Top Panel */}
                    <motion.div 
                        className="glass-panel top-panel"
                        initial={{ y: 0 }}
                        exit={{ y: '-100%' }}
                        transition={{ duration: 1.2, ease: [0.6, 0.01, -0.05, 0.95] }}
                    >
                        <div className="panel-blur" />
                        <div className="panel-content">
                            <motion.h2 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                PARAM-X
                            </motion.h2>
                        </div>
                    </motion.div>

                    {/* Bottom Panel */}
                    <motion.div 
                        className="glass-panel bottom-panel"
                        initial={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ duration: 1.2, ease: [0.6, 0.01, -0.05, 0.95] }}
                    >
                        <div className="panel-blur" />
                        <div className="panel-content">
                            <motion.div 
                                className="status-indicator"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.5 }}
                                transition={{ delay: 0.8 }}
                            >
                                <span className="pulse-dot"></span>
                                READY_FOR_DECRYPTION
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Center Line / Laser */}
                    <motion.div 
                        className="horizontal-divider"
                        exit={{ scaleX: 0, opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ParamXGlassOpening;
