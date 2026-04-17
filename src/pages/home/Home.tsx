import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import SEO from '../../components/seo/SEO';
import './Home.css';
import MagicBento from './MagicBento';

export default function Home() {
  return (
    <>
      <SEO 
        title="Avishkar '26 | The Tech Ecosystem" 
        description="Welcome to Avishkar '26, the ultimate tech ecosystem by ZCOER."
      />
      
      <div className="home-container">
        
        {/* Simple hero section with logo */}
        <section className="home-hero">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="home-hero-logo-wrapper"
          >
            <a href="https://zcoer.in" target="_blank" rel="noopener noreferrer" className="home-hero-zcoer-link">
              <img 
                src={`${import.meta.env.BASE_URL}assets/logos/ZCOER-Logo-White.webp`} 
                alt="ZCOER Logo" 
                className="home-hero-zcoer-logo"
              />
            </a>
            <img 
              src={`${import.meta.env.BASE_URL}assets/logos/avishkar-white.webp`} 
              alt="Avishkar 26" 
              className="home-hero-logo"
            />
            <div className="home-hero-dates">
              23 - 25 April 2026
            </div>
            
            <div className="home-hero-cta-group">
              <Link to="/competitions" className="home-btn home-btn-primary">
                Explore Events
              </Link>
              <Link to="/schedule" className="home-btn home-btn-secondary">
                View Schedule
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Bento Grid section below */}
        <section className="home-bento-section">
          <div className="home-bento-container">
            <h2 className="home-section-title">Explore The Ecosystem</h2>
            <MagicBento 
              textAutoHide={true}
              enableStars={true}
              enableSpotlight={true}
              enableBorderGlow={true}
              enableTilt={false}
              enableMagnetism={false}
              clickEffect={true}
              spotlightRadius={400}
              particleCount={12}
              glowColor="132, 0, 255"
              disableAnimations={false}
            />
          </div>
        </section>

      </div>
    </>
  );
}
