import React, { useState, useEffect } from 'react';
import SEO from '../../components/seo/SEO';
import './Fahhh.css';

const Fahhh: React.FC = () => {
    // Current playing index to track which one needs to stay alive
    const [playingIndex, setPlayingIndex] = useState<number | null>(null);
    // Refresh keys for each iframe to force re-render (and thus stop audio)
    const [refreshKeys, setRefreshKeys] = useState<number[]>(new Array(11).fill(0));

    const soundButtons = [
        "https://www.myinstants.com/instant/faaah-63455/embed/",
        "https://www.myinstants.com/instant/fart/embed/",
        "https://www.myinstants.com/instant/vine-boom-sound-70972/embed/",
        "https://www.myinstants.com/instant/among-us-role-reveal-sound-34956/embed/",
        "https://www.myinstants.com/instant/chalo-9295/embed/",
        "https://www.myinstants.com/instant/tudum-tedev-97332/embed/",
        "https://www.myinstants.com/instant/spiderman-meme-song-37638/embed/",
        "https://www.myinstants.com/instant/dexter-meme-26140/embed/",
        "https://www.myinstants.com/instant/rizz-sound-effect-54189/embed/",
        "https://www.myinstants.com/instant/eh-eh-ehhhh-30930/embed/",
        "https://www.myinstants.com/instant/mac-quack-83896/embed/"
    ];

    useEffect(() => {
        const handleBlur = () => {
            // Wait a tiny bit for document.activeElement to update
            setTimeout(() => {
                if (document.activeElement instanceof HTMLIFrameElement) {
                    const src = document.activeElement.src;
                    const index = soundButtons.findIndex(s => s === src);
                    
                    if (index !== -1) {
                        // User clicked a NEW button
                        // Increment refresh keys for all OTHER buttons to stop them
                        setRefreshKeys(prev => prev.map((key, i) => i === index ? key : key + 1));
                        setPlayingIndex(index);
                    }
                }
            }, 100);
        };

        window.addEventListener('blur', handleBlur);
        return () => window.removeEventListener('blur', handleBlur);
    }, []);

    return (
        <div className="fahhh-container">
            <SEO title="fahhh..." description="..." />
            <div className="fahhh-header">
                <h1>fahhh...</h1>
                <p>Useless buttons. Enjoy the chaos.</p>
            </div>
            
            <div className="iframes-grid">
                {soundButtons.map((src, index) => (
                    <div 
                        key={`${index}-${refreshKeys[index]}`} 
                        className={`iframe-wrapper ${playingIndex === index ? 'active' : ''}`}
                    >
                        <iframe 
                            width="110" 
                            height="200" 
                            src={src} 
                            frameBorder="0" 
                            scrolling="no"
                            title={`sound-button-${index}`}
                            className="dark-button-iframe"
                        ></iframe>
                    </div>
                ))}
            </div>

            <div className="fahhh-footer">
                <a href="/">← Go back to reality</a>
            </div>
        </div>
    );
};

export default Fahhh;
