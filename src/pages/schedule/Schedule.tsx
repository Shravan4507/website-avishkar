import { useState } from 'react'
import SEO from '../../components/seo/SEO'
import './Schedule.css'
import scheduleData from '../../data/schedule.json'

const DEPT_COLORS: Record<string, string> = {
  'CS':          '#5227FF',
  'IT':          '#7c3aed',
  'AI&ML':       '#06b6d4',
  'AI&DS':       '#0ea5e9',
  'ECE':         '#10b981',
  'EnTC':        '#f59e0b',
  'Electrical':  '#f97316',
  'Mechanical':  '#ef4444',
  'Civil':       '#84cc16',
  'R&A':         '#d9ff00',
  'AI&DS':       '#0ea5e9',
}

const BUILDING_NAMES: Record<string, string> = {
  'A': 'Block A',
  'B': 'Block B',
  'C': 'Block C',
  'D': 'Block D',
}

function getDeptColor(dept: string): string {
  return DEPT_COLORS[dept] ?? '#5227FF'
}

// Parse a single location code like "A1-11" into structured info
function parseLocationCode(code: string): { building: string; floor: string; room: string } | null {
  const trimmed = code.trim()

  // Special locations — not parsed structurally
  if (['Reading Hall', 'Standby', '*Standby', 'CSMA'].includes(trimmed)) {
    return null
  }

  // Pattern: Letter + digit(s) + dash + digits  e.g. A1-11, C5-03, D3-05
  const match = trimmed.match(/^([A-Z])(\d+)-(\d+)$/)
  if (match) {
    return {
      building: BUILDING_NAMES[match[1]] ?? `Block ${match[1]}`,
      floor: `Floor ${match[2]}`,
      room: `Room ${match[3]}`,
    }
  }

  // Pattern: Letter + digit + letters (e.g. C5MA) → treat as special lab
  const match2 = trimmed.match(/^([A-Z])(\d+)([A-Z]+)$/)
  if (match2) {
    return {
      building: BUILDING_NAMES[match2[1]] ?? `Block ${match2[1]}`,
      floor: `Floor ${match2[2]}`,
      room: `${match2[3]} Hall`,
    }
  }

  return null
}

// Parse multiple comma-separated location codes and group by building+floor
interface ParsedLocation {
  building: string
  floor: string
  rooms: string[]
  raw: string
}

function parseLocations(locationStr: string): { parsed: ParsedLocation[]; specials: string[] } {
  const parts = locationStr.split(',').map(s => s.trim())
  const parsed: ParsedLocation[] = []
  const specials: string[] = []

  for (const part of parts) {
    const info = parseLocationCode(part)
    if (!info) {
      specials.push(part)
      continue
    }
    // Group by building + floor
    const existing = parsed.find(p => p.building === info.building && p.floor === info.floor)
    if (existing) {
      if (!existing.rooms.includes(info.room)) existing.rooms.push(info.room)
    } else {
      parsed.push({ building: info.building, floor: info.floor, rooms: [info.room], raw: part })
    }
  }

  return { parsed, specials }
}

interface LocationCellProps {
  location: string
}

function LocationCell({ location }: LocationCellProps) {
  const { parsed, specials } = parseLocations(location)

  return (
    <div className="loc-cell">
      {parsed.map((loc, i) => (
        <div key={i} className="loc-group">
          <div className="loc-building">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            {loc.building}
          </div>
          <div className="loc-floor">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
            {loc.floor}
          </div>
          <div className="loc-rooms">
            {loc.rooms.map((room, j) => (
              <span key={j} className="loc-room-badge">{room}</span>
            ))}
          </div>
        </div>
      ))}
      {specials.map((s, i) => (
        <div key={i} className="loc-special">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {s}
        </div>
      ))}
    </div>
  )
}

