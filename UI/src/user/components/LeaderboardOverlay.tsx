import React, { useState, useEffect } from 'react';

declare const gsap: any;

interface LeaderboardEntry {
    name: string;
    time: string;
}



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
            const tl = gsap.timeline();
            tl.to('.user-podium-wrapper', { opacity: 1, duration: 0.3 })
              .to('.podium-box', { scaleY: 1, duration: 0.8, stagger: 0.1, ease: 'back.out(1.5)' }, "-=0.1")
              .to('.podium-info', { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }, "-=0.4");
        }
    }, [view, selectedEvent]);

    if (!isOpen) return null;

    const leaderboardList = (events || [])
        .filter(ev => leaderboardData[ev.slug] && leaderboardData[ev.slug].length > 0)
        .map(ev => ({
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
                            {leaderboardList.length > 0 ? leaderboardList.map((item, idx) => (
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
                                        <div className="lb-action">VIEW PODIUM →</div>
                                    </div>
                                </div>
                            )) : (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
                                    <h4 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>NO LEADERBOARDS YET</h4>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>Results will be posted soon after the events are completed.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="lb-standings-view">
                            <div className="lb-back-wrapper">
                                <button className="lb-back-btn hover-target" onClick={() => setView('grid')} id="lb-back-btn">← BACK TO EVENTS</button>
                            </div>
                            <h3 className="lb-event-name" style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '3rem', textTransform: 'uppercase' }}>{selectedEvent?.name}</h3>
                            <div className="lb-winners-list">
                                {currentWinners.length > 0 ? (
                                    <div className="user-podium-wrapper">
                                        <div className="podium-step podium-rank-2">
                                            <div className="podium-info">
                                                <div className="podium-name">{currentWinners[1]?.name || '—'}</div>
                                                <div className="podium-time">{currentWinners[1]?.time || '—'}</div>
                                            </div>
                                            <div className="podium-box">2</div>
                                        </div>
                                        <div className="podium-step podium-rank-1">
                                            <div className="podium-info">
                                                <div className="podium-name">{currentWinners[0]?.name || '—'}</div>
                                                <div className="podium-time">{currentWinners[0]?.time || '—'}</div>
                                            </div>
                                            <div className="podium-box">1</div>
                                        </div>
                                        <div className="podium-step podium-rank-3">
                                            <div className="podium-info">
                                                <div className="podium-name">{currentWinners[2]?.name || '—'}</div>
                                                <div className="podium-time">{currentWinners[2]?.time || '—'}</div>
                                            </div>
                                            <div className="podium-box">3</div>
                                        </div>
                                    </div>
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
