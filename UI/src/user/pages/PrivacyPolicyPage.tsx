import React, { useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';

declare const gsap: any;
declare const ScrollTrigger: any;

export default function PrivacyPolicyPage() {
    useLayoutEffect(() => {
        window.scrollTo(0, 0);
        
        const tl = gsap.timeline();

        tl.fromTo('.pp-hero-bg', 
            { scale: 1.2, filter: 'blur(10px)', opacity: 0 },
            { scale: 1, filter: 'blur(0px)', opacity: 1, duration: 2, ease: 'power4.out' }
        )
        .fromTo('.pp-title-main', 
            { y: 100, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out' },
            "-=1.5"
        )
        .fromTo('.pp-badge', 
            { scale: 0, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.7)' },
            "-=1"
        )
        .fromTo('.pp-scroll-hint', 
            { opacity: 0, y: -20 },
            { opacity: 1, y: 0, duration: 1, repeat: -1, yoyo: true, ease: 'sine.inOut' },
            "-=0.5"
        );

        // Horizontal Scroll Animation
        const hzContainer = document.querySelector('.pp-hz-container') as HTMLElement;
        const hzWrapper = document.querySelector('.pp-hz-wrapper') as HTMLElement;

        if (hzContainer && hzWrapper && window.innerWidth > 1024) {
            const getScrollAmount = () => -(hzContainer.scrollWidth - window.innerWidth);

            const tween = gsap.to(hzContainer, {
                x: getScrollAmount,
                ease: 'none'
            });

            const st = ScrollTrigger.create({
                trigger: hzWrapper,
                start: 'top top',
                end: () => `+=${Math.abs(getScrollAmount())}`,
                pin: true,
                animation: tween,
                scrub: 1,
                invalidateOnRefresh: true,
            });
            
            // Stagger slide-in for the panels
            gsap.fromTo('.pp-slide-inner', 
                { y: 50, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    stagger: 0.2,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: hzWrapper,
                        start: 'top 20%',
                    }
                }
            );

            return () => {
                st.kill();
                tween.kill();
            };
        }
    }, []);

    const policies = [
        {
            num: '01',
            title: 'Information Collection',
            desc: 'We collect personal details such as name, age, contact number, email, and emergency contact during registration.',
            detail: 'This ensures a seamless event experience and safety for all participants. We prioritize data accuracy to provide the best service.'
        },
        {
            num: '02',
            title: 'Use of Information',
            desc: 'Information is used solely for event registration, safety, communication, and updates.',
            detail: 'We do not sell, rent, or share participant details with third parties, except service providers essential for conducting the event.'
        },
        {
            num: '03',
            title: 'Data Protection',
            desc: 'Your data is securely stored and accessible only to authorized personnel.',
            detail: 'Participants may request correction or deletion of their personal data after the event by contacting our support team.'
        },
        {
            num: '04',
            title: 'Media Consent',
            desc: 'By registering, participants agree to the use of event photos and videos for promotional purposes.',
            detail: 'We capture the spirit of sportsmanship to share the energy with the world. Requests for media exclusion can be made in writing.'
        }
    ];

    return (
        <div className="pp-wrapper" style={{ background: '#050505', color: '#fff' }}>
            {/* HERO SECTION */}
            <section className="pp-hero" style={{ height: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <div className="pp-hero-bg" style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                    <img src="/images/privacy_policy_key_3d.png" alt="Privacy Key" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(5,5,5,0.1) 0%, rgba(5,5,5,0.95) 100%)', backdropFilter: 'blur(2px)' }}></div>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 60%, #050505 100%)' }}></div>
                </div>

                <div className="pp-hero-content" style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 2rem' }}>
                    <div className="pp-badge" style={{ 
                        display: 'inline-block', 
                        padding: '0.6rem 2rem', 
                        background: 'rgba(255, 95, 0, 0.1)', 
                        border: '1px solid rgba(255, 95, 0, 0.5)', 
                        borderRadius: '100px', 
                        fontSize: '0.8rem', 
                        fontWeight: 700, 
                        color: '#ff5f00', 
                        letterSpacing: '5px',
                        marginBottom: '3rem',
                        backdropFilter: 'blur(5px)'
                    }}>LEGAL DOCUMENT</div>
                    
                    <h1 className="pp-title-main" style={{ fontSize: 'clamp(4rem, 12vw, 12rem)', fontWeight: 900, textTransform: 'uppercase', lineHeight: '0.85', margin: 0, letterSpacing: '-4px' }}>
                        Privacy<br/>
                        <span style={{ color: 'transparent', WebkitTextStroke: '1.5px rgba(255,255,255,0.4)', letterSpacing: '2px' }}>STRATEGY</span>
                    </h1>

                    <div className="pp-scroll-hint" style={{ marginTop: '5rem', fontSize: '0.8rem', opacity: 0.5, letterSpacing: '4px', fontWeight: 600 }}>
                        SCROLL TO EXPLORE <br/> <span style={{ fontSize: '1.5rem', display: 'inline-block', marginTop: '1rem' }}>↓</span>
                    </div>
                </div>
            </section>

            {/* CONTENT SECTION - HORIZONTAL SCROLL OVERHAUL */}
            <section className="pp-hz-wrapper" style={{ position: 'relative', background: '#050505', color: '#fff', minHeight: '100vh' }}>
                <div className="pp-hz-container" style={{ display: 'flex', width: 'fit-content', height: '100vh', alignItems: 'center' }}>
                    
                    {/* Intro spacer / anchor for scroll */}
                    <div style={{ width: '30vw', minWidth: '300px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5vw', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                        <h2 style={{ fontSize: '3rem', fontWeight: 900, color: '#ff5f00', lineHeight: '1.2', textTransform: 'uppercase', letterSpacing: '-1px' }}>
                            The Rules of <br/>Engagement
                            <span style={{ display: 'block', height: '2px', width: '50px', background: '#fff', marginTop: '2rem' }}></span>
                        </h2>
                    </div>

                    {/* Policy Slides */}
                    {policies.map((p, i) => (
                        <div key={i} className="pp-slide" style={{ 
                            width: '70vw', 
                            minWidth: '320px',
                            height: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            padding: '0 8vw',
                            position: 'relative',
                            borderRight: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div className="pp-slide-inner" style={{ 
                                width: '100%', 
                                maxWidth: '800px',
                                background: 'rgba(255, 255, 255, 0.02)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                padding: '4rem',
                                borderRadius: '30px',
                                position: 'relative'
                            }}>
                                {/* Elegant Number */}
                                <div style={{ 
                                    position: 'absolute', 
                                    top: '-2rem', 
                                    left: '4rem', 
                                    width: '60px', 
                                    height: '60px', 
                                    background: '#050505', 
                                    border: '2px solid #ff5f00', 
                                    borderRadius: '50%', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    fontSize: '1.2rem', 
                                    fontWeight: 800, 
                                    color: '#ff5f00',
                                    zIndex: 2,
                                    boxShadow: '0 10px 30px rgba(255,95,0,0.2)'
                                }}>{p.num}</div>

                                <h3 className="pp-slide-title" style={{ 
                                    fontSize: '2rem', 
                                    fontWeight: 800, 
                                    marginBottom: '2rem', 
                                    color: '#fff', 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '1px',
                                    marginTop: '2rem'
                                }}>{p.title}</h3>
                                
                                <p className="pp-slide-desc" style={{ 
                                    fontSize: '1.1rem', 
                                    lineHeight: '1.8', 
                                    color: '#ccc', 
                                    marginBottom: '2rem', 
                                    fontWeight: 400
                                }}>{p.desc}</p>
                                
                                <p className="pp-slide-detail" style={{ 
                                    fontSize: '0.95rem', 
                                    lineHeight: '1.8', 
                                    color: '#777', 
                                    fontWeight: 300,
                                    paddingLeft: '1.5rem',
                                    borderLeft: '2px solid rgba(255,95,0,0.5)'
                                }}>{p.detail}</p>
                            </div>
                        </div>
                    ))}

                    {/* Outro spacer */}
                    <div style={{ width: '40vw', minWidth: '350px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 5vw', textAlign: 'center' }}>
                         <p style={{ color: '#222', letterSpacing: '4px', fontSize: '0.8rem', fontWeight: 900 }}>LEGAL FRAMEWORK / MARCH 20, 2026</p>
                         <p style={{ fontSize: '1.4rem', marginTop: '2.5rem', fontWeight: 300, color: '#aaa', lineHeight: '1.6' }}>Formal inquiries: <br/><span style={{ color: '#ff5f00', fontWeight: 700 }}>legal@gagnersports.com</span></p>
                    </div>

                </div>
            </section>

            <style>{`
                @media (max-width: 1024px) {
                    .pp-hz-container {
                        flex-direction: column !important;
                        width: 100% !important;
                        height: auto !important;
                    }
                    .pp-slide {
                        width: 100% !important;
                        height: auto !important;
                        padding: 5rem 2rem !important;
                        border-right: none !important;
                        border-bottom: 1px solid rgba(255,255,255,0.05) !important;
                    }
                    .pp-hz-wrapper {
                        overflow: visible !important;
                    }
                }
            `}</style>
        </div>
    );
}