function Schedule() {
  const [activeDay, setActiveDay] = useState(0)
  const currentDay = scheduleData[activeDay] as typeof scheduleData[0] & { dayName?: string }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }

  return (
    <>
      <SEO
        title="Schedule | Avishkar '26"
        description="Track every moment of Avishkar '26. Three days of pure innovation — full event schedule."
      />
      <div className="sched-page">

        {/* ── Hero ── */}
        <header className="sched-hero">
          <div className="sched-hero-glow" />
          <h1>Festival Schedule</h1>
          <p>Three days. Limitless innovation. Every moment mapped.</p>
        </header>

        {/* ── Day Tabs ── */}
        <div className="sched-tabs">
          {scheduleData.map((day: any, idx: number) => (
            <button
              key={idx}
              className={`sched-tab ${activeDay === idx ? 'active' : ''} ${day.label === 'Standby' ? 'standby-tab' : ''}`}
              onClick={() => setActiveDay(idx)}
            >
              <span className="tab-label">{day.label}</span>
              <span className="tab-date">
                {day.label === 'Standby' ? '⚡ TBD Events' : formatDate(day.date)}
              </span>
            </button>
          ))}
        </div>

        {/* ── Stats bar ── */}
        <div className="sched-stats">
          <div className="stat-chip">
            <span className="stat-num">{currentDay.events.length}</span>
            <span className="stat-label">Events</span>
          </div>
          <div className="stat-chip">
            <span className="stat-num">
              {[...new Set(currentDay.events.map((e: any) => e.department))].length}
            </span>
            <span className="stat-label">Departments</span>
          </div>
          <div className="stat-chip">
            <span className="stat-num">
              {[...new Set(currentDay.events.flatMap((e: any) => e.location.split(',').map((s: string) => s.trim())))].length}
            </span>
            <span className="stat-label">Venues</span>
          </div>
          {(currentDay as any).dayName && (
            <div className="stat-chip day-name-chip">
              <span className="stat-label day-name-text">{(currentDay as any).dayName}</span>
            </div>
          )}
        </div>

        {/* ── Building Key ── */}
        <div className="building-key">
          <span className="bk-title">Campus Map Key</span>
          {Object.entries(BUILDING_NAMES).map(([letter, name]) => (
            <div key={letter} className="bk-chip">
              <span className="bk-letter">{letter}</span>
              <span className="bk-name">{name}</span>
            </div>
          ))}
          <div className="bk-note">
            <span className="bk-ex">e.g.</span>
            <span className="bk-ex-code">D3-05</span>
            <span className="bk-arrow">→</span>
            <span className="bk-ex-result">Block D · Floor 3 · Room 05</span>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="sched-table-wrap">
          <table className="sched-table">
            <thead>
              <tr>
                <th className="col-sr">#</th>
                <th className="col-dept">Dept</th>
                <th className="col-event">Event</th>
                <th className="col-slot">Slot 1</th>
                <th className="col-break">Break</th>
                <th className="col-slot">Slot 2</th>
                <th className="col-loc">Location</th>
              </tr>
            </thead>
            <tbody>
              {currentDay.events.map((ev: any, idx: number) => {
                const color = getDeptColor(ev.department)
                const isStandby = ev.note === '*Standby'
                const isZone = ev.note === '*Zone'
                const isAids = ev.note === '*AIDS'
                return (
                  <tr
                    key={idx}
                    className={`sched-row ${isStandby ? 'row-standby' : ''} ${isZone ? 'row-zone' : ''}`}
                    style={{ '--dept-color': color } as React.CSSProperties}
                  >
                    <td className="col-sr">
                      <span className="sr-badge">{ev.srNo}</span>
                    </td>
                    <td className="col-dept">
                      <span className="dept-tag" style={{ background: `${color}22`, color, borderColor: `${color}55` }}>
                        {ev.department}
                      </span>
                    </td>
                    <td className="col-event">
                      <span className="event-name">{ev.name}</span>
                      {isZone  && <span className="event-note note-zone">Chill Zone</span>}
                      {isAids  && <span className="event-note note-aids">*AIDS Dept</span>}
                      {isStandby && <span className="event-note note-standby">⚡ Standby</span>}
                    </td>
                    <td className="col-slot">
                      <span className={`time-pill ${ev.slot1 === '---' ? 'empty' : ''}`}>
                        {ev.slot1 === '---' ? '—' : ev.slot1}
                      </span>
                    </td>
                    <td className="col-break">
                      <span className={`break-pill ${ev.break === '---' ? 'empty' : ''}`}>
                        {ev.break === '---' ? '—' : ev.break}
                      </span>
                    </td>
                    <td className="col-slot">
                      <span className={`time-pill ${ev.slot2 === '---' ? 'empty' : ''}`}>
                        {ev.slot2 === '---' ? '—' : ev.slot2}
                      </span>
                    </td>
                    <td className="col-loc">
                      <LocationCell location={ev.location} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* ── Legend ── */}
        <div className="sched-legend">
          <span className="legend-title">Departments</span>
          {Object.entries(DEPT_COLORS).map(([dept, color]) => (
            <span key={dept} className="legend-chip" style={{ borderColor: color, color }}>
              <span className="legend-dot" style={{ background: color }} />
              {dept}
            </span>
          ))}
        </div>

      </div>
    </>
  )
}

export default Schedule
