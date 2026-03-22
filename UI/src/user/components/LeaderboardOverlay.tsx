import React, { useState, useEffect } from 'react';

declare const gsap: any;

interface LeaderboardEntry {
    name: string;
    time: string;
}

const leaderboardData: Record<string, LeaderboardEntry[]> = {
    'womens-day': [
        {name: "Sarah Johnson", time: "02:15:30"},
        {name: "Priya Sharma", time: "02:18:45"},
        {name: "Emily Chen", time: "02:20:10"},
        {name: "Anita Desai", time: "02:22:55"},
        {name: "Maria Garcia", time: "02:25:00"}
    ],
    'health-day': [
        {name: "Rahul Kumar", time: "00:45:12"},
        {name: "David Smith", time: "00:46:30"},
        {name: "Arjun Reddy", time: "00:47:15"},
        {name: "Michael Chang", time: "00:48:05"},
        {name: "Karthik N.", time: "00:49:20"}
    ],
    'fathers-day': [
        {name: "James & Tommy", time: "01:10:45"},
        {name: "Raj & Aryan", time: "01:12:30"},
        {name: "Robert & Bobby", time: "01:15:00"},
        {name: "Vikram & Dev", time: "01:16:20"},
        {name: "Ali & Hassan", time: "01:18:10"}
    ]
};

export default function LeaderboardOverlay({ isOpen, onClose, events, leaderboardData }: { isOpen: boolean, onClose: () => void, events: any[], leaderboardData: any }) {
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [view, setView] = useState<'grid' | 'standings'>('grid');

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            gsap.fromTo('.leaderboard-overlay', { opacity: 0, scale: 1.1 }, { opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" });
            gsap.fromTo('.lb-event-card', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, delay: 0.2 });
        } else {
            document.body.style.overflow = '';
            setView('grid');
            setSelectedEvent(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (view === 'standings') {
            gsap.fromTo('.lb-winner-row', { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.05 });
        }
    }, [view]);

    if (!isOpen) return null;

    const leaderboardList = (events || []).map(ev => ({
        slug: ev.slug,
        name: ev.title,
        image: ev.bgImg || `/images/${ev.slug.replace(/-/g, '_')}.png`
    }));

    const currentWinners = selectedEvent ? (leaderboardData[selectedEvent.slug] || []) : [];

    return (
        <div className={`leaderboard-overlay ${isOpen ? 'active' : ''}`} id="leaderboard-overlay">
            <div className="lb-close hover-target" onClick={onClose} id="lb-close">
                <span className="lb-close-line"></span>
                <span className="lb-close-line"></span>
            </div>
            
            <div className="lb-inner">
                <div className="lb-header">
                    <h2 className="lb-title">EVENT <span className="green filled">LEADERBOARDS</span></h2>
                    <p className="lb-subtitle">Select an event to view the elite standing performers.</p>
                </div>

                <div className="lb-content-area">
                    {view === 'grid' ? (
                        <div className="lb-events-grid active" id="lb-events-grid">
                            {leaderboardList.map((item, idx) => (
                                <div key={idx} className="lb-event-card hover-target" onClick={() => {
                                    setSelectedEvent(item);
                                    setView('standings');
                                }}>
                                    <div className="lb-card-bg">
                                        <img 
                                            src={item.image} 
                                            alt={item.name} 
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=1400&auto=format&fit=crop';
                                            }}
                                        />
                                    </div>
                                    <div className="lb-card-content">
                                        <div className="lb-tag">MARATHON</div>
                                        <h3>{item.name}</h3>
                                        <div className="lb-action">VIEW STANDINGS →</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="lb-standings-view">
                            <div className="lb-back-wrapper">
                                <button className="lb-back-btn hover-target" onClick={() => setView('grid')} id="lb-back-btn">← BACK TO EVENTS</button>
                            </div>
                            <h3 className="lb-event-name" style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '3rem', textTransform: 'uppercase' }}>{selectedEvent?.name}</h3>
                            <div className="lb-winners-list">
                                {currentWinners.length > 0 ? (
                                    currentWinners.map((w: any, index: number) => (
                                        <div key={index} className={`lb-winner-row rank-${index + 1}`}>
                                            <div className="lb-rank">0{index + 1}</div>
                                            <div className="lb-winner-info">
                                                <div className="lb-winner-name">{w.name}</div>
                                            </div>
                                            <div className="lb-winner-time">{w.time}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
                                        <h4 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>NO STANDINGS YET</h4>
                                        <p style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>Results will be posted soon after the event completion.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
