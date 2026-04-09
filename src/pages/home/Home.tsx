import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SEO from '../../components/seo/SEO'
import StarBorder from '../../components/star-border/StarBorder'
import { Award, Cpu, Globe } from 'lucide-react'
import ChromaGrid from '../../components/chroma-grid/ChromaGrid'
import { COMPETITIONS_DATA } from '../../data/competitions'
import { useRegistrationGuard } from '../../hooks/useRegistrationGuard'

const zcoerLogo = `${import.meta.env.BASE_URL}assets/logos/ZCOER-Logo-White.webp`
const avishkarTitle = `${import.meta.env.BASE_URL}assets/logos/avishkar-white.webp`
const avishkarHeader = `${import.meta.env.BASE_URL}assets/logos/Avishkar '26 White.webp`

import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db } from '../../firebase/firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import GlitchText from '../../components/GlitchText/GlitchText'
import { useToast } from '../../components/toast/Toast'
import './Home.css'

const CountUp = ({ end, duration = 2000, suffix = "" }: { end: number, duration?: number, suffix?: string }) => {
  const [count, setCount] = useState(0)
  const countRef = useRef(0)
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const currentCount = Math.floor(progress * end)
      
      if (currentCount !== countRef.current) {
        countRef.current = currentCount
        setCount(currentCount)
      }

      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }
    window.requestAnimationFrame(step)
  }, [isVisible, end, duration])

  return <span ref={elementRef}>{count.toLocaleString()}{suffix}</span>
}

const ScratchDate = () => {
  const [isRevealed, setIsRevealed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    const lastScratched = localStorage.getItem('last_date_scratch');
    if (lastScratched) {
      const now = new Date().getTime();
      const timePassed = now - parseInt(lastScratched);
      if (timePassed < 24 * 60 * 60 * 1000) {
        setIsRevealed(true);
        return;
      }
    }
  }, []);

  useEffect(() => {
    if (isRevealed || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Match container size
    const resize = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Fill with scratch surface
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add some "noise/texture" to make it look premium
      ctx.fillStyle = '#222';
      for(let i=0; i<1000; i++) {
        ctx.fillRect(Math.random()*canvas.width, Math.random()*canvas.height, 2, 2);
      }
      
      ctx.font = '700 1.2rem Iceland';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';
      ctx.fillText('SCRATCH TO REVEAL', canvas.width/2, canvas.height/2 + 7);
    };

    resize();
    window.addEventListener('resize', resize);

    const getPos = (e: any) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const scratch = (e: any) => {
      if (!isDrawing.current) return;
      const pos = getPos(e);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 25, 0, Math.PI * 2);
      ctx.fill();
      checkReveal();
    };

    const checkReveal = () => {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      let transparent = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] === 0) transparent++;
      }
      const percentage = (transparent / (pixels.length / 4)) * 100;
      if (percentage > 45) {
        handleReveal();
      }
    };

    const handleReveal = () => {
      setIsRevealed(true);
      localStorage.setItem('last_date_scratch', new Date().getTime().toString());
    };

    const start = (e: any) => { isDrawing.current = true; scratch(e); };
    const end = () => isDrawing.current = false;

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', scratch);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start);
    canvas.addEventListener('touchmove', scratch);
    canvas.addEventListener('touchend', end);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', start);
      canvas.removeEventListener('mousemove', scratch);
    };
  }, [isRevealed]);

  return (
    <div className={`scratch-container ${isRevealed ? 'revealed' : ''}`} ref={containerRef}>
      <div className="scratch-content">
        <span className="event-date-text">23<sup>rd</sup> - 25<sup>th</sup> APRIL 2026</span>
      </div>
      {!isRevealed && <canvas ref={canvasRef} className="scratch-canvas" />}
    </div>
  );
};

