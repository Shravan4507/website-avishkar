import { useState, useEffect, useRef } from 'react'
import SEO from '../../components/seo/SEO'
import StarBorder from '../../components/star-border/StarBorder'
const zcoerLogo = `${import.meta.env.BASE_URL}assets/logos/ZCOER-Logo-White.png`
const avishkarTitle = `${import.meta.env.BASE_URL}assets/logos/avishkar-white.png`
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

function Home() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  useEffect(() => {
    const eventDate = new Date('April 09, 2026 00:00:00').getTime()

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
      <section className="hero" id="home">
        <div className="hero__content">
          <button className="hero__logo-btn" onClick={() => window.open('https://zcoer.in/', '_blank')}>
            <img
              src={zcoerLogo}
              alt="ZCOER"
              className="hero__zcoer-logo"
            />
          </button>
          <img
            src={avishkarTitle}
            alt="AVISHKAR '26"
            className="hero__title"
          />
          
          <div className="hero__countdown">
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
          <div className="hero__cta-group">
            <div className="hero__cta">
              <a href="/login" className="hero__cta-link">
                Get Started
              </a>
            </div>
            <div className="hero__explore">
              <a href="#about" className="hero__explore-link">
                Explore
              </a>
            </div>
          </div>
        </div>

        <div className="hero__ticker">
          <div className="hero__ticker-track">
            <span>ROBO-SUMO REGISTRATIONS OPEN!</span>
            <span className="ticker-dot">•</span>
            <span>50+ COLLEGES PARTICIPATING</span>
            <span className="ticker-dot">•</span>
            <span>CODE SPRINT: ₹50K PRIZE POOL</span>
            <span className="ticker-dot">•</span>
            <span>TOTAL PRIZES WORTH ₹5 LAKHS+</span>
            <span className="ticker-dot">•</span>
            {/* Repeat for seamless loop */}
            <span>ROBO-SUMO REGISTRATIONS OPEN!</span>
            <span className="ticker-dot">•</span>
            <span>50+ COLLEGES PARTICIPATING</span>
            <span className="ticker-dot">•</span>
            <span>CODE SPRINT: ₹50K PRIZE POOL</span>
            <span className="ticker-dot">•</span>
            <span>TOTAL PRIZES WORTH ₹5 LAKHS+</span>
            <span className="ticker-dot">•</span>
          </div>
        </div>
      </section>

      <section className="about" id="about">
        <div className="about__content">
          <h2 className="about__title">
            <span className="about__title-text">What is</span>
            <img
              src={avishkarTitle}
              alt="AVISHKAR '26"
              className="about__title-logo"
            />
          </h2>
          <p className="about__description">
            AVISHKAR '26 is the annual technical festival of Zeal College of Engineering and Research, Pune.
            It brings together brilliant minds from across the nation to compete, innovate, and celebrate
            the spirit of technology and creativity. From intense coding battles to innovative robotics
            challenges, AVISHKAR offers a platform for students to showcase their talents and push the
            boundaries of what's possible.
          </p>
        </div>
        <div className="about__image-wrapper">
          <StarBorder
            as="div"
            color="magenta"
            speed="6s"
            thickness={2}
            borderRadius={32}
            className="about__star-border"
          >
            <img
              src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80"
              alt="Technical fest workshop"
              className="about__image"
            />
          </StarBorder>
        </div>
      </section>

      <section className="stats">
        <div className="stats__container">
          <div className="stats__item">
            <h3 className="stats__number">
              <CountUp end={50} suffix="+" />
            </h3>
            <p className="stats__label">Workshops</p>
          </div>
          <div className="stats__item">
            <h3 className="stats__number">
              <CountUp end={10000} suffix="+" />
            </h3>
            <p className="stats__label">Expected Footfall</p>
          </div>
          <div className="stats__item">
            <h3 className="stats__number">
              <span className="stats__currency">₹</span>
              <CountUp end={5} suffix="L+" />
            </h3>
            <p className="stats__label">Prize Pool</p>
          </div>
          <div className="stats__item">
            <h3 className="stats__number">
              <CountUp end={200} suffix="+" />
            </h3>
            <p className="stats__label">Student Organizers</p>
          </div>
        </div>
      </section>
    </>
  )
}

export default Home
