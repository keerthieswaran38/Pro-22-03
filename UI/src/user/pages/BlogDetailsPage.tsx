import React, { useLayoutEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

declare const gsap: any;

export default function BlogDetailsPage() {
    const { id } = useParams();

    useLayoutEffect(() => {
        window.scrollTo(0, 0);
        
        const tl = gsap.timeline();

        tl.fromTo('.bd-hero-bg', 
            { scale: 1.1, filter: 'blur(10px)', opacity: 0 },
            { scale: 1, filter: 'blur(0px)', opacity: 1, duration: 1.5, ease: 'power4.out' }
        )
        .fromTo('.bd-title-main', 
            { y: 60, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out' },
            "-=1"
        )
        .fromTo('.bd-meta-item', 
            { x: -50, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' },
            "-=0.8"
        );

        gsap.fromTo('.bd-magazine-col', 
            { y: 50, opacity: 0 },
            { 
                y: 0, 
                opacity: 1, 
                duration: 1, 
                stagger: 0.3, 
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: '.bd-magazine-grid',
                    start: 'top 85%',
                }
            }
        );
    }, [id]);

    const getBlogImage = (id: string | undefined) => {
        if (id?.includes('community')) return '/images/blog_community_sports.png';
        if (id?.includes('nutrition')) return 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200&auto=format&fit=crop';
        return 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?q=80&w=1200&auto=format&fit=crop';
    };

    return (
        <div className="blog-details-unique" style={{ background: '#050505', color: '#fff', minHeight: '100vh' }}>
            {/* HERO SECTION - CLEARING NAVBAR WITH 15REM TOP PADDING */}
            <section className="bd-hero" style={{ minHeight: '85vh', position: 'relative', display: 'flex', alignItems: 'center', overflow: 'hidden', paddingTop: '15rem', paddingBottom: '10rem' }}>
                <div className="bd-hero-bg" style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                    <img src={getBlogImage(id)} alt="Blog Feature" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #050505 0%, rgba(5,5,5,0.4) 50%, rgba(5,5,5,0.9) 100%)' }}></div>
                </div>

                <div className="bd-hero-container" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '0 5%' }}>
                    <div className="bd-meta-item" style={{ 
                        color: '#ff5f00', 
                        fontSize: '0.9rem', 
                        fontWeight: 800, 
                        letterSpacing: '5px', 
                        marginBottom: '2rem', 
                        textTransform: 'uppercase' 
                    }}>INSIGHTS & STRATEGY</div>
                    
                    <h1 className="bd-title-main" style={{ 
                        fontSize: 'clamp(3rem, 10vw, 8.5rem)', 
                        fontWeight: 900, 
                        textTransform: 'uppercase', 
                        lineHeight: '0.85', 
                        margin: 0, 
                        letterSpacing: '-4px',
                        maxWidth: '1200px'
                    }}>
                        {id?.replace(/-/g, ' ')}
                    </h1>

                    <div className="bd-meta-row" style={{ display: 'flex', gap: '4rem', marginTop: '5rem' }}>
                        <div className="bd-meta-item" style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.7rem', color: '#666', letterSpacing: '3px', marginBottom: '0.8rem' }}>PUBLISHED</span>
                            <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>MARCH 21, 2026</span>
                        </div>
                        <div className="bd-meta-item" style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.7rem', color: '#666', letterSpacing: '3px', marginBottom: '0.8rem' }}>AUTHOR</span>
                            <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>EDITORIAL TEAM</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* MAGAZINE GRID SECTION */}
            <section className="bd-magazine-grid" style={{ maxWidth: '1400px', margin: '0 auto', padding: '12rem 5% 15rem', display: 'grid', gridTemplateColumns: '350px 1fr', gap: '80px' }}>
                
                {/* STICKY SIDEBAR */}
                <aside className="bd-magazine-col bd-sidebar" style={{ position: 'sticky', top: '10rem', height: 'fit-content' }}>
                    <div style={{ padding: '3rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '30px', backdropFilter: 'blur(10px)' }}>
                        <div style={{ color: '#ff5f00', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '4px', marginBottom: '1.5rem' }}>EPISODE / 01</div>
                        <h4 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem', textTransform: 'uppercase' }}>Building The Future of Athletics</h4>
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '2rem 0' }}></div>
                        

                    </div>
                    
                    <div style={{ marginTop: '4rem', paddingLeft: '2rem', borderLeft: '2px solid #ff5f00', opacity: 0.5, fontSize: '0.9rem', lineHeight: '1.8' }}>
                        Curated by Gagner Sports Editorial Team. Exploring the intersection of human performance and technological strategy.
                    </div>
                </aside>

                {/* MAIN CONTENT AREA */}
                <main className="bd-magazine-col bd-article-body" style={{ fontSize: '1.4rem', lineHeight: '2.4', color: '#bbb', fontWeight: 300 }}>
                    <p style={{ marginBottom: '5rem', fontSize: '1.8rem', color: '#fff', fontWeight: 400, lineHeight: '1.6' }}>
                        <span style={{ float: 'left', fontSize: '6rem', lineHeight: '0.8', paddingRight: '1rem', paddingTop: '0.5rem', fontWeight: 900, color: '#ff5f00' }}>T</span>
                        he world of athletics provides an unparalleled stage for testing the boundaries of human potential. Whether your goal is a personal best in a local run or competing in professional leagues, the journey demands a synthesis of physical preparation and mental fortitude.
                    </p>
                    
                    <h2 style={{ fontSize: '3.5rem', fontWeight: 900, color: '#fff', margin: '8rem 0 3rem', textTransform: 'uppercase', letterSpacing: '-2px', position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '-40px', color: '#ff5f00' }}>/</span>
                        The Philosophy of Precision
                    </h2>
                    <p style={{ marginBottom: '4rem' }}>In the pursuit of excellence, every detail matters. From the mechanics of a stride to the timing of a recovery phase, precision determines the margin between success and stagnation. We believe that athletic development is a lifelong strategy, not a seasonal goal.</p>
                    
                    <blockquote style={{ 
                        margin: '8rem 0', 
                        padding: '5rem', 
                        background: 'linear-gradient(135deg, rgba(255, 95, 0, 0.05) 0%, transparent 100%)', 
                        borderLeft: '6px solid #ff5f00', 
                        fontSize: '2.5rem', 
                        fontStyle: 'italic', 
                        color: '#fff',
                        fontWeight: 600,
                        lineHeight: '1.4',
                        borderRadius: '0 40px 40px 0'
                    }}>
                        "Sport is the ultimate crucible where character is forged through the persistence of effort and the clarity of vision."
                    </blockquote>

                    <h2 style={{ fontSize: '3.5rem', fontWeight: 900, color: '#fff', margin: '8rem 0 3rem', textTransform: 'uppercase', letterSpacing: '-2px', position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '-40px', color: '#ff5f00' }}>/</span>
                        Data-Driven Performance
                    </h2>
                    <p style={{ marginBottom: '4rem' }}>In modern athletics, intuition is complemented by data. Understanding heart rate zones, nutritional intake, and recovery metrics allows athletes to optimize their output. At Gagner Sports, we emphasize this analytical approach to help our community reach their peak performance safely and effectively.</p>

                    <div style={{ marginTop: '12rem', paddingTop: '6rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Link to="/" style={{ color: '#ff5f00', textDecoration: 'none', fontWeight: 800, fontSize: '1rem', letterSpacing: '3px' }} className="hover-target">← EXPLORE MORE STORIES</Link>
                    </div>
                </main>
            </section>

            <style>{`
                @media (max-width: 1100px) {
                    .bd-magazine-grid { grid-template-columns: 1fr !important; padding: 6rem 5% !important; gap: 40px !important; }
                    .bd-sidebar { position: relative !important; top: 0 !important; width: 100% !important; }
                    .bd-hero { padding-top: 10rem !important; min-height: 60vh !important; }
                    .bd-title-main { font-size: 4rem !important; }
                }
            `}</style>
        </div>
    );
}
