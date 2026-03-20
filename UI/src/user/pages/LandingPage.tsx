import React, { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { GagnerEvent } from '../../shared/utils/storage';
import GlobalPreloader from '../components/GlobalPreloader';

declare const gsap: any;
declare const ScrollTrigger: any;

if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

interface LeaderboardData {
    [slug: string]: { name: string; time: string }[];
}

export default function LandingPage({ events, leaderboard }: { events: GagnerEvent[]; leaderboard: LeaderboardData }) {
    const mainRef = useRef<HTMLDivElement>(null);
    const servicesRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const mm = gsap.matchMedia();

        mm.add({
            isDesktop: "(min-width: 1025px)",
            isMobile: "(max-width: 1024px)",
            reduceMotion: "(prefers-reduced-motion: reduce)"
        }, (context: any) => {
            const { isDesktop } = context.conditions;

            // 1. UNIVERSAL ANIMATIONS (Power Stomp Sequence)
            const tl = gsap.timeline();
            tl.to('.splash-logo-stomp', { animation: 'stomp-impact 0.8s forwards', ease: 'power4.out' })
              .to('.loader-branding-stomp', { opacity: 1, y: 0, duration: 0.6, ease: 'back.out(1.7)' }, '-=0.2')
              .to('.brand-shadow-bloom', { animation: 'shadow-bloom 0.8s forwards', ease: 'power2.out' }, '-=0.5')
              .to('.preloader', { yPercent: -100, duration: 1, ease: 'expo.inOut', delay: 0.8 })
              .from('.hero-title', { y: 120, duration: 1.2, stagger: 0.15, ease: 'power4.out' }, "-=0.2")
              .from('.hero-visual', { opacity: 0, scale: 0.95, duration: 1.5, ease: 'power3.out' }, "-=1");

            // 2. DESKTOP ONLY: HORIZONTAL PINNED SERVICES
            if (isDesktop && servicesRef.current && trackRef.current) {
                const getScrollAmount = () => {
                    const trackWidth = trackRef.current?.scrollWidth || 0;
                    const viewportWidth = window.innerWidth;
                    return Math.max(0, trackWidth - viewportWidth + 80);
                };

                gsap.to(trackRef.current, {
                    x: () => -getScrollAmount(),
                    ease: "none",
                    scrollTrigger: {
                        trigger: servicesRef.current,
                        start: "top top",
                        end: () => `+=${getScrollAmount()}`,
                        pin: true,
                        scrub: 1,
                        invalidateOnRefresh: true,
                        anticipatePin: 1
                    }
                });

                // Parallax images inside horizontal slides
                gsap.utils.toArray('.sc-img img').forEach((img: any) => {
                    gsap.to(img, {
                        xPercent: 15,
                        ease: "none",
                        scrollTrigger: {
                            trigger: img.closest('.service-card-horizontal'),
                            start: "left right",
                            end: "right left",
                            scrub: true,
                            horizontal: true
                        }
                    });
                });
            }

            // 3. STATS COUNTER (Universal)
            gsap.utils.toArray('.stat-number').forEach((numEl: any) => {
                const target = parseInt(numEl.dataset.target || "0");
                ScrollTrigger.create({
                    trigger: numEl,
                    start: "top 90%",
                    once: true,
                    onEnter: () => {
                        gsap.to({ val: 0 }, {
                            val: target,
                            duration: 2.5,
                            ease: "power2.out",
                            onUpdate: function(this: any) {
                                numEl.textContent = Math.round(this.targets()[0].val);
                            }
                        });
                    }
                });
            });

            // 4. EVENT REVEALS (Universal)
            ScrollTrigger.batch('.event-stack-item', {
                onEnter: (elements: any) => gsap.to(elements, { opacity: 1, y: 0, stagger: 0.2, duration: 1.2, ease: 'power3.out' }),
                start: 'top 85%'
            });

        });

        return () => mm.revert();
    }, [events]);

    const publicEvents = events.filter(e => !e.isDraft);
    const featuredEvents = publicEvents.slice(0, 5);

    return (
        <div className="landing-wrap" ref={mainRef}>
            <GlobalPreloader />

            {/* HERO SECTION */}
            <section className="hero-brutal">
                <div className="hero-content">
                    <div className="hero-text-wrapper"><h1 className="hero-title">WE ENGINEER</h1></div>
                    <div className="hero-text-wrapper"><h1 className="hero-title indent"><span className="green-accent">ATHLETIC</span></h1></div>
                    <div className="hero-text-wrapper"><h1 className="hero-title">EXCELLENCE.</h1></div>
                    <div className="hero-footer">
                        <p className="hero-experience-tag">05 YEARS OF ELITE MARATHON MANAGEMENT</p>
                        <div className="scroll-hint"><span className="scroll-line"></span><span>SCROLL FOR ACTION</span></div>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="visual-glass-overlay"></div>
                    <img src="/src/assets/images/hero_visual.png" alt="Athletic training" />
                </div>
            </section>

            {/* STATS SECTION */}
            <section id="about" className="stats-section-premium">
                <div className="stats-grid-modern">
                    <StatItem num="5" label="YEARS FOUNDED" />
                    <StatItem num="50" label="EVENTS ORGANIZED" />
                    <StatItem num="10" plus="K+" label="HAPPY PARTICIPANTS" />
                    <StatItem num="100" label="CORPORATE PARTNERS" />
                </div>
            </section>

            {/* SERVICES SECTION */}
            <section ref={servicesRef} id="services" className="services-pin-container">
                <div className="section-header-pin">
                    <h2 className="brutal-heading-pin">
                        <span className="outline-text">ELITE</span>
                        <span className="solid-text">SERVICES</span>
                    </h2>
                </div>
                <div ref={trackRef} className="services-horizontal-track">
                    <ServiceSlide num="01" title="CRICKET PROJECTS" desc="IPL-style league management and clinics." img="https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=1400" />
                    <ServiceSlide num="02" title="FOOTBALL ACADEMY" desc="Elite youth development and execution." img="https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1400" />
                    <ServiceSlide num="03" title="ATHLETICS SPRINT" desc="Speed engineering for professional track." img="/src/assets/images/athletics_sprint_action.png" />
                    <ServiceSlide num="04" title="MARATHON MANAGEMENT" desc="End-to-end execution for major city runs." img="https://images.unsplash.com/photo-1471295253337-3ceaaedca402?q=80&w=1400" />
                </div>
            </section>

            {/* ELITE LEADERBOARD STANDINGS */}
            <section id="leaderboard" className="leaderboard-section-modern">
                <div className="lb-brutal-container">
                    <div className="lb-text">
                        <h2 className="brutal-heading"><span className="outline-text">ELITE</span> <br/> <span className="solid-text">STANDINGS</span></h2>
                        <p>Live rankings from our latest Gagner Sports series.</p>
                    </div>
                    <div className="lb-grid-scroller">
                        {Object.entries(leaderboard).map(([slug, winners]) => {
                            const event = events.find(e => e.slug === slug);
                            if (!event) return null;
                            return (
                                <div key={slug} className="lb-entry-card">
                                    <div className="lb-entry-header">
                                        <span className="lb-event-tag">{event.tag}</span>
                                        <h4>{event.title}</h4>
                                    </div>
                                    <div className="lb-podium-list">
                                        {winners.slice(0, 3).map((w, i) => (
                                            <div key={i} className="lb-winner-row">
                                                <span className={`lb-rank rank-${i+1}`}>{i+1}</span>
                                                <span className="lb-name">{w.name}</span>
                                                <span className="lb-time">{w.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* EVENTS SECTION */}
            <section id="events" className="events-section-premium">
                <div className="section-header centered">
                    <h2 className="brutal-heading">
                        <span className="solid-text">UPCOMING</span>
                        <span className="outline-text">SERIES</span>
                    </h2>
                </div>
                
                {featuredEvents.length === 0 ? (
                    <div className="no-events-state" style={{ textAlign: 'center', padding: '10rem 2rem' }}>
                        <h3 className="brutal-heading-small" style={{ fontSize: '2rem', marginBottom: '1rem' }}>NO ACTIVE ENTITIES FOUND</h3>
                        <p style={{ color: 'var(--text-gray)', fontSize: '1.2rem' }}>The databases are currently empty or awaiting new logistics. Check back soon for the next elite challenge.</p>
                    </div>
                ) : (
                    <div className="events-stack">
                        {featuredEvents.map((ev) => (
                            <div key={ev.slug} className="event-stack-item">
                                <div className="esi-img">
                                    <img src={ev.bgImg} alt={ev.title} />
                                    <div className="esi-tag-float">{ev.tag}</div>
                                </div>
                                <div className="esi-info">
                                    <span className="esi-date">{ev.date} • {ev.venue}</span>
                                    <h3>{ev.title}</h3>
                                    <p>{ev.desc}</p>
                                    <div className="esi-footer">
                                        <Link to={`/events/${ev.slug}`} className="btn-brand hover-kinetic">EXPLORE EVENT →</Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function StatItem({ num, plus = "+", label }: { num: string, plus?: string, label: string }) {
    return (
        <div className="stat-item-modern">
            <div className="stat-value">
                <span className="stat-number" data-target={num}>0</span>
                <span className="stat-plus">{plus}</span>
            </div>
            <div className="stat-label-modern">{label}</div>
        </div>
    );
}

function ServiceSlide({ num, title, desc, img }: { num: string, title: string, desc: string, img: string }) {
    return (
        <div className="service-card-horizontal">
            <div className="sc-img"><img src={img} alt={title} /><div className="sc-overlay-dark"></div></div>
            <div className="sc-content-float">
                <span className="sc-num-big">{num}</span>
                <h3>{title}</h3>
                <p>{desc}</p>
                <a href="#contact" className="btn-outline-mini">GET QUOTE →</a>
            </div>
        </div>
    );
}
