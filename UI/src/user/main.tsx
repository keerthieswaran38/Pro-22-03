import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEvents, useLeaderboard, useCMSContent, useParticipants } from '../shared/hooks/useSync';
import { logAction } from '../shared/utils/auditLog';

declare const gsap: any;
declare const ScrollTrigger: any;

const queryClient = new QueryClient();

// ============================
// REACT COMPONENTS (Reactive Islands)
// ============================

function EventsSection({ events }: { events: any[] }) {
    const publicEvents = events.filter(e => !e.isDraft);
    return (
        <>
            {publicEvents.map((ev, i) => (
                <div key={ev.slug || i} className="event-stack-item hover-target">
                   <div className="esi-img">
                        <img src={ev.bgImg} alt={ev.title} />
                    </div>
                    <div className="esi-content">
                        <div className="esi-meta">
                            <span className="ec-tag">{ev.tag}</span>
                            <span className="ec-year">{new Date(ev.date).getFullYear() || 2026}</span>
                        </div>
                        <h3>{ev.title}</h3>
                        <p>{ev.desc}</p>
                        <div className="esi-bottom">
                            <span className="ec-date">{ev.date}</span>
                            <a href={`event-details.html?id=${ev.slug || i}`} className="btn-neon small">EXPLORE →</a>
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
}

function StatsSection({ participantsCount }: { participantsCount: number }) {
    return (
        <div className="stats-grid">
            <div className="stat-item">
                <div className="stat-number">{5 + Math.floor(participantsCount / 50)}</div>
                <div className="stat-plus">+</div>
                <div className="stat-label">YEARS<br/>FOUNDED</div>
            </div>
            <div className="stat-item">
                <div className="stat-number">{1000 + participantsCount}</div>
                <div className="stat-plus">K+</div>
                <div className="stat-label">HAPPY<br/>PARTICIPANTS</div>
            </div>
        </div>
    );
}

function CMSHeroSection({ content }: { content: any[] }) {
    const heroContent = content.find(c => c.type === 'image' && c.title === 'Hero Banner');
    if (!heroContent) return null;
    return <img src={heroContent.imageUrl} alt="Running Athletes" />;
}

function LeaderboardContent({ data }: { data: any }) {
    // This is the interior of the leaderboard overlay standings
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const events = Object.entries(data);

    if (selectedEventId && data[selectedEventId]) {
        const winners = data[selectedEventId];
        return (
            <div className="lb-standings-view" style={{ display: 'block' }}>
                <div className="lb-back-wrapper">
                    <button className="lb-back-btn hover-target" onClick={() => setSelectedEventId(null)}>← BACK TO EVENTS</button>
                </div>
                <h3 className="lb-event-name">{selectedEventId.replace(/-/g, ' ').toUpperCase()}</h3>
                <div className="lb-winners-list">
                    {winners.map((w: any, index: number) => (
                        <div key={index} className={`lb-winner-row rank-${Math.min(index + 1, 4)}`}>
                            <div className="lb-rank">0{index + 1}</div>
                            <div className="lb-winner-info"><div className="lb-winner-name">{w.name}</div></div>
                            <div className="lb-winner-time">{w.time}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="lb-events-grid" style={{ display: 'grid' }}>
            {events.map(([slug, winners]: [string, any]) => (
                <div key={slug} className="lb-event-card hover-target" onClick={() => setSelectedEventId(slug)}>
                    <div className="lb-card-bg">
                        <img src={`/src/assets/images/${slug.replace(/-/g, '_')}.png`} alt={slug} />
                    </div>
                    <div className="lb-card-content">
                        <div className="lb-tag">MARATHON</div>
                        <h3>{slug.replace(/-/g, ' ').toUpperCase()}</h3>
                        <div className="lb-action">VIEW STANDINGS →</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================
// BOOTSTRAP LOGIC
// ============================

const bootstrapIsland = (id: string, Component: React.FC<any>, useHook: () => any) => {
    const el = document.getElementById(id);
    if (el) {
        const root = ReactDOM.createRoot(el);
        const Wrapper = () => {
            const { data, isLoading } = useHook();
            if (isLoading || !data) return null;
            return <Component data={data} content={data} events={data} participantsCount={data?.length || 0} />;
        };
        root.render(
            <QueryClientProvider client={queryClient}>
                <Wrapper />
            </QueryClientProvider>
        );
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Islands
    bootstrapIsland('events-stack-root', EventsSection, useEvents);
    bootstrapIsland('stats-react-root', StatsSection, useParticipants);
    bootstrapIsland('hero-visual-root', CMSHeroSection, useCMSContent);
    bootstrapIsland('lb-content-root', LeaderboardContent, useLeaderboard);

    // ============================
    // VANILLA GSAP LOGIC (Shell Animations)
    // ============================
    if (typeof gsap !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        // Custom Cursor
        const cursor = document.querySelector('.cursor') as HTMLElement;
        const follower = document.querySelector('.cursor-follower') as HTMLElement;
        const hoverTargets = document.querySelectorAll('.hover-target');
        let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
        let followerX = window.innerWidth / 2, followerY = window.innerHeight / 2;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX; mouseY = e.clientY;
            gsap.to(cursor, { x: mouseX, y: mouseY, duration: 0.1 });
        });
        gsap.ticker.add(() => {
            followerX += (mouseX - followerX) * 0.1;
            followerY += (mouseY - followerY) * 0.1;
            gsap.set(follower, { x: followerX, y: followerY });
        });

        // Preloader & Hero
        const tl = gsap.timeline();
        tl.to('#sweep-path', { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut" })
          .to('.logo-initials', { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(2)" }, "-=0.5")
          .to('.loader-text span', { y: 0, stagger: 0.1, duration: 0.8, ease: "power3.out" }, "-=0.3")
          .to('.preloader', { yPercent: -100, duration: 1.2, ease: "power4.inOut", delay: 0.8 })
          .to('.reveal-text', { y: 0, duration: 1.2, stagger: 0.1, ease: "power4.out" }, "-=0.6")
          .from('.hero-visual', { opacity: 0, x: 80, duration: 1.5, ease: "power4.out" }, "-=1.2");

        // Leaderboard toggle
        const navLB = document.getElementById('nav-leaderboard');
        const lbOverlay = document.getElementById('leaderboard-overlay');
        const lbClose = document.getElementById('lb-close');
        if (navLB && lbOverlay && lbClose) {
            navLB.addEventListener('click', (e) => {
                e.preventDefault();
                lbOverlay.classList.add('active');
                gsap.fromTo(lbOverlay, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" });
            });
            lbClose.addEventListener('click', () => {
                gsap.to(lbOverlay, { opacity: 0, scale: 0.95, duration: 0.4, onComplete: () => lbOverlay.classList.remove('active') });
            });
        }
    }
});