function Home() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const toast = useToast();
  const { isRegistered, eventName } = useRegistrationGuard();
  
  // --- Void Walker Logic ---
  const [glitchActive, setGlitchActive] = useState(false);
  const [showVoidMsg, setShowVoidMsg] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [eggFound, setEggFound] = useState(false);
  const [alreadyHasBadge, setAlreadyHasBadge] = useState(false);
  const [engagementScore, setEngagementScore] = useState(0); 
  const holdTimerRef = useRef<any>(null);
  const hintTimeoutRef = useRef<any>(null);

  // --- Persistent Check ---
  useEffect(() => {
    if (user) {
      const checkBadgeStatus = async () => {
        try {
          const uSnap = await getDoc(doc(db, "user", user.uid));
          if (uSnap.exists() && uSnap.data()?.badges?.voidWalker?.unlocked) {
            setAlreadyHasBadge(true);
          }
        } catch (e) { console.error("Badge sync error", e); }
      };
      checkBadgeStatus();
    }
  }, [user]);
  // -------------------------

  const startGlitchTimer = () => {
    if (holdTimerRef.current) return;
    
    // Increment engagement on interact
    setEngagementScore(prev => prev + 1);

    holdTimerRef.current = setTimeout(() => {
      setGlitchActive(true);
      setShowHint(false); // Hide hint once glitch starts
      setEggFound(true);  // Permanently silence hint for session
      
      setTimeout(() => {
        setGlitchActive(false);
        unlockBadge();
        toast.success("Hey Pal, Go Check your Dashboard! 🚀");
      }, 2000);
    }, 3000);
  };

  const handleMouseEnter = () => {
    if (eggFound || alreadyHasBadge) return;
    // Start tracking for hint after 5 seconds of hovering
    hintTimeoutRef.current = setTimeout(() => {
      setShowHint(true);
    }, 5000);
  };

  const handleMouseLeave = () => {
    clearGlitchTimer();
    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current);
    }
  };

  // Trigger hint after 3 interactions too
  useEffect(() => {
    if (engagementScore >= 3 && !glitchActive && !eggFound && !alreadyHasBadge) {
      setShowHint(true);
    }
  }, [engagementScore, glitchActive, eggFound, alreadyHasBadge]);

  const clearGlitchTimer = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const unlockBadge = async () => {
    if (user) {
      try {
        const userRef = doc(db, 'user', user.uid);
        await updateDoc(userRef, {
          "badges.voidWalker": {
            unlocked: true,
            unlockedAt: new Date().toISOString()
          }
        });
        setShowVoidMsg(true);
        setTimeout(() => setShowVoidMsg(false), 6000);
      } catch (err) {
        console.error("Error bypassing protocol:", err);
      }
    }
  };
  // -------------------------

  const flagshipCompetitions = COMPETITIONS_DATA.filter((item: any) => item.isFlagship);

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  useEffect(() => {
    const eventDate = new Date('April 23, 2026 00:00:00').getTime()

    const timer = setInterval(() => {
      const now = new Date().getTime()
      const difference = eventDate - now

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        })
      } else {
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <>
      <SEO 
        title="Avishkar '26 | The Premier Technology Festival by ZCOER" 
        description="Avishkar '26 is the premier technology festival organized by Zeal College of Engineering and Research, Pune. Explore 50+ workshops, coding hackathons, and a ₹5 Lakh+ prize pool." 
      />
      
      {/* --- HERO SECTION --- */}
      <section className="hero" id="home">
        <div className="hero__content">
          <button className="hero__logo-btn" onClick={() => window.open('https://zcoer.in/', '_blank')}>
            <img src={zcoerLogo} alt="ZCOER" className="hero__zcoer-logo" />
          </button>
          
          <div 
            className="glitch-logo-container"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onPointerDown={startGlitchTimer} 
            onPointerUp={clearGlitchTimer}
            style={{ position: 'relative', height: 'fit-content' }}
          >
            {showHint && !glitchActive && (
              <div className="logo-hint-bubble">
                Wanna see something useless? <br/>
                <span>{('ontouchstart' in window) ? 'Tap' : 'Click'} and hold this for few seconds</span>
              </div>
            )}
            
            {!glitchActive ? (
              <img 
                src={avishkarTitle} 
                alt="AVISHKAR '26" 
                className="hero__title" 
                style={{ opacity: 1, transition: 'opacity 0.3s ease' }}
              />
            ) : (
              <GlitchText
                speed={0.3}
                enableShadows
                className="hero__glitch-title"
              >
                AVISHKAR '26
              </GlitchText>
            )}
          </div>
          
          <div className="hero__countdown">
            {/* ... countdown items ... */}
            <div className="countdown-item">
              <span className="countdown-value">{timeLeft.days.toString().padStart(2, '0')}</span>
              <span className="countdown-label">Days</span>
            </div>
            <div className="countdown-separator">:</div>
            <div className="countdown-item">
              <span className="countdown-value">{timeLeft.hours.toString().padStart(2, '0')}</span>
              <span className="countdown-label">Hours</span>
            </div>
            <div className="countdown-separator">:</div>
            <div className="countdown-item">
              <span className="countdown-value">{timeLeft.minutes.toString().padStart(2, '0')}</span>
              <span className="countdown-label">Mins</span>
            </div>
            <div className="countdown-separator">:</div>
            <div className="countdown-item">
              <span className="countdown-value">{timeLeft.seconds.toString().padStart(2, '0')}</span>
              <span className="countdown-label">Secs</span>
            </div>
          </div>

          <ScratchDate />

          <div className="home-arenas">
            <div className="arena-header">
              <span className="arena-label">The Flagships</span>
              <h2>3 CORE ARENAS</h2>
              <div className="arena-line"></div>
            </div>
            <div className="home-competitions-container">
              <ChromaGrid 
                items={flagshipCompetitions}
                radius={400}
                damping={0.5}
                fadeOut={0.8}
                columns={3}
                isRegistered={isRegistered}
                registeredEventName={eventName}
                disableModal={true}
                onItemClick={(item) => {
                  if (item.slug === 'param-x-26') {
                    navigate('/param-x');
                  } else if (item.slug === 'battle-grid-26') {
                    navigate('/battle-grid');
                  } else if (item.slug === 'robotron-26') {
                    navigate('/robo-kshetra');
                  } else {
                    navigate('/competitions');
                  }
                }}
              />
            </div>
          </div>
          
          <div className="arena-ctas">
            <Link to="/workshops" className="arena-cta secondary">
              <span>WORKSHOPS</span>
            </Link>
            <Link to="/signup" className="arena-cta primary">
              <div className="cta-content">
                <span>GET STARTED</span>
                <div className="cta-glow"></div>
              </div>
            </Link>
            <Link to="/competitions" className="arena-cta secondary">
              <span>COMPETITIONS</span>
            </Link>
          </div>

          {/* --- WHAT IS AVISHKAR (CENTERED) --- */}
          <div className="hero__about">
            <div className="hero__about-content">
              <h2 className="hero__about-title">
                <span className="hero__about-prefix">What is</span>
                <img src={avishkarHeader} alt="AVISHKAR '26" className="hero__about-logo" />
              </h2>
            </div>
            
            <div className="hero__about-video-placeholder">
              <StarBorder as="div" color="#5227FF" speed="6s" thickness={2} borderRadius={32}>
                <div className="video-teaser">
                  <div className="teaser-content">
                    <div className="teaser-icon">
                      <div className="play-ring"></div>
                    </div>
                    <span className="teaser-text">You'll Know Very Soon...</span>
                  </div>
                </div>
              </StarBorder>
            </div>

            <p className="hero__about-description">
              AVISHKAR ’26 is not just a technical festival—it is an ecosystem built to cultivate innovation, collaboration, and engineering excellence. 
              At ZCOER, Pune, we are building a legacy-driven platform where technology meets purpose. AVISHKAR empowers participants to move beyond learning and step into creation.
            </p>
          </div>
        </div>
      </section>

      {/* --- CORE PILLARS SECTION --- */}
      <section className="pillars">
        <div className="pillars__header">
          <h2 className="section-title">Core Pillars</h2>
          <p className="section-subtitle">Why participate in AVISHKAR '26?</p>
        </div>
        <div className="pillars__grid">
          <div className="pillar-card">
            <div className="pillar-icon"><Award size={32} /></div>
            <h3>Elite Competition</h3>
            <p>Compete at the highest level across multi-disciplinary challenges designed to test real-world problem-solving and innovation.</p>
          </div>
          <div className="pillar-card">
            <div className="pillar-icon"><Cpu size={32} /></div>
            <h3>Hands-on Mastery</h3>
            <p>Engage in immersive workshops and live builds that transform theoretical knowledge into practical expertise.</p>
          </div>
          <div className="pillar-card">
            <div className="pillar-icon"><Globe size={32} /></div>
            <h3>Future-Ready Network</h3>
            <p>Connect with innovators, industry experts, and like-minded creators shaping the next wave of technology.</p>
          </div>
        </div>
      </section>

      {/* --- STATS SECTION --- */}
      <section className="stats">
        <div className="stats__container">
          <div className="stats__item">
            <h3 className="stats__number"><CountUp end={50} suffix="+" /></h3>
            <p className="stats__label">Workshops</p>
          </div>
          <div className="stats__item">
            <h3 className="stats__number"><CountUp end={10000} suffix="+" /></h3>
            <p className="stats__label">Expected Footfall</p>
          </div>
          <div className="stats__item">
            <h3 className="stats__number"><span className="stats__currency">₹</span><CountUp end={5} suffix="L+" /></h3>
            <p className="stats__label">Prize Pool</p>
          </div>
          <div className="stats__item">
            <h3 className="stats__number"><CountUp end={200} suffix="+" /></h3>
            <p className="stats__label">Organizers</p>
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="final-cta">
        <div className="final-cta__glass">
          <h2>Step into the future.</h2>
          <p>Build your legacy at AVISHKAR ’26.</p>
          <Link to="/login" className="final-cta-btn">Join the Ecosystem</Link>
        </div>
      </section>

      {/* --- VOID WALKER NOTIFICATION --- */}
      {showVoidMsg && (
        <div className="void-walker-msg">
          <h4>[PROTOCOL BYPASSED]</h4>
          <p>VOID WALKER BADGE UNLOCKED</p>
        </div>
      )}
    </>
  )
}

export default Home
