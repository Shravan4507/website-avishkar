import { useState } from 'react'
import SEO from '../../components/seo/SEO'
import './Schedule.css'

const SCHEDULE_DATA = [
    {
        day: "Day 1",
        date: "April 23, 2026",
        theme: "Inauguration & Tech-Genesis",
        events: [
            { time: "09:00 AM", title: "Grand Opening Ceremony", location: "Main Auditorium", type: "Ceremony" },
            { time: "11:00 AM", title: "Keynote: Future of Al", location: "Tech Hall A", type: "Talk" },
            { time: "01:00 PM", title: "Networking Lunch", location: "Central Plaza", type: "Social" },
            { time: "02:30 PM", title: "Robo-Sumo Qualifiers", location: "Workshop Arena", type: "Technical" },
            { time: "04:00 PM", title: "Code Sprint: Round 1", location: "Computer Center", type: "Technical" },
        ]
    },
    {
        day: "Day 2",
        date: "April 24, 2026",
        theme: "Innovation & Design",
        events: [
            { time: "10:00 AM", title: "UI/UX Masterclass", location: "Design Studio", type: "Workshop" },
            { time: "12:00 PM", title: "Poster Making Competition", location: "Art Gallery", type: "Creative" },
            { time: "02:00 PM", title: "Shark Tank: Pitch Deck", location: "Business Hub", type: "Business" },
            { time: "04:30 PM", title: "Guest Lecture: Web3", location: "Tech Hall B", type: "Talk" },
        ]
    },
    {
        day: "Day 3",
        date: "April 25, 2026",
        theme: "The Grand Finale",
        events: [
            { time: "09:30 AM", title: "Final Coding Showdown", location: "Main Auditorium", type: "Technical" },
            { time: "11:30 AM", title: "Project Expo: Finals", location: "Exhibition Hall", type: "Technical" },
            { time: "02:00 PM", title: "Dance Faceoff", location: "Open Theater", type: "Cultural" },
            { time: "05:00 PM", title: "Award Ceremony", location: "Main Auditorium", type: "Ceremony" },
            { time: "07:30 PM", title: "Cultural Night & DJ", location: "Festival Ground", type: "Social" },
        ]
    }
]

function Schedule() {
    const [activeDay, setActiveDay] = useState(0)

    return (
        <>
            <SEO 
                title="Schedule" 
                description="Track every moment of Avishkar '26. View the full 3-day technical festival itinerary." 
            />
            <div className="schedule-page">
            <div className="schedule-hero">
                <div className="schedule-glow"></div>
                <h1>Festival Schedule</h1>
                <p>Track every moment of Avishkar '26. Three days of pure innovation.</p>
            </div>

            <div className="schedule-tabs">
                {SCHEDULE_DATA.map((item, index) => (
                    <button 
                        key={index}
                        className={`schedule-tab ${activeDay === index ? 'active' : ''}`}
                        onClick={() => setActiveDay(index)}
                    >
                        <span className="tab-day">{item.day}</span>
                        <span className="tab-date">{item.date}</span>
                    </button>
                ))}
            </div>

            <div className="schedule-content">
                <div className="day-info">
                    <h2>{SCHEDULE_DATA[activeDay].theme}</h2>
                </div>

                <div className="timeline">
                    {SCHEDULE_DATA[activeDay].events.map((event, index) => (
                        <div className="timeline-item" key={index} style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className="timeline-time">
                                <span>{event.time}</span>
                            </div>
                            <div className="timeline-dot-wrapper">
                                <div className="timeline-dot"></div>
                                <div className="timeline-line"></div>
                            </div>
                            <div className="timeline-card" data-time={event.time}>
                                <div className="event-type">{event.type}</div>
                                <h3>{event.title}</h3>
                                <div className="event-location">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                    {event.location}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        </>
    )
}

export default Schedule
