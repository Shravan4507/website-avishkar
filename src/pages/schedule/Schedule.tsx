import { useState } from 'react'
import SEO from '../../components/seo/SEO'
import './Schedule.css'
import scheduleData from '../../data/schedule.json'

function Schedule() {
    const [activeDay, setActiveDay] = useState(0)

    const currentDayData = scheduleData[activeDay]

    // Extract unique start times and sort them
    const allStartTimes = new Set<string>()
    // Extract unique venues
    const allVenues = new Set<string>()

    currentDayData.events.forEach(event => {
        event.schedule.forEach(slot => {
            allStartTimes.add(slot.startTime)
        })
        event.venue.forEach(v => allVenues.add(v))
    })

    const startTimes = Array.from(allStartTimes).sort()
    const venues = Array.from(allVenues).sort()

    // Helper to format date
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr)
        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    }

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
                    {scheduleData.map((item, index) => (
                        <button 
                            key={index}
                            className={`schedule-tab ${activeDay === index ? 'active' : ''}`}
                            onClick={() => setActiveDay(index)}
                        >
                            <span className="tab-day">Day {index + 1}</span>
                            <span className="tab-date">{formatDate(item.date)}</span>
                        </button>
                    ))}
                </div>

                <div className="schedule-table-wrapper">
                    <table className="schedule-grid">
                        <thead>
                            <tr>
                                <th className="time-col">Timing <br/><span className="time-note">(Start Time)</span></th>
                                {venues.map(venue => (
                                    <th key={venue} className="venue-col">
                                        <div className="venue-header">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                            {venue}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {startTimes.map(time => (
                                <tr key={time}>
                                    <td className="time-cell">
                                        <div className="time-badge">{time}</div>
                                    </td>
                                    {venues.map(venue => {
                                        // Find events starting at this time in this venue
                                        const matchedEvents = currentDayData.events.filter(event => 
                                            event.venue.includes(venue) && 
                                            event.schedule.some(s => s.startTime === time)
                                        )

                                        return (
                                            <td key={`${time}-${venue}`} className={`event-cell ${matchedEvents.length > 0 ? 'has-event' : ''}`}>
                                                {matchedEvents.length > 0 ? (
                                                    <div className="events-stack">
                                                        {matchedEvents.map((ev, idx) => {
                                                            const slot = ev.schedule.find(s => s.startTime === time)
                                                            return (
                                                                <div key={idx} className="event-card">
                                                                    <div className="event-name">{ev.name}</div>
                                                                    <div className="event-meta">
                                                                        <span className="event-time">{slot?.startTime} - {slot?.endTime}</span>
                                                                        <span className="event-dept">{ev.department}</span>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                ) : <div className="empty-cell"></div>}
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}

export default Schedule
